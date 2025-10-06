'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye } from 'lucide-react'

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
        upload_date: new Date(upload.upload_date).toLocaleDateString(),
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
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Uploads</CardTitle>
        <CardDescription>
          View all your uploaded parts and files
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploads.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No uploads yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Uploaded</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Part Name</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploads.map((upload) => (
                <TableRow key={upload.id}>
                  <TableCell>{upload.upload_date}</TableCell>
                  <TableCell className="font-medium">{upload.part_number}</TableCell>
                  <TableCell>{upload.part_name}</TableCell>
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
  )
}