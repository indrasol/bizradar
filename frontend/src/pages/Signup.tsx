import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaLinkedin, FaGoogle } from "react-icons/fa";
import { Radar, Eye, EyeOff, ArrowRight, Check } from "lucide-react";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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

  // Password strength indicator
  const getPasswordStrength = (pass) => {
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
    switch(passwordStrength) {
      case 0: return "bg-gray-300";
      case 1: return "bg-red-500";
      case 2: return "bg-orange-500";
      case 3: return "bg-yellow-500";
      case 4: return "bg-green-500";
      default: return "bg-gray-300";
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-950 relative overflow-hidden py-12">
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

      {/* Signup card */}
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
                Create your account
              </motion.h2>
            </div>

            {/* Social Signup Buttons */}
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
                  <span className="relative z-10">Sign up with LinkedIn</span>
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
                  <span className="relative z-10">Sign up with Google</span>
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

            {/* Signup Form */}
            <form className="space-y-5">
              {/* Name Fields */}
              <motion.div
                className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                {/* First Name */}
                <div className="relative">
                  <label htmlFor="firstName" className="block text-sm font-medium text-blue-100 mb-1 ml-1">
                    First Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-blue-900/30 border border-blue-300/20 rounded-lg text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                      placeholder="John"
                      required
                    />
                    <motion.div 
                      className="absolute bottom-0 left-0 h-0.5 bg-primary-500"
                      initial={{ width: 0 }}
                      animate={firstName ? { width: "100%" } : { width: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
                
                {/* Last Name */}
                <div className="relative">
                  <label htmlFor="lastName" className="block text-sm font-medium text-blue-100 mb-1 ml-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-blue-900/30 border border-blue-300/20 rounded-lg text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                      placeholder="Doe"
                      required
                    />
                    <motion.div 
                      className="absolute bottom-0 left-0 h-0.5 bg-primary-500"
                      initial={{ width: 0 }}
                      animate={lastName ? { width: "100%" } : { width: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Email Field */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
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
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-1 ml-1">
                  Password
                </label>
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
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(4)].map((_, index) => (
                        <motion.div 
                          key={index}
                          className={`h-1 rounded-full flex-1 ${index < passwordStrength ? getStrengthColor() : "bg-blue-900/30"}`}
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-200/60">Weak</span>
                      <span className="text-blue-200/60">Strong</span>
                    </div>
                  </div>
                )}
                
                {/* Password requirements */}
                {password && (
                  <motion.div 
                    className="mt-3 space-y-1 text-xs"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${password.length >= 8 ? "bg-green-500" : "bg-blue-900/30"}`}>
                        {password.length >= 8 && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`${password.length >= 8 ? "text-green-400" : "text-blue-200/60"}`}>
                        At least 8 characters
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? "bg-green-500" : "bg-blue-900/30"}`}>
                        {/[A-Z]/.test(password) && /[a-z]/.test(password) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`${/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-green-400" : "text-blue-200/60"}`}>
                        Uppercase & lowercase letters
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/\d/.test(password) ? "bg-green-500" : "bg-blue-900/30"}`}>
                        {/\d/.test(password) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`${/\d/.test(password) ? "text-green-400" : "text-blue-200/60"}`}>
                        At least one number
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "bg-green-500" : "bg-blue-900/30"}`}>
                        {/[!@#$%^&*(),.?":{}|<>]/.test(password) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-400" : "text-blue-200/60"}`}>
                        At least one special character
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Signup Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
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
                  <span className="relative z-10">Sign up</span>
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

            {/* Login Redirect */}
            <motion.div 
              className="text-center mt-6 text-blue-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
            >
              Already have an account?{" "}
              <motion.span 
                className="inline-block"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Link to="/login" className="text-primary-400 font-medium relative group">
                  Log in
                  <motion.span 
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500"
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.span>
            </motion.div>

            {/* Terms and Privacy */}
            <motion.div 
              className="text-center mt-6 text-blue-200/40 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-primary-400 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary-400 hover:underline">
                Privacy Policy
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}