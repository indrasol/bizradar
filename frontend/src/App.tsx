import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Homepage from "./pages/Homepage";
import Contracts from "./pages/Contracts";
import Admin from "./pages/Admin";
import RfpWriter from "./pages/RfpWriter";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Opportunities from "./pages/Opportunities";
import { AuthProvider } from "./components/Auth/AuthContext"; // Fixed path


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
        {/* <AuthProvider> */}
          <Route path="/" element={<Homepage children={null} />} />
          <Route path="/Contracts" element={<Contracts />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/opportunites" element={<Opportunities />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/contracts/rfp/:contractId" element={<RfpWriter />} />
          <Route path="*" element={<NotFound />} />
          {/* </AuthProvider> */}
        </Routes>
      
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;


// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import HomePage from "./pages/HomePage";
// import Index from "./pages/Index";
// import CreateProject from "./pages/CreateProject";
// import ModelWithAI from "./pages/ModelWithAI";
// import NotFound from "./pages/NotFound";
// import ProjectList from "./pages/ProjectList";
// import ExistingProject from "./pages/ExistingProject";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import { AuthProvider, useAuth } from "./components/Auth/AuthContext"; // Fixed path
// import ProtectedRoute from "./components/Auth/ProtectedRoute";
// import GenerateReport from "./pages/GenerateReport";
// import ProjectCard from "./components/dashboard/ProjectCard";
// import Dashboard from "./pages/Dashboard";
// import Documents from "./pages/Documents";
// import SOC2 from "./pages/SOC2";
// import Projects from "./pages/Projects";


// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Router>
//         <div className="relative">
//           <Toaster />
//           <Sonner />
//           <AuthProvider>
//             <Routes>
//               <Route path="/" element={<HomePage />} />
//               <Route path="/index" element={<Index />} />
//               <Route
//                 path="/login"
//                 element={
//                   <Login
//                     isOpen={true}
//                     onOpenChange={() => {}}
//                     onSwitchToRegister={() => {}}
//                   />
//                 }
//               />
//               <Route
//                 path="/register"
//                 element={
//                   <Register
//                     isOpen={true}
//                     onOpenChange={() => {}}
//                     onSwitchToLogin={() => {}}
//                   />
//                 }
//               />

//               {/* Protected Routes */}
//               <Route element={<ProtectedRoute />}>
//                 <Route path="/dashboard" element={<Dashboard />} />   
//                 <Route path="/documents" element={<Documents />} />
//                 <Route path="/soc2" element={<SOC2 />} />
//                 <Route path="/create-project" element={<CreateProject />} />
//                 <Route path="/existing-project" element={<ExistingProject />} />
//                 <Route path="/model-with-ai" element={<ModelWithAI />} />
//                 <Route path="/project-list" element={<ProjectList />} />
//                 <Route path="/projects" element={<Projects />} />
//                 <Route path="/generate-report" element={<GenerateReport />} />
//                 <Route path="*" element={<NotFound />} />
//               </Route>

//               <Route path="*" element={<NotFound />} />
              
//             </Routes>
//           </AuthProvider>
//         </div>
//       </Router>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;
