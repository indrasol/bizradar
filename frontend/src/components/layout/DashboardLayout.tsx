import { Link } from "react-router-dom";
import { Radar } from "lucide-react";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-purple-200">
      <header className="bg-blue-950 border-b fixed top-0 w-full z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Radar className="w-8 h-8 text-primary-600 group-hover:animate-spin transition-all duration-500" />
                <div className="absolute inset-0 bg-primary-600/20 rounded-full animate-ping group-hover:animate-none" />
              </div>
              <span className="text-2xl text-primary-600">
                Bizradar
              </span>
            </Link>
            <nav className="space-x-6">
              <Link to="/" className="text-gray-300 hover:text-primary-600">
                Contracts
              </Link>
              <Link to="/dashboard" className="text-gray-300 hover:text-primary-600">
                Dashboard
              </Link>
              <Link to="/rfp-writer" className="text-gray-300 hover:text-primary-600">
                RFP Writer
              </Link>
              <Link to="/admin" className="text-gray-300 hover:text-primary-600">
                Admin
              </Link>
              <Link to="/Login" className="text-gray-300 hover:text-primary-600">
                Signup/Login
              </Link>
            </nav>
          </div>
        </div>
      </header>
      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto mt-16 mb-0 p-4 ">
        {children}
      </main>
      {/* <footer className="bg-gray-500 border-t">
        <div className="{bg-gray-900 text-blue p-4 text-center fixed bottom-0 w-full z-10 text-gray-600">
          &copy; {new Date().getFullYear()} Bizradar. All rights reserved.
        </div>
      </footer> */}
    </div>
  );
};
