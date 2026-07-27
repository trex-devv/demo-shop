import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { 
  Package, 
  List, 
  Tags, 
  Layers, 
  ShoppingBag,
  LayoutDashboard,
  PlusCircle,
  X,
  CreditCard,
  UsersRound,
  Ticket,
  Award,
  Database,
  Shield
} from "lucide-react";
import siteConfig from "../config/site.config";
import Subscriptions from "../pages/Subscriptions";
import NotificationButton from "./Button/NotificationButton";

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileOpen]);

  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/add", icon: PlusCircle, label: "Add Product" },
    { path: "/list", icon: List, label: "Products" },
    { path: "/subscriptions", icon: Award, label: "Subscriptions" },
    { path: "/categories", icon: Tags, label: "Categories" },
    { path: "/subcategories", icon: Layers, label: "Subcategories" },
    {path: '/fields', icon: Database , label: 'Field Management'},
    { path: "/payments", icon: CreditCard, label: "Payments" },
    { path: "/orders", icon: ShoppingBag, label: "Orders" },
    { path: "/users", icon: UsersRound, label: "Users" },
    { path: "/tickets", icon: Ticket, label: "Tickets" },
    { path: "/dev", icon: Shield, label: "Dev Dashboard" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-white border-r border-gray-200 flex flex-col transition-all duration-300
        ${isMobile 
          ? `fixed top-0 left-0 z-50 h-full w-64 transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `fixed top-16 left-0 h-[calc(100vh-4rem)] w-64`
        }
      `}>
        {/* Mobile Header with Logo - Only show on mobile when open */}
        {isMobile && mobileOpen && (
          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {siteConfig.siteName?.charAt(0) || 'G'}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {siteConfig.siteName}
              </span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`
                }
              >
                <Icon size={18} className="flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer - Admin Info */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-gray-600">A</span>
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
              <p className="text-xs text-gray-400 truncate">{siteConfig.siteName}</p>
            </div>
            
            {/* Notification Button */}
            <div className="flex-shrink-0">
              <NotificationButton />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;