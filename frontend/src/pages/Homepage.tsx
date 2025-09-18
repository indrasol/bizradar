import { Link } from "react-router-dom";
import { Radar, Search, User, ArrowRight, ArrowLeft, Activity, Zap, Lock, FileText, BarChart4, ChevronLeft, ChevronRight, PencilRuler } from "lucide-react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
// import { FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter, FaLinkedin, FaYoutube } from "react-icons/fa6";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { emailService } from "@/utils/emailService";
import { useTrack } from "@/logging"; // <-- added

// Image Carousel Component
const ImageCarousel = ({ currentSlide, setCurrentSlide }) => {
  const [autoplay, setAutoplay] = useState(true);
  const images = [
    {
      src: "/biz_opp.png",
      alt: "Bizradar Opportunities Interface",
      title: "Opportunity Discovery",
      description: "Find perfect-fit government contracts tailored to your business capabilities"
    },
    {
      src: "/biz_rfp.png",
      alt: "RFP Generation Interface",
      title: "AI-Powered RFP Response",
      description: "Create winning proposals with our intelligent document editor"
    },
    {
      src: "/biz_dash.png",
      alt: "Contract Details Interface",
      title: "Contract Intelligence",
      description: "Get detailed insights and analytics on each opportunity"
    }
  ];
  
  // Auto advance slides
  useEffect(() => {
    let interval;
    if (autoplay) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % images.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [autoplay, images.length]);

  const nextSlide = () => {
    setAutoplay(false);
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setAutoplay(false);
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index) => {
    setAutoplay(false);
    setCurrentSlide(index);
  };

  // Animation variants
  const slideVariants = {
    hidden: (direction) => {
      return {
        x: direction > 0 ? 300 : -300,
        opacity: 0
      };
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: (direction) => {
      return {
        x: direction > 0 ? -300 : 300,
        opacity: 0,
        transition: {
          duration: 0.5,
          ease: "easeIn"
        }
      };
    }
  };
  
  // Direction tracking for animations
  const [[slideDirection], setSlideDirection] = useState([0]);
  
  const updateSlide = (newSlide) => {
    setSlideDirection([newSlide > currentSlide ? 1 : -1]);
    setCurrentSlide(newSlide);
  };
  
  return (
    <div className="h-full relative">
      {/* Direct image slides */}
      <AnimatePresence initial={false} custom={slideDirection}>
        <motion.div
          key={currentSlide}
          custom={slideDirection}
          variants={slideVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute inset-0"
        >
          {/* Full-height image container */}
          <div className="h-full w-full relative">
            {/* Ensure all images are fully visible without cutoff */}
            <div className="w-full h-full flex items-center justify-center p-4">
              <img 
                src={images[currentSlide].src} 
                alt={images[currentSlide].alt}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            
            {/* Compact glass-effect blue badge */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600/95 via-blue-700/95 to-blue-600/95 backdrop-blur-md border-t border-white/20 shadow-xl">
              <div className="px-4 py-3 text-center">
                <h3 className="font-bold text-white mb-1 text-base md:text-lg">{images[currentSlide].title}</h3>
                <p className="text-white/90 text-xs md:text-sm font-medium leading-snug max-w-4xl mx-auto">{images[currentSlide].description}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
    </div>
  );
};



const Layout = ({ children }) => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { toast } = useToast();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const solutionsRef = useRef(null);

  // 🔹 fire logout event if we just returned to "/"
  const track = useTrack(); // <-- added
  useEffect(() => {
    if (sessionStorage.getItem("pendingLogoutTrack") === "1") {
      track({
        event_name: "logout-success",
        event_type: "button_click",
        metadata: {search_query: null, stage: null, opportunity_id: null, naics_code: null, rfp_title: null}
      });
      sessionStorage.removeItem("pendingLogoutTrack");
    }
  }, [track]); // <-- added

  // For scroll progress indicator
  const { scrollYProgress } = useScroll();
  const scrollProgressScale = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // For section in-view detection
  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const solutionsInView = useInView(solutionsRef, { once: true, amount: 0.2 });

  // Simplified animation variants for better performance
  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemFadeIn = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // Simplified animations

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
    <div className="flex flex-col min-h-screen w-full bg-white overflow-x-hidden">
      {/* Clean design without cursor follower */}

      {/* Simple Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-blue-600 z-50"
        style={{ transform: `scaleX(${scrollProgressScale})`, transformOrigin: "0%" }}
      />

      {/* Modern Glass Header with subtle shadow */}
      <header className="sticky top-0 backdrop-blur-md bg-white/90 py-2 sm:py-3 md:py-4 z-40 border-b border-gray-100 shadow-sm w-full">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-md transform group-hover:scale-110 transition-transform duration-300"></div>
              <Radar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 relative z-10 transition-transform group-hover:rotate-12 duration-300" />
            </div>
            <div className="flex items-end">
              <span className="text-lg sm:text-xl lg:text-2xl font-semibold text-blue-600">Bizradar</span>
              <a 
                href="https://indrasol.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-gray-500 ml-1 mb-1 hover:text-blue-600 transition-colors duration-200 hidden sm:block"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open("https://indrasol.com", "_blank");
                }}
              >
                by Indrasol
              </a>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {/* Hidden for now
            <Link to="/contracts" className="text-gray-700 hover:text-blue-600 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300">Features</Link>
            <Link to="/pricing" className="text-gray-700 hover:text-blue-600 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300">Pricing</Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300">About</Link>
            */}
            <div className="h-6 w-px bg-gradient-to-b from-gray-100 to-gray-300 mx-2"></div>
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm sm:text-base">Login</Link>
            {/* <button className="bg-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white px-5 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Get Started
            </button> */}
            <Link to="/register" className="bg-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base">
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

        {/* Hero Section with Modern Glassy Layout */}
        <section
          ref={heroRef}
          className="relative py-8 md:py-16 lg:py-20 overflow-hidden w-full min-h-[85vh] flex flex-col justify-center"
        >
          {/* Sophisticated Glassy Background Design */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 via-blue-50/60 to-indigo-50/70 z-0"></div>
          
          {/* Layered Glass Effects */}
          <div className="absolute inset-0 z-0">
            {/* Primary glass layer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-blue-50/30 to-purple-50/25 backdrop-blur-[1px]"></div>
            
            {/* Secondary frosted layer */}
            <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-white/20 to-emerald-50/30 backdrop-blur-[0.5px]"></div>
          </div>
          
          {/* Enhanced Geometric Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            {/* Large glass orbs with enhanced depth */}
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/15 via-blue-100/10 to-transparent rounded-full blur-3xl backdrop-blur-sm"></div>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-white/20 via-blue-50/15 to-transparent rounded-full blur-2xl backdrop-blur-[2px] border border-white/10"></div>
            
            {/* Bottom left glass cluster */}
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-emerald-200/12 via-emerald-100/8 to-transparent rounded-full blur-3xl backdrop-blur-sm"></div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-white/15 via-emerald-50/10 to-transparent rounded-full blur-xl backdrop-blur-[1px] border border-white/8"></div>
            
            {/* Mid-section glass elements */}
            <div className="absolute top-1/4 left-1/5 w-40 h-40 bg-gradient-to-r from-purple-100/20 via-white/10 to-blue-100/15 rounded-full blur-2xl backdrop-blur-[1px]"></div>
            <div className="absolute bottom-1/3 right-1/5 w-32 h-32 bg-gradient-to-l from-emerald-100/18 via-white/12 to-blue-100/10 rounded-full blur-xl backdrop-blur-[0.5px]"></div>
            
            {/* Center accent glass */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full blur-3xl"></div>
            
            {/* Refined grid pattern with glass effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
            
            
            {/* Additional depth layers */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 via-transparent to-white/5 backdrop-blur-[0.5px]"></div>
            <div className="absolute inset-0" style={{background: 'radial-gradient(ellipse at center, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)'}}></div>
          </div>
          
          {/* Subtle glass overlay for content area */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent z-5 backdrop-blur-[0.5px]"></div>

          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10 w-full">
            {/* Content Section - Adjusted Position */}
            <motion.div
              className="text-center mb-12 md:mb-20 mt-8 md:mt-0"
              initial="hidden"
              animate={heroInView ? "visible" : "hidden"}
              variants={staggerChildren}
            >

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-8 md:mb-10 max-w-5xl mx-auto"
                variants={itemFadeIn}
              >
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Win Government </span>
                <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">Contracts </span>
                <span className="bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">with AI</span>
              </motion.h1>

              {/* Enhanced Tagline - All on One Line */}
              <motion.p
                className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-10 md:mb-14 font-medium max-w-5xl mx-auto leading-relaxed"
                variants={itemFadeIn}
              >
                Smarter contracts. Faster submissions. Turn RFP chaos into clarity. More wins.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-5 sm:gap-8 justify-center items-center"
                variants={itemFadeIn}
              >
                <Link to="/register" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-10 py-5 rounded-xl font-bold text-xl transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center relative overflow-hidden group transform hover:-translate-y-1">
                  <span className="relative z-10 flex items-center">
                    Start Finding Contracts for Free 
                    <ArrowRight className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-2" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </Link>
                
                <Link to="/demo" className="border-2 border-blue-600 text-blue-700 bg-white/80 backdrop-blur-sm hover:bg-blue-50 px-10 py-5 rounded-xl font-bold text-xl transition-all duration-300 hover:shadow-xl flex items-center justify-center relative overflow-hidden group">
                  <span className="relative z-10 flex items-center">
                    Watch Demo Video
                    <ArrowRight className="ml-3 w-6 h-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2" />
                  </span>
                  <div className="absolute inset-0 bg-blue-50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </Link>
              </motion.div>
            </motion.div>

            {/* Image Carousel Section - Now at Bottom */}
            <motion.div
              className="max-w-6xl mx-auto"
              initial="hidden"
              animate={heroInView ? 'visible' : 'hidden'}
              variants={fadeIn}
            >
              {/* Carousel container with enhanced glassy styling */}
              <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
                {/* Enhanced glass glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-white/5 to-emerald-500/8 rounded-3xl"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5 rounded-3xl"></div>
                
                {/* Inner glass border */}
                <div className="absolute inset-[1px] rounded-3xl border border-white/20"></div>
                
                {/* Carousel with improved height */}
                <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
                  <ImageCarousel currentSlide={currentSlide} setCurrentSlide={setCurrentSlide} />
                </div>
              </div>
              
              {/* Navigation dots outside carousel */}
              <div className="flex items-center justify-center space-x-3 mt-6">
                {[0, 1, 2].map((index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-3 rounded-full transition-all duration-300 shadow-lg ${
                      index === currentSlide
                        ? 'bg-blue-600 w-10' 
                        : 'bg-gray-300 hover:bg-gray-400 w-3'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>

        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50/30 via-white/50 to-blue-50/20 relative overflow-hidden">
          {/* Subtle background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 right-20 w-32 h-32 bg-blue-100/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 left-20 w-40 h-40 bg-emerald-100/8 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl py-8 sm:py-12 px-6 sm:px-8 md:px-12 border border-white/40 max-w-6xl mx-auto relative overflow-hidden">
                {/* Glass overlay effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-white/10 to-emerald-50/20 rounded-3xl"></div>
                <div className="absolute inset-[1px] rounded-3xl border border-white/30"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-12 relative z-10">
                  {[
                    { label: "Contracts Found", value: "10,000+", icon: <Search className="w-7 h-7 text-yellow-500" />, bgColor: "bg-yellow-50/80", accentColor: "border-yellow-200/60" },
                    { label: "Avg. Time Saved", value: "65%", icon: <Zap className="w-7 h-7 text-emerald-500" />, bgColor: "bg-emerald-50/80", accentColor: "border-emerald-200/60" },
                    { label: "Proposal Templates", value: "25+", icon: <FileText className="w-7 h-7 text-blue-500" />, bgColor: "bg-blue-50/80", accentColor: "border-blue-200/60" },
                    { label: "Agency Coverage", value: "100%", icon: <BarChart4 className="w-7 h-7 text-purple-500" />, bgColor: "bg-purple-50/80", accentColor: "border-purple-200/60" }
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      className="flex flex-col items-center text-center group"
                      variants={itemFadeIn}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`mb-4 w-16 h-16 ${stat.bgColor} backdrop-blur-sm rounded-2xl border-2 ${stat.accentColor} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                        {stat.icon}
                      </div>
                      <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-1">{stat.value}</p>
                      <p className="text-sm md:text-base text-gray-600 font-medium">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-16 md:py-24 lg:py-28 relative overflow-hidden">
          {/* Enhanced subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/20 to-white z-0"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent z-0"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-100/10 via-transparent to-transparent z-0"></div>
          <div className="absolute top-40 -left-24 w-72 h-72 bg-blue-200/10 rounded-full filter blur-3xl z-0"></div>
          <div className="absolute bottom-20 right-0 w-96 h-96 bg-blue-100/20 rounded-full filter blur-3xl z-0"></div>
          
          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-6">How it Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Three simple steps to transform how you find and win government contracts
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8 md:gap-7">
              {/* Step 1: Search */}
              <motion.div
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                whileHover={{ y: -3 }}
              >
                <div className="p-6 md:p-7 flex-grow">
                  <div className="flex items-center mb-5">
                    <div className="bg-blue-50 h-12 w-12 rounded-lg flex items-center justify-center mr-4">
                      <Search className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-blue-600 text-sm font-medium">Step 1</div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">Search.</h3>
                  <p className="text-gray-600 text-sm">
                    Leverage Bizradar's AI-Powered search engine to Turn keywords into contracts.
                  </p>
                </div>
                <div className="h-1 bg-blue-500 mt-auto"></div>
              </motion.div>

              {/* Step 2: Ask */}
              <motion.div
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                whileHover={{ y: -3 }}
              >
                <div className="p-6 md:p-7 flex-grow">
                  <div className="flex items-center mb-5">
                    <div className="bg-blue-50 h-12 w-12 rounded-lg flex items-center justify-center mr-4">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-blue-600 text-sm font-medium">Step 2</div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">Ask.</h3>
                  <p className="text-gray-600 text-sm">
                    Make a quick bid/no-bid decision with our simplified Jargon free explanations of any grant opportunity or by asking Bizradar AI questions about the opportunity.
                  </p>
                </div>
                <div className="h-1 bg-blue-500 mt-auto"></div>
              </motion.div>

              {/* Step 3: Respond */}
              <motion.div
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                whileHover={{ y: -3 }}
              >
                <div className="p-6 md:p-7 flex-grow">
                  <div className="flex items-center mb-5">
                    <div className="bg-blue-50 h-12 w-12 rounded-lg flex items-center justify-center mr-4">
                      <PencilRuler className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-blue-600 text-sm font-medium">Step 3</div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">Respond.</h3>
                  <p className="text-gray-600 text-sm">
                    Focus on the opportunity — Bizradar AI RFP Writer structures a win-ready, compelling, pursuit-specific response for you.
                  </p>
                </div>
                <div className="h-1 bg-blue-500 mt-auto"></div>
              </motion.div>
            </div>

            <div className="mt-12 text-center">
              <Link to="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-xl">
                Try Bizradar for Free <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section with Enhanced Visual Elements */}
        <section ref={featuresRef} className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
          {/* Clean background with subtle gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/20 to-white z-0"></div>

          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10 w-full">
            <motion.div
              className="max-w-3xl mx-auto text-center mb-16"
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-6">Purpose-Built for Government Contractors</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Find, evaluate, and act on the right public-sector opportunities—fast with our AI specialized tools that turn search time into win time.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center mb-12 md:mb-16 lg:mb-20">
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
                        <div className="w-36 sm:w-40 md:w-48 h-36 sm:h-40 md:h-48 rounded-full border-2 border-gray-200 flex items-center justify-center">
                          <div className="w-24 sm:w-28 md:w-32 h-24 sm:h-28 md:h-32 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center shadow-sm">
                              <Radar className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
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

                  {/* Clean design without decorative elements */}
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
                  Find Perfect-Fit Government Contracts
                </motion.h3>
                <motion.p
                  className="text-gray-600 mb-6"
                  variants={itemFadeIn}
                >
                  Our AI scans federal, state, and local government sources to identify contracts that match your company's capabilities and expertise.
                </motion.p>
                <motion.ul
                  className="space-y-4"
                  variants={staggerChildren}
                >
                  {[
                    "Find contracts matching your company's expertise and capabilities",
                    "Get alerts when new relevant government RFPs are posted",
                    "Filter by agency, contract value, and industry requirements",
                    "Access historical award data to optimize your proposals"
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
        <section ref={solutionsRef} className="py-16 md:py-24 lg:py-32 relative bg-gradient-to-b from-white to-gray-50">
          {/* Clean background with subtle gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 z-0"></div>

          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10 w-full">
            <motion.div
              className="md:max-w-lg md:mx-auto md:text-center mb-12 md:mb-16 lg:mb-20"
              initial="hidden"
              animate={solutionsInView ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-6">Win More Contracts</h2>
              <p className="text-lg text-gray-600">
                Bizradar provides the complete toolkit to discover opportunities, prepare winning proposals, and grow your government contracting business.
              </p>
            </motion.div>

            {/* Enhanced card grid with staggered animations */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-6 mx-4 md:ml-16"
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
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">Smart Opportunity Discovery</h3>
                  <p className="text-gray-600">
                    Automatically find and prioritize government contracts that match your company's strengths and capabilities.
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
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">AI-Powered RFP Generation</h3>
                  <p className="text-gray-600">
                    Create professional, tailored proposal responses in minutes with our advanced AI assistant that understands government requirements.
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
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">Proposal Management</h3>
                  <p className="text-gray-600">
                    Track your proposals, manage deadlines, and collaborate with your team to submit winning bids on time, every time.
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
                  <div className="flex items-end">
                    <span className="text-2xl font-semibold text-blue-600">Bizradar</span>
                    <a 
                      href="https://indrasol.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-gray-500 ml-1 mb-1 hover:text-blue-600 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        window.open("https://indrasol.com", "_blank");
                      }}
                    >
                      by Indrasol
                    </a>
                  </div>
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
