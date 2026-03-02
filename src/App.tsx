import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ScholarListPage from "./pages/ScholarListPage";
import ScholarDetailPage from "./pages/ScholarDetailPage";
import AddScholarPage from "./pages/AddScholarPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <AnimatePresence mode="wait">
          <Routes>
            <Route index element={<ScholarListPage />} />
            <Route path="scholars" element={<ScholarListPage />} />
            <Route path="scholars/add" element={<AddScholarPage />} />
            <Route
              path="scholars/:scholarId"
              element={<ScholarDetailPage />}
            />
          </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}
