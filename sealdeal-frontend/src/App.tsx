import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import BenchmarkAdmin from './components/BenchmarkAdmin';
import ProfilePage from './components/ProfilePage'; // This will now import correctly
import { type UserProfile } from './types';
import './App.css';

function App() {
  const [user, loading] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [page, setPage] = useState<'dashboard' | 'admin' | 'profile'>('dashboard');

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        }
      });
      return () => unsubscribe();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {!user ? (
        <Login />
      ) : (
        <>
          <nav style={{ padding: '1rem', background: '#eee', display: 'flex', gap: '1rem' }}>
            <button onClick={() => setPage('dashboard')}>Dashboard</button>
            <button onClick={() => setPage('profile')}>Profile</button>
            {userProfile?.role === 'admin' && (
              <button onClick={() => setPage('admin')}>Admin Panel</button>
            )}
          </nav>
          {page === 'dashboard' && <Dashboard />}
          {page === 'profile' && <ProfilePage />}
          {page === 'admin' && userProfile?.role === 'admin' && <BenchmarkAdmin />}
        </>
      )}
    </div>
  );
}

export default App;

