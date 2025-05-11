import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import TeacherSchedulePage from "@/pages/teacher-schedule-page";
import DutyManagementPage from "@/pages/duty-management-page";
import AbsentTeacherPage from "@/pages/absent-teacher-page";
import ExtraLessonPage from "@/pages/extra-lesson-page";
import PeriodsPage from "@/pages/periods-page";
import AdminPage from "@/pages/admin-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/schedule" component={TeacherSchedulePage} />
      <ProtectedRoute path="/periods" component={PeriodsPage} />
      <ProtectedRoute path="/duty" component={DutyManagementPage} />
      <ProtectedRoute path="/absent" component={AbsentTeacherPage} />
      <ProtectedRoute path="/extra-lesson" component={ExtraLessonPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/admin/:section" component={AdminPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
