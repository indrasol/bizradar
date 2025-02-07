
import { Link } from "react-router-dom";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              WorkForge Radar
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
