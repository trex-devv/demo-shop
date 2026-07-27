// admin/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import {
  TrendingUp, TrendingDown, ShoppingBag, 
  Package, DollarSign, Clock, CheckCircle, XCircle,
  Loader2, RotateCw,
  UsersRound, Award, Target,
  ChevronRight, UserPlus,
  CreditCard, Truck, Sparkles, Ban,
  Star, Zap, Calendar, BarChart3, PieChart as PieChartIcon,
  Activity, TrendingUp as TrendingUpIcon, ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  ComposedChart,
  Legend
} from 'recharts';
import { timeAgo } from '../utils/dateUtils';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#10b981', '#f59e0b', '#3b82f6'];

const STATUS_PIE_COLORS = {
  'Pending Verification': '#f59e0b',
  'Payment Verified': '#3b82f6',
  'Delivered': '#10b981',
  'Payment Rejected': '#ef4444',
  'Cancelled': '#6b7280'
};

const Dashboard = ({ token }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      totalCustomers: 0,
      pendingOrders: 0,
      verifiedOrders: 0,
      deliveredOrders: 0,
      rejectedOrders: 0,
      cancelledOrders: 0,
      subscriptionRevenue: 0,
      productRevenue: 0
    },
    trends: {
      revenueTrend: 0,
      ordersTrend: 0,
      customersTrend: 0
    },
    charts: {
      salesData: [],
      categoryData: [],
      statusData: [],
      revenueBreakdown: []
    },
    recentOrders: [],
    topProducts: [],
    topCustomers: []
  });
  const [timeframe, setTimeframe] = useState('today');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/category`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const categoriesData = response.data.categories || [];
        setCategories(categoriesData);
        
        const map = {};
        categoriesData.forEach(cat => {
          map[cat.slug] = cat.name;
        });
        map['subscription'] = 'Subscriptions';
        map['other'] = 'Other';
        map[''] = 'Uncategorized';
        setCategoryMap(map);
      }
    } catch (error) {
      setCategoryMap({
        'ff': 'FREEFIRE',
        'coc': 'CLASH OF CLANS',
        'mlbb': 'MLBB',
        'pubg-mobile': 'PUBG MOBILE',
        'subscription': 'Subscriptions',
        'other': 'Other',
        '': 'Uncategorized'
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${backendUrl}/api/dashboard/stats?timeframe=${timeframe}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const data = response.data.data;
        
        if (data.charts && data.charts.categoryData) {
          data.charts.categoryData = data.charts.categoryData.map(item => {
            const displayName = categoryMap[item.slug?.toLowerCase()] || item.name || item.slug || 'Other';
            return {
              ...item,
              displayName: displayName,
              name: displayName
            };
          });
        }
        
        setDashboardData(data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending Verification': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Payment Verified': 'bg-blue-50 text-blue-700 border-blue-200',
      'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Payment Rejected': 'bg-red-50 text-red-700 border-red-200',
      'Cancelled': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatCurrency = (value) => {
    return `${currency}${value?.toFixed(2) || '0.00'}`;
  };

  const StatCard = ({ title, value, icon: Icon, gradient, trend, subtitle, iconBg }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 lg:p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-2xl lg:text-2xl font-bold text-gray-900 mt-1.5 truncate">{value}</p>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-gray-400 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl bg-gradient-to-br ${gradient} flex-shrink-0 shadow-lg shadow-${iconBg}-500/20 ml-2`}>
          <Icon className="w-5 h-5 lg:w-5 lg:h-5 text-white" />
        </div>
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className="mt-3 flex items-center gap-1">
          {trend > 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-semibold ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {Math.abs(trend)}%
          </span>
          <span className="text-[11px] sm:text-xs text-gray-400">vs previous</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const { stats, trends, charts, recentOrders, topProducts, topCustomers } = dashboardData;

  const top5Customers = topCustomers?.slice(0, 5) || [];
  const top10RecentOrders = recentOrders?.slice(0, 10) || [];
  const periodLabel = timeframe === 'all' ? 'All Time' : 
                      timeframe === 'today' ? 'Today' : 
                      timeframe === 'week' ? 'This Week' : 
                      timeframe === 'month' ? 'This Month' : 
                      timeframe === 'year' ? 'This Year' : 'All Time';

  const filteredCategoryData = charts.categoryData || [];
  const filteredRevenueBreakdown = charts.revenueBreakdown || [];

  const handleCustomerClick = (customerId) => {
    if (customerId) {
      navigate(`/user-orders/${customerId}`);
    } else {
      toast.error('Customer ID not found');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80 px-4 sm:px-4 md:px-6 py-5 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Dashboard
                </h1>
                <p className="text-sm sm:text-sm text-gray-400 mt-0.5">Overall performance overview</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-full sm:w-auto overflow-x-auto">
              {['all', 'today', 'week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-3 py-2 sm:py-1.5 text-sm sm:text-xs font-medium rounded-lg transition-all capitalize whitespace-nowrap flex-1 sm:flex-none ${
                    timeframe === period
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {period === 'all' ? 'All' : period}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                fetchCategories();
                fetchDashboardData();
              }}
              className="p-2.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all border border-gray-100 hover:border-gray-200"
            >
              <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            gradient="from-emerald-500 to-emerald-600"
            iconBg="emerald"
            trend={trends?.revenueTrend}
            subtitle={`${formatCurrency(stats.productRevenue)} from products`}
          />
          <StatCard
            title="Orders"
            value={stats.totalOrders || 0}
            icon={ShoppingBag}
            gradient="from-blue-500 to-blue-600"
            iconBg="blue"
            trend={trends?.ordersTrend}
            subtitle={`${stats.pendingOrders || 0} pending · ${stats.deliveredOrders || 0} delivered`}
          />
          <StatCard
            title="Customers"
            value={stats.totalCustomers || 0}
            icon={UsersRound}
            gradient="from-purple-500 to-purple-600"
            iconBg="purple"
            trend={trends?.customersTrend}
            subtitle="Active users"
          />
          <StatCard
            title="Products"
            value={stats.totalProducts || 0}
            icon={Package}
            gradient="from-orange-500 to-orange-600"
            iconBg="orange"
            subtitle="In store"
          />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
          {[
            { label: 'Pending', value: stats.pendingOrders, icon: Clock, color: 'yellow' },
            { label: 'Verified', value: stats.verifiedOrders, icon: CheckCircle, color: 'blue' },
            { label: 'Delivered', value: stats.deliveredOrders, icon: Truck, color: 'emerald' },
            { label: 'Rejected', value: stats.rejectedOrders, icon: XCircle, color: 'red' },
            { label: 'Cancelled', value: stats.cancelledOrders || 0, icon: Ban, color: 'gray' }
          ].map((item, index) => (
            <div 
              key={index}
              className={`bg-gradient-to-br from-${item.color}-50 to-${item.color}-100/50 rounded-xl border border-${item.color}-200 p-3.5 sm:p-4`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className={`text-[11px] sm:text-xs text-${item.color}-700 font-medium truncate`}>{item.label}</p>
                  <p className={`text-xl sm:text-lg lg:text-2xl font-bold text-${item.color}-700 mt-0.5`}>{item.value}</p>
                </div>
                <item.icon className={`w-5 h-5 sm:w-6 sm:h-8 text-${item.color}-500/40 flex-shrink-0 ml-1`} />
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-5 sm:mb-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <h3 className="text-base sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUpIcon className="w-4 h-4 text-indigo-500" />
                  Revenue Overview
                </h3>
                <p className="text-xs sm:text-xs text-gray-400 mt-0.5">Daily revenue & orders trend</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-xs flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Revenue
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Orders
                </span>
              </div>
            </div>
            <div className="h-64 sm:h-64 md:h-64 lg:h-72">
              {charts.salesData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={charts.salesData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Revenue') return [formatCurrency(value), name];
                        return [value, name];
                      }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '12px',
                        padding: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        fontSize: '11px'
                      }}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#6366f1" 
                      fill="url(#revenueGradient)" 
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="orders" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                      name="Orders"
                      barSize={20}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm sm:text-sm">
                  <div className="text-center">
                    <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    No sales data available
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <PieChartIcon className="w-4 h-4 text-purple-500" />
              Order Status
            </h3>
            <p className="text-xs sm:text-xs text-gray-400 mb-3 sm:mb-4">Distribution overview</p>
            <div className="h-60 sm:h-52 md:h-56 lg:h-64">
              {charts.statusData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.statusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {charts.statusData.map((entry) => (
                        <Cell 
                          key={`cell-${entry.name}`} 
                          fill={STATUS_PIE_COLORS[entry.name] || '#6366f1'}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} orders`, name]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '12px',
                        padding: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom" 
                      height={25} 
                      iconType="circle" 
                      iconSize={7}
                      wrapperStyle={{ fontSize: '10px' }}
                      formatter={(value) => <span className="text-xs sm:text-xs text-gray-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm sm:text-sm">
                  <div className="text-center">
                    <PieChartIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    No status data available
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category & Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-5 sm:mb-6">
          {/* Revenue Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Revenue Breakdown
            </h3>
            <p className="text-xs sm:text-xs text-gray-400 mb-3 sm:mb-4">{periodLabel}</p>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3.5 sm:p-4 border border-blue-200">
                <p className="text-xs sm:text-xs text-blue-600 font-medium">Products</p>
                <p className="text-lg sm:text-base lg:text-xl font-bold text-blue-700 truncate">{formatCurrency(stats.productRevenue)}</p>
                <p className="text-[11px] sm:text-[10px] text-blue-400 mt-0.5">
                  {stats.productRevenue > 0 ? `${Math.round((stats.productRevenue / (stats.productRevenue + stats.subscriptionRevenue || 1)) * 100)}%` : '0%'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3.5 sm:p-4 border border-purple-200">
                <p className="text-xs sm:text-xs text-purple-600 font-medium">Subscriptions</p>
                <p className="text-lg sm:text-base lg:text-xl font-bold text-purple-700 truncate">{formatCurrency(stats.subscriptionRevenue)}</p>
                <p className="text-[11px] sm:text-[10px] text-purple-400 mt-0.5">
                  {stats.subscriptionRevenue > 0 ? `${Math.round((stats.subscriptionRevenue / (stats.productRevenue + stats.subscriptionRevenue || 1)) * 100)}%` : '0%'}
                </p>
              </div>
            </div>
            {filteredRevenueBreakdown && filteredRevenueBreakdown.length > 0 ? (
              <div className="h-32 sm:h-28 lg:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredRevenueBreakdown}
                      cx="50%"
                      cy="45%"
                      innerRadius={20}
                      outerRadius={35}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {filteredRevenueBreakdown.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={['#3b82f6', '#8b5cf6'][index % 2]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '12px',
                        padding: '6px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        fontSize: '11px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={20} 
                      iconType="circle" 
                      iconSize={7}
                      wrapperStyle={{ fontSize: '10px' }}
                      formatter={(value) => <span className="text-xs sm:text-xs text-gray-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-32 sm:h-28 lg:h-32 flex flex-col items-center justify-center text-gray-400">
                <DollarSign className="w-8 h-8 text-gray-200 mb-1" />
                <p className="text-sm sm:text-sm text-center">No revenue data</p>
              </div>
            )}
          </div>
          
          {/* Category Sales */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-orange-500" />
              Category Sales
            </h3>
            <p className="text-xs sm:text-xs text-gray-400 mb-3 sm:mb-4">{periodLabel}</p>
            {filteredCategoryData && filteredCategoryData.length > 0 ? (
              <div className="h-60 sm:h-52 md:h-56 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredCategoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: 11, fill: '#9ca3af' }} 
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="displayName" 
                      tick={{ fontSize: 11, fill: '#6b7280' }} 
                      width={80}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '12px',
                        padding: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        fontSize: '11px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 6, 6, 0]}
                      background={{ fill: '#f9fafb', radius: [0, 6, 6, 0] }}
                    >
                      {filteredCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 sm:h-52 md:h-56 lg:h-64 flex flex-col items-center justify-center text-gray-400">
                <Package className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-sm sm:text-sm text-center">No category data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders & Top Products/Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 sm:mb-4">
              <div>
                <h3 className="text-base sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Recent Orders
                </h3>
                <p className="text-xs sm:text-xs text-gray-400 mt-0.5">Latest 10 customer orders</p>
              </div>
              <button 
                onClick={() => window.location.href = '/orders'}
                className="text-xs sm:text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
              >
                View all
                <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            {top10RecentOrders.length > 0 ? (
              <div className="space-y-2.5 sm:space-y-2 h-auto overflow-y-auto pr-1">
                {top10RecentOrders.map((order) => (
                  <div 
                    key={order._id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-3 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all cursor-pointer gap-1.5 sm:gap-0"
                    onClick={() => window.location.href = `/orders/${order._id}`}
                  >
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className="flex items-center gap-2 sm:gap-2 flex-wrap">
                        <span className="text-sm sm:text-sm font-medium text-gray-900 truncate">
                          {order.userId?.name || 'Guest'}
                        </span>
                        <span className="text-xs sm:text-xs text-gray-400">#{order._id.slice(-6)}</span>
                        <span className={`text-[11px] sm:text-[10px] px-2 sm:px-2 py-0.5 rounded-full font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-xs text-gray-400">
                        <span>{timeAgo(order.createdAt)}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-gray-300 hidden sm:block"></span>
                        <span>{order.items?.length || 0} items</span>
                        {order.paymentMethod && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-gray-300 hidden sm:block"></span>
                            <span className="flex items-center gap-1 sm:gap-1">
                              <CreditCard className="w-3 h-3 sm:w-3 sm:h-3" />
                              <span className="truncate">{order.paymentMethod}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right w-full sm:w-auto mt-1.5 sm:mt-0">
                      <p className="text-sm sm:text-sm font-bold text-gray-900">
                        {formatCurrency(order.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-200 mx-auto mb-2 sm:mb-3" />
                <p className="text-sm sm:text-sm text-gray-400">No recent orders</p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Top Products */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Top Products
              </h3>
              {topProducts && topProducts.length > 0 ? (
                <div className="space-y-3 sm:space-y-3">
                  {topProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center gap-3 sm:gap-3">
                      <div className={`flex-shrink-0 w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600' :
                        index === 1 ? 'bg-gray-200 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs sm:text-xs text-gray-400">{product.sales || 0} sales</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm sm:text-sm font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 sm:py-6">
                  <Package className="w-8 h-8 text-gray-200 mx-auto mb-1" />
                  <p className="text-sm sm:text-sm text-gray-400">No product data</p>
                </div>
              )}
            </div>

            {/* Top 5 Customers */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-base sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                Top Customers
              </h3>
              {top5Customers.length > 0 ? (
                <div className="space-y-3 sm:space-y-3">
                  {top5Customers.map((customer, index) => {
                    const customerId = customer._id || customer.id;
                    
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 sm:gap-3 group cursor-pointer hover:bg-gray-50 rounded-lg p-2.5 sm:p-2 transition-all"
                        onClick={() => handleCustomerClick(customerId)}
                      >
                        <div className={`flex-shrink-0 w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-xs font-bold ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-sm shadow-yellow-500/20' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-sm shadow-orange-500/20' :
                          'bg-gradient-to-br from-indigo-400 to-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                        }`}>
                          {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                            {customer.name || 'Unknown'}
                          </p>
                          <p className="text-xs sm:text-xs text-gray-400">{customer.orders || 0} orders</p>
                        </div>
                        <div className="text-right flex items-center gap-1 sm:gap-2">
                          <p className="text-sm sm:text-sm font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                          <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 sm:py-6">
                  <UsersRound className="w-8 h-8 text-gray-200 mx-auto mb-1" />
                  <p className="text-sm sm:text-sm text-gray-400">No customer data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;