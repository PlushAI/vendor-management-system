'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase, type User } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, LogOut, Building2, Menu, X, User as UserIcon } from 'lucide-react'

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
  checkUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userData?.role !== 'manager') {
        router.push('/')
        return
      }

      setUser(userData)
    } catch (error: unknown) {
  console.error('Authentication error:', error)
  router.push('/')
} finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (path: string) => pathname === path

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900">Manager Portal</h1>
                <p className="text-xs text-slate-500">Review & Download</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/manager/dashboard">
                <Button 
                  variant={isActive('/manager/dashboard') ? 'default' : 'ghost'}
                  className={`flex items-center gap-2 ${isActive('/manager/dashboard') ? 'bg-blue-600' : ''}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              
              <div className="ml-4 pl-4 border-l border-slate-200 flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                  <UserIcon className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">{user?.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200">
              <div className="space-y-2">
                <div className="px-3 py-2 mb-3 bg-slate-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">{user?.name}</span>
                  </div>
                </div>
                <Link href="/manager/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant={isActive('/manager/dashboard') ? 'default' : 'ghost'}
                    className={`w-full justify-start gap-2 ${isActive('/manager/dashboard') ? 'bg-blue-600' : ''}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="w-full justify-start gap-2 text-slate-600"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}