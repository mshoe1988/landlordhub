'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Wrench,
  DollarSign,
  FileText,
  BarChart3,
  User,
  LogOut
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Properties', href: '/properties', icon: Home },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Expenses', href: '/expenses', icon: DollarSign },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Account', href: '/account', icon: User },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold">🏠 LandlordHub</h1>
        <p className="text-blue-100 mt-1">Simple property management for 1-10 units</p>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                    isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="inline w-5 h-5 mr-2" />
                  {item.name}
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
    </div>
  )
}
