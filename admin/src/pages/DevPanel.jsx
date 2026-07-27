// frontend/src/pages/DeveloperDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Lock, Unlock, Users, ShoppingBag, Ticket,
  Trash2, Loader2, RefreshCw,
  AlertTriangle, Terminal, Search,
  PowerOff, Menu
} from 'lucide-react';

const TOKEN_STORAGE_KEY = 'devDashboardToken';

const DeveloperDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const API_BASE = `${backendUrl}/api/dev`;

  // NOTE: the dev password itself never lives in frontend code or env vars
  // anymore. It's checked server-side by POST /api/dev/login, which returns
  // a short-lived JWT that we attach as a Bearer token on every other call.

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  // Restore a still-valid session on page refresh
  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      setToken(stored);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter the key');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/login`, { password });
      if (res.data.success) {
        setToken(res.data.token);
        sessionStorage.setItem(TOKEN_STORAGE_KEY, res.data.token);
        setIsAuthenticated(true);
        setPassword('');
        toast.success('Welcome Developer');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken(null);
    setPassword('');
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    toast.info('Logged out');
  };

  // Centralized handler: if the token is invalid/expired, kick back to login
  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      toast.error('Session expired, please log in again');
      handleLogout();
      return true;
    }
    return false;
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`, { headers: authHeaders() });
      if (res.data.success) setStats(res.data.data);
    } catch (error) {
      if (!handleAuthError(error)) console.error('Stats fetch error:', error);
    }
  }, [API_BASE, authHeaders, handleAuthError]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/orders`, { headers: authHeaders() });
      if (res.data.success) setOrders(res.data.data);
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Orders fetch error:', error);
        toast.error('Failed to fetch orders');
      }
    }
  }, [API_BASE, authHeaders, handleAuthError]);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/tickets`, { headers: authHeaders() });
      if (res.data.success) setTickets(res.data.data);
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Tickets fetch error:', error);
        toast.error('Failed to fetch tickets');
      }
    }
  }, [API_BASE, authHeaders, handleAuthError]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`, { headers: authHeaders() });
      if (res.data.success) setUsers(res.data.data);
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Users fetch error:', error);
        toast.error('Failed to fetch users');
      }
    }
  }, [API_BASE, authHeaders, handleAuthError]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchStats();
      fetchOrders();
      fetchTickets();
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const refreshAll = () => {
    Promise.all([fetchStats(), fetchOrders(), fetchTickets(), fetchUsers()]);
    toast.success('Refreshed');
  };

  const handleDeleteOperation = (type, action) => {
    setShowConfirmDialog(true);
    setConfirmAction({ type, action });
  };

  const executeDelete = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      const { type, action } = confirmAction;
      let endpoint = '';

      const actionMap = {
        'delete-all': `${API_BASE}/${type}/delete-all`,
        'delete-rejected': `${API_BASE}/${type}/delete-rejected`,
        'delete-delivered': `${API_BASE}/${type}/delete-delivered`,
        'delete-pending': `${API_BASE}/${type}/delete-pending`,
        'delete-resolved': `${API_BASE}/${type}/delete-resolved`,
        'delete-inactive': `${API_BASE}/${type}/delete-inactive`,
        'delete-all-data': `${API_BASE}/delete-all-data`
      };

      endpoint = actionMap[action];
      if (!endpoint) {
        toast.error('Invalid action');
        return;
      }

      const config = { headers: authHeaders() };

      if (action === 'delete-all-data') {
        config.data = { confirm: 'DELETE_ALL_DATA' };
      }

      const res = await axios.delete(endpoint, config);

      if (res.data.success) {
        toast.success(res.data.message);
        refreshAll();
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error.response?.data?.message || 'Delete operation failed');
      }
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const deleteSingleItem = async (type, id) => {
    if (!window.confirm(`Delete this ${type.slice(0, -1)}?`)) return;
    setLoading(true);
    try {
      const res = await axios.delete(`${API_BASE}/${type}/${id}`, {
        headers: authHeaders()
      });
      if (res.data.success) {
        toast.success(`${type.slice(0, -1)} deleted`);
        refreshAll();
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = (data, searchFields = []) => {
    if (!searchTerm) return data;
    return data.filter(item =>
      searchFields.some(field => {
        const value = field.includes('.')
          ? field.split('.').reduce((obj, key) => obj?.[key], item)
          : item[field];
        return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  };

  const orderStatusColors = {
    'Pending Verification': 'bg-yellow-100 text-yellow-800',
    'Payment Verified': 'bg-blue-100 text-blue-800',
    'Payment Rejected': 'bg-red-100 text-red-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Invalid Details': 'bg-orange-100 text-orange-800',
    'Cancelled': 'bg-gray-100 text-gray-800'
  };

  const ticketStatusColors = {
    'Open': 'bg-red-100 text-red-800',
    'Hold': 'bg-yellow-100 text-yellow-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-gray-100 text-gray-800'
  };

  const priorityColors = {
    'Urgent': 'bg-red-100 text-red-800',
    'High': 'bg-orange-100 text-orange-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800'
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dev Dashboard</h1>
            <p className="text-gray-500 text-sm mt-2">Enter the security key to continue</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter security key"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition bg-white text-sm sm:text-base"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Authenticating...
                </>
              ) : (
                'Login to Dev Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-bold text-gray-900 text-sm sm:text-base">Dev Dashboard</span>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw size={18} className="text-gray-600" />
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
          >
            Exit Dev
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-3 space-y-2">
          <button
            onClick={() => { refreshAll(); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition text-sm"
          >
            <RefreshCw size={16} className="text-gray-600" />
            Refresh
          </button>
          <button
            onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 rounded-lg transition text-red-600 text-sm"
          >
            <Unlock size={16} />
            Exit Dev
          </button>
        </div>
      )}

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
              <ShoppingBag size={14} className="text-blue-600 sm:text-lg" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500">Orders</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">{stats.orders?.total || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg">
              <Ticket size={14} className="text-purple-600 sm:text-lg" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500">Tickets</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">{stats.tickets?.total || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg">
              <Users size={14} className="text-green-600 sm:text-lg" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500">Users</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">{stats.users?.total || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-2 sm:px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap ${
              activeTab === 'orders'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap ${
              activeTab === 'users'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Users ({users.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2 sm:p-4">
        {/* Search */}
        <div className="mb-3 sm:mb-4">
          <div className="relative max-w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white text-sm"
            />
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 bg-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">Orders</h3>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">{orders.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <button
                  onClick={() => handleDeleteOperation('orders', 'delete-rejected')}
                  className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition whitespace-nowrap"
                >
                  Delete Rejected
                </button>
                <button
                  onClick={() => handleDeleteOperation('orders', 'delete-delivered')}
                  className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition whitespace-nowrap"
                >
                  Delete Delivered
                </button>
                <button
                  onClick={() => handleDeleteOperation('orders', 'delete-pending')}
                  className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition whitespace-nowrap"
                >
                  Delete Pending
                </button>
                <button
                  onClick={() => handleDeleteOperation('orders', 'delete-all')}
                  className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 transition whitespace-nowrap"
                >
                  Delete All
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="hidden md:table-cell px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-2.5 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getFilteredData(orders, ['orderNumber', 'userId.name', 'userId.email']).map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition">
                      <td className="px-2 sm:px-4 py-2 sm:py-2.5 font-medium text-gray-900 text-[10px] sm:text-xs">#{order.orderNumber || order._id.slice(-6)}</td>
                      <td className="hidden sm:table-cell px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs">{order.userId?.name || 'Guest'}</span>
                          <span className="text-[10px] text-gray-500">{order.userId?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-2.5 font-medium text-[10px] sm:text-xs">${(order.amount || 0).toFixed(2)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-2.5">
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-medium whitespace-nowrap ${orderStatusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-2.5 text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-2.5 text-center">
                        <button
                          onClick={() => deleteSingleItem('orders', order._id)}
                          className="p-0.5 sm:p-1 hover:bg-red-50 rounded text-red-500 transition"
                          title="Delete Order"
                        >
                          <Trash2 size={14} className="sm:text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {getFilteredData(orders, ['orderNumber', 'userId.name', 'userId.email']).length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-sm">No orders found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 bg-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">Tickets</h3>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">{tickets.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <button
                  onClick={() => handleDeleteOperation('tickets', 'delete-resolved')}
                  className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition whitespace-nowrap"
                >
                  Delete Resolved
                </button>
                <button
                  onClick={() => handleDeleteOperation('tickets', 'delete-pending')}
                  className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition whitespace-nowrap"
                >
                  Delete Pending
                </button>
                <button
                  onClick={() => handleDeleteOperation('tickets', 'delete-all')}
                  className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 transition whitespace-nowrap"
                >
                  Delete All
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Ticket</th>
                    <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="hidden md:table-cell px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-2.5 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getFilteredData(tickets, ['orderNumber', 'user.name', 'user.email', 'type']).map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50 transition">
                      <td className="px-2 sm:px-4 py-2 sm:py-2.5 font-medium text-gray-900 text-[10px] sm:text-xs">#{ticket.orderNumber || ticket._id.slice(-6)}</td>
                      <td className="hidden sm:table-cell px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs">{ticket.user?.name || 'Guest'}</span>
                          <span className="text-[10px] text-gray-500">{ticket.user?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-2.5 text-gray-600 text-[10px] sm:text-xs max-w-[60px] sm:max-w-xs truncate">{ticket.type || 'N/A'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-2.5">
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-medium whitespace-nowrap ${ticketStatusColors[ticket.status] || 'bg-gray-100 text-gray-800'}`}>
                          {ticket.status || 'Open'}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-2.5">
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-medium ${priorityColors[ticket.priority] || 'bg-gray-100 text-gray-800'}`}>
                          {ticket.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-2.5 text-center">
                        <button
                          onClick={() => deleteSingleItem('tickets', ticket._id)}
                          className="p-0.5 sm:p-1 hover:bg-red-50 rounded text-red-500 transition"
                          title="Delete Ticket"
                        >
                          <Trash2 size={14} className="sm:text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {getFilteredData(tickets, ['orderNumber', 'user.name', 'user.email', 'type']).length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-sm">No tickets found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 bg-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">Users</h3>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">{users.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <button
                  onClick={() => handleDeleteOperation('users', 'delete-inactive')}
                  className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition whitespace-nowrap"
                >
                  Delete Inactive
                </button>
                <button
                  onClick={() => handleDeleteOperation('users', 'delete-all')}
                  className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 transition whitespace-nowrap"
                >
                  Delete All
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-2.5 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="hidden md:table-cell px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-2.5 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getFilteredData(users, ['name', 'email', 'phone']).map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition">
                      <td className="px-2 sm:px-4 py-2 sm:py-2.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-[10px] sm:text-xs">{user.name || 'N/A'}</span>
                          <span className="text-[9px] sm:text-xs text-gray-500">{user.phone || 'No phone'}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-2.5 text-gray-600 text-xs">{user.email || 'N/A'}</td>

                      <td className="px-2 sm:px-4 py-2 sm:py-2.5">
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-medium whitespace-nowrap ${
                          user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-2.5 text-gray-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-2.5 text-center">
                        <button
                          onClick={() => deleteSingleItem('users', user._id)}
                          className="p-0.5 sm:p-1 hover:bg-red-50 rounded text-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={user.role === 'developer' || user.role === 'admin'}
                          title={user.role === 'developer' || user.role === 'admin' ? 'Cannot delete admin/developer' : 'Delete User'}
                        >
                          <Trash2 size={14} className="sm:text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {getFilteredData(users, ['name', 'email', 'phone']).length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-sm">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl mx-2 sm:mx-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-full flex-shrink-0">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to perform this delete operation? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperDashboard;