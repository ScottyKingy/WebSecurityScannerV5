import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Download, 
  Plus, 
  Search, 
  UserPlus 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistance, format } from "date-fns";

type User = {
  id: string;
  email: string;
  role: string;
  tier: string;
  createdAt: string;
  lastLogin?: string;
  isVerified: boolean;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Get user's initials for avatar
  const getInitials = (email: string) => {
    const parts = email.split("@")[0].split(".");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Filter users based on search and filters
  const filteredUsers = users?.filter(user => {
    // Apply search filter
    const matchesSearch = searchQuery === "" || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    // Apply tier filter
    const matchesTier = tierFilter === "all" || user.tier === tierFilter;
    
    return matchesSearch && matchesRole && matchesTier;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  // Format relative time
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="space-x-3">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" /> Add User
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200">
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="users"
                  className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-4 border-b-2 font-medium text-sm"
                >
                  Users
                </TabsTrigger>
                <TabsTrigger 
                  value="transactions"
                  className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-4 border-b-2 font-medium text-sm"
                >
                  Transactions
                </TabsTrigger>
                <TabsTrigger 
                  value="audit"
                  className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-4 border-b-2 font-medium text-sm"
                >
                  Audit Logs
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-4 border-b-2 font-medium text-sm"
                >
                  System Settings
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="users" className="p-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row mb-6 space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="text" 
                    placeholder="Search users..." 
                    className="pl-10" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All tiers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tiers</SelectItem>
                      <SelectItem value="anonymous">Anonymous</SelectItem>
                      <SelectItem value="lite">Lite</SelectItem>
                      <SelectItem value="deep">Deep</SelectItem>
                      <SelectItem value="ultimate">Ultimate</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role / Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">Loading users...</TableCell>
                      </TableRow>
                    ) : filteredUsers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">No users found</TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 bg-primary-200 text-primary-700">
                                <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500">{user.id.substring(0, 8)}...</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Badge variant="outline" className={user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {user.role}
                              </Badge>
                              <span className="mt-1 text-gray-500 text-sm">
                                {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isVerified ? "success" : "secondary"}>
                              {user.isVerified ? "Verified" : "Unverified"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatRelativeTime(user.lastLogin)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            <Button variant="ghost" className="text-primary-600 hover:text-primary-900 mr-2">Edit</Button>
                            <Button variant="ghost" className="text-red-600 hover:text-red-900">Suspend</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="py-4 flex items-center justify-between">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers?.length || 0}</span> of <span className="font-medium">{users?.length || 0}</span> users
                  </p>
                </div>
                <div className="flex-1 flex justify-between sm:justify-end">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" className="ml-3" disabled>Next</Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="transactions" className="p-6">
              <div className="text-center py-8 text-gray-500">
                Transaction management coming soon
              </div>
            </TabsContent>
            
            <TabsContent value="audit" className="p-6">
              <div className="text-center py-8 text-gray-500">
                Audit logs coming soon
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="p-6">
              <div className="text-center py-8 text-gray-500">
                System settings coming soon
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
