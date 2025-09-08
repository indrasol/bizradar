import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowLeft, RotateCcw, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface OtpVerificationProps {
  email: string;
  isSignup: boolean;
  firstName?: string;
  lastName?: string;
  onBack: () => void;
  onSuccess: () => void;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({
  email,
  isSignup,
  firstName = "",
  lastName = "",
  onBack,
  onSuccess,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyEmailOtp, sendEmailOtp, signupWithOtp } = useAuth();

  // Timer countdown for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((digit, idx) => idx >= pastedData.length && !digit);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit code", {
        closeButton: true,
        duration: 5000
      });
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (isSignup) {
        result = await verifyEmailOtp(email, otpString, firstName, lastName);
      } else {
        result = await verifyEmailOtp(email, otpString);
      }
      
      console.log("OTP verification result:", result);
      
      toast.success("Successfully verified!", {
        description: isSignup ? "Welcome to Bizradar!" : "You're now logged in!",
        closeButton: true,
        duration: 5000
      });
      
      // Add a small delay to ensure session is fully set before navigation
      setTimeout(() => {
        onSuccess();
      }, 100);
      
    } catch (err: any) {
      console.error("OTP verification error:", err);
      toast.error(err.message || "Invalid verification code", {
        closeButton: true,
        duration: 5000
      });
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setIsResending(true);

    try {
      if (isSignup) {
        await signupWithOtp(firstName, lastName, email);
      } else {
        await sendEmailOtp(email);
      }
      
      toast.success("New verification code sent!", {
        description: "Please check your email",
        closeButton: true,
        duration: 5000
      });
      
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error("Resend OTP error:", err);
      toast.error(err.message || "Failed to resend verification code", {
        closeButton: true,
        duration: 5000
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Check your email
        </h2>
        <p className="text-gray-600 text-sm">
          We've sent a 6-digit verification code to{" "}
          <span className="font-medium text-gray-800">{email}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              disabled={isLoading}
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerifyOtp}
          disabled={isLoading || otp.join("").length !== 6}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
        >
          <span>{isLoading ? "Verifying..." : "Verify Code"}</span>
          {!isLoading && <ArrowRight size={18} />}
        </button>
      </div>

      {/* Resend Section */}
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-600">
          Didn't receive the code?
        </p>
        
        <button
          onClick={handleResendOtp}
          disabled={resendTimer > 0 || isResending}
          className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-1 mx-auto transition-colors"
        >
          <RotateCcw size={16} className={isResending ? "animate-spin" : ""} />
          {resendTimer > 0 
            ? `Resend in ${resendTimer}s` 
            : isResending 
              ? "Sending..." 
              : "Resend code"
          }
        </button>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        disabled={isLoading}
        className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <ArrowLeft size={18} />
        Back to {isSignup ? "sign up" : "login"}
      </button>
    </div>
  );
};

export default OtpVerification;
