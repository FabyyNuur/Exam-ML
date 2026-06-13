import { Routes, Route } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { ReportsHub } from './components/reports/ReportsHub';
import { ReportViewerPage } from './components/reports/ReportViewerPage';
import './reports.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/rapports" element={<ReportsHub />} />
      <Route path="/rapport/:reportId" element={<ReportViewerPage />} />
    </Routes>
  );
}
