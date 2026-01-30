import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { SOSProvider } from "@/contexts/SOSContext";
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import RoleSelection from "./pages/RoleSelection";
import Dashboard from "./pages/Dashboard";
import FindRide from "./pages/FindRide";
import RideDetails from "./pages/RideDetails";
import Profile from "./pages/Profile";
import OfferRide from "./pages/OfferRide";
import MyRides from "./pages/MyRides";
import Leaderboard from "./pages/Leaderboard";
import Wallet from "./pages/Wallet";
import Admin from "./pages/Admin";
import RideTracking from "./pages/RideTracking";
import Chat from "./pages/Chat";
import SmartMatch from "./pages/SmartMatch";
import SafetyCenter from "./pages/SafetyCenter";
import EcoImpact from "./pages/EcoImpact";
import CarbonDashboard from "./pages/CarbonDashboard";
import TreePlanting from "./pages/TreePlanting";
import ChatPage from "./pages/ChatPage";
import FavoriteRoutes from "./pages/FavoriteRoutes";
import RecurringRides from "./pages/RecurringRides";
import DevTools from "./pages/DevTools";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SOSProvider>
          <SocketProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/role-selection" element={<RoleSelection />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/find-ride" element={<FindRide />} />
                <Route path="/smart-match" element={<SmartMatch />} />
                <Route path="/offer-ride" element={<OfferRide />} />
                <Route path="/my-rides" element={<MyRides />} />
                <Route path="/safety" element={<SafetyCenter />} />
                <Route path="/eco-impact" element={<EcoImpact />} />
                <Route path="/carbon" element={<CarbonDashboard />} />
                <Route path="/plant-trees" element={<TreePlanting />} />
                <Route path="/chat/:rideId" element={<ChatPage />} />
                <Route path="/favorite-routes" element={<FavoriteRoutes />} />
                <Route path="/recurring-rides" element={<RecurringRides />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/ride/:id" element={<RideDetails />} />
                <Route path="/track/:id" element={<RideTracking />} />
                <Route path="/chat/:userId" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dev-tools" element={<DevTools />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </SOSProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
