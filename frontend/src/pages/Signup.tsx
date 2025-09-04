import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaLinkedin, FaGoogle, FaFacebook } from "react-icons/fa";
import {
  Radar,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  User,
  Mail,
  Lock,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import AuthContext from "../components/Auth/AuthContext";

// Signup form schema validation
const signupFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character"
    ),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

interface SignupProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

const Signup = ({
  isOpen = true,
  onOpenChange = () => {},
  onSwitchToLogin = () => {},
}: SignupProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register: authRegister } = useContext(AuthContext);
  const navigate = useNavigate();

  // Initialize signup form
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
    mode: "onChange", // Validate on change for immediate feedback
  });

  // Get values for UI enhancements like the password strength indicator
  const password = signupForm.watch("password") || "";

  // Password strength indicator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;

    // Length check
    if (pass.length >= 8) strength += 1;

    // Contains number
    if (/\d/.test(pass)) strength += 1;

    // Contains special char
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) strength += 1;

    // Contains uppercase & lowercase
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength += 1;

    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
        return "bg-gray-300";
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-orange-500";
      case 3:
        return "bg-yellow-500";
      case 4:
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  // Handle signup form submission
  const onSignupSubmit = async (values: SignupFormValues) => {
    console.log("Signup values:", values);

    setIsLoading(true);
    setError(null);

    try {
      // Attempt registration via AuthContext
      await authRegister(values.firstName, values.lastName, values.email, values.password);

      // Success notification
      toast.success("Account created successfully!");
      onOpenChange(false);
      signupForm.reset();

      // Email confirmation is always required - no immediate login
      toast.success("Account created! Please check your email and confirm your account to continue.");
      toast.info("You will be redirected to login after email confirmation.");
      
      // Always redirect to login since email confirmation is required
      navigate("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      // Check for specific error messages from Supabase
      const errorMessage = err.message?.toLowerCase() || '';
      if (errorMessage.includes('email already registered') || 
          errorMessage.includes('user already registered') ||
          errorMessage.includes('already exists')) {
        setError("An account with this email already exists. Please try logging in instead.");
        toast.error("An account with this email already exists. Please try logging in instead.");
      } else {
        setError(err.message || "Signup failed. Please try again.");
        toast.error(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white to-gray-50 relative overflow-hidden py-12">
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
      
      {/* Signup card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <div className="p-8">
            {/* Logo & Title */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <Radar className="w-8 h-8 text-blue-600" />
                  <div className="absolute inset-0 bg-blue-100 rounded-full -z-10"></div>
                </div>
                <span className="text-2xl font-semibold bg-blue-600 bg-clip-text text-transparent">
                  Bizradar
                </span>
              </div>

              <h2 className="text-2xl font-medium text-gray-800 ml-4 relative">
                  <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-emerald-400 rounded-r-md"></div>
                  Create an account
                </h2>
            </div>

            {/* Social Signup Buttons */}
            <div className="space-y-4 mb-6">
              <button className="w-full py-3 px-4 bg-white rounded-lg flex items-center justify-center gap-2 text-gray-700 font-medium border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <FaLinkedin className="text-blue-600 text-lg" />
                <span>Sign up with LinkedIn</span>
              </button>

              <button className="w-full py-3 px-4 bg-white rounded-lg flex items-center justify-center gap-2 text-gray-700 font-medium border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <FaGoogle className="text-red-500 text-lg" />
                <span>Sign up with Google</span>
              </button>

              <button className="w-full py-3 px-4 bg-white rounded-lg flex items-center justify-center gap-2 text-gray-700 font-medium border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <FaFacebook className="text-blue-600 text-lg" />
                <span>Sign up with Facebook</span>
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

            {/* Signup Form */}
            <form
              className="space-y-5"
              onSubmit={signupForm.handleSubmit(onSignupSubmit)}
            >
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div className="relative">
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1 ml-1"
                  >
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="firstName"
                      {...signupForm.register("firstName")}
                      className="w-full pl-10 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="John"
                    />
                    {signupForm.formState.errors.firstName && (
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {signupForm.formState.errors.firstName.message}
                      </p>
                    )}
                    {!signupForm.formState.errors.firstName &&
                      signupForm.watch("firstName") && (
                        <div className="absolute bottom-0 left-0 h-0.5 bg-blue-600 w-full" />
                      )}
                  </div>
                </div>

                {/* Last Name */}
                <div className="relative">
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1 ml-1"
                  >
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
                    {!signupForm.formState.errors.lastName &&
                      signupForm.watch("lastName") && (
                        <div className="absolute bottom-0 left-0 h-0.5 bg-blue-600 w-full" />
                      )}
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="relative">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1 ml-1"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    {...signupForm.register("email")}
                    className="w-full pl-10 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="your@email.com"
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                  {!signupForm.formState.errors.email &&
                    signupForm.watch("email") && (
                      <div className="absolute bottom-0 left-0 h-0.5 bg-blue-600 w-full" />
                    )}
                </div>
              </div>

              {/* Password Field */}
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1 ml-1"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    {...signupForm.register("password")}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                  {!signupForm.formState.errors.password && password && (
                    <div className="absolute bottom-0 left-0 h-0.5 bg-blue-600 w-full" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(4)].map((_, index) => (
                        <div
                          key={index}
                          className={`h-1 rounded-full flex-1 ${
                            index < passwordStrength
                              ? getStrengthColor()
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Weak</span>
                      <span className="text-gray-500">Strong</span>
                    </div>
                  </div>
                )}

                {/* Password requirements */}
                {password && (
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          password.length >= 8 ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        {password.length >= 8 && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span
                        className={`${
                          password.length >= 8
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        At least 8 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          /[A-Z]/.test(password) && /[a-z]/.test(password)
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      >
                        {/[A-Z]/.test(password) && /[a-z]/.test(password) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span
                        className={`${
                          /[A-Z]/.test(password) && /[a-z]/.test(password)
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        Uppercase & lowercase letters
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          /\d/.test(password) ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        {/\d/.test(password) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span
                        className={`${
                          /\d/.test(password)
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        At least one number
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          /[!@#$%^&*(),.?":{}|<>]/.test(password)
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      >
                        {/[!@#$%^&*(),.?":{}|<>]/.test(password) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span
                        className={`${
                          /[!@#$%^&*(),.?":{}|<>]/.test(password)
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        At least one special character
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {/* Signup Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                  disabled={isLoading}
                >
                  <span>{isLoading ? "Creating account..." : "Sign Up"}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>

            {/* Login Redirect */}
            <div className="text-center mt-6 text-gray-700">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-medium hover:underline"
              >
                Log In
              </Link>
            </div>

            {/* Terms and Privacy */}
            <div className="text-center mt-6 text-gray-500 text-xs">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;