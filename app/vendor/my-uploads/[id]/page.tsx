'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, ArrowLeft, FileText, HardDrive, Calendar, Hash, Package } from 'lucide-react'
import { toast } from 'sonner'

type FileRecord = {
  id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
}

type UploadDetails = {
  part_number: string
  part_name: string
  upload_date: string
}

export default function ViewFilesPage() {
  const params = useParams()
  const router = useRouter()
  const [files, setFiles] = useState<FileRecord[]>([])
  const [uploadDetails, setUploadDetails] = useState<UploadDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  fetchFiles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

  const fetchFiles = async () => {
    try {
      const uploadId = params.id as string

      const { data: uploadData, error: uploadError } = await supabase
        .from('uploads')
        .select('part_number, part_name, upload_date')
        .eq('id', uploadId)
        .single()

      if (uploadError) throw uploadError

      setUploadDetails({
        ...uploadData,
        upload_date: new Date(uploadData.upload_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      })

      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('upload_id', uploadId)

      if (filesError) throw filesError

      setFiles(filesData)
    } catch (error: unknown) {
      console.error('Error fetching files:', error)
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('part-files')
        .download(fileUrl)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('File downloaded successfully')
    } catch (error: unknown) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('image')) return '🖼️'
    return '📁'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-6 hover:bg-slate-100"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to My Uploads
      </Button>

      {/* Part Details Card */}
      <Card className="mb-6 shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-slate-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl shadow-md">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">{uploadDetails?.part_number}</CardTitle>
                <CardDescription className="text-base">
                  {uploadDetails?.part_name}
                </CardDescription>
                <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>Uploaded on {uploadDetails?.upload_date}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                <FileText className="w-4 h-4" />
                {files.length} File{files.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Files Table */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <CardTitle>Attached Files</CardTitle>
          <CardDescription>
            All documentation and drawings for this part
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {files.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No files found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">File Name</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Size</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                          <span className="font-medium text-slate-900">{file.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                          {file.file_type || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <HardDrive className="w-4 h-4" />
                          {formatFileSize(file.file_size)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(file.file_url, file.file_name)}
                          className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
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