'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, ArrowLeft } from 'lucide-react'
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
  vendor_name: string
}

export default function ManagerViewFilesPage() {
  const params = useParams()
  const router = useRouter()
  const [files, setFiles] = useState<FileRecord[]>([])
  const [uploadDetails, setUploadDetails] = useState<UploadDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const uploadId = params.id as string

      // Get upload details with vendor info
      const { data: uploadData, error: uploadError } = await supabase
        .from('uploads')
        .select(`
          part_number,
          part_name,
          upload_date,
          vendor:users!uploads_vendor_id_fkey(company_name)
        `)
        .eq('id', uploadId)
        .single()

      if (uploadError) throw uploadError

setUploadDetails({
  part_number: uploadData.part_number,
  part_name: uploadData.part_name,
  upload_date: new Date(uploadData.upload_date).toLocaleDateString(),
  vendor_name: (uploadData.vendor as any)?.company_name || 'Unknown'
})

      // Get files
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('upload_id', uploadId)

      if (filesError) throw filesError

      setFiles(filesData)
    } catch (error) {
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
    } catch (error) {
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

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Files for {uploadDetails?.part_number}</CardTitle>
          <CardDescription>
            {uploadDetails?.part_name} • Vendor: {uploadDetails?.vendor_name} • Uploaded on {uploadDetails?.upload_date}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No files found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">{file.file_name}</TableCell>
                    <TableCell>{file.file_type || 'Unknown'}</TableCell>
                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(file.file_url, file.file_name)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
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