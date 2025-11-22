import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { WebSocketProvider } from "@/lib/websocket";
import { CallingProvider } from "@/lib/calling";
import { ThemeToggle } from "@/components/ThemeToggle";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Feed from "@/pages/feed";
import Messages from "@/pages/messages";
import Groups from "@/pages/groups";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import NotFound from "@/pages/not-found";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function PublicRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-hidden flex">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/signup" component={() => <PublicRoute component={Signup} />} />
      
      <Route path="/">
        {() => (
          <ProtectedRoute
            component={() => (
              <AppLayout>
                <Feed />
              </AppLayout>
            )}
          />
        )}
      </Route>

      <Route path="/messages">
        {() => (
          <ProtectedRoute
            component={() => (
              <AppLayout>
                <Messages />
              </AppLayout>
            )}
          />
        )}
      </Route>

      <Route path="/groups">
        {() => (
          <ProtectedRoute
            component={() => (
              <AppLayout>
                <Groups />
              </AppLayout>
            )}
          />
        )}
      </Route>

      <Route path="/notifications">
        {() => (
          <ProtectedRoute
            component={() => (
              <AppLayout>
                <Notifications />
              </AppLayout>
            )}
          />
        )}
      </Route>

      <Route path="/profile/:userId">
        {() => (
          <ProtectedRoute
            component={() => (
              <AppLayout>
                <Profile />
              </AppLayout>
            )}
          />
        )}
      </Route>

      <Route path="/settings">
        {() => (
          <ProtectedRoute
            component={() => (
              <AppLayout>
                <Settings />
              </AppLayout>
            )}
          />
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WebSocketProvider>
            <CallingProvider>
              <Toaster />
              <Router />
            </CallingProvider>
          </WebSocketProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
