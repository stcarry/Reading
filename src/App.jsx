import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Coaching from './pages/Coaching';
import Notes from './pages/Notes';
import Stats from './pages/Stats';
import Guide from './pages/Guide';
import Workbook from './pages/Workbook';
import { initSampleData } from './data/store';

export default function App() {
  useEffect(() => {
    initSampleData();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/coaching" element={<Coaching />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/workbook" element={<Workbook />} />
        </Routes>
      </main>
    </div>
  );
}
