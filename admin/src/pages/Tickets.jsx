import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import {
  Ticket, Search, X, Loader2, Eye,
  Mail, Clock, ChevronLeft, ChevronRight,
  ChevronDown, User, CheckCircle, XCircle,
  MessageSquare, History, Layers,
  Inbox, Circle, PauseCircle, ShoppingBag,
  CreditCard, Package, Calendar, Phone, ImageIcon,
  RefreshCw, Filter
} from 'lucide-react';
import { timeAgo } from '../utils/dateUtils';

const PRIORITY_STYLES = {
  Urgent: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'Urgent' },
  High: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', label: 'High' },
  Medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Medium' },
  Low: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400', label: 'Low' },
};

const STATUS_STYLES = {
  Open: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  Hold: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  Resolved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  Rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase() || '?';
};

const Tickets = ({ token }) => {
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({});
  const [orderTickets, setOrderTickets] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [showScreenshotPreview, setShowScreenshotPreview] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState({});

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${backendUrl}/api/ticket/admin/all?limit=1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setAllTickets(response.data.tickets || []);
      }
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/ticket/admin/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {}
  }, [backendUrl, token]);

  const fetchOrderDetails = useCallback(async (orderId) => {
    try {
      setLoadingOrder(true);
      const id = typeof orderId === 'string' ? orderId : orderId?.toString();
      if (!id) return null;

      const response = await axios.get(
        `${backendUrl}/api/order/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setOrderDetails(response.data.order);
        return response.data.order;
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoadingOrder(false);
    }
  }, [backendUrl, token]);

  const updateTicketStatus = useCallback(async (ticketId, status, note) => {
    if (!note?.trim()) {
      toast.warning('Please add a note before updating status');
      return;
    }

    setUpdating(true);
    try {
      const response = await axios.put(
        `${backendUrl}/api/ticket/admin/${ticketId}/status`,
        { status, adminNote: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Ticket ${status.toLowerCase()}`);
        
        // Close modal and reset state
        setShowModal(false);
        setSelectedTicket(null);
        setOrderTickets([]);
        setOrderDetails(null);
        setExpandedTickets({});
        
        // Refresh data
        await fetchTickets();
        await fetchStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }, [backendUrl, token, fetchTickets, fetchStats]);

  const openOrderDetail = useCallback(async (group) => {
    // group contains ALL tickets for this order
    const allTicketsForOrder = group.tickets;
    
    // Sort tickets: Open first, then Hold, then Resolved, then Rejected
    const statusOrder = { 'Open': 0, 'Hold': 1, 'Resolved': 2, 'Rejected': 3 };
    const sortedTickets = [...allTicketsForOrder].sort((a, b) => {
      return (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
    });
    
    // Set the first ticket as selected (highest priority open ticket)
    setSelectedTicket(sortedTickets[0]);
    
    // Set the rest as orderTickets
    setOrderTickets(sortedTickets.slice(1));
    
    // Fetch full order details
    const orderId = sortedTickets[0]?.order?._id || sortedTickets[0]?.order;
    if (orderId) {
      await fetchOrderDetails(orderId);
    }
    
    // Expand all tickets by default
    const expanded = {};
    sortedTickets.forEach(t => {
      expanded[t._id] = true;
    });
    setExpandedTickets(expanded);
    
    setShowModal(true);
  }, [fetchOrderDetails]);

  const toggleTicketExpand = useCallback((ticketId) => {
    setExpandedTickets(prev => ({ ...prev, [ticketId]: !prev[ticketId] }));
  }, []);

  // Filter only Open and Hold tickets for main view
  const filteredTickets = useMemo(() => {
    let result = [...allTickets];
    result = result.filter(t => t.status === 'Open' || t.status === 'Hold');

    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    if (debouncedSearchTerm.trim()) {
      const search = debouncedSearchTerm.toLowerCase().trim();
      result = result.filter(t =>
        t.orderNumber?.toLowerCase().includes(search) ||
        t.type?.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search) ||
        t.user?.name?.toLowerCase().includes(search) ||
        t.user?.email?.toLowerCase().includes(search)
      );
    }

    if (filterPriority !== 'all') {
      result = result.filter(t => t.priority === filterPriority);
    }

    const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    const statusOrder = { 'Open': 0, 'Hold': 1 };
    
    result.sort((a, b) => {
      const statusA = statusOrder[a.status] ?? 2;
      const statusB = statusOrder[b.status] ?? 2;
      if (statusA !== statusB) return statusA - statusB;
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    });

    return result;
  }, [allTickets, debouncedSearchTerm, filterStatus, filterPriority]);

  // Group by order and include ALL tickets for each order
  const groupedOrders = useMemo(() => {
    const groups = {};
    
    const allTicketsByOrder = {};
    allTickets.forEach(ticket => {
      const key = ticket.order?._id || ticket.order;
      if (!allTicketsByOrder[key]) {
        allTicketsByOrder[key] = [];
      }
      allTicketsByOrder[key].push(ticket);
    });

    filteredTickets.forEach(ticket => {
      const key = ticket.order?._id || ticket.order;
      if (!groups[key]) {
        const allOrderTickets = allTicketsByOrder[key] || [];
        groups[key] = {
          orderId: key,
          orderNumber: ticket.orderNumber,
          tickets: allOrderTickets,
          user: ticket.user || ticket.order?.user || {},
          highestPriority: null,
          hasOpen: false,
        };
      }
    });

    const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    Object.values(groups).forEach(group => {
      const openTickets = group.tickets.filter(t => t.status === 'Open');
      if (openTickets.length > 0) {
        group.highestPriority = openTickets.reduce((a, b) => 
          (priorityOrder[a.priority] ?? 2) < (priorityOrder[b.priority] ?? 2) ? a : b
        ).priority;
      } else {
        group.highestPriority = 'Low';
      }
    });

    return Object.values(groups);
  }, [filteredTickets, allTickets]);

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return groupedOrders.slice(start, end);
  }, [groupedOrders, currentPage, pageSize]);

  const totalPages = Math.ceil(groupedOrders.length / pageSize);

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setCurrentPage(1);
  }, []);

  const getStatusBadge = useCallback((status) => STATUS_STYLES[status] || STATUS_STYLES['Open'], []);
  const getPriorityBadge = useCallback((priority) => PRIORITY_STYLES[priority] || PRIORITY_STYLES['Medium'], []);

  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterPriority !== 'all';

  const ScreenshotPreviewModal = useCallback(() => {
    if (!showScreenshotPreview) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4" onClick={() => setShowScreenshotPreview(false)}>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        <button
          onClick={() => setShowScreenshotPreview(false)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X size={24} className="sm:hidden" />
          <X size={28} className="hidden sm:block" />
        </button>
        <div className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
          <img src={screenshotUrl} alt="Payment Screenshot" className="w-full h-full max-h-[85vh] object-contain rounded-2xl" />
        </div>
      </div>
    );
  }, [showScreenshotPreview, screenshotUrl]);

  const OrderModal = useCallback(() => {
    if (!showModal || !selectedTicket) return null;

    const [localNotes, setLocalNotes] = useState({});
    
    useEffect(() => {
      const notes = {};
      [selectedTicket, ...orderTickets].forEach(t => {
        if (t) notes[t._id] = '';
      });
      setLocalNotes(notes);
    }, [selectedTicket, orderTickets]);

    const ticket = selectedTicket;
    const order = orderDetails || ticket.order || {};
    const tickets = [ticket, ...orderTickets];
    const user = order.userId || order.user || ticket.user || {};
    const hasScreenshot = order.paymentProof?.screenshotUrl && order.paymentProof?.screenshotUrl !== 'cod-payment';

    const handleLocalNoteChange = (ticketId, value) => {
      setLocalNotes(prev => ({ ...prev, [ticketId]: value }));
    };

    const handleStatusUpdate = async (ticketId, status) => {
      const note = localNotes[ticketId] || '';
      await updateTicketStatus(ticketId, status, note);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 z-10 rounded-t-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="font-mono text-indigo-600">#{ticket.orderNumber}</span>
                  <span className="text-xs sm:text-sm font-normal text-gray-400">· Order Details</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} · {order.items?.length || 0} items
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {loadingOrder ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User size={13} /> Customer
                    </p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{user.name || 'Unknown'}</p>
                    <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Mail size={12} /> {user.email || 'No email'}
                    </p>
                    {user.phone && (
                      <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone size={12} /> {user.phone}
                      </p>
                    )}
                    {hasScreenshot && (
                      <button
                        onClick={() => {
                          setScreenshotUrl(order.paymentProof.screenshotUrl);
                          setShowScreenshotPreview(true);
                        }}
                        className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <ImageIcon size={13} />
                        <span className="hidden xs:inline">View Payment Screenshot</span>
                        <span className="xs:inline hidden">Receipt</span>
                      </button>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShoppingBag size={13} /> Order Summary
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">Total</span>
                        <span className="font-semibold text-gray-900">{currency}{order.amount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">Payment</span>
                        <span className="text-gray-700">{order.paymentMethod || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className="text-gray-700">{order.status || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">Date</span>
                        <span className="text-gray-700">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Package size={13} /> Order Items
                  </p>
                  {order.items && order.items.length > 0 ? (
                    <>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {order.items.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs sm:text-sm bg-white rounded-lg p-2 border border-gray-100">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-900 truncate">{item.name}</span>
                              {item.variant && <span className="text-xs text-gray-400 ml-1">{item.variant}</span>}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-gray-400 text-xs">×{item.quantity}</span>
                              <span className="font-medium text-gray-900">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 5 && (
                          <p className="text-xs text-gray-400 text-center">+{order.items.length - 5} more items</p>
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-600">Total</span>
                        <span className="text-xs sm:text-sm font-bold text-gray-900">{currency}{order.amount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">No items found</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <History size={16} className="text-gray-500" />
                    <h4 className="text-sm font-semibold text-gray-900">All Tickets ({tickets.length})</h4>
                  </div>

                  <div className="space-y-3">
                    {tickets.map((t, index) => {
                      const isExpanded = expandedTickets[t._id] ?? true;
                      const statusStyle = getStatusBadge(t.status);
                      const priorityStyle = getPriorityBadge(t.priority);
                      const isTicketOpen = t.status === 'Open' || t.status === 'Hold';
                      const note = localNotes[t._id] || '';
                      const isCurrent = index === 0;

                      return (
                        <div key={t._id} className={`bg-white border rounded-xl overflow-hidden ${
                          isCurrent ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200'
                        }`}>
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition"
                            onClick={() => toggleTicketExpand(t._id)}
                          >
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span className="text-xs sm:text-sm font-medium text-gray-400 font-mono">#{index + 1}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-medium text-indigo-600 bg-indigo-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                              {!isCurrent && (
                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                                  Previous
                                </span>
                              )}
                              <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">{t.type}</span>
                              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium ${priorityStyle.bg} ${priorityStyle.text} border ${priorityStyle.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                                <span className="hidden xs:inline">{priorityStyle.label}</span>
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                                {t.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-[10px] sm:text-xs text-gray-400 hidden xs:inline">{timeAgo(t.createdAt)}</span>
                              <ChevronDown
                                size={15}
                                className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-gray-100">
                              <div className="mb-2 sm:mb-3">
                                <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                  <MessageSquare size={11} />
                                  User Message
                                </p>
                                <p className="text-xs sm:text-sm text-gray-700 bg-blue-50 rounded-lg p-2 border border-blue-100 break-words">
                                  {t.description}
                                </p>
                              </div>

                              {t.adminNote && (
                                <div className="mb-2 sm:mb-3">
                                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                    <CheckCircle size={11} className="text-green-500" />
                                    Admin Response
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-700 bg-green-50 rounded-lg p-2 border border-green-100 break-words">
                                    {t.adminNote}
                                  </p>
                                </div>
                              )}

                              {isTicketOpen && (
                                <div className="space-y-2">
                                  <textarea
                                    rows="2"
                                    value={note}
                                    onChange={(e) => handleLocalNoteChange(t._id, e.target.value)}
                                    placeholder="Add a note before updating this ticket..."
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
                                  />
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    <button
                                      onClick={() => handleStatusUpdate(t._id, 'Hold')}
                                      disabled={updating || !note.trim()}
                                      className="px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed border border-purple-200"
                                    >
                                      <PauseCircle size={13} className="inline mr-1" />
                                      Hold
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(t._id, 'Resolved')}
                                      disabled={updating || !note.trim()}
                                      className="px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed border border-green-200"
                                    >
                                      <CheckCircle size={13} className="inline mr-1" />
                                      Resolve
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(t._id, 'Rejected')}
                                      disabled={updating || !note.trim()}
                                      className="px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed border border-red-200"
                                    >
                                      <XCircle size={13} className="inline mr-1" />
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              )}

                              {!isTicketOpen && (
                                <div className="text-xs sm:text-sm text-gray-500">
                                  {t.status === 'Resolved' && <span className="text-green-600">✓ Resolved</span>}
                                  {t.status === 'Rejected' && <span className="text-red-600">✕ Rejected</span>}
                                  <span className="text-[10px] sm:text-xs text-gray-400 ml-2">
                                    {t.resolvedAt ? formatDate(t.resolvedAt) : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }, [
    showModal, selectedTicket, orderDetails, orderTickets, expandedTickets,
    loadingOrder, updating, formatDate, getStatusBadge,
    getPriorityBadge, toggleTicketExpand, updateTicketStatus
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
          <p className="text-gray-400 text-sm">Loading tickets…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl sm:text-lg font-semibold text-gray-900">Users</h3>
          <p className="text-sm sm:text-sm text-gray-500 mt-0.5">Manage all registered customers</p>
        </div>
        <button
            onClick={() => { fetchTickets(); fetchStats(); }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 mb-5 overflow-hidden">
        <div className="grid grid-cols-3 sm:grid-cols-5 divide-x divide-gray-100">
          <div className="p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            <p className="text-[8px] sm:text-xs text-gray-400 uppercase tracking-wider">Total</p>
          </div>
          <div className="p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.open || 0}</p>
            <p className="text-[8px] sm:text-xs text-yellow-600/80 uppercase tracking-wider">Open</p>
          </div>
          <div className="p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.hold || 0}</p>
            <p className="text-[8px] sm:text-xs text-purple-600/80 uppercase tracking-wider">Hold</p>
          </div>
          <div className="p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.resolved || 0}</p>
            <p className="text-[8px] sm:text-xs text-green-600/80 uppercase tracking-wider">Resolved</p>
          </div>
          <div className="p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.rejected || 0}</p>
            <p className="text-[8px] sm:text-xs text-red-600/80 uppercase tracking-wider">Rejected</p>
          </div>
        </div>
      </div>

      <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-2 sm:gap-3 mb-5`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search by order #, customer, issue…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 text-sm bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-sm overflow-x-auto">
            {['all', 'Open', 'Hold'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap ${
                  filterStatus === s
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm bg-white min-w-[100px] transition"
          >
            <option value="all">Priority</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {paginatedGroups.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-200">
          <Inbox className="w-11 h-11 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            {hasActiveFilters ? 'Nothing matches these filters' : 'All caught up!'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {hasActiveFilters ? 'Try a different search or clear filters.' : 'New tickets will appear here.'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {paginatedGroups.map((group) => {
            const priorityStyle = getPriorityBadge(group.highestPriority);
            const hasFollowUp = group.tickets.some(t => t.status !== 'Open' && t.status !== 'Hold');
            const openTickets = group.tickets.filter(t => t.status === 'Open');
            const hasResolved = group.tickets.some(t => t.status === 'Resolved');
            const hasRejected = group.tickets.some(t => t.status === 'Rejected');

            let statusToShow = null;
            if (openTickets.length > 0) statusToShow = 'Open';
            else if (group.tickets.some(t => t.status === 'Hold')) statusToShow = 'Hold';

            const statusStyle = statusToShow ? getStatusBadge(statusToShow) : getStatusBadge('Open');

            return (
              <div
                key={group.orderId}
                onClick={() => openOrderDetail(group)}
                className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer"
              >
                <div className={`h-1 w-full ${priorityStyle.bg}`} />

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 font-mono">
                          #{group.orderNumber}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium ${priorityStyle.bg} ${priorityStyle.text} border ${priorityStyle.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                          {priorityStyle.label}
                        </span>
                        <span className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {group.tickets.length}
                        </span>
                        {hasFollowUp && (
                          <span className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                            Follow-up
                          </span>
                        )}
                        {hasResolved && (
                          <span className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                            Resolved
                          </span>
                        )}
                        {hasRejected && (
                          <span className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            Rejected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1.5 truncate">{group.tickets[0]?.type}</p>
                    </div>
                    {statusToShow && (
                      <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border} flex-shrink-0 ml-2`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {statusToShow}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{group.tickets[0]?.description}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                        {getInitials(group.user?.name)}
                      </div>
                      <span className="truncate">{group.user?.name || 'Unknown'}</span>
                      <span className="hidden sm:inline text-gray-300">·</span>
                      <span className="flex items-center gap-0.5 text-gray-400 flex-shrink-0">
                        <Clock size={12} />
                        {timeAgo(group.tickets[0]?.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500 order-2 sm:order-1">Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <OrderModal />
      <ScreenshotPreviewModal />
    </div>
  );
};

export default Tickets;