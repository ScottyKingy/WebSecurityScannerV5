import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                tier: string;
            };
        }
    }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decodedToken = verifyAccessToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

/**
 * Middleware to require a minimum tier level
 * @param minTier The minimum tier required (lite, deep, ultimate, enterprise)
 */
export function requireTier(minTier: string) {
    return function (req: Request, res: Response, next: NextFunction) {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const tierOrder = ["anonymous", "lite", "deep", "ultimate", "enterprise"];
        const userTierIndex = tierOrder.indexOf(req.user.tier);
        const requiredTierIndex = tierOrder.indexOf(minTier);

        if (userTierIndex < requiredTierIndex) {
            return res.status(403).json({
                message: `This action requires ${minTier} tier or higher`,
                requiredTier: minTier,
                currentTier: req.user.tier
            });
        }

        next();
    };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin privileges required for this action"
        });
    }

    next();
}