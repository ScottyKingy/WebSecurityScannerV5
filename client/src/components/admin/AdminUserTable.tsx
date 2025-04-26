import React, { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MoreHorizontal, 
  RefreshCw, 
  Search, 
  UserCog, 
  CreditCard,
  ChevronUp,
  ChevronDown,
  X,
  ArrowUpDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatRelativeTime } from '@/lib/utils';

interface AdminUserTableProps {
  users: any[];
  onRefresh: () => void;
  openCreditModal: (userId: string, email: string) => void;
}

export function AdminUserTable({ users, onRefresh, openCreditModal }: AdminUserTableProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [sortField, setSortField] = useState<string>('email');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Update user role or tier
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string, updates: any }) => {
      const res = await apiRequest('PATCH', `/api/admin/users/${userId}`, updates);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User Updated',
        description: 'User information has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update user information.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle user filters and sorting
  const filteredUsers = users
    .filter(user => {
      // Apply search filter
      if (search && !user.email.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // Apply role filter
      if (roleFilter && roleFilter !== 'all_roles' && user.role !== roleFilter) {
        return false;
      }
      
      // Apply tier filter
      if (tierFilter && tierFilter !== 'all_tiers' && user.tier !== tierFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      const fieldA = a[sortField] || '';
      const fieldB = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return fieldA.localeCompare(fieldB);
      } else {
        return fieldB.localeCompare(fieldA);
      }
    });
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserMutation.mutate({
      userId,
      updates: { role: newRole }
    });
  };
  
  const handleTierChange = (userId: string, newTier: string) => {
    updateUserMutation.mutate({
      userId,
      updates: { tier: newTier }
    });
  };
  
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };
  
  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge className="bg-primary text-white">Admin</Badge>
    ) : (
      <Badge variant="outline">User</Badge>
    );
  };
  
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return <Badge className="bg-purple-600 text-white">Enterprise</Badge>;
      case 'ultimate':
        return <Badge className="bg-indigo-600 text-white">Ultimate</Badge>;
      case 'deep':
        return <Badge className="bg-blue-600 text-white">Deep</Badge>;
      case 'lite':
        return <Badge className="bg-emerald-600 text-white">Lite</Badge>;
      default:
        return <Badge variant="outline">Anonymous</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button 
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
          <div className="w-32">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_roles">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-32">
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_tiers">All Tiers</SelectItem>
                <SelectItem value="lite">Lite</SelectItem>
                <SelectItem value="deep">Deep</SelectItem>
                <SelectItem value="ultimate">Ultimate</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[300px] cursor-pointer"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center">
                  <span>Email</span>
                  {getSortIcon('email')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('role')}>
                <div className="flex items-center">
                  <span>Role</span>
                  {getSortIcon('role')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('tier')}>
                <div className="flex items-center">
                  <span>Tier</span>
                  {getSortIcon('tier')}
                </div>
              </TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead 
                className="w-[180px] cursor-pointer"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  <span>Created</span>
                  {getSortIcon('createdAt')}
                </div>
              </TableHead>
              <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort('lastLogin')}>
                <div className="flex items-center">
                  <span>Last Login</span>
                  {getSortIcon('lastLogin')}
                </div>
              </TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No users found matching the filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-28 h-8">
                        <SelectValue>
                          {getRoleBadge(user.role)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.tier}
                      onValueChange={(value) => handleTierChange(user.id, value)}
                    >
                      <SelectTrigger className="w-28 h-8">
                        <SelectValue>
                          {getTierBadge(user.tier)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lite">Lite</SelectItem>
                        <SelectItem value="deep">Deep</SelectItem>
                        <SelectItem value="ultimate">Ultimate</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.tier === 'enterprise' ? (
                      <Badge variant="outline" className="font-mono">Unlimited</Badge>
                    ) : (
                      <Badge variant="outline" className="font-mono">{user.creditBalance ?? 0}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.createdAt ? formatRelativeTime(new Date(user.createdAt)) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLogin ? formatRelativeTime(new Date(user.lastLogin)) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openCreditModal(user.id, user.email)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>Manage Credits</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserCog className="mr-2 h-4 w-4" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground mt-2">
        Showing {filteredUsers.length} out of {users.length} users
      </div>
    </div>
  );
}