import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radar, Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { FaLinkedin, FaGoogle, FaFacebook } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import AuthContext from "../components/Auth/AuthContext";

// Login form schema validation
const loginFormSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

interface LoginProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSwitchToRegister?: () => void;
}

const Login = ({ isOpen = true, onOpenChange = () => {}, onSwitchToRegister = () => {} }: LoginProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Initialize login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    console.log("Login values:", values);
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Attempt login via AuthContext
       await login(values.identifier, values.password);
      
      // Success notification and UI update
      toast.success("Login successful!");
      onOpenChange(false);
      loginForm.reset();

      // Introduce a 1-second delay before navigating to "/dashboard"
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000); // 1000ms = 1 second delay
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
      toast.error(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decorative elements with asymmetrical design */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Diagonal decorative shapes */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-bl from-blue-100 to-transparent transform rotate-12 rounded-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-gradient-to-tr from-emerald-50 to-transparent transform -rotate-12 rounded-3xl"></div>
        
        {/* Scattered circles with different sizes and opacity */}
        <div className="absolute top-1/4 right-20 w-32 h-32 border border-blue-300 rounded-full opacity-40"></div>
        <div className="absolute bottom-1/4 left-10 w-48 h-48 border border-emerald-300 rounded-full opacity-30"></div>
        <div className="absolute top-1/5 left-1/3 w-64 h-64 rounded-full bg-blue-50 blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-emerald-50 blur-3xl opacity-60"></div>
        
        {/* Slanted accent line */}
        <div className="absolute top-0 bottom-0 left-1/3 w-1 bg-gradient-to-b from-blue-100 via-emerald-100 to-transparent transform rotate-12"></div>
      </div>

        {/* Left decorative element - offset from center */}
        <div className="hidden md:block md:w-2/5 relative -mr-20">
          <div className="absolute -top-10 -left-10 w-full h-full">
            <div className="w-64 h-64 bg-gradient-to-br from-blue-400/10 to-emerald-400/10 rounded-3xl transform rotate-12 ml-10"></div>
            <div className="w-80 h-80 border border-blue-200 rounded-full absolute top-20 left-16 opacity-50"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Radar className="w-32 h-32 text-blue-600/20" />
            </div>
          </div>
        </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <div className="p-8">
            {/* Logo & Title */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <Radar className="w-8 h-8 text-blue-600" />
                  <div className="absolute inset-0 bg-blue-100 rounded-full -z-10"></div>
                </div>
                <span className="text-2xl font-semibold bg-blue-600 bg-clip-text text-transparent">Bizradar</span>
              </div>
              
              <h2 className="text-2xl font-medium text-gray-800 ml-4 relative">
                  <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-emerald-400 rounded-r-md"></div>
                  Welcome back!
                </h2>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-4 mb-6">
              <button className="w-full py-3 px-4 bg-white rounded-lg flex items-center justify-center gap-2 text-gray-700 font-medium border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <FaLinkedin className="text-blue-600 text-lg" />
                <span>Continue with LinkedIn</span>
              </button>
              
              <button className="w-full py-3 px-4 bg-white rounded-lg flex items-center justify-center gap-2 text-gray-700 font-medium border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <FaGoogle className="text-red-500 text-lg" />
                <span>Continue with Google</span>
              </button>
              
              <button className="w-full py-3 px-4 bg-white rounded-lg flex items-center justify-center gap-2 text-gray-700 font-medium border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <FaFacebook className="text-blue-600 text-lg" />
                <span>Continue with Facebook</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="px-4 text-sm text-gray-500">
                OR 
              </span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Login Form */}
            <form className="space-y-5" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
              {/* Email/Username Field */}
              <div className="relative">
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="identifier"
                    {...loginForm.register("identifier")}
                    className="w-full pl-10 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="your@email.com or username"
                    autoComplete="username"
                  />
                  {loginForm.formState.errors.identifier && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {loginForm.formState.errors.identifier.message}
                    </p>
                  )}
                  {!loginForm.formState.errors.identifier && loginForm.watch("identifier") && (
                    <div className="absolute bottom-0 left-0 h-0.5 bg-blue-600 w-full" />
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    {...loginForm.register("password")}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                  {!loginForm.formState.errors.password && loginForm.watch("password") && (
                    <div className="absolute bottom-0 left-0 h-0.5 bg-blue-600 w-full" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:from-blue-700 hover:to-emerald-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                  disabled={isLoading}
                >
                  <span>{isLoading ? "Signing in..." : "Log in"}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>

            {/* Signup Redirect */}
            <div className="text-center mt-6 text-gray-700">
              Don't have an account?{" "}
              {/* <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 font-medium hover:underline"
              >
                Sign up
              </button> */}
              <Link to="/signup" className="text-blue-600 font-medium hover:underline">
                  Sign up
                 </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


