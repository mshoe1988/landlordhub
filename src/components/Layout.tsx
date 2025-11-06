'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import {
  Home,
  Wrench,
  DollarSign,
  FileText,
  BarChart3,
  User,
  LogOut,
  HelpCircle,
  Users,
  Linkedin,
  Instagram,
  Facebook,
  Settings,
  MoreVertical,
  X,
  Building
} from 'lucide-react'
import HelpModal from './HelpModal'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const quickActionsRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    // Clear dashboard animation flag so animations play again on next sign-in
    sessionStorage.removeItem('dashboard-animated')
    await signOut()
    router.push('/login')
  }

  // Scroll to active tab on mobile
  useEffect(() => {
    if (navRef.current) {
      const activeTab = navRef.current.querySelector('[data-active="true"]') as HTMLElement
      if (activeTab) {
        activeTab.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center' 
        })
      }
    }
  }, [pathname])

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/get-subscription', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
        const data = await response.json()
        setSubscription(data.subscription)
      } catch (error) {
        console.error('Error checking subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [user])

  const isPremium = subscription && subscription.status === 'active' && subscription.plan !== 'free'
  const isPro = subscription && subscription.status === 'active' && subscription.plan === 'pro'

  const primaryNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Properties', href: '/properties', icon: Building },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  ]

  const secondaryNavigation = [
    { name: 'Expenses', href: '/expenses', icon: DollarSign },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Contacts', href: '/contacts', icon: Users, isProFeature: !isPro },
    { name: 'Account', href: '/account', icon: User },
  ]

  const navigation = [...primaryNavigation, ...secondaryNavigation]

  // Close quick actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false)
      }
    }
    if (showQuickActions) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showQuickActions])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E7F2EF' }}>
      {/* Header */}
      <div 
        className="py-2 px-4 md:px-6 shadow-lg relative" 
        style={{ 
          background: 'radial-gradient(circle at top center, rgba(255,255,255,0.15) 0%, transparent 60%), linear-gradient(180deg, #1E7D9A 0%, #0F5C70 100%)', 
          color: '#0A2540', 
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)', 
          borderBottom: '1px solid rgba(0,0,0,0.05)' 
        }}
      >
        <div className="flex items-center justify-center relative">
          <Link 
            href="/dashboard" 
            className="transition-all duration-300 relative z-10" 
            style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.3))' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 20px rgba(255,255,255,0.5))'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 15px rgba(255,255,255,0.3))'
            }}
          >
            <Image
              src="/landlord-hub-logo.svg?v=21"
              alt="LandlordHub Logo"
              width={650}
              height={260}
              className="w-auto h-auto max-w-[280px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[650px] cursor-pointer"
              priority
              quality={100}
              unoptimized
              style={{ 
                background: 'transparent !important',
                backgroundColor: 'transparent !important',
                backgroundImage: 'none !important',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <div 
        className="sticky top-0 z-50"
        style={{ 
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid rgba(28,124,99,0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
          borderRadius: '0 0 8px 8px'
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          {/* Desktop: Show all navigation items */}
          <div ref={navRef} className="hidden md:flex items-center justify-center space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isAccount = item.name === 'Account'
              
              return (
                <div key={item.name} className="relative">
                  {isAccount ? (
                    <div className="relative" ref={quickActionsRef}>
                      <Link
                        href={item.href}
                        data-active={isActive}
                        className={`flex flex-col items-center gap-1 font-medium transition-all duration-250 relative ${
                          (item as any).isProFeature ? 'px-3 pr-10' : 'px-3'
                        } ${
                          isActive ? 'text-[#1C7C63] font-semibold' : 'text-[#6B7B7A] hover:text-[#1C7C63]'
                        }`}
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 600 : 500
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = '#1C7C63'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = '#6B7B7A'
                          }
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <Icon 
                          className="w-5 h-5 transition-all duration-200"
                          style={{
                            transform: isActive ? 'translateY(-1px) scale(1.1)' : 'scale(1)'
                          }}
                        />
                        <span>{item.name}</span>
                        {isActive && (
                          <div 
                            style={{
                              content: '',
                              width: '30px',
                              height: '3px',
                              borderRadius: '3px',
                              background: 'linear-gradient(90deg, #1C7C63, #29A184)',
                              marginTop: '6px',
                              marginLeft: 'auto',
                              marginRight: 'auto'
                            }}
                          />
                        )}
                      </Link>
                      <button
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        className="absolute -top-1 -right-1 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        style={{ color: '#6B7B7A' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#1C7C63'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#6B7B7A'
                        }}
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      {showQuickActions && (
                        <div 
                          className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                          style={{ minWidth: '160px' }}
                        >
                          <Link
                            href="/account"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowQuickActions(false)}
                          >
                            <div className="flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              Settings
                            </div>
                          </Link>
                          <button
                            onClick={() => {
                              setShowQuickActions(false)
                              handleSignOut()
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      data-active={isActive}
                      className={`flex flex-col items-center gap-1 font-medium transition-all duration-250 relative ${
                        (item as any).isProFeature ? 'px-3 pr-10' : 'px-3'
                      } ${
                        isActive ? 'text-[#1C7C63] font-semibold' : 'text-[#6B7B7A] hover:text-[#1C7C63]'
                      }`}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 600 : 500
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#1C7C63'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#6B7B7A'
                        }
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <Icon 
                        className="w-5 h-5 transition-all duration-200"
                        style={{
                          transform: isActive ? 'translateY(-1px) scale(1.1)' : 'scale(1)'
                        }}
                      />
                      <span>{item.name}</span>
                      {isActive && (
                        <div 
                          style={{
                            content: '',
                            width: '30px',
                            height: '3px',
                            borderRadius: '3px',
                            background: 'linear-gradient(90deg, #1C7C63, #29A184)',
                            marginTop: '6px',
                            marginLeft: 'auto',
                            marginRight: 'auto'
                          }}
                        />
                      )}
                      {(item as any).isProFeature && (
                        <span 
                          className="absolute -top-1 right-1 text-white text-xs font-semibold whitespace-nowrap"
                          style={{
                            background: 'linear-gradient(90deg, #C864E4, #EC9CFB)',
                            borderRadius: '6px',
                            padding: '3px 7px',
                            boxShadow: '0 0 6px rgba(200,100,228,0.4)',
                            fontSize: '0.75rem'
                          }}
                        >
                          PRO
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile: Show primary navigation with More button */}
          <div className="md:hidden flex items-center justify-center space-x-1 overflow-x-auto">
            {primaryNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center gap-1 font-medium transition-all duration-250 relative px-2"
                  style={{
                    color: isActive ? '#1C7C63' : '#6B7B7A',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 600 : 500,
                    minWidth: '60px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#1C7C63'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      const icon = e.currentTarget.querySelector('svg')
                      if (icon) {
                        icon.style.transform = 'scale(1.15)'
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#6B7B7A'
                      e.currentTarget.style.transform = 'translateY(0)'
                      const icon = e.currentTarget.querySelector('svg')
                      if (icon) {
                        icon.style.transform = 'scale(1)'
                      }
                    }
                  }}
                >
                  <Icon 
                    className="w-4 h-4 transition-all duration-200"
                    style={{
                      transform: isActive ? 'translateY(-1px) scale(1.1)' : 'scale(1)'
                    }}
                  />
                  <span className="text-xs">{item.name}</span>
                  {isActive && (
                    <div 
                      style={{
                        width: '24px',
                        height: '3px',
                        borderRadius: '3px',
                        background: 'linear-gradient(90deg, #1C7C63, #29A184)',
                        marginTop: '4px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                      }}
                    />
                  )}
                </Link>
              )
            })}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex flex-col items-center gap-1 font-medium transition-all duration-250 relative px-2"
              style={{
                color: showMoreMenu ? '#1C7C63' : '#6B7B7A',
                padding: '8px 12px',
                fontSize: '0.8rem',
                fontWeight: showMoreMenu ? 600 : 500,
                minWidth: '60px'
              }}
              onMouseEnter={(e) => {
                if (!showMoreMenu) {
                  e.currentTarget.style.color = '#1C7C63'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  const icon = e.currentTarget.querySelector('svg')
                  if (icon) {
                    icon.style.transform = 'scale(1.15)'
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!showMoreMenu) {
                  e.currentTarget.style.color = '#6B7B7A'
                  e.currentTarget.style.transform = 'translateY(0)'
                  const icon = e.currentTarget.querySelector('svg')
                  if (icon) {
                    icon.style.transform = 'scale(1)'
                  }
                }
              }}
            >
              <MoreVertical 
                className="w-4 h-4 transition-all duration-200"
                style={{
                  transform: showMoreMenu ? 'translateY(-1px) scale(1.1)' : 'scale(1)'
                }}
              />
              <span className="text-xs">More</span>
              {showMoreMenu && (
                <div 
                  style={{
                    width: '24px',
                    height: '3px',
                    borderRadius: '3px',
                    background: 'linear-gradient(90deg, #1C7C63, #29A184)',
                    marginTop: '4px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile More Menu Sheet */}
      {showMoreMenu && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMoreMenu(false)}
          />
          <div 
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 shadow-2xl"
            style={{ maxHeight: '70vh', overflowY: 'auto' }}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: '#0A2540' }}>More</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: '#6B7B7A' }} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {secondaryNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200"
                    style={{
                      backgroundColor: isActive ? '#F7FBF9' : 'transparent',
                      color: isActive ? '#1C7C63' : '#0A2540'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#F7FBF9'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                    {(item as any).isProFeature && (
                      <span 
                        className="ml-auto text-white text-xs font-semibold"
                        style={{
                          background: 'linear-gradient(90deg, #C864E4, #EC9CFB)',
                          borderRadius: '6px',
                          padding: '3px 7px',
                          boxShadow: '0 0 6px rgba(200,100,228,0.4)'
                        }}
                      >
                        PRO
                      </span>
                    )}
                  </Link>
                )
              })}
              <div className="border-t border-gray-200 mt-4 pt-4">
                <button
                  onClick={() => {
                    setShowMoreMenu(false)
                    handleSignOut()
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 w-full text-left"
                  style={{
                    color: '#0A2540'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F7FBF9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>

      {/* Footer */}
      <footer className="text-white py-8 mt-12" style={{ backgroundColor: '#0A2540' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-6">
              <p className="text-gray-300 text-sm">© 2025 LandlordHub | Simplify Life. Maximize Rentals.</p>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.linkedin.com/company/landlordhub"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LandlordHub on LinkedIn"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://www.instagram.com/landlordhubapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="@landlordhubapp on Instagram"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://www.facebook.com/landlordhubapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LandlordHub on Facebook"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Need Help?</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Help Modal */}
      <HelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
      />
    </div>
  )
}
