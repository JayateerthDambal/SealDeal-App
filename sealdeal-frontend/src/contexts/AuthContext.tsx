import { createContext, useState, useEffect } from "react";
import { ReactNode } from "react";
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig.ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

