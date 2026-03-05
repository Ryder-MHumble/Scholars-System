import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import HomePage from "./pages/HomePage";
import ScholarDetailPage from "./pages/ScholarDetailPage";
import AddScholarPage from "./pages/AddScholarPage";
import InstitutionDetailPage from "./pages/InstitutionDetailPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <AnimatePresence mode="wait">
          <Routes>
            <Route index element={<HomePage />} />
            <Route
              path="scholars"
              element={<Navigate to="/?tab=scholars" replace />}
            />
            <Route path="scholars/add" element={<AddScholarPage />} />
            <Route path="scholars/:scholarId" element={<ScholarDetailPage />} />
            <Route
              path="institutions/:id"
              element={<InstitutionDetailPage />}
            />
            <Route path="projects/:projectId" element={<ProjectDetailPage />} />
            <Route
              path="activities/:activityId"
              element={<ActivityDetailPage />}
            />
          </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}
