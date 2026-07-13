import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazyWithRetry } from "./utils/lazyWithRetry";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
const HomePage = lazyWithRetry(() => import("./pages/HomePage"), "home-page");
const ScholarDetailPage = lazyWithRetry(
  () => import("./pages/ScholarDetailPage"),
  "scholar-detail-page",
);
const AddScholarDetailPage = lazyWithRetry(
  () => import("./pages/AddScholarDetailPage"),
  "add-scholar-detail-page",
);
const InstitutionDetailPage = lazyWithRetry(
  () => import("./pages/InstitutionDetailPage"),
  "institution-detail-page",
);
const ProjectDetailPage = lazyWithRetry(
  () => import("./pages/ProjectDetailPage"),
  "project-detail-page",
);
const ActivityDetailPage = lazyWithRetry(
  () => import("./pages/ActivityDetailPage"),
  "activity-detail-page",
);
const StudentDetailPage = lazyWithRetry(
  () => import("./pages/StudentDetailPage"),
  "student-detail-page",
);
import { InstitutionPickerPage } from "./pages/InstitutionPickerPage";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
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
          </Suspense>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
