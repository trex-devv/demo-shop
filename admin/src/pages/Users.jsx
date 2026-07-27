// admin/src/pages/Users.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import {
  Users as UsersIcon,
  Search, X, Loader2, Eye, 
  Mail, Calendar, ShoppingBag, DollarSign,
  ChevronLeft, ChevronRight,
  UserCheck, UserX,
  Clock, Phone, User,
  Ban, CheckCircle, AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { timeAgo } from '../utils/dateUtils';

const Users = ({ token }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusActionUser, setStatusActionUser] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch users only once on mount
  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${backendUrl}/api/user?limit=1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const userList = response.data.users || [];
        setAllUsers(userList);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearching(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(false);
      setCurrentPage(1);
    }, 300);
  };

  // Apply search, filters and sorting client-side
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...allUsers];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(user => 
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term)
      );
    }

    if (filterStatus === 'active') {
      result = result.filter(user => user.isActive !== false);
    } else if (filterStatus === 'inactive') {
      result = result.filter(user => user.isActive === false);
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'most_orders':
        result.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
        break;
      case 'least_orders':
        result.sort((a, b) => (a.totalOrders || 0) - (b.totalOrders || 0));
        break;
      case 'most_spent':
        result.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
        break;
      case 'least_spent':
        result.sort((a, b) => (a.totalSpent || 0) - (b.totalSpent || 0));
        break;
      default:
        break;
    }

    return result;
  }, [allUsers, searchTerm, filterStatus, sortBy]);

  // Pagination
  const totalFilteredUsers = filteredAndSortedUsers.length;
  const totalFilteredPages = Math.ceil(totalFilteredUsers / 10);
  const indexOfLastUser = currentPage * 10;
  const indexOfFirstUser = indexOfLastUser - 10;
  const currentUsers = filteredAndSortedUsers.slice(indexOfFirstUser, indexOfLastUser);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setSelectedUser(response.data.user);
        setShowUserModal(true);
      }
    } catch (error) {
      toast.error('Failed to load user details');
    }
  };

  const handleStatusToggle = async () => {
    if (!statusActionUser) return;
    
    const newStatus = !statusActionUser.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    try {
      setUpdatingStatus(statusActionUser._id);
      const response = await axios.put(
        `${backendUrl}/api/user/${statusActionUser._id}/status`,
        { isActive: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(`User ${action}d successfully`);
        fetchUsers();
        setShowStatusModal(false);
        setStatusActionUser(null);
      } else {
        toast.error(response.data.message || 'Failed to update user status');
      }
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openStatusModal = (user) => {
    setStatusActionUser(user);
    setShowStatusModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending Verification': 'bg-yellow-100 text-yellow-800',
      'Payment Verified': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Payment Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const UserDetailModal = () => {
    if (!showUserModal || !selectedUser) return null;

    const isActive = selectedUser.isActive !== false;
    const orderCount = selectedUser.orders?.length || 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
          onClick={() => setShowUserModal(false)}
        />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg flex-shrink-0 ${
                isActive 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-400/30'
              }`}>
                {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedUser.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm text-gray-400 truncate max-w-[150px] sm:max-w-[200px]">
                    {selectedUser.email}
                  </p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                    isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {isActive ? (
                      <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    ) : (
                      <UserX className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    )}
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowUserModal(false)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 sm:p-4 text-center border border-blue-200">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg sm:text-xl font-bold text-gray-900">{selectedUser.totalOrders || 0}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Total Orders</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 sm:p-4 text-center border border-emerald-200">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-lg sm:text-xl font-bold text-gray-900">{currency}{selectedUser.totalSpent?.toFixed(2) || '0.00'}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Total Spent</p>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 sm:p-4 text-center border border-purple-200">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">Joined</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-500 min-w-[80px]">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-xs sm:text-sm">Email</span>
                </div>
                <span className="text-gray-900 text-xs sm:text-sm break-all">{selectedUser.email}</span>
              </div>
              {selectedUser.phone && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-500 min-w-[80px]">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-xs sm:text-sm">Phone</span>
                  </div>
                  <span className="text-gray-900 text-xs sm:text-sm">{selectedUser.phone}</span>
                </div>
              )}
              {selectedUser.lastLogin && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-500 min-w-[80px]">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs sm:text-sm">Last Seen</span>
                  </div>
                  <span className="text-gray-500 text-xs sm:text-sm">{timeAgo(selectedUser.lastLogin)}</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ShoppingBag size={15} />
                  Order History ({orderCount})
                </p>
              </div>
              
              {orderCount > 0 ? (
                <div className="space-y-2 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
                  {selectedUser.orders.slice(0, 5).map((order) => (
                    <div 
                      key={order._id} 
                      className="bg-gray-50 hover:bg-gray-100 transition rounded-lg p-3 cursor-pointer"
                      onClick={() => window.location.href = `/orders/${order._id}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-gray-400 font-mono">#{order._id.slice(-8)}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {order.items?.map((item, idx) => (
                              <span key={idx}>
                                {item.name} {item.variant && `(${item.variant})`} ×{item.quantity}
                                {idx < order.items.length - 1 && ', '}
                              </span>
                            ))}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">
                            {currency}{order.amount?.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {order.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-xl">
                  <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-xs sm:text-sm">No orders yet</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  openStatusModal(selectedUser);
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition text-center ${
                  isActive 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {isActive ? 'Deactivate User' : 'Activate User'}
              </button>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  window.location.href = `/user-orders/${selectedUser._id}`;
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition text-center"
              >
                View All Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatusModal = () => {
    if (!showStatusModal || !statusActionUser) return null;

    const isActive = statusActionUser.isActive !== false;
    const action = isActive ? 'deactivate' : 'activate';
    const actionLabel = isActive ? 'Deactivate' : 'Activate';
    const icon = isActive ? UserX : UserCheck;
    const IconComponent = icon;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={() => {
            setShowStatusModal(false);
            setStatusActionUser(null);
          }}
        />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
          <div className="text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isActive ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <IconComponent className={`w-7 h-7 ${
                isActive ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {actionLabel} User
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to <span className="font-medium">{action}</span> user{' '}
              <span className="font-semibold text-gray-900">{statusActionUser.name}</span>?
              {isActive && (
                <span className="block mt-1 text-xs text-red-500">
                  This will prevent the user from placing new orders.
                </span>
              )}
              {!isActive && (
                <span className="block mt-1 text-xs text-green-500">
                  This will allow the user to place orders again.
                </span>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusActionUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusToggle}
                disabled={updatingStatus === statusActionUser._id}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition text-sm font-medium ${
                  isActive 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-green-500 hover:bg-green-600'
                } ${updatingStatus === statusActionUser._id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updatingStatus === statusActionUser._id ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  `${actionLabel} User`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl sm:text-lg font-semibold text-gray-900">Users</h3>
          <p className="text-sm sm:text-sm text-gray-500 mt-0.5">Manage all registered customers</p>
        </div>
        <div className="text-sm sm:text-sm text-gray-500 bg-gray-100 px-3.5 sm:px-3 py-1.5 rounded-lg">
          {totalFilteredUsers} users
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-6">
        <div className="relative flex-1">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" 
            size={18} 
          />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-9 py-2.5 sm:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm sm:text-sm bg-white/80 backdrop-blur-sm transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
            >
              <X size={18} />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 z-10">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        <div className="relative min-w-[150px]">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2.5 sm:py-2 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm sm:text-sm appearance-none bg-white/80 backdrop-blur-sm transition-all"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>

        <div className="relative min-w-[150px]">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2.5 sm:py-2 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm sm:text-sm appearance-none bg-white/80 backdrop-blur-sm transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_orders">Most Orders</option>
            <option value="least_orders">Least Orders</option>
            <option value="most_spent">Highest Spent</option>
            <option value="least_spent">Lowest Spent</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>

        {(filterStatus !== 'all' || sortBy !== 'newest' || searchTerm) && (
          <button
            onClick={() => {
              clearFilters();
              clearSearch();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm sm:text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition whitespace-nowrap"
          >
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      {/* Users List */}
      {currentUsers.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-200">
          <UsersIcon className="w-14 h-14 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-base sm:text-sm text-gray-500">No users found</p>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="hidden md:grid md:grid-cols-7 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">User</div>
            <div className="col-span-2">Contact</div>
            <div className="text-center">Orders</div>
            <div className="text-center">Status</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-gray-100">
            {currentUsers.map((user) => {
              const isActive = user.isActive !== false;
              const initials = user.name?.charAt(0)?.toUpperCase() || 'U';
              
              return (
                <div key={user._id} className="group">
                  <div className="hidden md:grid md:grid-cols-7 gap-3 px-4 py-3 items-center hover:bg-gray-50 transition">
                    <div className="col-span-2 flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                        isActive ? 'bg-indigo-500' : 'bg-gray-400'
                      }`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      </div>
                    </div>

                    <div className="col-span-2 min-w-0">
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs text-gray-400 truncate">{user.phone}</p>
                      )}
                    </div>

                    <div className="text-center text-sm text-gray-600">
                      {user.totalOrders || 0}
                    </div>

                    <div className="text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isActive ? (
                          <UserCheck className="w-3 h-3" />
                        ) : (
                          <UserX className="w-3 h-3" />
                        )}
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => openStatusModal(user)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                          isActive 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => fetchUserDetails(user._id)}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition"
                      >
                        View
                      </button>
                    </div>
                  </div>

                  <div className="md:hidden p-4 space-y-2 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                          isActive ? 'bg-indigo-500' : 'bg-gray-400'
                        }`}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        {user.totalOrders || 0} orders
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => openStatusModal(user)}
                        className={`flex-1 text-center px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                          isActive 
                            ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => fetchUserDetails(user._id)}
                        className="flex-1 text-center px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalFilteredPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm sm:text-sm text-gray-500 order-2 sm:order-1">
            Page {currentPage} of {totalFilteredPages}
          </div>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            
            {Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
              let pageNum;
              if (totalFilteredPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalFilteredPages - 2) {
                pageNum = totalFilteredPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    currentPage === pageNum
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(Math.min(totalFilteredPages, currentPage + 1))}
              disabled={currentPage === totalFilteredPages}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <UserDetailModal />
      <StatusModal />
    </div>
  );
};

export default Users;