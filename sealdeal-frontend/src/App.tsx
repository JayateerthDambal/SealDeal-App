import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ChartBarIcon, 
  UserCircleIcon, 
  CogIcon, 
  ArrowRightOnRectangleIcon,
  BellIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import BenchmarkAdmin from './components/BenchmarkAdmin';
import ProfilePage from './components/ProfilePage';
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

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="text-white">
            <h3 className="text-xl font-semibold mb-2">SealDeal</h3>
            <p className="text-blue-200 animate-pulse">Loading your investment platform...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {!user ? (
        <Login />
      ) : (
        <div className="min-h-screen bg-gray-50">
          {/* Enhanced Stakeholder-Centric Navbar */}
          <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo and Brand */}
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">SealDeal</h1>
                      <p className="text-xs text-gray-500 -mt-1">Investment Analytics Platform</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-1">
                  <button
                    onClick={() => setPage('dashboard')}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      page === 'dashboard'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Squares2X2Icon className="h-4 w-4 mr-2" />
                    Portfolio Dashboard
                  </button>
                  
                  <button
                    onClick={() => setPage('profile')}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      page === 'profile'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <UserCircleIcon className="h-4 w-4 mr-2" />
                    Profile
                  </button>

                  {userProfile?.role === 'admin' && (
                    <button
                      onClick={() => setPage('admin')}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        page === 'admin'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <CogIcon className="h-4 w-4 mr-2" />
                      Admin Panel
                    </button>
                  )}
                </div>

                {/* Right side - User info and actions */}
                <div className="flex items-center space-x-4">
                  {/* Notifications */}
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <BellIcon className="h-5 w-5" />
                  </button>

                  {/* User Profile Section */}
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                        {user?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {userProfile?.role || 'Analyst'}
                      </div>
                    </div>
                    <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>

              {/* Mobile Navigation */}
              <div className="md:hidden border-t border-gray-200 py-2">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setPage('dashboard')}
                    className={`flex-1 inline-flex items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      page === 'dashboard'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Squares2X2Icon className="h-4 w-4 mr-1" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => setPage('profile')}
                    className={`flex-1 inline-flex items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      page === 'profile'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <UserCircleIcon className="h-4 w-4 mr-1" />
                    Profile
                  </button>
                  {userProfile?.role === 'admin' && (
                    <button
                      onClick={() => setPage('admin')}
                      className={`flex-1 inline-flex items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        page === 'admin'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <CogIcon className="h-4 w-4 mr-1" />
                      Admin
                    </button>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Page Content */}
          <main>
            {page === 'dashboard' && <Dashboard />}
            {page === 'profile' && <ProfilePage />}
            {page === 'admin' && userProfile?.role === 'admin' && <BenchmarkAdmin />}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;

