import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import HomePage from "./pages/HomePage";
import ScholarDetailPage from "./pages/ScholarDetailPage";
import AddScholarDetailPage from "./pages/AddScholarDetailPage";
import InstitutionDetailPage from "./pages/InstitutionDetailPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ActivityDetailPage from "./pages/ActivityDetailPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import { InstitutionPickerPage } from "./pages/InstitutionPickerPage";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <AnimatePresence mode="wait">
            <Routes>
              <Route index element={<HomePage />} />
              <Route
                path="scholars"
                element={<Navigate to="/?tab=scholars" replace />}
              />
              <Route path="scholars/add" element={<AddScholarDetailPage />} />
              <Route
                path="scholars/:scholarId"
                element={<ScholarDetailPage />}
              />
              <Route
                path="institutions/:id"
                element={<InstitutionDetailPage />}
              />
              <Route
                path="institutions/picker"
                element={<InstitutionPickerPage />}
              />
              <Route
                path="projects/:projectId"
                element={<ProjectDetailPage />}
              />
              <Route
                path="activities/:activityId"
                element={<ActivityDetailPage />}
              />
              <Route
                path="students/:studentId"
                element={<StudentDetailPage />}
              />
            </Routes>
          </AnimatePresence>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
