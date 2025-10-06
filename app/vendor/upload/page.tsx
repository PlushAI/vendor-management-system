'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'

export default function VendorUploadPage() {
  const [partNumber, setPartNumber] = useState('')
  const [partName, setPartName] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!files || files.length === 0) {
      toast.error('Please select at least one file')
      return
    }

    setUploading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create upload record
      const { data: uploadData, error: uploadError } = await supabase
        .from('uploads')
        .insert({
          vendor_id: user.id,
          part_number: partNumber,
          part_name: partName,
        })
        .select()
        .single()

      if (uploadError) throw uploadError

      // Upload each file
      const filePromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${uploadData.id}/${Date.now()}_${file.name}`
        
        const { error: storageError } = await supabase.storage
          .from('part-files')
          .upload(fileName, file)

        if (storageError) throw storageError

        const { data: { publicUrl } } = supabase.storage
          .from('part-files')
          .getPublicUrl(fileName)

        // Save file record
        return supabase.from('files').insert({
          upload_id: uploadData.id,
          file_name: file.name,
          file_url: fileName,
          file_size: file.size,
          file_type: file.type,
        })
      })

      await Promise.all(filePromises)

      toast.success('Files uploaded successfully!')
      
      // Reset form
      setPartNumber('')
      setPartName('')
      setFiles(null)
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (error: any) {
      toast.error(error.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Upload Part Files</CardTitle>
        <CardDescription>
          Upload files for a new part. You can select multiple files at once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="part-number">Part Number</Label>
            <Input
              id="part-number"
              placeholder="e.g., PART-001"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="part-name">Part Name</Label>
            <Input
              id="part-name"
              placeholder="e.g., Engine Mount Bracket"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload Files</Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf,.step,.stl"
              required
            />
            {files && files.length > 0 && (
              <p className="text-sm text-slate-600">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <Button type="submit" disabled={uploading} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}