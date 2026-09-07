import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Chat from "./pages/Chat";
import EligibilityForm from "./pages/EligibilityForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/eligibility" element={<EligibilityForm />} />

        {/* Temporary pages - we will build these later */}
        <Route
          path="/schemes"
          element={<div>Browse Schemes - Coming Soon</div>}
        />
        <Route
          path="/about"
          element={<div>About - Coming Soon</div>}
        />

        {/* Any unknown URL goes back to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
