// GENERATOR: ANALYTICS_DASHBOARD
// Analytics dashboard metrics service
// HOW TO RUN: import { getDashboardMetrics } from './dashboardService'

import { getPrismaClient } from '../../db/prismaClient';

const prisma = getPrismaClient();

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalCustomers: number;
  avgLTV: number;
  growthRate: number;
  revenueChart: Array<{ date: string; revenue: number }>;
  previousPeriodRevenue: number;
  previousPeriodOrders: number;
}

/**
 * Get dashboard metrics for a brand within a date range
 */
export async function getDashboardMetrics(
  brandId: string,
  startDate: Date,
  endDate: Date
): Promise<DashboardMetrics> {
  // Calculate previous period for comparison
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - periodDays);
  const previousEndDate = new Date(startDate);

  // Get ALL purchase events for the brand (we'll filter by payload date)
  const allPurchaseEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      eventType: {
        in: ['purchase', 'pos_sale', 'pos_transaction'],
      },
    },
    select: {
      payload: true,
      createdAt: true,
    },
  });

  // Filter events by their actual order date (from payload)
  const purchaseEvents = allPurchaseEvents.filter((event) => {
    const payload = event.payload as any;
    // Get order date from payload (could be order_date, created_at, timestamp, processed_at)
    const orderDateStr = payload.order_date || payload.created_at || payload.timestamp || payload.processed_at;
    if (!orderDateStr) {
      // If no date in payload, use createdAt as fallback
      return event.createdAt >= startDate && event.createdAt <= endDate;
    }
    
    const orderDate = new Date(orderDateStr);
    return orderDate >= startDate && orderDate <= endDate;
  });

  const previousPurchaseEvents = allPurchaseEvents.filter((event) => {
    const payload = event.payload as any;
    const orderDateStr = payload.order_date || payload.created_at || payload.timestamp || payload.processed_at;
    if (!orderDateStr) {
      return event.createdAt >= previousStartDate && event.createdAt < startDate;
    }
    
    const orderDate = new Date(orderDateStr);
    return orderDate >= previousStartDate && orderDate < startDate;
  });

  // Calculate current period metrics
  let totalRevenue = 0;
  let totalOrders = 0;

  purchaseEvents.forEach((event) => {
    const payload = event.payload as any;
    const revenue = parseFloat(
      payload.amount || payload.total_spent || payload.total || '0'
    );
    if (!isNaN(revenue) && revenue > 0) {
      totalRevenue += revenue;
      totalOrders++;
    }
  });

  // Calculate previous period metrics
  let previousPeriodRevenue = 0;
  let previousPeriodOrders = 0;

  previousPurchaseEvents.forEach((event) => {
    const payload = event.payload as any;
    const revenue = parseFloat(
      payload.amount || payload.total_spent || payload.total || '0'
    );
    if (!isNaN(revenue) && revenue > 0) {
      previousPeriodRevenue += revenue;
      previousPeriodOrders++;
    }
  });

  // Calculate average order value
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Get total customers (active in period)
  const activeCustomers = await prisma.customerProfile.count({
    where: {
      brandId,
      updatedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Get average LTV from all profiles
  const ltvStats = await prisma.customerProfile.aggregate({
    where: {
      brandId,
    },
    _avg: {
      lifetimeValue: true,
    },
  });

  const avgLTV = ltvStats._avg.lifetimeValue || 0;

  // Calculate growth rate
  const growthRate = previousPeriodRevenue > 0
    ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
    : 0;

  // Generate revenue chart data (daily aggregation)
  const revenueChart: Array<{ date: string; revenue: number }> = [];
  const dailyRevenue: Record<string, number> = {};

  purchaseEvents.forEach((event) => {
    const payload = event.payload as any;
    // Use order date from payload, fallback to createdAt
    const orderDateStr = payload.order_date || payload.created_at || payload.timestamp || payload.processed_at;
    const orderDate = orderDateStr ? new Date(orderDateStr) : event.createdAt;
    const date = orderDate.toISOString().split('T')[0];
    
    const revenue = parseFloat(
      payload.amount || payload.total_spent || payload.total || '0'
    );
    if (!isNaN(revenue) && revenue > 0) {
      dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
    }
  });

  // Fill in all dates in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    revenueChart.push({
      date: dateStr,
      revenue: dailyRevenue[dateStr] || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    totalCustomers: activeCustomers,
    avgLTV,
    growthRate,
    revenueChart,
    previousPeriodRevenue,
    previousPeriodOrders,
  };
}

