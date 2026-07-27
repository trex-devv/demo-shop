import React from "react";
import { LogOut, User, Menu } from "lucide-react";
import siteConfig from "../config/site.config";
import { useNavigate } from "react-router-dom";

const Navbar = ({ setToken, onMenuToggle }) => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 right-0 left-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-gray-200 h-16">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Menu Toggle Button - Visible on all screen sizes */}
        <button
          onClick={onMenuToggle}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} className="text-gray-600" />
        </button>

        {/* Website Name - Always visible */}
        <span className="text-lg font-semibold text-gray-900 tracking-tight cursor-pointer"
          onClick={()=>{
            navigate("/")
          }} 
        >
          {siteConfig.siteName}
        </span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-medium hidden sm:inline">
          Admin
        </span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">        
        <button
          onClick={() => setToken("")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;