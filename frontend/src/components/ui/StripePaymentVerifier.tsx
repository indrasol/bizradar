import { useEffect, useState, useContext } from "react";
import AuthContext from '@/components/Auth/AuthContext';
import { API_ENDPOINTS } from "@/config/apiEndpoints";

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

    if (payment === "success" && sessionId) {
      setPaymentStatus("pending");
      fetch(API_ENDPOINTS.STRIPE_VERIFY_SESSION + `?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPaymentStatus("success");
            setPaymentMessage("Your subscription has been updated successfully!");
            // Refresh trial/subscription status so blocker disappears immediately
            refreshTrialStatus?.();
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
    <div>
      {paymentStatus === "pending" && (
        <div className="p-4 bg-blue-50 text-blue-700 rounded">Verifying your payment...</div>
      )}
      {paymentStatus === "success" && (
        <div className="p-4 bg-green-50 text-green-700 rounded">{paymentMessage}</div>
      )}
      {paymentStatus === "error" && (
        <div className="p-4 bg-red-50 text-red-700 rounded">{paymentMessage}</div>
      )}
    </div>
  );
};

export default StripePaymentVerifier; 