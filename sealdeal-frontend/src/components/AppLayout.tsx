import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { auth } from '@/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/Toaster';
import {
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Scale,
  TrendingUp,
  Users,
  Settings,
} from 'lucide-react';

// This type definition is the key to fixing the error.
// It explicitly tells TypeScript that this component can accept children.
type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Enhanced Sidebar with better navigation */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-16 flex-col border-r bg-card shadow-sm sm:flex">
        <div className="flex h-16 items-center justify-center border-b">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
        <nav className="flex flex-col items-center gap-2 px-2 py-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex h-10 w-10 items-center justify-center rounded-lg ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              } transition-all duration-200`
            }
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="sr-only">Dashboard</span>
          </NavLink>
          <NavLink
            to="/compare"
            className={({ isActive }) =>
              `flex h-10 w-10 items-center justify-center rounded-lg ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              } transition-all duration-200`
            }
          >
            <Scale className="h-5 w-5" />
            <span className="sr-only">Compare Deals</span>
          </NavLink>
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex h-10 w-10 items-center justify-center rounded-lg ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              } transition-all duration-200`
            }
          >
            <MessageCircle className="h-5 w-5" />
            <span className="sr-only">AI Assistant</span>
          </NavLink>
          <NavLink
            to="/stakeholders"
            className={({ isActive }) =>
              `flex h-10 w-10 items-center justify-center rounded-lg ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              } transition-all duration-200`
            }
          >
            <Users className="h-5 w-5" />
            <span className="sr-only">Stakeholders</span>
          </NavLink>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-2 px-2 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </nav>
      </aside>
      
      {/* Main Content Area */}
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-16">
        {/* Enhanced Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-primary">Seal</span>
              <span className="text-foreground">Deal</span>
              <span className="text-primary">.ai</span>
            </h1>
            <div className="hidden sm:block text-xs text-muted-foreground">
              Investment Intelligence Platform
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-muted-foreground hidden md:inline">
                {user?.email}
              </span>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  );
};

export default AppLayout;

