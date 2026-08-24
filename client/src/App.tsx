import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GlobalProvider } from "./contexts/GlobalContext";
import { queryClient } from "./api/auth";
import LoadingIndicator from "./components/UI/LoadingIndicator/LoadingIndicator";

import HomePage from "./pages/HomePage";
import PeoplePage from "./pages/PeoplePage";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import LandingPage from "./pages/LandingPage";

const RoomPage = lazy(() => import("./pages/RoomPage"));

import ProtectedRoute from "./components/Routes/ProtectedRoute";
import PublicOnlyRoute from "./components/Routes/PublicOnlyRoute";

const PageFallback = () => (
  <div className="flex justify-center items-center h-[100dvh] w-full bg-background text-foreground">
    <LoadingIndicator size="lg" />
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalProvider>
        <BrowserRouter>
          <ToastContainer
            position="top-center"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public-only routes (accessible only for logged out users) */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Protected app routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/chats" element={<HomePage />} />
                <Route path="/people" element={<PeoplePage />} />
                <Route path="/chats/:id" element={<ChatPage />} />
                <Route path="/room/:roomId" element={<RoomPage />} />
              </Route>

              {/* Fallback 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </GlobalProvider>
    </QueryClientProvider>
  );
};

export default App;
