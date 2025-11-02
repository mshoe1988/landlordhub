// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

export const trackPurchase = (transactionId: string, value: number, currency: string = 'USD', items?: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items
    })
  }
}

export const trackSubscriptionUpgrade = (planName: string, planValue: number, planId: string) => {
  trackEvent('subscription_upgrade', {
    plan_name: planName,
    plan_value: planValue,
    plan_id: planId,
    event_category: 'subscription',
    event_label: planName
  })
  
  // Also track as a purchase for ecommerce
  trackPurchase(
    `upgrade_${Date.now()}`,
    planValue,
    'USD',
    [{
      item_id: planId,
      item_name: planName,
      category: 'subscription',
      quantity: 1,
      price: planValue
    }]
  )
}

export const trackFreeToPaidUpgrade = (planName: string, planValue: number, planId: string) => {
  // Track as a specific free-to-paid conversion
  trackEvent('free_to_paid_upgrade', {
    plan_name: planName,
    plan_value: planValue,
    plan_id: planId,
    event_category: 'conversion',
    event_label: `Free to ${planName}`,
    conversion_type: 'freemium_upgrade'
  })
  
  // Also track as a purchase for ecommerce
  trackPurchase(
    `free_to_paid_${Date.now()}`,
    planValue,
    'USD',
    [{
      item_id: planId,
      item_name: planName,
      category: 'subscription',
      quantity: 1,
      price: planValue
    }]
  )
  
  // Track as a subscription upgrade for consistency
  trackSubscriptionUpgrade(planName, planValue, planId)
}

export const trackSignUp = (method: string = 'email') => {
  trackEvent('sign_up', {
    method: method,
    event_category: 'engagement'
  })
}

export const trackLogin = (method: string = 'email') => {
  trackEvent('login', {
    method: method,
    event_category: 'engagement'
  })
}

export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || 'G-PGCTTFN3D3', {
      page_path: pagePath,
      page_title: pageTitle
    })
  }
}
