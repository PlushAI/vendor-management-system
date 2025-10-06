'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, type User } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Upload, List, LogOut } from 'lucide-react'

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
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
    } catch (error) {
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-slate-800">
                {user?.company_name || 'Vendor Portal'}
              </h1>
              <div className="flex space-x-4">
                <Link href="/vendor/upload">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                </Link>
                <Link href="/vendor/my-uploads">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    My Uploads
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}