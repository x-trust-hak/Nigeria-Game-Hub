import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Main Pages
import Home from "@/pages/main/Home";
import Games from "@/pages/main/Games";
import Wallet from "@/pages/main/Wallet";
import Profile from "@/pages/main/Profile";
import Rewards from "@/pages/main/Rewards";
import Referral from "@/pages/main/Referral";
import Membership from "@/pages/main/Membership";
import Notifications from "@/pages/main/Notifications";
import Leaderboard from "@/pages/main/Leaderboard";

// Admin Pages
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminMemberships from "@/pages/admin/AdminMemberships";
import AdminDeposits from "@/pages/admin/AdminDeposits";
import AdminWithdrawals from "@/pages/admin/AdminWithdrawals";
import AdminGames from "@/pages/admin/AdminGames";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminPlans from "@/pages/admin/AdminPlans";
import AdminTransactions from "@/pages/admin/AdminTransactions";

// Layouts
import MainLayout from "@/components/layout/MainLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (adminOnly && user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function AdminRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />

      {/* Protected Routes */}
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/games" component={() => <ProtectedRoute component={Games} />} />
      <Route path="/wallet" component={() => <ProtectedRoute component={Wallet} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/rewards" component={() => <ProtectedRoute component={Rewards} />} />
      <Route path="/referral" component={() => <ProtectedRoute component={Referral} />} />
      <Route path="/membership" component={() => <ProtectedRoute component={Membership} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route path="/leaderboard" component={() => <ProtectedRoute component={Leaderboard} />} />

      {/* Admin Routes */}
      <Route path="/admin" component={() => <AdminRoute component={AdminDashboard} />} />
      <Route path="/admin/users" component={() => <AdminRoute component={AdminUsers} />} />
      <Route path="/admin/memberships" component={() => <AdminRoute component={AdminMemberships} />} />
      <Route path="/admin/deposits" component={() => <AdminRoute component={AdminDeposits} />} />
      <Route path="/admin/withdrawals" component={() => <AdminRoute component={AdminWithdrawals} />} />
      <Route path="/admin/games" component={() => <AdminRoute component={AdminGames} />} />
      <Route path="/admin/notifications" component={() => <AdminRoute component={AdminNotifications} />} />
      <Route path="/admin/activity" component={() => <AdminRoute component={AdminNotifications} />} />
      <Route path="/admin/settings" component={() => <AdminRoute component={AdminSettings} />} />
      <Route path="/admin/plans" component={() => <AdminRoute component={AdminPlans} />} />
      <Route path="/admin/transactions" component={() => <AdminRoute component={AdminTransactions} />} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
