import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ScholarListPage from "./pages/ScholarListPage";
import ScholarDetailPageDemo from "./pages/ScholarDetailPageDemo";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <AnimatePresence mode="wait">
          <Routes>
            <Route index element={<ScholarListPage />} />
            <Route path="scholars" element={<ScholarListPage />} />
            <Route
              path="scholars/:scholarId"
              element={<ScholarDetailPageDemo />}
            />
          </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}
