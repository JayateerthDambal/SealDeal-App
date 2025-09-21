import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DealAnalysisPage from './pages/DealAnalysisPage';
import ChatPage from './pages/ChatPage';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ErrorBoundary>
                  <Routes>
                    {/* Redirect from the base path to the dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/deal/:dealId" element={<DealAnalysisPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    {/* Future protected routes like /compare or /stakeholders
                      will be added here.
                    */}
                  </Routes>
                </ErrorBoundary>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

