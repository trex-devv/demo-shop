import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShopContext } from "../contexts/ShopContext";
import siteConfig from "../config/site.config";
import { ShoppingCart, User, Menu, X, ChevronDown, LogOut, Package, Settings, UserRound, LogIn } from "lucide-react";
import logo from "/logo.png";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  
  // Get values from ShopContext
  const { cartCount, token, setToken, cartItems, setCartItems, user } = useContext(ShopContext);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setCartItems([]);
    navigate("/login");
    setProfileOpen(false);
  };

  const { menuItems } = siteConfig.navbar;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [window.location.pathname]);

  // Get user initial for avatar
  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
          {logo ? (
            <img src={logo} alt={siteConfig.siteName} className="h-10 w-auto" />
          ) : (
            <span className="text-xl font-bold text-gray-900">{siteConfig.siteName}</span>
          )}
          <span className="text-xl font-bold text-gray-900 hidden sm:block">
            {siteConfig.siteName}
          </span>
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `text-sm font-medium text-gray-600 hover:text-gray-900 transition ${
                    isActive ? "text-gray-900" : ""
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {/* Profile / Login Button */}
          <div className="relative" ref={profileRef}>
            {token ? (
              // Logged in - Show profile button with avatar
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition group"
              >
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                  {getUserInitial()}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>
            ) : (
              // Logged out - Show Login button
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-lg text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Login
              </button>
            )}

            {/* Profile Dropdown - Only when logged in */}
            {token && profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name || "User"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                </div>
                
                {/* Menu Items */}
                <button
                  onClick={() => {
                    navigate("/profile");
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <UserRound className="w-4 h-4 text-gray-400" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    navigate("/orders");
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <Package className="w-4 h-4 text-gray-400" />
                  My Orders
                </button>
                
                {/* Logout */}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Cart */}
          <Link to="/cart" className="relative p-2 ml-4 rounded-lg hover:bg-gray-100 transition">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gray-900 text-white text-xs flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-white z-40 md:hidden overflow-y-auto">
          <div className="p-4 space-y-2">
            {/* Mobile User Info */}
            {token && user && (
              <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                  {getUserInitial()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            )}

            {/* Menu Items */}
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
              >
                {item.label}
              </Link>
            ))}
            
            {token ? (
              <>
                <hr className="my-2 border-gray-100" />
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="flex items-center gap-3 w-full text-left py-3 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
                >
                  <UserRound className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/orders");
                  }}
                  className="flex items-center gap-3 w-full text-left py-3 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
                >
                  <Package className="w-4 h-4" />
                  My Orders
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 w-full text-left py-3 px-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <hr className="my-2 border-gray-100" />
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="flex items-center gap-3 w-full text-left py-3 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;