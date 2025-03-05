import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaLinkedin, FaGoogle } from "react-icons/fa";
import { Radar, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // For floating elements effect
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-950 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute w-96 h-96 rounded-full bg-blue-700/10 blur-3xl"
          animate={{
            x: mousePosition.x * 0.03,
            y: mousePosition.y * 0.03,
          }}
          transition={{ type: "spring", damping: 50 }}
        />
        <motion.div 
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl"
          animate={{
            x: mousePosition.x * -0.02,
            y: mousePosition.y * -0.02,
          }}
          transition={{ type: "spring", damping: 80 }}
        />
        
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 border border-blue-500/10 rounded-full" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 border border-blue-400/10 rounded-full" />
        
        {/* Diagonal accent */}
        <svg className="absolute top-0 right-0 h-full w-1/3 text-blue-800 opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.polygon 
            points="100,0 100,100 0,100" 
            animate={{ points: ["100,0 100,100 0,100", "100,0 100,100 10,90"] }}
            transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
          />
        </svg>
      </div>

      {/* Login card */}
      <motion.div 
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border border-white/10"
          whileHover={{ boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-8">
            {/* Logo & Title */}
            <div className="flex flex-col items-center mb-8">
              <motion.div 
                className="flex items-center gap-3 mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.div
                  className="relative"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 1 }}
                >
                  <Radar className="w-8 h-8 text-primary-500" />
                  <motion.div 
                    className="absolute inset-0 bg-primary-500/20 rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.6, 0.2, 0.6]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
                <span className="text-2xl font-semibold text-white">Bizradar</span>
              </motion.div>
              
              <motion.h2 
                className="text-xl font-medium text-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Log in to your account
              </motion.h2>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-4 mb-6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <motion.button
                  className="w-full py-3 px-4 bg-white rounded-lg flex items-center justify-center gap-2 text-gray-700 font-medium relative overflow-hidden group"
                  whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-blue-50"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <FaLinkedin className="text-blue-600 text-xl relative z-10" />
                  <span className="relative z-10">Sign in with LinkedIn</span>
                </motion.button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <motion.button
                  className="w-full py-3 px-4 bg-white rounded-lg flex items-center justify-center gap-2 text-gray-700 font-medium relative overflow-hidden group"
                  whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-red-50"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <FaGoogle className="text-red-500 text-xl relative z-10" />
                  <span className="relative z-10">Sign in with Google</span>
                </motion.button>
              </motion.div>
            </div>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-blue-200/20"></div>
              <motion.span 
                className="px-4 text-sm text-blue-200/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                OR CONTINUE WITH EMAIL
              </motion.span>
              <div className="flex-1 h-px bg-blue-200/20"></div>
            </div>

            {/* Login Form */}
            <form className="space-y-5">
              {/* Email Field */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <label htmlFor="email" className="block text-sm font-medium text-blue-100 mb-1 ml-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-blue-900/30 border border-blue-300/20 rounded-lg text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    placeholder="your@email.com"
                    required
                  />
                  <motion.div 
                    className="absolute bottom-0 left-0 h-0.5 bg-primary-500"
                    initial={{ width: 0 }}
                    animate={email ? { width: "100%" } : { width: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label htmlFor="password" className="block text-sm font-medium text-blue-100">
                    Password
                  </label>
                  <motion.a 
                    href="#" 
                    className="text-xs text-primary-400 hover:text-primary-300"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    Forgot password?
                  </motion.a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-blue-900/30 border border-blue-300/20 rounded-lg text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <motion.div 
                    className="absolute bottom-0 left-0 h-0.5 bg-primary-500"
                    initial={{ width: 0 }}
                    animate={password ? { width: "100%" } : { width: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300/60 hover:text-primary-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.div>

              {/* Login Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="pt-2"
              >
                <motion.button
                  type="submit"
                  className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 relative overflow-hidden"
                  whileHover={{ 
                    scale: 1.02, 
                    boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.5)" 
                  }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-blue-600"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                  <span className="relative z-10">Log in</span>
                  <motion.div
                    className="relative z-10"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
                  >
                    <ArrowRight size={18} />
                  </motion.div>
                </motion.button>
              </motion.div>
            </form>

            {/* Signup Redirect */}
            <motion.div 
              className="text-center mt-6 text-blue-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              Don't have an account?{" "}
              <motion.span 
                className="inline-block"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Link to="/signup" className="text-primary-400 font-medium relative group">
                  Sign up
                  <motion.span 
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500"
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
