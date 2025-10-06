'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, Calendar, Hash, FileText, Files, Package } from 'lucide-react'

type Upload = {
  id: string
  part_number: string
  part_name: string
  upload_date: string
  file_count: number
}

export default function MyUploadsPage() {
  const router = useRouter()
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: uploadsData, error } = await supabase
        .from('uploads')
        .select('*, files(count)')
        .eq('vendor_id', user.id)
        .order('upload_date', { ascending: false })

      if (error) throw error

      const formattedUploads = uploadsData.map((upload: any) => ({
        id: upload.id,
        part_number: upload.part_number,
        part_name: upload.part_name,
        upload_date: new Date(upload.upload_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        file_count: upload.files[0]?.count || 0
      }))

      setUploads(formattedUploads)
    } catch (error) {
      console.error('Error fetching uploads:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewFiles = (uploadId: string) => {
    router.push(`/vendor/my-uploads/${uploadId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your uploads...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Uploads</h1>
            <p className="text-slate-600">View and manage all your uploaded parts</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Parts</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{uploads.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Files</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {uploads.reduce((sum, upload) => sum + upload.file_count, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Files className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Latest Upload</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {uploads.length > 0 ? uploads[0].upload_date : 'No uploads'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploads Table */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <CardTitle>Upload History</CardTitle>
          <CardDescription>
            All parts you've uploaded with their associated files
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {uploads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-2">No uploads yet</p>
              <p className="text-sm text-slate-500 mb-4">Start by uploading your first part</p>
              <Button 
                onClick={() => router.push('/vendor/upload')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Upload Part
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">Date Uploaded</TableHead>
                    <TableHead className="font-semibold">Part Number</TableHead>
                    <TableHead className="font-semibold">Part Name</TableHead>
                    <TableHead className="font-semibold">Files</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads.map((upload) => (
                    <TableRow key={upload.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {upload.upload_date}
                        </div>
                      </TableCell>
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          <Files className="w-3.5 h-3.5" />
                          {upload.file_count} file{upload.file_count !== 1 ? 's' : ''}
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