import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import EligibilityForm from "./pages/EligibilityForm";
import BrowseSchemes from "./pages/BrowseSchemes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/eligibility" element={<EligibilityForm />} />
        <Route path="/schemes" element={<BrowseSchemes />} />
        <Route path="/about" element={<div>About - Coming Soon</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;