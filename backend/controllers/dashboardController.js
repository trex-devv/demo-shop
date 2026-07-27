// backend/controllers/dashboardController.js
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import userModel from '../models/userModel.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { timeframe = 'today' } = req.query;
    
    const now = new Date();
    let startDate = new Date();
    
    // Set the date range based on timeframe
    switch (timeframe) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    // Get all orders in timeframe (ALL orders - no user filtering)
    const ordersQuery = timeframe === 'all' 
      ? {} 
      : { createdAt: { $gte: startDate, $lte: now } };
    
    const orders = await orderModel.find(ordersQuery);

    // Get user data for orders (ALL users - including inactive)
    const ordersWithUser = await Promise.all(orders.map(async (order) => {
      if (order.userId) {
        const user = await userModel.findById(order.userId).select('name email isActive');
        return {
          ...order.toObject(),
          userId: user || order.userId
        };
      }
      return order;
    }));

    const totalOrders = ordersWithUser.length;
    
    // Get verified and delivered orders for revenue (ALL users - including inactive)
    const revenueQuery = timeframe === 'all'
      ? { status: { $in: ['Payment Verified', 'Delivered'] } }
      : { 
          status: { $in: ['Payment Verified', 'Delivered'] },
          createdAt: { $gte: startDate, $lte: now }
        };
    
    const allOrders = await orderModel.find(revenueQuery);

    // Get user data for all orders (ALL users - including inactive)
    const allOrdersWithUser = await Promise.all(allOrders.map(async (order) => {
      if (order.userId) {
        const user = await userModel.findById(order.userId).select('name email isActive');
        return {
          ...order.toObject(),
          userId: user || order.userId
        };
      }
      return order;
    }));

    // Calculate revenue - from ALL Verified and Delivered orders (including inactive users)
    let totalRevenue = 0;
    let productRevenue = 0;
    let subscriptionRevenue = 0;
    
    allOrdersWithUser.forEach(order => {
      totalRevenue += order.amount || 0;
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          if (item.isSubscription) {
            subscriptionRevenue += itemTotal;
          } else {
            productRevenue += itemTotal;
          }
        });
      }
    });

    // Status counts from timeframe (ALL users)
    const pendingOrders = ordersWithUser.filter(o => o.status === 'Pending Verification').length;
    const verifiedOrders = ordersWithUser.filter(o => o.status === 'Payment Verified').length;
    const deliveredOrders = ordersWithUser.filter(o => o.status === 'Delivered').length;
    const rejectedOrders = ordersWithUser.filter(o => o.status === 'Payment Rejected' || o.status === 'Cancelled').length;
    const cancelledOrders = ordersWithUser.filter(o => o.status === 'Cancelled').length;

    // Category data aggregation - from ALL Verified and Delivered orders (including inactive users)
    const categoryMap = {};
    allOrdersWithUser.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const slug = item.categorySlug || 'other';
          if (!categoryMap[slug]) {
            categoryMap[slug] = {
              name: slug,
              slug: slug,
              value: 0
            };
          }
          categoryMap[slug].value += (item.price || 0) * (item.quantity || 1);
        });
      }
    });
    const categoryData = Object.values(categoryMap);

    // Status data (ALL users)
    const statusMap = {};
    ordersWithUser.forEach(order => {
      const status = order.status || 'Unknown';
      if (!statusMap[status]) {
        statusMap[status] = 0;
      }
      statusMap[status]++;
    });
    const statusData = Object.keys(statusMap).map(key => ({
      name: key,
      value: statusMap[key]
    }));

    // Sales data (daily aggregation) - from ALL orders
    const salesMap = {};
    ordersWithUser.forEach(order => {
      const date = order.createdAt ? order.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (!salesMap[date]) {
        salesMap[date] = { date, amount: 0, orders: 0 };
      }
      salesMap[date].amount += order.amount || 0;
      salesMap[date].orders += 1;
    });
    const salesData = Object.values(salesMap).sort((a, b) => a.date.localeCompare(b.date));

    // Revenue breakdown
    const revenueBreakdown = [
      { name: 'Products', value: productRevenue },
      { name: 'Subscriptions', value: subscriptionRevenue }
    ];

    // Top products - from ALL Verified and Delivered orders (including inactive users)
    const productMap = {};
    allOrdersWithUser.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const key = item.productId || item.name;
          if (!productMap[key]) {
            productMap[key] = {
              name: item.name || 'Unknown Product',
              sales: 0,
              revenue: 0
            };
          }
          productMap[key].sales += item.quantity || 1;
          productMap[key].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top customers - from ALL Verified and Delivered orders (including inactive users)
    const customerMap = {};
    allOrdersWithUser.forEach(order => {
      const userId = order.userId?._id || order.userId;
      if (userId) {
        const userIdStr = userId.toString();
        const userName = order.userId?.name || 'Unknown';
        
        if (!customerMap[userIdStr]) {
          customerMap[userIdStr] = {
            _id: userId,
            id: userId,
            name: userName,
            orders: 0,
            totalSpent: 0
          };
        }
        customerMap[userIdStr].orders += 1;
        customerMap[userIdStr].totalSpent += order.amount || 0;
        if (userName !== 'Unknown' && customerMap[userIdStr].name === 'Unknown') {
          customerMap[userIdStr].name = userName;
        }
      }
    });
    
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Recent orders (last 10) - from ALL orders
    const recentOrders = await orderModel.find(ordersQuery)
      .sort({ createdAt: -1 })
      .limit(10);

    // Populate user data for recent orders (ALL users)
    const recentOrdersWithUser = await Promise.all(recentOrders.map(async (order) => {
      if (order.userId) {
        const user = await userModel.findById(order.userId).select('name email isActive');
        return {
          ...order.toObject(),
          userId: user || order.userId
        };
      }
      return order.toObject();
    }));

    // Calculate trends (compare with previous period) - only if not "all"
    let revenueTrend = 0;
    let ordersTrend = 0;
    
    if (timeframe !== 'all') {
      const daysDiff = Math.max(1, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
      
      const prevOrders = await orderModel.find({
        createdAt: { $gte: prevStartDate, $lt: startDate }
      });
      
      const prevRevenue = prevOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const prevTotalOrders = prevOrders.length;
      
      revenueTrend = prevRevenue > 0 
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
        : totalRevenue > 0 ? 100 : 0;
      ordersTrend = prevTotalOrders > 0 
        ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 
        : totalOrders > 0 ? 100 : 0;
    }

    // Get total counts (all time)
    const totalProducts = await productModel.countDocuments();
    
    // ONLY count ACTIVE users for the customers count
    const totalCustomers = await userModel.countDocuments({ isActive: { $ne: false } });

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          totalRevenue,
          totalProducts,
          totalCustomers, // Only active users
          pendingOrders,
          verifiedOrders,
          deliveredOrders,
          rejectedOrders,
          cancelledOrders,
          subscriptionRevenue,
          productRevenue
        },
        trends: {
          revenueTrend: timeframe === 'all' ? 0 : Math.round(revenueTrend * 10) / 10,
          ordersTrend: timeframe === 'all' ? 0 : Math.round(ordersTrend * 10) / 10,
          customersTrend: 0
        },
        charts: {
          salesData,
          categoryData,
          statusData,
          revenueBreakdown
        },
        recentOrders: recentOrdersWithUser,
        topProducts,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};