import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radar,
  ArrowRight,
  User,
  Mail,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import OtpVerification from "@/components/Auth/OtpVerification";
import { supabase } from "../utils/supabase";

// Registration modal form schema validation
const registrationFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

// Login form schema validation
const loginFormSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;
type LoginFormValues = z.infer<typeof loginFormSchema>;

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'otp'>('login');
  const [otpData, setOtpData] = useState<{
    email: string;
    isSignup: boolean;
    firstName?: string;
    lastName?: string;
  } | null>(null);
  const navigate = useNavigate();
  const { sendEmailOtp, signupWithOtp } = useAuth();


  // Initialize forms
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: "",
    },
  });

  const signupForm = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  // Handle login form submission (Send OTP)
  const onLoginSubmit = async (values: LoginFormValues) => {
    console.log("Login values:", values);

    setIsLoading(true);
    setError(null);

    try {
      // Send OTP to the email/username
      await sendEmailOtp(values.identifier);
      
      toast.success("OTP sent to your email!", {
        description: "Please check your email for the verification code."
      });

      // Set OTP data and switch to OTP view
      setOtpData({
        email: values.identifier,
        isSignup: false
      });
      setCurrentView('otp');

      // Reset form
      loginForm.reset();
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to send OTP");
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signup form submission (Send OTP)
  const onSignupSubmit = async (values: RegistrationFormValues) => {
    console.log("Signup values:", values);
    
    setIsLoading(true);
    setError(null);

    try {
      // Send OTP for signup with user metadata
      await signupWithOtp(values.firstName, values.lastName, values.email);
      
      toast.success("OTP sent to your email!", {
        description: "Please check your email for the verification code."
      });
      
      // Set OTP data and switch to OTP view
      setOtpData({
        email: values.email,
        isSignup: true,
        firstName: values.firstName,
        lastName: values.lastName
      });
      setCurrentView('otp');
      
      // Reset form
      signupForm.reset();
      
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to send OTP");
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle going back from OTP view
  const handleBackFromOtp = () => {
    setCurrentView(otpData?.isSignup ? 'signup' : 'login');
    setOtpData(null);
    setError(null);
  };

  // Handle successful OTP verification
  const handleOtpSuccess = async () => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }
      
      // Check if user already has a company setup
      const { data: userCompanies } = await supabase
        .from('user_companies')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_primary', true);
        
      if (userCompanies && userCompanies.length > 0) {
        // User has company setup, redirect to dashboard/opportunities
        navigate('/dashboard');
      } else {
        // User does not have company setup, redirect to company setup
        navigate('/company-setup');
      }
    } catch (error) {
      console.error("Error checking user company:", error);
      // Fallback to original logic in case of error
      if (otpData?.isSignup) {
        navigate('/company-setup');
      } else {
        navigate('/dashboard');
      }
    }
  };

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

      {/* Main card */}
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

              {/* Toggle buttons - only show when not in OTP view */}
              {currentView !== 'otp' && (
                <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => setCurrentView('login')}
                    className={`px-6 py-2 rounded-md font-medium transition-all ${
                      currentView === 'login'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setCurrentView('signup')}
                    className={`px-6 py-2 rounded-md font-medium transition-all ${
                      currentView === 'signup'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {currentView !== 'otp' && (
                <h2 className="text-2xl font-medium text-gray-800 ml-4 relative">
                  <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-emerald-400 rounded-r-md"></div>
                  {currentView === 'login' ? 'Welcome back!' : 'Create account'}
                </h2>
              )}
            </div>


            {/* Conditional Content */}
            {currentView === 'otp' ? (
              /* OTP Verification */
              otpData && (
                <OtpVerification
                  email={otpData.email}
                  isSignup={otpData.isSignup}
                  firstName={otpData.firstName}
                  lastName={otpData.lastName}
                  onBack={handleBackFromOtp}
                  onSuccess={handleOtpSuccess}
                />
              )
            ) : currentView === 'login' ? (
              /* Login Form */
              <form className="space-y-5" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                {/* Email/Username Field */}
                <div className="relative">
                  <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="identifier"
                      {...loginForm.register("identifier")}
                      className="w-full pl-10 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="your@email.com"
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

                {/* Error Message */}
                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                {/* Send OTP Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? "Sending OTP..." : "Send OTP"}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            ) : (
              /* Sign Up Form */
              <form className="space-y-5" onSubmit={signupForm.handleSubmit(onSignupSubmit)}>
                {/* First Name */}
                <div className="relative">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="firstName"
                      {...signupForm.register("firstName")}
                      className="w-full pl-10 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="John"
                    />
                    {signupForm.formState.errors.firstName && (
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {signupForm.formState.errors.firstName.message}
                      </p>
                    )}
                    {!signupForm.formState.errors.firstName && signupForm.watch("firstName") && (
                      <div className="absolute bottom-0 left-0 h-0.5 bg-blue-600 w-full" />
                    )}
                  </div>
                </div>

                {/* Last Name */}
                <div className="relative">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="lastName"
                      {...signupForm.register("lastName")}
                      className="w-full pl-10 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="Doe"
                    />
                    {signupForm.formState.errors.lastName && (
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {signupForm.formState.errors.lastName.message}
                      </p>
                    )}
                    {!signupForm.formState.errors.lastName && signupForm.watch("lastName") && (
                      <div className="absolute bottom-0 left-0 h-0.5 bg-blue-600 w-full" />
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="relative">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      {...signupForm.register("email")}
                      className="w-full pl-10 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="john@example.com"
                    />
                    {signupForm.formState.errors.email && (
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {signupForm.formState.errors.email.message}
                      </p>
                    )}
                    {!signupForm.formState.errors.email && signupForm.watch("email") && (
                      <div className="absolute bottom-0 left-0 h-0.5 bg-blue-600 w-full" />
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                {/* Send OTP Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? "Sending OTP..." : "Send OTP"}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            )}

            {/* Terms and Privacy - only show when not in OTP view */}
            {currentView !== 'otp' && (
              <div className="text-center mt-6 text-gray-500 text-xs">
                By continuing, you agree to our{" "}
                <Link to="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Register;
