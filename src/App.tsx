
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import UploadPage from "@/pages/Upload";
import Chat from "@/pages/Chat";
import Dashboard from "@/pages/Dashboard";
import PatientDetail from "@/pages/PatientDetail"; // Updated import to use the existing PatientDetail page

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/upload/:id" element={<UploadPage />} />
          <Route path="/patient/:id" element={<PatientDetail />} /> {/* Updated component */}
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}
