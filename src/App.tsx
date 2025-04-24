
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import UploadPage from "@/pages/Upload";
import Chat from "@/pages/Chat";
import Dashboard from "@/pages/Dashboard";
import PatientDetail from "@/pages/PatientDetail";
import Index from "@/pages/Index";  // Import the Index component for the home page
import Resources from "@/pages/Resources"; // Import the Resources component
import PatientList from "@/pages/PatientList"; // Import the PatientList component

export default function App() {
  console.log("App component rendering");
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/upload/:id" element={<UploadPage />} />
          <Route path="/patient/:id" element={<PatientDetail />} />
          <Route path="/patients" element={<PatientList />} /> {/* Add the patients route */}
          <Route path="/resources" element={<Resources />} /> {/* Add the resources route */}
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}
