import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../../contexts/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import {
  User,
  Package,
  Ticket,
  LogOut,
  Edit2,
  Loader2,
  Save,
  X,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

const Profile = () => {
  const { backendUrl, token, user, setUser, currency } =
    useContext(ShopContext);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");

  // Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      const profileRes = await axios.get(`${backendUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.data.success) {
        setUser(profileRes.data.user);
        setFormData({
          name: profileRes.data.user.name || "",
          phone: profileRes.data.user.phone || "",
        });
      }

      const ordersRes = await axios.get(`${backendUrl}/api/order/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.orders || []);
      }

      const ticketsRes = await axios.get(
        `${backendUrl}/api/ticket/my-tickets`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (ticketsRes.data.success) {
        setTickets(ticketsRes.data.tickets || []);
      }
    } catch (error) {
      toast.error("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({
        name: user?.name || "",
        phone: user?.phone || "",
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.put(
        `${backendUrl}/api/auth/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        setUser({ ...user, ...formData });
        toast.success("Profile updated");
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };

  const closeTicketModal = () => {
    setSelectedTicket(null);
    setIsTicketModalOpen(false);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      Delivered: {
        icon: CheckCircle,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
      },
      "Payment Verified": {
        icon: CheckCircle,
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
      },
      "Pending Verification": {
        icon: Clock,
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
      },
      "Payment Rejected": {
        icon: XCircle,
        color: "text-rose-700",
        bg: "bg-rose-50",
        border: "border-rose-200",
      },
      Cancelled: {
        icon: XCircle,
        color: "text-gray-600",
        bg: "bg-gray-100",
        border: "border-gray-200",
      },
      Open: {
        icon: AlertCircle,
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
      },
      Hold: {
        icon: Clock,
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
      },
      Resolved: {
        icon: CheckCircle,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
      },
      Rejected: {
        icon: XCircle,
        color: "text-rose-700",
        bg: "bg-rose-50",
        border: "border-rose-200",
      },
    };
    return (
      configs[status] || {
        icon: AlertCircle,
        color: "text-gray-700",
        bg: "bg-gray-100",
        border: "border-gray-200",
      }
    );
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "orders", label: "Orders", icon: Package },
    { id: "tickets", label: "Tickets", icon: Ticket },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin text-gray-900" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              My Account
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your profile, orders, and support tickets
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border border-gray-200 rounded-t-xl px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count =
                tab.id === "orders"
                  ? orders.length
                  : tab.id === "tickets"
                    ? tickets.length
                    : 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Contents */}
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-4 sm:p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Personal Information
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Update your account details
                  </p>
                </div>
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleEditToggle}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full Name
                    </label>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <p className="text-base font-medium text-gray-900">
                      {user?.name || "Not set"}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Address
                    </label>
                  </div>
                  <p className="text-base font-medium text-gray-900">
                    {user?.email || "Not set"}
                  </p>
                </div>

                {/* Phone */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </label>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-base font-medium text-gray-900">
                      {user?.phone || "Not set"}
                    </p>
                  )}
                </div>

                {/* Member Since */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member Since
                    </label>
                  </div>
                  <p className="text-base font-medium text-gray-900">
                    {formatDate(user?.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Order History
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Track your top-up purchases
                  </p>
                </div>
                {orders.length > 0 && (
                  <Link
                    to="/orders"
                    className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No orders yet</p>
                  <Link
                    to="/collection"
                    className="text-sm text-gray-900 hover:underline mt-2 inline-block"
                  >
                    Start Shopping →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => {
                    const statusConfig = getStatusBadge(order.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div
                        key={order._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200"
                      >
                        <div className="space-y-1.5 mb-2 sm:mb-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              #{order.orderNumber || order._id.slice(-8)}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {order.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{formatDate(order.createdAt)}</span>
                            <span className="w-px h-3 bg-gray-300"></span>
                            <span>{order.items?.length || 0} item(s)</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-base font-bold text-gray-900">
                            {currency}
                            {order.amount?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === "tickets" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Support Tickets
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    View your support inquiries
                  </p>
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No support tickets</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.slice(0, 5).map((ticket) => {
                    const statusConfig = getStatusBadge(ticket.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <button
                        key={ticket._id}
                        onClick={() => openTicketModal(ticket)}
                        className="w-full text-left p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {ticket.type}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {ticket.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Order #{ticket.orderNumber}</span>
                            <span className="w-px h-3 bg-gray-300"></span>
                            <span>{formatDate(ticket.createdAt)}</span>
                          </div>
                          {ticket.description && (
                            <p className="text-xs text-gray-600 line-clamp-1">
                              {ticket.description}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {isTicketModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MessageCircle className="w-4 h-4 text-gray-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ticket Details
                </h3>
              </div>
              <button
                onClick={closeTicketModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Ticket Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    #{selectedTicket._id.slice(-8)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Order Number
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    #{selectedTicket.orderNumber}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full mt-0.5 ${getStatusBadge(selectedTicket.status).bg} ${getStatusBadge(selectedTicket.status).color} border ${getStatusBadge(selectedTicket.status).border}`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Priority
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full mt-0.5 ${
                      selectedTicket.priority === "Urgent"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : selectedTicket.priority === "High"
                          ? "bg-orange-50 text-orange-700 border border-orange-200"
                          : selectedTicket.priority === "Medium"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                  >
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>

              {/* Issue Type */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Issue Type
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedTicket.type}
                </p>
              </div>

              {/* Description */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Description
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedTicket.description || "No description provided"}
                </p>
              </div>

              {/* Admin Note */}
              {selectedTicket.adminNote && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-600 uppercase tracking-wider mb-1">
                    Support Note
                  </p>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {selectedTicket.adminNote}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Created
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatDateTime(selectedTicket.createdAt)}
                  </p>
                </div>
                {selectedTicket.resolvedAt && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Resolved
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {formatDateTime(selectedTicket.resolvedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <button
                onClick={closeTicketModal}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Profile;
