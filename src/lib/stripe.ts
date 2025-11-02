import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance (only create if key is available)
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null

// Client-side Stripe instance
export const getStripe = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return null
  }
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

export const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    properties: 1,
    description: 'For single-property owners building a strong foundation.',
    features: [
      '1 Property',
      'Basic income & expense tracking',
      'Maintenance task tracking',
      'Secure document storage',
      'Email support'
    ]
  },
  basic: {
    name: 'Basic',
    price: 19,
    properties: 5,
    description: 'Smart tools for growing portfolios.',
    features: [
      'Manage 2–5 properties',
      'Advanced reporting for better financial visibility',
      'CSV exports for bookkeeping and tax tools',
      'Automated email reminders for tasks & deadlines',
      'Fast and reliable email support'
    ]
  },
  growth: {
    name: 'Growth',
    price: 29,
    properties: 10,
    description: 'Efficient management for expanding rental businesses.',
    features: [
      'Manage 6–10 properties',
      'Enhanced analytics to improve portfolio performance',
      'Simplified tax reporting',
      'Priority dedicated support',
      'Includes all Basic features'
    ]
  },
  pro: {
    name: 'Pro',
    price: 39,
    properties: -1, // Unlimited
    description: 'Full-service rental management for unlimited portfolios.',
    features: [
      'Unlimited properties included',
      'Comprehensive advanced analytics',
      'Full tax reporting capabilities',
      'Interactive tenant & vendor management',
      'Priority support with fastest response times',
      'All Growth features included'
    ]
  }
}

export const STRIPE_PRICE_IDS = {
  // Subscription Plans
  free: process.env.STRIPE_FREE_PRICE_ID || '',
  basic: process.env.STRIPE_BASIC_PRICE_ID || '',
  growth: process.env.STRIPE_GROWTH_PRICE_ID || '',
  pro: process.env.STRIPE_PRO_PRICE_ID || '',
}

export const getPropertyLimit = (plan: string): number => {
  switch (plan) {
    case 'free':
      return 1
    case 'basic':
      return 5
    case 'growth':
      return 10
    case 'pro':
      return -1 // Unlimited
    default:
      return 1
  }
}

export const canAddProperty = (currentPlan: string, currentCount: number): boolean => {
  const limit = getPropertyLimit(currentPlan)
  return limit === -1 || currentCount < limit
}
