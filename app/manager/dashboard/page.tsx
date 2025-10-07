'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Filter, X, Building2, Package, Files, TrendingUp, Calendar, Hash, FileText, Search } from 'lucide-react'

type Upload = {
  id: string
  part_number: string
  part_name: string
  vendor_name: string
  vendor_id: string
  upload_date: string
  file_count: number
}

type Vendor = {
  id: string
  company_name: string
}

export default function ManagerDashboardPage() {
  const router = useRouter()
  const [uploads, setUploads] = useState<Upload[]>([])
  const [filteredUploads, setFilteredUploads] = useState<Upload[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedVendor, setSelectedVendor] = useState<string>('all')
  const [partNumberSearch, setPartNumberSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
  applyFilters()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [uploads, selectedVendor, partNumberSearch, dateFrom, dateTo])

  const fetchData = async () => {
    try {
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('users')
        .select('id, company_name')
        .eq('role', 'vendor')

      if (vendorsError) throw vendorsError
      setVendors(vendorsData || [])

      const { data: uploadsData, error: uploadsError } = await supabase
        .from('uploads')
        .select(`
          *,
          users!uploads_vendor_id_fkey(company_name),
          files(count)
        `)
        .order('upload_date', { ascending: false })

      if (uploadsError) throw uploadsError

      const formattedUploads = uploadsData.map((upload: Record<string, any>) => ({
        id: upload.id,
        part_number: upload.part_number,
        part_name: upload.part_name,
        vendor_name: (upload.users as { company_name?: string })?.company_name || 'Unknown',
        vendor_id: upload.vendor_id,
        upload_date: upload.upload_date,
        file_count: upload.files[0]?.count || 0
      }))

      setUploads(formattedUploads)
    } catch (error: unknown) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...uploads]

    if (selectedVendor !== 'all') {
      filtered = filtered.filter(upload => upload.vendor_id === selectedVendor)
    }

    if (partNumberSearch) {
      filtered = filtered.filter(upload =>
        upload.part_number.toLowerCase().includes(partNumberSearch.toLowerCase())
      )
    }

    if (dateFrom) {
      filtered = filtered.filter(upload =>
        new Date(upload.upload_date) >= new Date(dateFrom)
      )
    }

    if (dateTo) {
      filtered = filtered.filter(upload =>
        new Date(upload.upload_date) <= new Date(dateTo)
      )
    }

    setFilteredUploads(filtered)
  }

  const clearFilters = () => {
    setSelectedVendor('all')
    setPartNumberSearch('')
    setDateFrom('')
    setDateTo('')
  }

  const viewFiles = (uploadId: string) => {
    router.push(`/manager/uploads/${uploadId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const hasActiveFilters = selectedVendor !== 'all' || partNumberSearch || dateFrom || dateTo

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Monitor and manage all vendor uploads</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Uploads</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{uploads.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Vendors</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{vendors.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Parts</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{uploads.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Files</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {uploads.reduce((sum, upload) => sum + upload.file_count, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Files className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="mb-6 shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Filter Uploads</CardTitle>
                <CardDescription>Refine results by vendor, part number, or date range</CardDescription>
              </div>
            </div>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearFilters} 
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              >
                <X className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Vendor</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="part-search" className="text-sm font-semibold">Part Number</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="part-search"
                  placeholder="Search..."
                  value={partNumberSearch}
                  onChange={(e) => setPartNumberSearch(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from" className="text-sm font-semibold">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to" className="text-sm font-semibold">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploads Table */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Uploads</CardTitle>
              <CardDescription>
                Showing {filteredUploads.length} of {uploads.length} uploads
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUploads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-2">
                {uploads.length === 0 ? 'No uploads yet' : 'No uploads match your filters'}
              </p>
              {hasActiveFilters && (
                <Button 
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">Part Number</TableHead>
                    <TableHead className="font-semibold">Part Name</TableHead>
                    <TableHead className="font-semibold">Vendor</TableHead>
                    <TableHead className="font-semibold">Date Uploaded</TableHead>
                    <TableHead className="font-semibold">Files</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUploads.map((upload) => (
                    <TableRow key={upload.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-900">{upload.part_number}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-700">
                          <FileText className="w-4 h-4 text-slate-400" />
                          {upload.part_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{upload.vendor_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(upload.upload_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          <Files className="w-3.5 h-3.5" />
                          {upload.file_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewFiles(upload.id)}
                          className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Files
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}