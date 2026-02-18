import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import ArchiveLibrary from './pages/ArchiveLibrary';
import SensorySettings from './pages/SensorySettings';
import CelebrationScrapbook from './pages/CelebrationScrapbook';
import ThoughtCloud from './pages/ThoughtCloud';
import FlowView from './pages/FlowView';
import HabitTrace from './pages/HabitTrace';
import DailyLeaf from './pages/DailyLeaf';
import MigrationStation from './pages/MigrationStation';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/daily" replace />} />
            <Route path="/archive" element={<ArchiveLibrary />} />
            <Route path="/settings" element={<SensorySettings />} />
            <Route path="/scrapbook" element={<CelebrationScrapbook />} />
            <Route path="/thought-cloud" element={<ThoughtCloud />} />
            <Route path="/flow" element={<FlowView />} />
            <Route path="/habit-trace" element={<HabitTrace />} />
            <Route path="/daily" element={<DailyLeaf />} />
            <Route path="/migration" element={<MigrationStation />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
