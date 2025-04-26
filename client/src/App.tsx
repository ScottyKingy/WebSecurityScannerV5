import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute, AdminRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/useAuth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import HomePage from "@/pages/home-page";
import ScansPage from "@/pages/scans-page";
import ScanDetailsPage from "@/pages/scan-details";
import ReportPage from "@/pages/reports/[scanId]";
import ScanWizard from "@/components/ScanWizard";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/home" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/scans" component={ScansPage} />
      <ProtectedRoute path="/scan-details" component={ScanDetailsPage} />
      {/* New route for the report page - accessible to all (with restricted view for non-premium users) */}
      <Route path="/reports/:scanId" component={ReportPage} />
      <ProtectedRoute path="/scan-wizard" component={() => (
        <div className="container py-10">
          <ScanWizard />
        </div>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {/* Include AuthProvider directly in App for proper context nesting */}
        <AuthProvider>
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
