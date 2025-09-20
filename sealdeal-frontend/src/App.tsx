import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DealAnalysisPage from './pages/DealAnalysisPage';
import ComparePage from './pages/ComparePage';
import AdminPage from './pages/AdminPage'; // Import AdminPage
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route 
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="deal/:dealId" element={<DealAnalysisPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="admin" element={<AdminPage />} /> {/* Add Admin Route */}
      </Route>
    </Routes>
  );
}

export default App;

