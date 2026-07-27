import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import siteConfig from "../config/site.config";
import { Mail, Phone, MapPin, Wallet, Landmark } from "lucide-react";
import logo from "/logo.png";

// Import payment logos
import esewaLogo from "../assets/payments/esewa.png";
import khaltiLogo from "../assets/payments/khalti.png";
import fonepayLogo from "../assets/payments/fonepay.png";

const Footer = () => {
  const { siteName, contact, footer, tagline, socials } = siteConfig;
  const [paymentMethods, setPaymentMethods] = useState([]);

  const socialLinks = [
    { key: "facebook", url: socials?.facebook, label: "Facebook" },
    { key: "instagram", url: socials?.instagram, label: "Instagram" },
    { key: "twitter", url: socials?.twitter, label: "Twitter" },
    { key: "youtube", url: socials?.youtube, label: "YouTube" },
  ].filter((s) => s.url);

  const companyLinks = [
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "Terms & Privacy", path: "/terms&privacy" },
  ];

  // Payment method icon/logo mapping
  const getPaymentDisplay = (method) => {
    const name = method.name.toLowerCase();
    
    if (name.includes("esewa")) {
      return { type: "image", src: esewaLogo, alt: "eSewa" };
    }
    if (name.includes("khalti")) {
      return { type: "image", src: khaltiLogo, alt: "Khalti" };
    }
    if (name.includes("fonepay")) {
      return { type: "image", src: fonepayLogo, alt: "FonePay" };
    }
    if (name.includes("cash on delivery") || name.includes("cod")) {
      return { type: "icon", icon: Wallet, label: "Cash on Delivery" };
    }
    if (name.includes("mobile banking")) {
      return { type: "icon", icon: Landmark, label: "Mobile Banking" };
    }
    return { type: "text", label: method.displayName || method.name };
  };

  // Fetch payment methods from backend
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const response = await axios.get(`${backendUrl}/api/payment/active`);
        if (response.data.success) {
          setPaymentMethods(response.data.methods || []);
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
      }
    };
    fetchPaymentMethods();
  }, []);

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-3">
            <Link to="/" className="inline-block">
              <img 
                src={logo} 
                alt={siteName} 
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-lg font-semibold text-gray-900">{siteName}</p>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              {tagline}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-4 pt-2">
                {socialLinks.map(({ key, url, label }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              We Accept
            </h4>
            {paymentMethods.length === 0 ? (
              <p className="text-sm text-gray-400">Loading payment methods...</p>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                {paymentMethods.map((method) => {
                  const display = getPaymentDisplay(method);
                  
                  if (display.type === "image") {
                    return (
                      <div key={method._id} className="flex items-center">
                        <img 
                          src={display.src} 
                          alt={display.alt} 
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                    );
                  }
                  
                  if (display.type === "icon") {
                    const Icon = display.icon;
                    return (
                      <div
                        key={method._id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md"
                      >
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="text-xs text-gray-700">{display.label}</span>
                      </div>
                    );
                  }
                  
                  return (
                    <span
                      key={method._id}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700"
                    >
                      {display.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-500">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <a href={`tel:${contact.phone}`} className="hover:text-gray-900 transition-colors">
                  {contact.phone}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-500">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <a href={`mailto:${contact.email}`} className="hover:text-gray-900 transition-colors">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>{contact.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-400">
            {footer?.copyrightText || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;