import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GlobalProvider } from "./contexts/GlobalContext";
import { queryClient } from "./api/auth";
import HomePage from "./pages/HomePage";
import PeoplePage from "./pages/PeoplePage";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import RoomPage from "./pages/RoomPage";
import NotFoundPage from "./pages/NotFoundPage";

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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/chats/:id" element={<ChatPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </GlobalProvider>
    </QueryClientProvider>
  );

}

export default App