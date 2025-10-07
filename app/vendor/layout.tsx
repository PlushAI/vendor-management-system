'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase, type User } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Upload, List, LogOut, Building2, Menu, X } from 'lucide-react'

export default function VendorLayout({
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

      if (userData?.role !== 'vendor') {
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
            {/* Logo and Company Name */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900">
                  {user?.company_name || 'Vendor Portal'}
                </h1>
                <p className="text-xs text-slate-500">Vendor Dashboard</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/vendor/upload">
                <Button 
                  variant={isActive('/vendor/upload') ? 'default' : 'ghost'}
                  className={`flex items-center gap-2 ${isActive('/vendor/upload') ? 'bg-blue-600' : ''}`}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              </Link>
              <Link href="/vendor/my-uploads">
                <Button 
                  variant={isActive('/vendor/my-uploads') ? 'default' : 'ghost'}
                  className={`flex items-center gap-2 ${isActive('/vendor/my-uploads') ? 'bg-blue-600' : ''}`}
                >
                  <List className="w-4 h-4" />
                  My Uploads
                </Button>
              </Link>
              <div className="ml-4 pl-4 border-l border-slate-200">
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
                <Link href="/vendor/upload" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant={isActive('/vendor/upload') ? 'default' : 'ghost'}
                    className={`w-full justify-start gap-2 ${isActive('/vendor/upload') ? 'bg-blue-600' : ''}`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                </Link>
                <Link href="/vendor/my-uploads" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant={isActive('/vendor/my-uploads') ? 'default' : 'ghost'}
                    className={`w-full justify-start gap-2 ${isActive('/vendor/my-uploads') ? 'bg-blue-600' : ''}`}
                  >
                    <List className="w-4 h-4" />
                    My Uploads
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