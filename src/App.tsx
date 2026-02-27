import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ArchiveLibrary from './pages/ArchiveLibrary';
// FlowView removed — weekly planner is now on the DailyLeaf page
import HabitTrace from './pages/HabitTrace';
import DailyLeaf from './pages/DailyLeaf';
import { useAuth } from './context/AuthContext';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-display italic text-ink-light text-lg">Loading your journal...</span>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/daily" replace />} />
          <Route path="/archive" element={<ArchiveLibrary />} />
          <Route path="/flow" element={<Navigate to="/daily" replace />} />
          <Route path="/habit-trace" element={<HabitTrace />} />
          <Route path="/daily" element={<DailyLeaf />} />
          <Route path="*" element={<Navigate to="/daily" replace />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ProtectedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
