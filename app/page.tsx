'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Building2, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (userError) throw userError

      toast.success('Welcome back!')

      if (userData.role === 'vendor') {
        router.push('/vendor/upload')
      } else {
        router.push('/manager/dashboard')
      }
    } catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Invalid credentials. Please try again.'
  toast.error(errorMessage)
} finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center p-4">
      {/* Logo/Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4 shadow-lg">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Vendor Management</h1>
        <p className="text-slate-600">Streamline your part uploads and reviews</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-700 mb-3 text-center">Demo Accounts</p>
            <div className="space-y-2 text-xs">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="font-medium text-blue-900 mb-1">Vendor Access</p>
                <p className="text-blue-700">vendor@test.com / vendor123</p>
              </div>
              <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
                <p className="font-medium text-slate-900 mb-1">Manager Access</p>
                <p className="text-slate-700">manager@test.com / manager123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-sm text-slate-500">
        © 2025 Vendor Management System. All rights reserved.
      </p>
    </div>
  )
}