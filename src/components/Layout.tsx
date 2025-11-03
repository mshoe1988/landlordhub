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
  Facebook
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
  const navRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Properties', href: '/properties', icon: Home },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Expenses', href: '/expenses', icon: DollarSign },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Contacts', href: '/contacts', icon: Users, isProFeature: !isPro },
    { name: 'Account', href: '/account', icon: User },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white p-4 md:p-6 shadow-lg" style={{ backgroundColor: '#DFE9F7' }}>
        <div className="flex items-center justify-center">
          <Link href="/dashboard" className="hover:opacity-90 transition-opacity">
            <Image
              src="/landlord-hub-logo.svg?v=21"
              alt="LandlordHub Logo"
              width={650}
              height={260}
              className="w-auto h-auto max-w-[280px] sm:max-w-[350px] md:max-w-[450px] lg:max-w-[650px] drop-shadow-[0_0_15px_rgba(255,255,255,1)] drop-shadow-[0_0_30px_rgba(255,255,255,0.6)] cursor-pointer"
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
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div ref={navRef} className="flex space-x-8 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  data-active={isActive}
                  className={`py-4 border-b-2 font-medium transition-colors relative ${
                    item.isProFeature ? 'px-2 pr-8' : 'px-2'
                  } ${
                    isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="inline w-5 h-5 mr-2" />
                  {item.name}
                  {item.isProFeature && (
                    <span className="absolute -top-1 right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                      PRO
                    </span>
                  )}
                </Link>
              )
            })}
            <button
              onClick={handleSignOut}
              className="py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              <LogOut className="inline w-5 h-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-6">
              <p className="text-gray-300">© 2025 LandlordHub. All rights reserved.</p>
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
