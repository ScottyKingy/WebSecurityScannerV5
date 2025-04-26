import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Edit2, Search, X, CreditCard } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatRelativeTime } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  role: string;
  tier: string;
  createdAt: string;
  lastLogin?: string;
  creditBalance?: number;
}

interface AdminUserTableProps {
  users: User[];
  onRefresh: () => void;
  openCreditModal: (userId: string, email: string) => void;
}

export function AdminUserTable({ users, onRefresh, openCreditModal }: AdminUserTableProps) {
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [updatedValues, setUpdatedValues] = useState<{ role?: string; tier?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = search
    ? users.filter(user => 
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.role.toLowerCase().includes(search.toLowerCase()) ||
        user.tier.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUpdatedValues({ role: user.role, tier: user.tier });
  };

  const handleCloseDialog = () => {
    setEditingUser(null);
    setUpdatedValues({});
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !updatedValues) return;
    
    try {
      setIsSubmitting(true);
      const response = await apiRequest(
        'PATCH',
        `/api/admin/users/${editingUser.id}`,
        updatedValues
      );
      
      if (response.ok) {
        toast({
          title: 'User updated',
          description: `${editingUser.email} has been updated successfully.`,
        });
        onRefresh();
        handleCloseDialog();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ultimate':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'deep':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lite':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {search ? 'No users match your search criteria.' : 'No users found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTierBadgeColor(user.tier)}>
                      {user.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {formatRelativeTime(new Date(user.createdAt))}
                        </TooltipTrigger>
                        <TooltipContent>
                          {new Date(user.createdAt).toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {formatRelativeTime(new Date(user.lastLogin))}
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(user.lastLogin).toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-xs">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.creditBalance !== undefined ? (
                      <span>{user.tier === 'enterprise' ? 'Unlimited' : user.creditBalance}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCreditModal(user.id, user.email)}
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      <span>Credits</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 py-2">
              <div className="font-medium">{editingUser.email}</div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={updatedValues.role || editingUser.role}
                  onValueChange={(value) => setUpdatedValues({ ...updatedValues, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium">Tier</label>
                <Select
                  value={updatedValues.tier || editingUser.tier}
                  onValueChange={(value) => setUpdatedValues({ ...updatedValues, tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lite">Lite</SelectItem>
                    <SelectItem value="deep">Deep</SelectItem>
                    <SelectItem value="ultimate">Ultimate</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="h-4 w-4 mr-1" />
              <span>Cancel</span>
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <span>Updating...</span>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}