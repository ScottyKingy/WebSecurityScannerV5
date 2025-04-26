import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Users, BarChart2, FileText, FileBox } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { AdminCreditsModal } from '@/components/admin/AdminCreditsModal';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';
import { formatRelativeTime } from '@/lib/utils';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);

  // Get all users
  const {
    data: users,
    isLoading: loadingUsers,
    isError: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/users');
      return await res.json();
    }
  });

  // Get admin stats
  const {
    data: stats,
    isLoading: loadingStats,
    isError: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/stats');
      return await res.json();
    }
  });

  // Get audit logs
  const {
    data: auditLogs,
    isLoading: loadingAuditLogs,
    isError: auditLogsError,
    refetch: refetchAuditLogs
  } = useQuery({
    queryKey: ['/api/admin/audit-logs'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/audit-logs');
      return await res.json();
    }
  });

  // Handle opening the credits modal
  const handleOpenCreditsModal = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setCreditsModalOpen(true);
  };

  // Handle refresh based on active tab
  const handleRefresh = () => {
    switch (activeTab) {
      case 'users':
        refetchUsers();
        break;
      case 'stats':
        refetchStats();
        break;
      case 'audit':
        refetchAuditLogs();
        break;
      default:
        break;
    }
  };

  // Handle credits modal close and refresh
  const handleCreditsModalComplete = () => {
    refetchUsers();
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | WebScanner</title>
      </Helmet>

      <div className="space-y-6 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, view statistics, and review system activity.
            </p>
          </div>
          <div className="shrink-0">
            <span className="text-sm text-muted-foreground mr-2">Logged in as:</span>
            <span className="font-medium">{user?.email}</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid md:w-[400px] grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline">System Stats</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Audit Logs</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-4">
            {loadingUsers ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : usersError ? (
              <div className="text-center p-10 border rounded-md bg-destructive/10">
                <p>Error loading users data. Please try again.</p>
                <Button variant="outline" className="mt-4" onClick={() => refetchUsers()}>
                  Retry
                </Button>
              </div>
            ) : (
              <AdminUserTable 
                users={users || []} 
                onRefresh={refetchUsers} 
                openCreditModal={handleOpenCreditsModal} 
              />
            )}
          </TabsContent>

          {/* STATS TAB */}
          <TabsContent value="stats" className="space-y-4">
            {loadingStats ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : statsError ? (
              <div className="text-center p-10 border rounded-md bg-destructive/10">
                <p>Error loading system statistics. Please try again.</p>
                <Button variant="outline" className="mt-4" onClick={() => refetchStats()}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Summary</CardTitle>
                    <CardDescription>Overall user statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Users</span>
                        <span className="font-medium">{stats?.totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admin Users</span>
                        <span className="font-medium">
                          {stats?.usersByRole?.find(r => r.role === 'admin')?.count || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Regular Users</span>
                        <span className="font-medium">
                          {stats?.usersByRole?.find(r => r.role === 'user')?.count || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tier Distribution</CardTitle>
                    <CardDescription>Users by subscription tier</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats?.usersByTier?.map((tierData: any) => (
                        <div key={tierData.tier} className="flex justify-between">
                          <span className="capitalize text-muted-foreground">{tierData.tier}</span>
                          <span className="font-medium">{tierData.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Credit Summary</CardTitle>
                    <CardDescription>Credit distribution and issuance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Credits Issued</span>
                        <span className="font-medium">{stats?.totalCreditsIssued}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* AUDIT LOGS TAB */}
          <TabsContent value="audit" className="space-y-4">
            {loadingAuditLogs ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : auditLogsError ? (
              <div className="text-center p-10 border rounded-md bg-destructive/10">
                <p>Error loading audit logs. Please try again.</p>
                <Button variant="outline" className="mt-4" onClick={() => refetchAuditLogs()}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead>Admin User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs && auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No audit logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs?.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {formatRelativeTime(new Date(log.createdAt))}
                          </TableCell>
                          <TableCell>{log.userId}</TableCell>
                          <TableCell>
                            <span className="capitalize">
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <FileBox className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AdminCreditsModal
        open={creditsModalOpen}
        onOpenChange={setCreditsModalOpen}
        userId={selectedUserId}
        userEmail={selectedUserEmail}
        onComplete={handleCreditsModalComplete}
      />
    </>
  );
}