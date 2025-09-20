import { NavLink, Outlet } from 'react-router-dom';
import { Button } from './ui/Button';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { Toaster } from './ui/Toaster';
import { LayoutDashboard, Scale, MessageSquare, LogOut, Loader2, ShieldCheck } from 'lucide-react';
import iconlogo from '../assets/icon.png';
import { ThemeToggle } from './ThemeToggle';
import ChatWidget from './chat/ChatWidget'; // Import the Chat Widget

export default function AppLayout() {
  const { user, isLoading, role } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, text: 'Dashboard' },
    { to: '/compare', icon: Scale, text: 'Compare Deals' },
    { to: '/chat', icon: MessageSquare, text: 'Chat Agent' },
  ];

  const isAdmin = role === 'admin' || role === 'benchmarking_admin';

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-primary/10 flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 py-4">
            <img src={iconlogo} alt="SealDeal.ai icon Logo" className="h-12 w-auto" />
            <span className="text-xl font-bold text-primary">SealDeal.ai</span>
        </div>
        <nav className="flex flex-col gap-2 mt-8 flex-grow">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-secondary ${
                  isActive ? 'bg-secondary text-primary font-semibold' : 'text-muted-foreground'
                }`
              }
            >
              <link.icon className="h-5 w-5" />
              {link.text}
            </NavLink>
          ))}
          {isAdmin && (
               <NavLink
                to="/admin"
                className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-secondary ${
                    isActive ? 'bg-secondary text-primary font-semibold' : 'text-muted-foreground'
                    }`
                }
                >
                <ShieldCheck className="h-5 w-5" />
                Admin Panel
                </NavLink>
          )}
        </nav>
         <div className="mt-auto">
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
         </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="flex h-16 items-center justify-between border-b border-primary/10 px-6">
           <div/>
           <div className="flex items-center gap-4">
               <ThemeToggle />
               <div className="text-sm text-right">
                    <p className="font-semibold">{user?.displayName || user?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{role || 'Analyst'}</p>
               </div>
           </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      <Toaster />
      <ChatWidget /> {/* Add the floating widget here */}
    </div>
  );
}

