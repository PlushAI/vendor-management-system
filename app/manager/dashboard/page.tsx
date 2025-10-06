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
import { Eye, Filter, X } from 'lucide-react'

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

  // Filter states
  const [selectedVendor, setSelectedVendor] = useState<string>('all')
  const [partNumberSearch, setPartNumberSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [uploads, selectedVendor, partNumberSearch, dateFrom, dateTo])

  const fetchData = async () => {
    try {
      // Fetch all vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('users')
        .select('id, company_name')
        .eq('role', 'vendor')

      if (vendorsError) throw vendorsError
      setVendors(vendorsData || [])

      // Fetch all uploads with vendor info
const { data: uploadsData, error: uploadsError } = await supabase
  .from('uploads')
  .select(`
    *,
    users!uploads_vendor_id_fkey(company_name),
    files(count)
  `)
  .order('upload_date', { ascending: false })

  console.log('Upload data:', uploadsData) // ADD THIS LINE

      if (uploadsError) throw uploadsError

const formattedUploads = uploadsData.map((upload: any) => ({
  id: upload.id,
  part_number: upload.part_number,
  part_name: upload.part_name,
  vendor_name: upload.users?.company_name || 'Unknown',
  vendor_id: upload.vendor_id,
  upload_date: upload.upload_date,
  file_count: upload.files[0]?.count || 0
}))

      setUploads(formattedUploads)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...uploads]

    // Filter by vendor
    if (selectedVendor !== 'all') {
      filtered = filtered.filter(upload => upload.vendor_id === selectedVendor)
    }

    // Filter by part number
    if (partNumberSearch) {
      filtered = filtered.filter(upload =>
        upload.part_number.toLowerCase().includes(partNumberSearch.toLowerCase())
      )
    }

    // Filter by date range
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
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter uploads by vendor, part number, or date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger>
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
              <Label htmlFor="part-search">Part Number</Label>
              <Input
                id="part-search"
                placeholder="Search..."
                value={partNumberSearch}
                onChange={(e) => setPartNumberSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Uploads</CardTitle>
          <CardDescription>
            Showing {filteredUploads.length} of {uploads.length} uploads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUploads.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              {uploads.length === 0 ? 'No uploads yet' : 'No uploads match your filters'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date Uploaded</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">{upload.part_number}</TableCell>
                    <TableCell>{upload.part_name}</TableCell>
                    <TableCell>{upload.vendor_name}</TableCell>
                    <TableCell>{formatDate(upload.upload_date)}</TableCell>
                    <TableCell>{upload.file_count} file{upload.file_count !== 1 ? 's' : ''}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewFiles(upload.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Files
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}