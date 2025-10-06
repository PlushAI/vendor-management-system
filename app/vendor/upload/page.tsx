'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, FileUp, CheckCircle2, Hash, FileText } from 'lucide-react'

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

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

      const filePromises = Array.from(files).map(async (file) => {
        const fileName = `${uploadData.id}/${Date.now()}_${file.name}`
        
        const { error: storageError } = await supabase.storage
          .from('part-files')
          .upload(fileName, file)

        if (storageError) throw storageError

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
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload Part Files</h1>
        <p className="text-slate-600">Add new parts with technical documentation and drawings</p>
      </div>

      {/* Upload Form Card */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <FileUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Part Information</CardTitle>
              <CardDescription>Enter part details and upload related files</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Part Number */}
            <div className="space-y-2">
              <Label htmlFor="part-number" className="text-sm font-semibold flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-500" />
                Part Number
              </Label>
              <Input
                id="part-number"
                placeholder="e.g., PART-001, BRK-2024-001"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="h-11"
                required
              />
              <p className="text-xs text-slate-500">Unique identifier for this part</p>
            </div>

            {/* Part Name */}
            <div className="space-y-2">
              <Label htmlFor="part-name" className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Part Name
              </Label>
              <Input
                id="part-name"
                placeholder="e.g., Engine Mount Bracket, Hydraulic Valve"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                className="h-11"
                required
              />
              <p className="text-xs text-slate-500">Descriptive name for this part</p>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-sm font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4 text-slate-500" />
                Upload Files
              </Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                  accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf,.step,.stl"
                  className="h-11"
                  required
                />
                <p className="text-xs text-slate-500 mt-3">
                  Accepted formats: PDF, PNG, JPG, DWG, DXF, STEP, STL (Max 10MB per file)
                </p>
              </div>
              {files && files.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                  </span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={uploading} 
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Part Files
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Upload Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure part numbers are unique and follow your naming convention</li>
          <li>• Include all relevant technical drawings and documentation</li>
          <li>• Multiple files can be uploaded at once for the same part</li>
          <li>• Files are immediately visible to managers after upload</li>
        </ul>
      </div>
    </div>
  )
}