import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Mail, Clock } from 'lucide-react';

// Form schema validation
const subscribeFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type SubscribeFormValues = z.infer<typeof subscribeFormSchema>;

const ComingSoon: React.FC = () => {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form
  const { register, handleSubmit, formState: { errors }, reset } = useForm<SubscribeFormValues>({
    resolver: zodResolver(subscribeFormSchema),
    defaultValues: { email: '' },
  });

  // Countdown timer logic
  const launchDate = new Date();
  launchDate.setDate(launchDate.getDate() + 30);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });

      if (distance < 0) {
        clearInterval(timer);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle form submission
  const onSubscribeSubmit = async (values: SubscribeFormValues) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Subscribed successfully!');
      reset();
    } catch (err) {
      toast.error('Subscription failed. Please try again.');
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
        <div className="absolute top-1/5 left-1/3 w-64 h-64 rounded-full bg-blue-50 blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-emerald-50 blur-3xl opacity-60"></div>
        <div className="absolute top-0 bottom-0 left-1/3 w-1 bg-gradient-to-b from-blue-100 via-emerald-100 to-transparent transform rotate-12"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <div className="p-8">
            {/* Logo & Title */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <Clock className="w-8 h-8 text-blue-600" />
                  <div className="absolute inset-0 bg-blue-100 rounded-full -z-10"></div>
                </div>
                <span className="text-2xl font-semibold bg-blue-600 bg-clip-text text-transparent">Coming Soon</span>
              </div>
              <h2 className="text-2xl font-medium text-gray-800 ml-4 relative">
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-emerald-400 rounded-r-md"></div>
                We're Almost Here!
              </h2>
            </div>

            {/* Countdown Timer */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-100 rounded-lg p-4">
                <span className="text-3xl font-bold text-blue-600">{countdown.days}</span>
                <p className="text-sm text-gray-500">Days</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <span className="text-3xl font-bold text-blue-600">{countdown.hours}</span>
                <p className="text-sm text-gray-500">Hours</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <span className="text-3xl font-bold text-blue-600">{countdown.minutes}</span>
                <p className="text-sm text-gray-500">Minutes</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <span className="text-3xl font-bold text-blue-600">{countdown.seconds}</span>
                <p className="text-sm text-gray-500">Seconds</p>
              </div>
            </div>

            {/* Subscription Form */}
            <form className="space-y-5" onSubmit={handleSubmit(onSubscribeSubmit)}>
              <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                  Get Notified
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    {...register('email')}
                    className="w-full pl-10 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-gradient-to-r hover:from-blue-700 hover:to-emerald-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                <span>{isLoading ? 'Subscribing...' : 'Subscribe'}</span>
                <Clock size={18} />
              </button>
            </form>

            {/* Footer */}
            <div className="text-center mt-6 text-gray-700 text-sm">
              © {new Date().getFullYear()} Bizradar. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;