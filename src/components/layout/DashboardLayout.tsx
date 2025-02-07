
import { Link } from "react-router-dom";
import { Radar } from "lucide-react";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Radar className="w-8 h-8 text-primary-600 group-hover:animate-spin transition-all duration-500" />
                <div className="absolute inset-0 bg-primary-600/20 rounded-full animate-ping group-hover:animate-none" />
              </div>
              <span className="text-2xl text-primary-600">
                Biz radar
              </span>
            </Link>
            <nav className="space-x-6">
              <Link to="/" className="text-gray-600 hover:text-primary-600">
                Contracts
              </Link>
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600">
                Dashboard
              </Link>
              <Link to="/admin" className="text-gray-600 hover:text-primary-600">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
