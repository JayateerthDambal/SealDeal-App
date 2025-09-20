import { createContext, useState, useEffect, ReactNode } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/firebaseConfig';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  role: string | null; // Add role to the context
}

export const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true, role: null });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult();
        setRole(tokenResult.claims.role as string || 'analyst');
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, isLoading, role };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

