
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthContext";
import ConditionalThemeProvider from "./components/ConditionalThemeProvider";
import ProtectedRoute from "./components/Auth/ProtectedRoute";

// Eagerly loaded (lightweight)
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Logout from "./pages/Logout";
import CompanySetup from "./pages/CompanySetup";
import Contracts from "./pages/Contracts";
import ComingSoon from "./pages/ComingSoon";
import Analytics from "./pages/Analytics";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// Lazily loaded (heavier)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Opportunities = lazy(() => import("./pages/Opportunities"));
const OpportunityDetails = lazy(() => import("./pages/OpportunityDetails"));
const Trackers = lazy(() => import("./pages/Pursuits"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const RfpWriter = lazy(() => import("./pages/RfpWriter"));
const BizradarAI = lazy(() => import('./components/Sidebar/BizradarAI'));

import NotFound from "./pages/NotFound";

// Create a query client for React Query
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ConditionalThemeProvider>
          <AuthProvider>
            <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Homepage children={null} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/register" element={<Register />} />
              <Route path="/company-setup" element={<CompanySetup />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/opportunities" element={
                <ProtectedRoute>
                  <Opportunities />
                </ProtectedRoute>
              } />
              <Route path="/opportunities/:id/details" element={
                <ProtectedRoute>
                  <OpportunityDetails />
                </ProtectedRoute>
              } />
              <Route path="/trackers" element={
                <ProtectedRoute>
                  <Trackers />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/contracts/rfp/:contractId" element={
                <ProtectedRoute>
                  <RfpWriter />
                </ProtectedRoute>
              } />
              {/* Added both routes for BizradarAI for compatibility */}
              <Route path="/ask-ai" element={
                <ProtectedRoute>
                  <BizradarAI />
                </ProtectedRoute>
              } />
              <Route path="/bizradar-ai" element={
                <ProtectedRoute>
                  <BizradarAI />
                </ProtectedRoute>
              } />

              {/* 404 route */}
              <Route path="*" element={<ComingSoon />} />
            </Routes>
            </Suspense>
          </AuthProvider>
        </ConditionalThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;