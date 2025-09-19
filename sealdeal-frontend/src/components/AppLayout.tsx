import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { auth } from '@/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/Toaster';
import {
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Scale,
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
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex h-9 w-9 items-center justify-center rounded-lg ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              } transition-colors hover:text-foreground md:h-8 md:w-8`
            }
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="sr-only">Dashboard</span>
          </NavLink>
          <NavLink
            to="/compare"
            className={({ isActive }) =>
              `flex h-9 w-9 items-center justify-center rounded-lg ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              } transition-colors hover:text-foreground md:h-8 md:w-8`
            }
          >
            <Scale className="h-5 w-5" />
            <span className="sr-only">Compare Deals</span>
          </NavLink>
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex h-9 w-9 items-center justify-center rounded-lg ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              } transition-colors hover:text-foreground md:h-8 md:w-8`
            }
          >
            <MessageCircle className="h-5 w-5" />
            <span className="sr-only">Chat Agent</span>
          </NavLink>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            SealDeal.ai
          </h1>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </header>
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  );
};

export default AppLayout;

