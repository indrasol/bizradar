import { useEffect, useState, useContext } from "react";
import AuthContext from '@/components/Auth/AuthContext';

const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = isDevelopment
  ? "http://localhost:8000"
  : import.meta.env.VITE_API_BASE_URL;

interface StripePaymentVerifierProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

const StripePaymentVerifier: React.FC<StripePaymentVerifierProps> = ({ onSuccess, onError }) => {
  const [paymentStatus, setPaymentStatus] = useState<null | "success" | "error" | "pending">(null);
  const [paymentMessage, setPaymentMessage] = useState<string>("");
  const { refreshTrialStatus } = useContext(AuthContext);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");

    // Trigger verification if session_id is present (new flow) or payment=success (legacy)
    if (sessionId || payment === "success") {
      setPaymentStatus("pending");
      const verifyUrl = sessionId
        ? `${API_BASE_URL}/api/stripe/verify-session?session_id=${sessionId}`
        : `${API_BASE_URL}/api/stripe/verify-session`;
      fetch(verifyUrl)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPaymentStatus("success");
            setPaymentMessage("Your subscription has been updated successfully!");
            // Refresh trial/subscription status so blocker disappears immediately
            refreshTrialStatus?.();
            try {
              // Notify app to refresh any subscription-dependent UI
              window.dispatchEvent(new Event('subscription-updated'));
            } catch {}
            if (onSuccess) onSuccess();
          } else {
            setPaymentStatus("error");
            setPaymentMessage(data.message || "Payment verification failed.");
            if (onError) onError(data.message || "Payment verification failed.");
          }
        })
        .catch(err => {
          setPaymentStatus("error");
          setPaymentMessage("An error occurred while verifying payment.");
          if (onError) onError("An error occurred while verifying payment.");
        });
    }
  }, [onSuccess, onError]);

  if (paymentStatus === null) return null;

  return (
    null
  );
};

export default StripePaymentVerifier; 