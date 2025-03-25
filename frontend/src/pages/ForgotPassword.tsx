import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Radar, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "../components/Auth/useAuth";

// Form schema for password reset
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  // Initialize form
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);

    try {
      await resetPassword(values.email);
      setEmailSent(true);
      toast.success("Reset instructions sent to your email");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
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
                {emailSent ? "Check your email" : "Reset your password"}
              </h2>
            </div>

            {emailSent ? (
              /* Success message */
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-700">
                    We've sent you an email with instructions to reset your password.
                  </p>
                  <p className="text-sm text-gray-500">
                    If you don't see it in your inbox, please check your spam folder.
                  </p>
                </div>
                
                <div className="pt-4">
                  <Link
                    to="/login"
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                  >
                    <ArrowLeft size={18} />
                    <span>Back to Login</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Password reset form */
              <div className="space-y-6">
                <p className="text-gray-700">
                  Enter your email address below and we'll send you instructions to reset your password.
                </p>
                
                <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                  {/* Email Field */}
                  <div className="relative">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1 ml-1"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        {...form.register("email")}
                        className="w-full pl-10 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        placeholder="your@email.com"
                      />
                      {form.formState.errors.email && (
                        <p className="text-red-500 text-xs mt-1 ml-1">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                      disabled={isLoading}
                    >
                      <span>
                        {isLoading ? "Sending..." : "Send Reset Instructions"}
                      </span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </form>

                {/* Back to login */}
                <div className="text-center mt-6">
                  <Link
                    to="/login"
                    className="text-blue-600 font-medium hover:underline flex items-center justify-center gap-1"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Login</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;