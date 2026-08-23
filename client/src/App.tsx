import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GlobalProvider } from "./contexts/GlobalContext";
import { queryClient } from "./api/auth";
import LoadingIndicator from "./components/UI/LoadingIndicator/LoadingIndicator";

const HomePage = lazy(() => import("./pages/HomePage"));
const PeoplePage = lazy(() => import("./pages/PeoplePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RoomPage = lazy(() => import("./pages/RoomPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

import ProtectedRoute from "./components/Routes/ProtectedRoute";
import PublicOnlyRoute from "./components/Routes/PublicOnlyRoute";
import HomeOrLanding from "./components/Routes/HomeOrLanding";

const PageFallback = () => (
  <div className="flex justify-center items-center h-screen w-full bg-slate-950 text-white">
    <LoadingIndicator />
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
              {/* Dynamic entry point: Landing for guests, HomePage for authenticated users */}
              <Route path="/" element={<HomeOrLanding />} />
              <Route path="/landing" element={<LandingPage />} />

              {/* Public-only authentication route */}
              <Route element={<PublicOnlyRoute />}>
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
