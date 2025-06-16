import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../Auth/useAuth';

interface UpdatePhoneNumberProps {
    onSuccess?: (phone: string) => void;
}

const UpdatePhoneNumber: React.FC<UpdatePhoneNumberProps> = ({ onSuccess }) => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'enter-phone' | 'enter-otp'>('enter-phone');
    const [loading, setLoading] = useState(false);
    const { updatePhoneNumber, verifyPhoneOtp } = useAuth();

    const isValidPhone = (num: string) => /^\+\d{10,15}$/.test(num);

    const handleSendOtp = async () => {
        if (!isValidPhone(phone)) {
            toast.error('Enter a valid phone number in E.164 format (e.g., +919876543210)');
            return;
        }

        setLoading(true);
        try {
            await updatePhoneNumber(phone);
            toast.success('OTP sent successfully to your phone');
            setStep('enter-otp');
        } catch (error: any) {
            toast.error(`Error sending OTP: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.trim().length === 0) {
            toast.error('Please enter the OTP');
            return;
        }

        setLoading(true);
        try {
            await verifyPhoneOtp(phone, otp);
            toast.success('Phone number updated successfully!');
            onSuccess?.(phone);
            setStep('enter-phone');
            setPhone('');
            setOtp('');
        } catch (error: any) {
            toast.error(`OTP verification failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white shadow rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Update Phone Number</h2>

            {step === 'enter-phone' && (
                <>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                        New Phone Number
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91XXXXXXXXXX"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
                    />
                    <button
                        onClick={handleSendOtp}
                        className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        disabled={loading}
                    >
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </>
            )}

            {step === 'enter-otp' && (
                <>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                        Enter OTP
                    </label>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter the OTP received"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
                    />
                    <button
                        onClick={handleVerifyOtp}
                        className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        disabled={loading}
                    >
                        {loading ? 'Verifying...' : 'Verify & Update'}
                    </button>
                    <button
                        onClick={() => setStep('enter-phone')}
                        className="mt-2 w-full text-sm text-blue-500 underline"
                    >
                        Change Phone Number
                    </button>
                </>
            )}
        </div>
    );
};

export default UpdatePhoneNumber;