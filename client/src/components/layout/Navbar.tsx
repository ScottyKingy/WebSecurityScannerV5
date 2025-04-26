import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, User, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function Navbar() {
  const { user, isLoading, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  const { data: creditsBalance } = useQuery({
    queryKey: ['/api/credits/balance'],
    enabled: !!user
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user's initials for avatar
  const getInitials = () => {
    if (!user?.email) return "U";
    const parts = user.email.split("@")[0].split(".");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };
  
  // Get user tier with fallback to prevent errors
  const getUserTier = () => {
    if (!user?.tier) return "Lite";
    return user.tier.charAt(0).toUpperCase() + user.tier.slice(1);
  };

  // Check if a path is active (current location)
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path === '/dashboard' && (location === '/dashboard' || location === '/')) return true;
    return location === path;
  };

  if (!user) return null;
  
  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-primary font-bold text-2xl cursor-pointer">
                WebScanner<span className="text-gray-500 text-sm align-super">v4</span>
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/dashboard" 
                className={`${isActive('/dashboard') ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dashboard
              </Link>
              <Link 
                href="/scans" 
                className={`${isActive('/scans') ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Scans
              </Link>
              <Link 
                href="/scan-wizard" 
                className={`${isActive('/scan-wizard') ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                New Scan
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className={`${isActive('/admin') ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          
          {/* User menu */}
          <div className="ml-3 relative flex items-center">
            <span className="mr-2 hidden md:block">{user?.email}</span>
            <div className="flex items-center">
              <Button 
                variant="outline" 
                className="bg-primary-100 text-primary-800 hover:bg-primary-200 border-primary-200 mr-4"
                size="sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                  <path d="m12 8-9.04.07m0 0-.12 1.21a1.3 1.3 0 0 0 2.29.86L12 3m0 5v8m0-8 9.04.07m0 0 .12 1.21a1.3 1.3 0 0 1-2.29.86L12 3m0 13 6.87 6.87a1.3 1.3 0 0 0 2.29-.86l.12-1.21M12 16l-9.04.07m0 0-.12 1.21a1.3 1.3 0 0 1-2.29-.86L12 21"/>
                </svg>
                <span>{getUserTier()}</span>
              </Button>
              
              {/* Credits balance */}
              <Button 
                variant="outline"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200 mr-4"
                size="sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                <span>{creditsBalance?.currentBalance || 0} credits</span>
              </Button>
              
              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-1 rounded-full">
                    <span className="sr-only">Open user menu</span>
                    <Avatar className="h-10 w-10 bg-primary-200 text-primary-700">
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Buy Credits</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}