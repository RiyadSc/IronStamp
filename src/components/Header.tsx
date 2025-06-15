
import { Button } from "@/components/ui/button";
import { Shield, Menu } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">CertKeeper</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </a>
            <a href="#demo" className="text-slate-600 hover:text-slate-900 transition-colors">
              Demo
            </a>
            <a href="#faq" className="text-slate-600 hover:text-slate-900 transition-colors">
              FAQ
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
              Sign In
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
              Get Started Free
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-slate-600 hover:text-slate-900">
                Features
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900">
                Pricing
              </a>
              <a href="#demo" className="text-slate-600 hover:text-slate-900">
                Demo
              </a>
              <a href="#faq" className="text-slate-600 hover:text-slate-900">
                FAQ
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="ghost" className="justify-start">
                  Sign In
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started Free
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
