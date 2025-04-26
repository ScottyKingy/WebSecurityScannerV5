import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistance, format } from "date-fns";
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle,
  Plus,
  Download
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CreditsTransaction = {
  id: string;
  amount: number;
  description: string;
  balanceAfter: number;
  createdAt: string;
};

export default function UserDashboard() {
  const { user } = useAuth();

  // Fetch credit history if user has deep tier or higher
  const hasAccessToHistory = ['deep', 'ultimate', 'enterprise'].includes(user?.tier || '');
  
  const { data: creditHistory } = useQuery<CreditsTransaction[]>({
    queryKey: ['/api/credits/history'],
    enabled: !!user && hasAccessToHistory
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
      {/* Account Information */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account Information</CardTitle>
          <Badge variant="outline" className="bg-primary-100 text-primary-800 hover:bg-primary-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
              <path d="m12 8-9.04.07m0 0-.12 1.21a1.3 1.3 0 0 0 2.29.86L12 3m0 5v8m0-8 9.04.07m0 0 .12 1.21a1.3 1.3 0 0 1-2.29.86L12 3m0 13 6.87 6.87a1.3 1.3 0 0 0 2.29-.86l.12-1.21M12 16l-9.04.07m0 0-.12 1.21a1.3 1.3 0 0 1-2.29-.86L12 21"/>
            </svg>
            {user?.tier.charAt(0).toUpperCase() + user?.tier.slice(1)}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Email address</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Account Role</p>
              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Credits Balance</p>
              <div className="flex items-center">
                <span className="font-medium text-lg mr-2">
                  {user?.creditsBalance?.amount || 0}
                </span>
                <Button variant="outline" size="sm" className="ml-2 h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Buy More
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Account Created</p>
              <p className="font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                {user?.createdAt && formatDate(user.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Last Login</p>
              <p className="font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                {formatRelativeTime(user?.lastLogin)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Tier Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Current Plan */}
          <div className="bg-primary-50 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-semibold text-primary-900">
                  {user?.tier.charAt(0).toUpperCase() + user?.tier.slice(1)}
                </h4>
                <p className="text-primary-700 mt-1">Your current plan with advanced features</p>
                <ul className="mt-4 space-y-2">
                  {user?.tier === 'lite' && (
                    <>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> Basic vulnerability scanning
                      </li>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> 5 scans per month
                      </li>
                    </>
                  )}
                  {user?.tier === 'deep' && (
                    <>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> Enhanced security scanning
                      </li>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> 20 scans per month
                      </li>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> Credit transaction history
                      </li>
                    </>
                  )}
                  {user?.tier === 'ultimate' && (
                    <>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> Advanced vulnerability scanning
                      </li>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> Custom scan scheduling
                      </li>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> Unlimited scan history
                      </li>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> API access
                      </li>
                    </>
                  )}
                  {user?.tier === 'enterprise' && (
                    <>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> Full-featured scanning
                      </li>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> Custom reporting
                      </li>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> Priority support
                      </li>
                      <li className="flex items-center text-sm text-primary-800">
                        <CheckCircle className="h-4 w-4 mr-2 text-primary-600" /> Custom integrations
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <Button>Manage Plan</Button>
            </div>
          </div>

          {/* Available Plans */}
          <h4 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Lite Plan */}
            <div className={`border ${user?.tier === 'lite' ? 'border-primary-200 bg-primary-50' : 'border-gray-200'} rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}>
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium text-gray-900">Lite</h5>
                  <p className="text-sm text-gray-500 mt-1">Basic scanning</p>
                </div>
                <span className="text-sm font-medium text-gray-900">Free</span>
              </div>
              {user?.tier !== 'lite' ? (
                <Button variant="outline" className="mt-4 w-full">Switch</Button>
              ) : (
                <Button variant="outline" className="mt-4 w-full bg-primary-100 text-primary-800 cursor-default">Current Plan</Button>
              )}
            </div>

            {/* Deep Plan */}
            <div className={`border ${user?.tier === 'deep' ? 'border-primary-200 bg-primary-50' : 'border-gray-200'} rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}>
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium text-gray-900">Deep</h5>
                  <p className="text-sm text-gray-500 mt-1">Enhanced security</p>
                </div>
                <span className="text-sm font-medium text-gray-900">$19/mo</span>
              </div>
              {user?.tier !== 'deep' ? (
                <Button variant="outline" className="mt-4 w-full">Switch</Button>
              ) : (
                <Button variant="outline" className="mt-4 w-full bg-primary-100 text-primary-800 cursor-default">Current Plan</Button>
              )}
            </div>

            {/* Ultimate Plan */}
            <div className={`border ${user?.tier === 'ultimate' ? 'border-primary-200 bg-primary-50' : 'border-gray-200'} rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}>
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium text-gray-900">Ultimate</h5>
                  <p className="text-sm text-gray-500 mt-1">Advanced features</p>
                </div>
                <span className="text-sm font-medium text-gray-900">$49/mo</span>
              </div>
              {user?.tier !== 'ultimate' ? (
                <Button variant="outline" className="mt-4 w-full">Switch</Button>
              ) : (
                <Button variant="primary" className="mt-4 w-full cursor-default">Current Plan</Button>
              )}
            </div>

            {/* Enterprise Plan */}
            <div className={`border ${user?.tier === 'enterprise' ? 'border-primary-200 bg-primary-50' : 'border-gray-200'} rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}>
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium text-gray-900">Enterprise</h5>
                  <p className="text-sm text-gray-500 mt-1">Custom solution</p>
                </div>
                <span className="text-sm font-medium text-gray-900">Custom</span>
              </div>
              {user?.tier !== 'enterprise' ? (
                <Button variant="outline" className="mt-4 w-full">Contact Sales</Button>
              ) : (
                <Button variant="outline" className="mt-4 w-full bg-primary-100 text-primary-800 cursor-default">Current Plan</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit History - Only visible for deep tier and above */}
      {hasAccessToHistory && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Credits History</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditHistory && creditHistory.length > 0 ? (
                  creditHistory.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-gray-500">{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount}
                      </TableCell>
                      <TableCell className="text-gray-500">{transaction.balanceAfter}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                      No transaction history available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
