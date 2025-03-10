import { Link } from "react-router-dom";
import { Radar, Search, User, ArrowRight, Star, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";

const Layout = ({ children }) => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const scrollRef = useRef(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const solutionsRef = useRef(null);
  const testimonialRef = useRef(null);
  
  // For scroll progress indicator
  const { scrollYProgress } = useScroll();
  const scrollProgressScale = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  
  // For parallax effects
  const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const featuresParallax = useTransform(scrollYProgress, [0.2, 0.5], [0, -50]);
  
  // For section in-view detection
  const heroInView = useInView(heroRef, { once: false, amount: 0.3 });
  const featuresInView = useInView(featuresRef, { once: false, amount: 0.3 });
  const solutionsInView = useInView(solutionsRef, { once: false, amount: 0.3 });
  const testimonialInView = useInView(testimonialRef, { once: false, amount: 0.3 });
  
  // For horizontal scrolling with mouse wheel
  useEffect(() => {
    const handleWheel = (e) => {
      if (scrollRef.current) {
        if (e.deltaY !== 0) {
          scrollRef.current.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      }
    };
    
    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // For floating elements effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-blue-950 overflow-x-hidden">
      {/* Scroll Progress Indicator */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary-500 z-50"
        style={{ scaleX: scrollProgressScale, transformOrigin: "0%" }}
      />
      
      {/* Floating Elements - Mouse-reactive */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          className="absolute w-40 h-40 rounded-full bg-blue-500/10 blur-2xl"
          animate={{
            x: mousePosition.x * 0.05,
            y: mousePosition.y * 0.05,
          }}
          transition={{ type: "spring", damping: 50 }}
        />
        <motion.div 
          className="absolute w-64 h-64 rounded-full bg-primary-500/10 blur-3xl"
          animate={{
            x: mousePosition.x * -0.03 + 100,
            y: mousePosition.y * -0.03 + 100,
          }}
          transition={{ type: "spring", damping: 80 }}
        />
      </div>

      {/* Main Content with Integrated Header */}
      <main className="flex-1 overflow-y-auto bg-blue-950">
        {/* Integrated Header */}
        <div className="bg-blue-950 text-gray-300 py-5 border-b border-blue-800/30">
          <div className="container mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                className="relative"
                whileHover={{ 
                  rotate: 360,
                  scale: 1.1,
                }}
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
              <motion.span 
                className="text-2xl font-semibold text-white"
                whileHover={{ 
                  letterSpacing: "0.05em",
                  color: "#38bdf8"
                }}
                transition={{ duration: 0.3 }}
              >
                Bizradar
              </motion.span>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-6">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Link to="/login" className="relative group overflow-hidden">
                  <span className="relative z-10 hover:text-primary-400 transition-colors duration-300">Signup/Login</span>
                  <motion.span 
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500"
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Link to="/contracts" className="relative group overflow-hidden">
                  <span className="relative z-10 hover:text-primary-400 transition-colors duration-300">Contracts</span>
                  <motion.span 
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500"
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.div>
              
              <motion.div 
                className="relative group"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <div className="flex items-center gap-1 cursor-pointer">
                  <User className="text-white" />
                  <ChevronDown className="w-4 h-4 text-gray-300 group-hover:rotate-180 transition-transform duration-300" />
                </div>
                <AnimatePresence>
                  <motion.div 
                    className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md text-gray-700 rounded-lg shadow-lg overflow-hidden"
                    initial={{ opacity: 0, height: 0 }}
                    whileHover={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {["Profile", "Settings", "Logout"].map((item, i) => (
                      <motion.div
                        key={item}
                        initial={{ x: -20, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Link 
                          to={`/${item.toLowerCase()}`} 
                          className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50"
                        >
                          <span className="w-1 h-1 rounded-full bg-primary-500"></span>
                          {item}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </nav>
          </div>
        </div>

        {children}

        {/* Hero Section with Overlapping Elements */}
        <section ref={heroRef} className="relative py-40 overflow-hidden">
          <motion.div
            style={{ y: heroParallax }}
            className="container mx-auto relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl"
            >
              <div className="overflow-hidden">
                <motion.h1 
                  className="text-5xl font-bold text-white mb-6"
                  initial={{ y: 0 }}
                  animate={heroInView ? { y: 20 } : { y: 200 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Discover Contract <br />
                  <motion.span 
                    className="text-primary-500 inline-block size-9"
                    animate={heroInView ? { 
                      scale: [1, 1.05, 1],
                      color: ["#3b82f6", "#38bdf8", "#3b82f6"]
                    } : {}}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    Opportunities
                  </motion.span>
                </motion.h1>
              </div>
              
              <motion.p 
                className="text-xl text-gray-300 mb-9 relative"
                initial={{ opacity: 0 }}
                animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                AI-driven contract tracking dashboard that automates discovery and analysis
                <motion.span 
                  className="absolute -left-8 w-6 h-0.5 bg-primary-500"
                  initial={{ width: 0 }}
                  animate={heroInView ? { width: "1.5rem" } : { width: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                />
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)"
                  }}
                  className="inline-block"
                >
                  <Link to="/signup" className="relative overflow-hidden bg-primary-500 text-white px-8 py-3 rounded-lg font-medium inline-block">
                    <motion.span 
                      className="relative z-10"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      Get Started
                    </motion.span>
                    <motion.div 
                      className="absolute inset-0 bg-blue-600"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Perspective floating elements */}
          <motion.div 
            className="absolute top-20 right-10 w-96 h-96 bg-blue-800 rounded-full -translate-y-1/3 translate-x-1/3 opacity-20"
            style={{ 
              y: useTransform(scrollYProgress, [0, 0.2], [0, -50]),
              x: useTransform(scrollYProgress, [0, 0.2], [0, 30])
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.15, 0.2]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-64 h-64 bg-primary-700 rounded-full translate-y-1/2 -translate-x-1/3 opacity-20"
            style={{ 
              y: useTransform(scrollYProgress, [0, 0.2], [0, 40]), 
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          
          {/* Diagonal vector accent */}
          <svg className="absolute top-0 right-0 h-full w-1/3 text-blue-800 opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.polygon 
              points="0,0 100,0 100,100" 
              style={{ 
                x: useTransform(scrollYProgress, [0, 0.2], [20, -20]) 
              }}
            />
          </svg>
        </section>

        {/* Features Section with Broken Grid Layout */}
        <section ref={featuresRef} id="features" className="py-24 relative">
          {/* Decorative elements */}
          <div className="absolute left-0 top-0 w-full h-full overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute -left-16 top-1/4 w-32 h-32 bg-primary-500/10 rounded-full blur-xl"
              animate={{ 
                y: [0, 30, 0],
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.3, 0.5]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute -right-16 bottom-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-xl"
              animate={{ 
                y: [0, -40, 0],
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.2, 0.3]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>
          
          <motion.div
            className="max-w-6xl mx-auto"
            style={{ y: featuresParallax }}
          >
            <div className="overflow-hidden mb-16">
              <motion.h1 
                className="text-4xl font-bold text-blue-400 mb-4 relative inline-block"
                initial={{ y: 100 }}
                animate={featuresInView ? { y: 0 } : { y: 100 }}
                transition={{ duration: 0.5 }}
              >
                Why Choose Bizradar?
                <motion.div 
                  className="absolute -bottom-2 left-0 h-1 bg-primary-500"
                  initial={{ width: 0 }}
                  animate={featuresInView ? { width: "100%" } : { width: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </motion.h1>
            </div>

            {/* Broken Grid Layout for Features */}
            <div className="relative grid grid-cols-12 gap-6 mb-32">
              {/* Feature 1: Positioned to break the grid */}
              <motion.div
                className="col-span-6 col-start-1 row-start-1 bg-white p-8 rounded-xl shadow-lg transform -rotate-2 z-20"
                initial={{ opacity: 0, x: -50 }}
                animate={featuresInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ 
                  scale: 1.03, 
                  rotate: 0,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  y: -10
                }}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <span className="text-xl">⚙️</span>
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-semibold text-blue-700">Automated Workflows</h3>
                    <p className="mt-2 text-gray-600">Save time with AI-powered deal automation.</p>
                  </div>
                </div>
                
                <motion.div 
                  className="w-full h-1 bg-gradient-to-r from-blue-500 to-primary-500 mt-6"
                  initial={{ scaleX: 0, originX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
              
              {/* Feature 2: Overlapping Feature 1 */}
              <motion.div
                className="col-span-5 col-start-5 row-start-2 bg-blue-100 p-8 rounded-xl shadow-lg z-10 transform translate-y-[-20%]"
                initial={{ opacity: 0, y: "0%" }}
                animate={featuresInView ? { opacity: 1, y: "-20%" } : { opacity: 0, y: "0%" }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ 
                  scale: 1.03,
                  y: "-22%",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.2 }}
                    transition={{ duration: 0.3, type: "spring" }}
                  >
                    <span className="text-xl">🔍</span>
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-semibold text-blue-700">Seamless Search</h3>
                    <p className="mt-2 text-gray-600">Government procurement platforms and freelance marketplaces.</p>
                  </div>
                </div>
                
                <motion.div 
                  className="w-full h-1 bg-gradient-to-r from-primary-500 to-blue-500 mt-6"
                  initial={{ scaleX: 0, originX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
              
              {/* Feature 3: Breaking out of alignment */}
              <motion.div
                className="col-span-6 col-start-7 row-start-1 bg-gray-50 p-8 rounded-xl shadow-lg transform translate-y-[30%] rotate-1"
                initial={{ opacity: 0, x: 50 }}
                animate={featuresInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                whileHover={{ 
                  scale: 1.03, 
                  rotate: 0,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  y: "25%"
                }}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden"
                    whileHover={{ 
                      scale: 1.2,
                      backgroundColor: "#dbeafe"
                    }}
                    transition={{ duration: 0.3, type: "spring" }}
                  >
                    <motion.span 
                      className="text-xl"
                      animate={{ y: [0, -30, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
                    >
                      🔒
                    </motion.span>
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-semibold text-blue-700">Secure & Reliable</h3>
                    <p className="mt-2 text-gray-600">Your data is protected with top security standards.</p>
                  </div>
                </div>
                
                <motion.div 
                  className="w-full h-1 bg-gradient-to-r from-blue-500 to-primary-500 mt-6"
                  initial={{ scaleX: 0, originX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            </div>

            {/* Image breaking grid boundaries with scroll-triggered reveal */}
            <div className="relative mb-24 overflow-hidden">
              <motion.div 
                className="w-[80%] mx-auto bg-blue-900/20 h-40 rounded-xl"
                initial={{ opacity: 0 }}
                animate={featuresInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              />
              
              <motion.div 
                className="w-[90%] max-w-3xl h-[200px] bg-blue-600/50 backdrop-blur-md rounded-lg shadow-xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={featuresInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: 1 }}
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-primary-500 opacity-70"
                  whileHover={{ opacity: 0.5 }}
                />
                
                <div className="h-full flex items-center justify-center relative z-10">
                  <motion.h3 
                    className="text-white text-2xl font-bold"
                    initial={{ opacity: 0, y: 20 }}
                    animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                  >
                    Visualize Your Contract Data
                  </motion.h3>
                </div>
                
                {/* Decorative elements */}
                <motion.div 
                  className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-white/30"
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-white/30"
                  animate={{ rotate: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Horizontal Scrolling Section with enhanced interactions */}
        <section ref={solutionsRef} className="py-16 relative">
          <div className="absolute left-0 top-1/2 w-20 h-64 bg-gradient-to-r from-blue-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-1/2 w-20 h-64 bg-gradient-to-l from-blue-950 to-transparent z-10 pointer-events-none" />
          
          <div className="container mx-auto mb-8">
            <motion.h2 
              className="text-3xl font-bold text-blue-400 mb-8 relative inline-block"
              initial={{ opacity: 0, x: -20 }}
              animate={solutionsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              Explore Our Solutions
              <motion.div 
                className="absolute -bottom-2 left-0 h-1 bg-primary-500"
                initial={{ width: 0 }}
                animate={solutionsInView ? { width: "100%" } : { width: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </motion.h2>
            
            <motion.div 
              className="flex items-center mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={solutionsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="text-gray-300 mr-2">Scroll horizontally to explore</p>
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-5 h-5 text-primary-400" />
              </motion.div>
            </motion.div>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto pb-8 hide-scrollbar snap-x snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            {[
              { title: "Contract Discovery", desc: "AI-driven contract opportunities discovery engine", color: "from-blue-600 to-blue-900", icon: "🎯" },
              { title: "Proposal Builder", desc: "Generate winning proposals with AI assistance", color: "from-purple-600 to-purple-900", icon: "📝" },
              { title: "Market Intelligence", desc: "Understand market trends and competitive landscape", color: "from-green-600 to-green-900", icon: "📊" },
              { title: "Compliance Manager", desc: "Stay compliant with all regulatory requirements", color: "from-red-600 to-red-900", icon: "✓" },
              { title: "Integration Hub", desc: "Connect with all your favorite tools", color: "from-yellow-600 to-yellow-900", icon: "🔄" },
            ].map((item, index) => (
              <motion.div
                key={index}
                className={`min-w-[300px] h-[400px] bg-gradient-to-br ${item.color} p-6 rounded-xl mx-4 flex-shrink-0 snap-center flex flex-col justify-between shadow-lg relative overflow-hidden group`}
                initial={{ opacity: 0, y: 30 }}
                animate={solutionsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div>
                  <motion.div 
                    className="text-4xl mb-6"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {item.icon}
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-white relative">
                    {item.title}
                    <motion.div 
                      className="absolute -bottom-2 left-0 h-0.5 bg-white/40"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </h3>
                  <p className="text-white/80 mb-4 mt-2">{item.desc}</p>
                </div>
                
                <Link 
                  to={`/solutions/${index}`} 
                  className="group flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg self-start transition-all"
                >
                  <span>Learn more</span>
                  <motion.div
                    animate={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </Link>
                
                {/* Decorative elements */}
                <motion.div 
                  className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10"
                  initial={{ scale: 0, x: 20, y: -20 }}
                  whileHover={{ scale: 1, x: 10, y: -10 }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div 
                  className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5"
                  initial={{ scale: 0, x: -20, y: 20 }}
                  whileHover={{ scale: 1, x: -10, y: 10 }}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials with enhanced Asymmetrical Layout */}
        <section ref={testimonialRef} id="testimonials" className="py-24 relative">
          {/* Background decoration */}
          <motion.div 
            className="absolute top-0 right-0 w-72 h-72 rounded-full bg-blue-600/5 blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.2, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary-500/5 blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.1, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          
          <motion.h2 
            className="text-3xl font-bold text-blue-400 mb-16 text-center relative inline-block mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={testimonialInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5 }}
            style={{ display: "block" }}
          >
            What Our Users Say
            <motion.div 
              className="absolute -bottom-2 left-1/2 h-1 bg-primary-500 w-24 transform -translate-x-1/2"
              initial={{ width: 0 }}
              animate={testimonialInView ? { width: "6rem" } : { width: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
          </motion.h2>
          
          <div className="max-w-5xl mx-auto grid grid-cols-12 gap-8">
            {/* Testimonial 1: Positioned asymmetrically */}
            <motion.div
              className="col-span-5 col-start-2 bg-white p-6 rounded-lg shadow-lg transform -rotate-3 group"
              initial={{ opacity: 0, x: -50 }}
              animate={testimonialInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ 
                scale: 1.05, 
                rotate: 0,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                y: -10
              }}
            >
              <div className="relative">
                <div className="absolute -top-3 -left-3 text-4xl text-blue-300 opacity-30 group-hover:opacity-70 transition-opacity">
                  "
                </div>
                <motion.div 
                  className="flex justify-center mb-4"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <div className="relative">
                    <div className="w-16 h-16 bg-blue-100 rounded-full overflow-hidden flex items-center justify-center">
                      <span className="text-xl">👨‍💼</span>
                    </div>
                    <motion.div 
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white"
                      whileHover={{ scale: 1.2 }}
                    >
                      <Star className="w-4 h-4" />
                    </motion.div>
                  </div>
                </motion.div>
                <h3 className="text-xl font-semibold text-blue-700 mt-4 text-center">John Doe</h3>
                <p className="mt-2 text-gray-600 relative z-10">"Bizradar has transformed our contract management process."</p>
                <div className="absolute -bottom-3 -right-3 text-4xl text-blue-300 opacity-30 group-hover:opacity-70 transition-opacity">
                  "
                </div>
              </div>
            </motion.div>
            
            {/* Testimonial 2: Positioned asymmetrically */}
            <motion.div
              className="col-span-5 col-start-7 bg-white p-6 rounded-lg shadow-lg transform translate-y-12 rotate-2 group"
              initial={{ opacity: 0, y: "20%" }}
              animate={testimonialInView ? { opacity: 1, y: "12%" } : { opacity: 0, y: "20%" }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ 
                scale: 1.05,
                rotate: 0,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                y: "8%"
              }}
            >
              <div className="relative">
                <div className="absolute -top-3 -left-3 text-4xl text-blue-300 opacity-30 group-hover:opacity-70 transition-opacity">
                  "
                </div>
                <motion.div 
                  className="flex justify-center mb-4"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <div className="relative">
                    <div className="w-16 h-16 bg-purple-100 rounded-full overflow-hidden flex items-center justify-center">
                      <span className="text-xl">👩‍💼</span>
                    </div>
                    <motion.div 
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white"
                      whileHover={{ scale: 1.2 }}
                    >
                      <Star className="w-4 h-4" />
                    </motion.div>
                  </div>
                </motion.div>
                <h3 className="text-xl font-semibold text-blue-700 mt-4 text-center">Jane Smith</h3>
                <p className="mt-2 text-gray-600 relative z-10">"The AI-driven insights are incredibly valuable."</p>
                <div className="absolute -bottom-3 -right-3 text-4xl text-blue-300 opacity-30 group-hover:opacity-70 transition-opacity">
                  "
                </div>
              </div>
            </motion.div>
            
            {/* Testimonial 3: Breaking the pattern */}
            <motion.div
              className="col-span-6 col-start-4 bg-white p-6 rounded-lg shadow-lg transform translate-y-24 group"
              initial={{ opacity: 0, y: "30%" }}
              animate={testimonialInView ? { opacity: 1, y: "24%" } : { opacity: 0, y: "30%" }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                y: "20%"
              }}
            >
              <div className="relative">
                <div className="absolute -top-3 -left-3 text-4xl text-blue-300 opacity-30 group-hover:opacity-70 transition-opacity">
                  "
                </div>
                <motion.div 
                  className="flex justify-center mb-4"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <div className="relative">
                    <div className="w-16 h-16 bg-green-100 rounded-full overflow-hidden flex items-center justify-center">
                      <span className="text-xl">👨‍💻</span>
                    </div>
                    <motion.div 
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white"
                      whileHover={{ scale: 1.2 }}
                    >
                      <Star className="w-4 h-4" />
                    </motion.div>
                  </div>
                </motion.div>
                <h3 className="text-xl font-semibold text-blue-700 mt-4 text-center">Sam Wilson</h3>
                <p className="mt-2 text-gray-600 relative z-10">"Excellent customer support and easy to use."</p>
                <div className="absolute -bottom-3 -right-3 text-4xl text-blue-300 opacity-30 group-hover:opacity-70 transition-opacity">
                  "
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Signup Call-to-Action with enhanced animations */}
        <motion.div
          className="py-16 text-center relative overflow-hidden group"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Decorative background */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-primary-500/20 rounded-xl"
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            style={{ backgroundSize: '200% 200%' }}
          />
          
          <motion.h2 
            className="text-3xl font-semibold text-gray-200 mb-6 relative"
            animate={{ 
              textShadow: ['0 0 8px rgba(59, 130, 246, 0)', '0 0 12px rgba(59, 130, 246, 0.5)', '0 0 8px rgba(59, 130, 246, 0)']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Ready to transform your business?
          </motion.h2>
          
          <motion.div
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 25px rgba(59, 130, 246, 0.5)"
            }}
            transition={{ duration: 0.3 }}
          >
            <Link to="/signup" className="relative overflow-hidden inline-block bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-8 rounded-lg transition-all">
              <motion.span 
                className="relative z-10 flex items-center gap-2"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.3 }}
              >
                Sign up now
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </motion.span>
              
              <motion.div 
                className="absolute inset-0 bg-blue-600"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.4 }}
              />
            </Link>
          </motion.div>
          
          {/* Decorative elements */}
          <motion.div 
            className="absolute -top-5 -left-5 w-16 h-16 border-t-2 border-l-2 border-primary-500/50 rounded-tl-xl"
            animate={{ rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-5 -right-5 w-16 h-16 border-b-2 border-r-2 border-primary-500/50 rounded-br-xl"
            animate={{ rotate: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      
        {/* Integrated Footer */}
        <div className="mt-12 pt-12 border-t border-blue-800/30">
          <div className="container mx-auto">
            {/* Top Footer Section with Links and Social */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Company Info */}
              <div className="flex flex-col items-center md:items-start">
                <Link to="/" className="flex items-center gap-3 group mb-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 1 }}
                  >
                    <Radar className="w-6 h-6 text-primary-500" />
                  </motion.div>
                  <span className="text-xl font-semibold text-white">Bizradar</span>
                </Link>
                <p className="text-gray-400 text-sm text-center md:text-left">
                  AI-driven contract tracking and opportunity discovery for modern businesses.
                </p>
              </div>
              
              {/* Quick Links */}
              <div className="flex flex-col items-center md:items-start">
                <h3 className="text-gray-200 font-medium mb-4">Quick Links</h3>
                <div className="grid grid-cols-2 gap-3">
                  {["Home", "About", "Pricing", "Blog", "Features", "FAQ"].map((item, i) => (
                    <motion.div
                      key={item}
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Link to={`/${item.toLowerCase()}`} className="text-gray-400 hover:text-primary-400 text-sm">
                        {item}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Connect */}
              <div className="flex flex-col items-center md:items-start">
                <h3 className="text-gray-200 font-medium mb-4">Connect With Us</h3>
                <div className="flex gap-4 mb-4">
                  {[
                    { Icon: FaFacebook, url: "https://facebook.com", color: "#4267B2" },
                    { Icon: FaLinkedin, url: "https://linkedin.com", color: "#0077B5" }
                  ].map((social, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ 
                        y: -3,
                        scale: 1.2
                      }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <a 
                        href={social.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-900/30 hover:bg-blue-800/50"
                      >
                        <social.Icon className="w-5 h-5 text-primary-400" />
                      </a>
                    </motion.div>
                  ))}
                </div>
                <p className="text-gray-400 text-sm text-center md:text-left">
                  Stay updated with our latest features
                </p>
              </div>
            </div>
            
            {/* Bottom Footer Section with Copyright and Legal */}
            <div className="flex flex-col md:flex-row justify-between items-center border-t border-blue-800/30 pt-4 pb-8">
              <span className="text-gray-400 text-sm mb-3 md:mb-0">&copy; {new Date().getFullYear()} Bizradar. All rights reserved.</span>
              <div className="flex gap-6">
                {["Privacy Policy", "Terms of Service", "Contact Us"].map((item, i) => (
                  <motion.div
                    key={item}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Link to={`/${item.toLowerCase().replace(/\s+/g, '-')}`} className="relative group text-gray-400 hover:text-primary-400 text-sm">
                      <span>{item}</span>
                      <motion.span 
                        className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500"
                        whileHover={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add the CSS for hiding scrollbar but allowing scroll functionality */}
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Layout;