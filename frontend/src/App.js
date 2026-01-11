import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from 'sonner';
import { AuthCallback, ProtectedRoute } from './components/AuthCallback';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Curriculum from './pages/Curriculum';
import ModuleDetail from './pages/ModuleDetail';
import Tools from './pages/Tools';
import MarketMatrix from './pages/MarketMatrix';
import FinancialCalculator from './pages/FinancialCalculator';
import Chatbot from './pages/Chatbot';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import AdminContent from './pages/AdminContent';

// Router wrapper to handle auth callback
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id SYNCHRONOUSLY during render
  // This prevents race conditions with ProtectedRoute
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            {({ user }) => <Dashboard user={user} />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/curriculum" 
        element={
          <ProtectedRoute>
            {({ user }) => <Curriculum user={user} />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/module/:moduleId" 
        element={
          <ProtectedRoute>
            {({ user }) => <ModuleDetail user={user} />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tools" 
        element={
          <ProtectedRoute>
            {({ user }) => <Tools user={user} />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tools/market-matrix" 
        element={
          <ProtectedRoute>
            {({ user }) => <MarketMatrix user={user} />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tools/financial" 
        element={
          <ProtectedRoute>
            {({ user }) => <FinancialCalculator user={user} />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            {({ user }) => <Chatbot user={user} />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/resources" 
        element={
          <ProtectedRoute>
            {({ user }) => <Dashboard user={user} />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            {({ user }) => <Settings user={user} />}
          </ProtectedRoute>
        } 
      />

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            {({ user }) => 
              user?.role === 'admin' || user?.role === 'instructor' 
                ? <AdminDashboard user={user} />
                : <Navigate to="/dashboard" replace />
            }
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/content" 
        element={
          <ProtectedRoute>
            {({ user }) => 
              user?.role === 'admin' || user?.role === 'instructor' 
                ? <AdminContent user={user} />
                : <Navigate to="/dashboard" replace />
            }
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute>
            {({ user }) => 
              user?.role === 'admin' 
                ? <AdminDashboard user={user} />
                : <Navigate to="/dashboard" replace />
            }
          </ProtectedRoute>
        } 
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            fontFamily: 'Public Sans, sans-serif',
          },
        }}
      />
    </div>
  );
}

export default App;
