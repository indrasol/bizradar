import { Link } from "react-router-dom";
import { Radar, Search, User, ArrowRight, Star, ChevronDown, Activity, Zap, Lock } from "lucide-react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
// import { FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter, FaLinkedin, FaYoutube } from "react-icons/fa6";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { emailService } from "@/utils/emailService";
import { X } from 'lucide-react';

const Layout = ({ children }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const solutionsRef = useRef(null);

  // For scroll progress indicator
  const { scrollYProgress } = useScroll();
  const scrollProgressScale = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // For section in-view detection
  const heroInView = useInView(heroRef, { once: false, amount: 0.3 });
  const featuresInView = useInView(featuresRef, { once: false, amount: 0.3 });
  const solutionsInView = useInView(solutionsRef, { once: false, amount: 0.3 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Enhanced animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemFadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  // Subtle cursor follower effect
  const cursorVariants = {
    default: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      opacity: 0.15
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);

    try {
      // Subscribe to newsletter
      const subscribeResponse = await emailService.subscribeToNewsletter(email);

      if (subscribeResponse.success) {
        toast({
          title: "Success!",
          description: "Thank you for subscribing to our newsletter. We've sent you a welcome email!",
        });

        setEmail("");
      } else {
        throw new Error(subscribeResponse.message);
      }
    } catch (error) {
      // Check for unique constraint violation
      if (error.message?.includes("newsletter_subscribers_email_key")) {
        toast({
          title: "Already Subscribed",
          description: "This email address is already subscribed to our newsletter.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to subscribe. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">
      {/* Subtle cursor follower */}
      <motion.div
        className="fixed w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 filter blur-3xl pointer-events-none mix-blend-overlay z-0"
        variants={cursorVariants}
        animate="default"
      />

      {/* Improved Scroll Progress Indicator with gradient */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500 z-50"
        style={{ transform: `scaleX(${scrollProgressScale})`, transformOrigin: "0%" }}
      />

      {/* Modern Glass Header with subtle shadow */}
      <header className="sticky top-0 backdrop-blur-md bg-white/90 py-4 z-40 border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-6 md:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-md transform group-hover:scale-110 transition-transform duration-300"></div>
              <Radar className="w-8 h-8 text-blue-600 relative z-10 transition-transform group-hover:rotate-12 duration-300" />
            </div>
            <span className="text-2xl font-semibold text-blue-600">Bizradar</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/contracts" className="text-gray-700 hover:text-blue-600 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300">Features</Link>
            <Link to="/pricing" className="text-gray-700 hover:text-blue-600 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300">Pricing</Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300">About</Link>
            <div className="h-6 w-px bg-gradient-to-b from-gray-100 to-gray-300 mx-2"></div>
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Login</Link>
            {/* <button className="bg-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white px-5 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Get Started
            </button> */}
            <Link to="/signup" className="bg-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white px-5 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Get Started
            </Link>
          </nav>

          {/* Mobile menu button with animation */}
          <button className="md:hidden text-gray-700 relative group">
            <div className="relative flex overflow-hidden items-center justify-center rounded-full w-[50px] h-[50px] transform transition-all duration-200">
              <div className="flex flex-col justify-between w-[20px] h-[20px] transform transition-all duration-300 origin-center overflow-hidden">
                <div className="bg-gray-700 h-[2px] w-7 transform transition-all duration-300 origin-left group-hover:bg-blue-600"></div>
                <div className="bg-gray-700 h-[2px] w-7 rounded transform transition-all duration-300 group-hover:bg-blue-600"></div>
                <div className="bg-gray-700 h-[2px] w-7 transform transition-all duration-300 origin-left group-hover:bg-blue-600"></div>
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        {children}

        {/* Hero Section with Enhanced Visual Elements */}
        <section
          ref={heroRef}
          className="relative py-20 md:py-32 overflow-hidden"
        >
          {/* Enhanced Background elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-50 to-blue-100/50 rounded-bl-[100px] z-0"></div>
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-gradient-to-tr from-emerald-50 to-emerald-100/50 rounded-full z-0"></div>
          <div className="absolute top-40 right-20 w-20 h-20 bg-yellow-100 rounded-full opacity-60 animate-pulse"></div>

          <div className="container mx-auto px-6 md:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Text content - enhanced with staggered animation */}
              <motion.div
                className="col-span-1 md:col-span-5 md:col-start-2"
                initial="hidden"
                animate={heroInView ? "visible" : "hidden"}
                variants={staggerChildren}
              >
                <motion.h1
                  className="text-5xl md:text-7xl font-extrabold leading-tight mb-6"
                  variants={itemFadeIn}
                >
                  <span className="bg-blue-600 bg-clip-text text-transparent">Discover</span> <span className="bg-emerald-500 bg-clip-text text-transparent">Contract</span> <span className="text-gray-800">Opportunities</span>
                </motion.h1>
                <motion.p
                  className="text-lg md:text-xl text-gray-600 mb-8"
                  variants={itemFadeIn}
                >
                  AI-driven contract tracking dashboard that automates discovery and analysis for modern businesses.
                </motion.p>
                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  variants={itemFadeIn}
                >
                  <Link to="/signup" className="bg-emerald-500 hover:emerald-600 text-white px-8 py-3 rounded-lg font-medium text-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    Get Started
                  </Link>
                  <Link to="/demo" className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-medium text-center transition-all duration-300 hover:shadow-md">
                    See Demo
                  </Link>
                </motion.div>
              </motion.div>

              {/* Visual element - with enhanced animations and details */}
              <motion.div
                className="col-span-1 md:col-span-6 md:col-start-7 mt-12 md:mt-0"
                initial="hidden"
                animate={heroInView ? "visible" : "hidden"}
                variants={fadeIn}
              >
                {/* SVG Illustration with enhanced styling */}
                <div className="relative">
                  {/* Enhanced main illustration with glass effect and better shadows */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-8 relative z-10 border border-gray-100">
                    {/* Floating elements with subtle animations */}
                    <div className="absolute -top-8 -right-16 w-32 h-32 bg-blue-100 rounded-full opacity-60 z-0 animate-pulse"></div>
                    <div className="absolute top-20 -left-12 w-24 h-24 bg-emerald-100 rounded-full opacity-60 z-0 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute -bottom-6 right-12 w-20 h-20 bg-blue-50 rounded-full opacity-60 z-0 animate-pulse" style={{ animationDelay: '2s' }}></div>

                    {/* Header with enhanced icon and gradient text */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 w-12 h-12 rounded-lg flex items-center justify-center shadow-md">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">Contract Analytics</h3>
                          <p className="text-sm text-gray-500">Real-time insights</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-emerald-500 text-sm font-semibold mr-2">+24%</span>
                        <div className="bg-emerald-50 rounded-full p-1 shadow-sm">
                          <ArrowRight className="w-4 h-4 text-emerald-500" />
                        </div>
                      </div>
                    </div>

                    {/* Chart visualization - enhanced with better gradient */}
                    <div className="h-40 w-full mb-8 relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/70 to-white rounded"></div>
                      <div className="h-full w-full flex items-end justify-between relative z-10">
                        {[35, 58, 45, 65, 40, 75, 90, 85].map((height, i) => (
                          <div key={i} className="w-1/8 px-1">
                            <div
                              className={`rounded-t-sm mx-auto ${i % 2 === 0
                                  ? 'bg-gradient-to-t from-emerald-400 to-emerald-500'
                                  : 'bg-gradient-to-t from-blue-500 to-blue-600'
                                } shadow-sm`}
                              style={{
                                height: `${height}%`,
                                width: '100%',
                                transition: 'all 0.5s ease',
                                transform: `scaleY(${heroInView ? 1 : 0})`,
                                transformOrigin: 'bottom'
                              }}
                            ></div>
                          </div>
                        ))}
                      </div>

                      {/* Chart indicators with improved styling */}
                      <div className="absolute -right-4 top-10 bg-white p-2 rounded-lg shadow-md border border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-sm"></div>
                          <span className="text-xs text-gray-600 font-medium">Current</span>
                        </div>
                      </div>
                      <div className="absolute -left-4 top-24 bg-white p-2 rounded-lg shadow-md border border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-sm"></div>
                          <span className="text-xs text-gray-600 font-medium">Previous</span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Contract Items with hover effects */}
                    <div className="space-y-4 relative">
                      <div className="absolute -right-16 top-12 w-20 h-28 bg-emerald-400/10 rounded-r-full z-0"></div>

                      {[
                        { title: "City Development Contract", value: "$1.2M", status: "active", growth: "+5.2%" },
                        { title: "Infrastructure Service", value: "$860K", status: "pending", growth: "+2.8%" },
                        { title: "Educational Services", value: "$540K", status: "review", growth: "+1.5%" }
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-3 px-4 border-b border-gray-100 bg-white rounded-lg hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 relative z-10"
                        >
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${item.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                item.status === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                  'bg-gradient-to-r from-blue-400 to-blue-500'
                              }`}></div>
                            <span className="ml-3 text-gray-800 font-medium">{item.title}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900 mr-3">{item.value}</span>
                            <span className="text-xs text-emerald-500 font-semibold">{item.growth}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Floating action button with pulse animation */}
                    <div className="absolute -right-5 -bottom-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
                      <ChevronDown className="w-6 h-6 group-hover:animate-bounce" />
                    </div>
                  </div>

                  {/* Enhanced decorative elements with animations */}
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full z-0 animate-pulse"></div>
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-tr from-emerald-100 to-emerald-200 rounded-full z-0 opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
                  <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 w-16 h-64 bg-gradient-to-b from-blue-600/10 to-emerald-500/10 rounded-full z-0 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Stats bar - enhanced with gradient backgrounds and animations */}
          <motion.div
            className="container mx-auto px-6 md:px-8 mt-24"
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl py-8 px-6 md:px-10 ml-0 md:ml-16 border border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: "Active Contracts", value: "1,240+", icon: <Star className="w-6 h-6 text-yellow-500" />, bgColor: "bg-yellow-50" },
                  { label: "Success Rate", value: "99.8%", icon: <Zap className="w-6 h-6 text-emerald-500" />, bgColor: "bg-emerald-50" },
                  { label: "Secure Documents", value: "45,000+", icon: <Lock className="w-6 h-6 text-blue-500" />, bgColor: "bg-blue-50" },
                  { label: "User Satisfaction", value: "4.9/5", icon: <User className="w-6 h-6 text-purple-500" />, bgColor: "bg-purple-50" }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="flex flex-col items-center text-center group"
                    variants={itemFadeIn}
                  >
                    <div className={`mb-4 w-14 h-14 ${stat.bgColor} rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-110`}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section with Enhanced Visual Elements */}
        <section ref={featuresRef} className="py-20 md:py-32 relative overflow-hidden">
          {/* Enhanced Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-blue-50 to-transparent"></div>
          <div className="absolute bottom-40 right-0 w-80 h-80 bg-gradient-to-l from-emerald-50 to-emerald-100/50 rounded-full opacity-60"></div>
          <div className="absolute top-40 left-20 w-20 h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full animate-pulse"></div>

          <div className="container mx-auto px-6 md:px-8 relative z-10">
            <motion.div
              className="max-w-lg md:ml-16 mb-16"
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-6">Powerful Features</h2>
              <p className="text-lg text-gray-600">Our platform offers advanced tools designed to streamline your contract management process.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-20">
              {/* Left side illustration - enhanced with animations */}
              <motion.div
                className="col-span-1 md:col-span-6 md:col-start-1 order-2 md:order-1"
                initial="hidden"
                animate={featuresInView ? "visible" : "hidden"}
                variants={fadeIn}
              >
                <div className="relative">
                  {/* Main feature illustration with glass morphism */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-8 ml-0 md:ml-8 relative border border-gray-100">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center shadow-md">
                        <Search className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">Smart Contract Discovery</h3>
                      </div>
                    </div>

                    {/* Enhanced Visualization of Contract Discovery with animations */}
                    <div className="relative h-64 mb-4">
                      {/* Document paths with pulse animations */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center animate-pulse" style={{ animationDuration: '6s' }}>
                          <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center shadow-inner">
                              <Radar className="w-8 h-8 text-blue-600 animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Document icons with hover effect */}
                      {[45, 90, 135, 180, 225, 270, 315].map((degree, i) => (
                        <div key={i}
                          className="absolute w-10 h-12 bg-white rounded-lg shadow-md border border-gray-100 flex items-center justify-center transform hover:scale-110 transition-transform duration-300"
                          style={{
                            top: `calc(50% - 24px + ${Math.sin(degree * Math.PI / 180) * 90}px)`,
                            left: `calc(50% - 20px + ${Math.cos(degree * Math.PI / 180) * 90}px)`
                          }}>
                          <div className={`w-5 h-6 ${i % 2 === 0 ? 'bg-gradient-to-b from-blue-100 to-blue-200' : 'bg-gradient-to-b from-emerald-100 to-emerald-200'} rounded shadow-inner`}></div>
                        </div>
                      ))}

                      {/* Connection lines with animation */}
                      <div className="absolute inset-0">
                        <svg width="100%" height="100%" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.8" />
                            </linearGradient>
                          </defs>
                          <g fill="none" stroke="url(#lineGradient)" strokeWidth="1.5" strokeDasharray="3,3">
                            <path d="M150,150 L150,60" />
                            <path d="M150,150 L240,150" />
                            <path d="M150,150 L60,150" />
                            <path d="M150,150 L90,210" />
                            <path d="M150,150 L210,210" />
                            <path d="M150,150 L90,90" />
                            <path d="M150,150 L210,90" />
                          </g>
                        </svg>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 shadow-inner">
                      <p className="text-sm text-blue-600 font-medium">
                        AI-powered system scans and identifies relevant opportunities matching your business profile.
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Decorative elements */}
                  <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg z-0 animate-pulse" style={{ animationDuration: '4s' }}></div>
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-tr from-blue-100 to-blue-200 rounded-lg z-0 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
                </div>
              </motion.div>

              {/* Right side text - enhanced with staggered animations */}
              <motion.div
                className="col-span-1 md:col-span-5 md:col-start-8 order-1 md:order-2"
                initial="hidden"
                animate={featuresInView ? "visible" : "hidden"}
                variants={staggerChildren}
              >
                <motion.h3
                  className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4"
                  variants={itemFadeIn}
                >
                  Discover Relevant Opportunities
                </motion.h3>
                <motion.p
                  className="text-gray-600 mb-6"
                  variants={itemFadeIn}
                >
                  Our AI-powered system automatically scans thousands of sources to find the most relevant contract opportunities for your business.
                </motion.p>
                <motion.ul
                  className="space-y-4"
                  variants={staggerChildren}
                >
                  {[
                    "Intelligent matching based on your business profile",
                    "Real-time notifications for new opportunities",
                    "Customizable search parameters and filters",
                    "Historical data analysis for better predictions"
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start"
                      variants={itemFadeIn}
                    >
                      <div className="mt-1 mr-3 w-5 h-5 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Solutions Section with Enhanced Visual Elements */}
        <section ref={solutionsRef} className="py-20 md:py-32 relative bg-gradient-to-b from-white to-gray-50">
          {/* Enhanced Decorative elements */}
          <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-bl from-blue-50 to-blue-100 rounded-full animate-pulse" style={{ animationDuration: '6s' }}></div>
          <div className="absolute bottom-40 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-50 to-emerald-100 rounded-full opacity-40 animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>

          <div className="container mx-auto px-6 md:px-8 relative z-10">
            <motion.div
              className="md:max-w-lg md:mx-auto md:text-center mb-20"
              initial="hidden"
              animate={solutionsInView ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-6">Complete Solution</h2>
              <p className="text-lg text-gray-600">
                Bizradar provides end-to-end contract management with powerful analytics and intelligent recommendations.
              </p>
            </motion.div>

            {/* Enhanced card grid with staggered animations */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 md:ml-16"
              initial="hidden"
              animate={solutionsInView ? "visible" : "hidden"}
              variants={staggerChildren}
            >
              {/* Card 1 - enhanced with glass morphism and hover effects */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 md:-mt-12 relative overflow-hidden border border-gray-100 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                variants={itemFadeIn}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-50 to-emerald-100 rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 w-14 h-14 rounded-lg flex items-center justify-center mb-6 shadow-inner">
                    <Search className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">Contract Discovery</h3>
                  <p className="text-gray-600">
                    Automatically find and prioritize the most relevant contract opportunities.
                  </p>
                </div>
              </motion.div>

              {/* Card 2 - enhanced with glass morphism and hover effects */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 relative overflow-hidden border border-gray-100 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                variants={itemFadeIn}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-50 to-blue-100 rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="bg-gradient-to-r from-emerald-100 to-emerald-200 w-14 h-14 rounded-lg flex items-center justify-center mb-6 shadow-inner">
                    <Activity className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">Performance Analytics</h3>
                  <p className="text-gray-600">
                    Track performance metrics and gain insights to optimize your contract strategy.
                  </p>
                </div>
              </motion.div>

              {/* Card 3 - enhanced with glass morphism and hover effects */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 md:mt-12 relative overflow-hidden border border-gray-100 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                variants={itemFadeIn}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-50 to-emerald-100 rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 w-14 h-14 rounded-lg flex items-center justify-center mb-6 shadow-inner">
                    <Lock className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">Secure Management</h3>
                  <p className="text-gray-600">
                    Securely store, manage, and share contract documents with role-based access controls.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Enhanced Footer with better visual hierarchy */}
        <footer className="bg-gradient-to-b from-gray-50 to-gray-100 pt-16 pb-8 border-t border-gray-200">
          <div className="container mx-auto px-6 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-12 gap-8 mb-12">
              <div className="col-span-2 md:col-span-3">
                <Link to="/" className="flex items-center gap-3 group mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-md transform group-hover:scale-110 transition-transform duration-300"></div>
                    <Radar className="w-8 h-8 text-blue-600 relative z-10 transition-transform group-hover:rotate-12 duration-300" />
                  </div>
                  <span className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Bizradar</span>
                </Link>
                <p className="text-gray-600 mb-6">
                  AI-driven contract tracking and business intelligence.
                </p>
                <div className="flex gap-4">
                  <a href="https://x.com/theindrasol" target="_blank" className="text-gray-500 hover:text-blue-600 transition-colors duration-300 transform hover:scale-110">
                    <FaXTwitter className="w-5 h-5" />
                  </a>
                  <a href="https://www.linkedin.com/company/indrasol/posts/?feedView=all" target="_blank" className="text-gray-500 hover:text-blue-600 transition-colors duration-300 transform hover:scale-110">
                    <FaLinkedin className="w-5 h-5" />
                  </a>
                  <a href="https://www.youtube.com/@IndrasolTech" target="_blank" className="text-gray-500 hover:text-blue-600 transition-colors duration-300 transform hover:scale-110">
                    <FaYoutube className="w-5 h-5" />
                  </a>
                  {/* <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors duration-300 transform hover:scale-110">
                    <FaFacebook className="w-5 h-5" />
                  </a> */}
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 md:col-start-5">
                <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
                <ul className="space-y-3">
                  <li><Link to="/features" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 hover:translate-x-1 inline-block">Features</Link></li>
                  <li><Link to="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 hover:translate-x-1 inline-block">Pricing</Link></li>
                  <li><Link to="/integrations" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 hover:translate-x-1 inline-block">Integrations</Link></li>
                </ul>
              </div>

              <div className="col-span-1 md:col-span-2">
                <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
                <ul className="space-y-3">
                  <li><Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 hover:translate-x-1 inline-block">About Us</Link></li>
                  <li><Link to="/careers" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 hover:translate-x-1 inline-block">Careers</Link></li>
                  <li><Link to="/contact" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 hover:translate-x-1 inline-block">Contact</Link></li>
                </ul>
              </div>

              <div className="col-span-2 md:col-span-3">
                <h3 className="font-semibold text-gray-900 mb-4">Stay Updated</h3>
                <p className="text-gray-600 mb-4">Subscribe to our newsletter for the latest updates.</p>
                <form onSubmit={handleSubscribe} className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="flex-1 bg-white border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    disabled={isSubscribing}
                  />
                  <button
                    type="submit"
                    disabled={isSubscribing}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-r-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubscribing ? "Subscribing..." : "Subscribe"}
                  </button>
                </form>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
              <span className="text-gray-600 text-sm">&copy; {new Date().getFullYear()} Bizradar. All rights reserved.</span>
              <div className="flex gap-6 mt-4 md:mt-0">
                <Link to="/privacy-policy" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 text-sm">
                  Privacy Policy
                </Link>
                <Link to="/terms-of-service" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 text-sm">
                  Terms of Service
                </Link>
                <Link to="/cookies" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 text-sm">
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Add Toaster component */}
      <Toaster />
    </div>
  );
};

export default Layout;
