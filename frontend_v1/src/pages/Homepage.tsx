import { Link } from "react-router-dom";
import { Radar, Search, User } from "lucide-react";
import { motion } from "framer-motion";
import { FaFacebook, FaLinkedin } from "react-icons/fa";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-blue-950">
      {/* Header - Fixed */}
      <header className="bg-blue-950 text-gray-300 p-4 fixed top-0 w-full z-10">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              className="relative"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 1 }}
            >
              <Radar className="w-8 h-8 text-primary-500" />
              <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-ping" />
            </motion.div>
            <span className="text-2xl font-semibold text-white">Bizradar</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link to="/login" className="hover:text-primary-400 transition-colors duration-300">Signup/Login</Link>
            <Link to="/contracts" className="hover:text-primary-400 transition-colors duration-300">Contracts</Link>
            <div className="relative group">
              <User className="text-white cursor-pointer" />
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</Link>
                <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100">Settings</Link>
                <Link to="/logout" className="block px-4 py-2 hover:bg-gray-100">Logout</Link>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto mt-20 p-6 bg-blue-950">
        {children}

        {/* Features Section */}
        <section id="features" className="py-24 text-center">
          <motion.div
            className="max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold text-blue-700">Why Choose Bizradar?</h1>
            <p className="mt-4 text-gray-200 max-w-3xl mx-auto">
              AI-driven contract tracking dashboard that automates discovery and analysis of cybersecurity, AI, and data engineering projects.
            </p>

            {/* Image */}
            <motion.div
              className="mt-10 flex justify-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src="/features-image.jpg"
                alt="Bizradar Features"
                className="w-full max-w-3xl rounded-lg shadow-xl"
              />
            </motion.div>

            {/* Feature List */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Automated Workflows", desc: "Save time with AI-powered deal automation.", icon: "⚙️" },
                { title: "Seamless Search", desc: "Government procurement platforms and freelance marketplaces.", icon: "🔍" },
                { title: "Secure & Reliable", desc: "Your data is protected with top security standards.", icon: "🔒" },
                { title: "Real-time Updates", desc: "Stay informed with instant notifications.", icon: "📡" },
                { title: "Customizable Dashboards", desc: "Tailor your dashboard to your needs.", icon: "📊" },
                { title: "24/7 Support", desc: "We're here to help, anytime.", icon: "🕒" },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="p-6 bg-white shadow-lg rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-2xl font-semibold text-blue-700">{feature.icon} {feature.title}</h3>
                  <p className="mt-2 text-gray-600">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-24 text-center bg-gray-100 mt-16">
              <h2 className="text-3xl font-bold text-blue-700">What Our Users Say</h2>
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { name: "John Doe", feedback: "Bizradar has transformed our contract management process.", avatar: "/avatar1.jpg" },
                  { name: "Jane Smith", feedback: "The AI-driven insights are incredibly valuable.", avatar: "/avatar2.jpg" },
                  { name: "Sam Wilson", feedback: "Excellent customer support and easy to use.", avatar: "/avatar3.jpg" },
                ].map((testimonial, index) => (
                  <motion.div
                    key={index}
                    className="p-6 bg-white shadow-lg rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-16 h-16 rounded-full mx-auto" />
                    <h3 className="text-xl font-semibold text-blue-700 mt-4">{testimonial.name}</h3>
                    <p className="mt-2 text-gray-600">{testimonial.feedback}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Signup Call-to-Action */}
            <motion.div
              className="py-16"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-semibold text-gray-200">
                Get Started <Link to="/signup" className="text-blue-500 hover:underline">Sign up</Link>
              </h2>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer - Fixed */}
      <footer className="bg-blue-950 text-gray-200 p-4 text-center fixed bottom-0 w-full z-10 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <span>&copy; {new Date().getFullYear()} Bizradar. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary-400 transition-colors duration-300">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary-400 transition-colors duration-300">Terms of Service</Link>
            <Link to="/contact" className="hover:text-primary-400 transition-colors duration-300">Contact Us</Link>
          </div>
          <div className="flex gap-4 justify-center mt-2">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors duration-300">
            <FaFacebook className="w-6 h-6" />
          </a>

          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors duration-300">
            <FaLinkedin className="w-6 h-6" />
          </a>
        </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
