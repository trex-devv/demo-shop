import React, { useState } from "react";
import siteConfig from "../../config/site.config";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

const Contact = () => {
  const { contact, siteName, social } = siteConfig;
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    message: ""
  });

  // Map social platform to display names
  const getSocialLabel = (platform) => {
    const labels = {
      facebook: "Facebook",
      instagram: "Instagram",
      twitter: "Twitter",
      youtube: "YouTube",
      discord: "Discord",
      tiktok: "TikTok",
      twitch: "Twitch",
      website: "Website"
    };
    return labels[platform] || platform;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const { name, subject, message } = formData;
    const email = contact.email;
    
    // Build mailto URL with prefilled details
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Name: ${name}\n\nMessage:\n${message}`
    )}`;
    
    // Open default email client
    window.location.href = mailtoLink;
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
            Have questions about your order? Need help with a top-up? We're here to help.
          </p>
          <div className="w-20 h-1 bg-gray-900 mt-6"></div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Info - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Cards */}
            <div className="space-y-4">
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-gray-700" />
                  <h3 className="font-medium text-gray-900">Email</h3>
                </div>
                <a 
                  href={`mailto:${contact.email}`}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {contact.email}
                </a>
              </div>

              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="w-5 h-5 text-gray-700" />
                  <h3 className="font-medium text-gray-900">Phone</h3>
                </div>
                <a 
                  href={`tel:${contact.phone}`}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {contact.phone}
                </a>
              </div>

              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-gray-700" />
                  <h3 className="font-medium text-gray-900">Location</h3>
                </div>
                <p className="text-gray-600">
                  {contact.address}
                </p>
              </div>
            </div>

            {/* Social Links */}
            {social && social.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Connect With Us
                </h2>
                <div className="flex flex-wrap gap-3">
                  {social.map((item, index) => (
                    <a
                      key={index}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 text-sm font-medium text-gray-700"
                      aria-label={item.platform}
                    >
                      {getSocialLabel(item.platform)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Form - Right Column */}
          <div className="lg:col-span-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Send Us a Message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors text-gray-900"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors text-gray-900"
                    placeholder="Order inquiry"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors text-gray-900 resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;