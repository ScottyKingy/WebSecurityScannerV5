import { Router } from 'express';
import { db } from '../db';
import { users, creditsBalances, tokens, insertUserSchema } from '@shared/schema';
import bcrypt from 'bcrypt';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  calculateTokenExpiry
} from '../lib/jwt';
import { requireAuth } from '../middleware/auth';
import { eq, and } from 'drizzle-orm';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const validatedData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email)
    });

    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    // Create user
    const [newUser] = await db.insert(users).values({
      email: validatedData.email,
      passwordHash,
      role: validatedData.role || "user",
      tier: validatedData.tier || "lite"
    }).returning();

    // Create credits balance
    await db.insert(creditsBalances).values({
      userId: newUser.id,
      currentBalance: 100, // Default starting credits
      monthlyAllotment: 50, // Default monthly credits
      rolloverEnabled: validatedData.tier === 'deep' || validatedData.tier === 'ultimate' || validatedData.tier === 'enterprise'
    });

    // Generate tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    
    // Store refresh token
    const expiresAt = calculateTokenExpiry('7d');
    await db.insert(tokens).values({
      userId: newUser.id,
      token: refreshToken,
      expiresAt
    });

    // Update last login
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, newUser.id));
    
    // Return user and tokens
    return res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        tier: newUser.tier,
        createdAt: newUser.createdAt,
        lastLogin: new Date()
      },
      accessToken,
      refreshToken
    });
    
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Store refresh token
    const expiresAt = calculateTokenExpiry('7d');
    await db.insert(tokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt
    });

    // Update last login
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    // Return user and tokens
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tier: user.tier,
        createdAt: user.createdAt,
        lastLogin: new Date()
      },
      accessToken,
      refreshToken
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: "Failed to login" });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user with credits balance
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get credits balance
    const creditsBalance = await db.query.creditsBalances.findFirst({
      where: eq(creditsBalances.userId, userId)
    });

    // Return user data without sensitive information
    return res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
      tier: user.tier,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isVerified: user.isVerified,
      creditsBalance: creditsBalance ? {
        currentBalance: creditsBalance.currentBalance,
        monthlyAllotment: creditsBalance.monthlyAllotment,
        rolloverEnabled: creditsBalance.rolloverEnabled,
        rolloverExpiry: creditsBalance.rolloverExpiry,
        updatedAt: creditsBalance.updatedAt
      } : null
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: "Failed to get user data" });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if token exists in the database
    const tokenRecord = await db.query.tokens.findFirst({
      where: eq(tokens.token, refreshToken)
    });

    if (!tokenRecord) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Check if token is expired
    if (new Date() > new Date(tokenRecord.expiresAt)) {
      // Delete expired token
      await db.delete(tokens).where(eq(tokens.id, tokenRecord.id));
      return res.status(401).json({ error: "Refresh token expired" });
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.id)
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    // Delete old refresh token
    await db.delete(tokens).where(eq(tokens.id, tokenRecord.id));
    
    // Store new refresh token
    const expiresAt = calculateTokenExpiry('7d');
    await db.insert(tokens).values({
      userId: user.id,
      token: newRefreshToken,
      expiresAt
    });

    // Return new tokens
    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (refreshToken) {
      // Delete specific refresh token
      await db.delete(tokens).where(
        and(
          eq(tokens.userId, userId),
          eq(tokens.token, refreshToken)
        )
      );
    } else {
      // Delete all refresh tokens for this user
      await db.delete(tokens).where(eq(tokens.userId, userId));
    }

    return res.status(200).json({ message: "Logged out successfully" });
    
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: "Failed to logout" });
  }
});

export default router;
