import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import EligibilityForm from "./pages/EligibilityForm";
import BrowseSchemes from "./pages/BrowseSchemes";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Legal from "./pages/Legal";

const Chat = lazy(() => import("./pages/Chat"));
const History = lazy(() => import("./pages/History"));

function PageLoading() {
  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center text-sm text-muted">
      Loading…
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/eligibility" element={<EligibilityForm />} />
          <Route path="/schemes" element={<BrowseSchemes />} />
          <Route path="/history" element={<History />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/privacy" element={<Legal type="privacy" />} />
          <Route path="/terms" element={<Legal type="terms" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;