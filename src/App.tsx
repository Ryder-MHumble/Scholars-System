import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import DashboardPage from './pages/DashboardPage';
import InstitutionBrowserPage from './pages/InstitutionBrowserPage';
import ScholarListPage from './pages/ScholarListPage';
import ScholarDetailPage from './pages/ScholarDetailPage';
import ChangeLogPage from './pages/ChangeLogPage';
import ExportPage from './pages/ExportPage';
import SearchResultsPage from './pages/SearchResultsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="institutions" element={<InstitutionBrowserPage />} />
          <Route path="institutions/:universityId" element={<InstitutionBrowserPage />} />
          <Route path="institutions/:universityId/:departmentId" element={<InstitutionBrowserPage />} />
          <Route path="scholars" element={<ScholarListPage />} />
          <Route path="scholars/:scholarId" element={<ScholarDetailPage />} />
          <Route path="search" element={<SearchResultsPage />} />
          <Route path="changelog" element={<ChangeLogPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
