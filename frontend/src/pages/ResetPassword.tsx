import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Radar, Lock, Eye, EyeOff, Check, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "../utils/supabase";

// Form schema for password reset
const resetPasswordSchema = z
  .object({
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
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const navigate = useNavigate();

  // Initialize form
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Validate on change for immediate feedback
  });

  // Get the current password for UI enhancements
  const password = form.watch("password") || "";

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

  // Check if we have a hash in the URL
  useEffect(() => {
    // The hash param comes from the URL when the user clicks the reset link in their email
    const hash = window.location.hash.substring(1);
    if (!hash) {
      toast.error("Invalid or expired password reset link");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Handle form submission
  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);

    try {
      // Update user's password
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) throw error;

      setResetComplete(true);
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-bl from-blue-100 to-transparent transform rotate-12 rounded-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-gradient-to-tr from-emerald-50 to-transparent transform -rotate-12 rounded-3xl"></div>
        <div className="absolute top-1/4 right-20 w-32 h-32 border border-blue-300 rounded-full opacity-40"></div>
        <div className="absolute bottom-1/4 left-10 w-48 h-48 border border-emerald-300 rounded-full opacity-30"></div>
      </div>

      {/* Content card */}
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
                {resetComplete ? "Password Reset Complete" : "Reset Your Password"}
              </h2>
            </div>

            {resetComplete ? (
              /* Success message */
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-700">
                    Your password has been successfully reset.
                  </p>
                  <p className="text-sm text-gray-500">
                    You can now log in with your new password.
                  </p>
                </div>
                
                <div className="pt-4">
                  <Link
                    to="/login"
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                  >
                    <span>Go to Login</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ) : (
              /* Reset password form */
              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                {/* New Password Field */}
                <div className="relative">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1 ml-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      {...form.register("password")}
                      className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                    {form.formState.errors.password && (
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {form.formState.errors.password.message}
                      </p>
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

                {/* Confirm Password Field */}
                <div className="relative">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1 ml-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      {...form.register("confirmPassword")}
                      className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                    {form.formState.errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? "Updating Password..." : "Reset Password"}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;