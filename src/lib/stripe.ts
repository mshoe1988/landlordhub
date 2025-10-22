import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Client-side Stripe instance
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

export const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    properties: 1,
    features: [
      '1 Property',
      'Basic expense tracking',
      'Maintenance tasks',
      'Document storage',
      'Email support'
    ]
  },
  starter: {
    name: 'Starter',
    price: 19,
    properties: 5,
    features: [
      'Up to 5 Properties',
      'Advanced reporting',
      'CSV exports',
      'Email reminders',
      'Priority support'
    ]
  },
  pro: {
    name: 'Pro',
    price: 39,
    properties: -1, // Unlimited
    features: [
      'Unlimited Properties',
      'Advanced analytics',
      'Tax reporting',
      'API access',
      'White-label options',
      'Dedicated support'
    ]
  }
}

export const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
}

export const getPropertyLimit = (plan: string): number => {
  switch (plan) {
    case 'free':
      return 1
    case 'starter':
      return 5
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
