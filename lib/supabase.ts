import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  name: string
  role: 'vendor' | 'manager'
  company_name?: string
}

export type Upload = {
  id: string
  vendor_id: string
  part_number: string
  part_name: string
  upload_date: string
  vendor_name?: string
  file_count?: number
}

export type FileRecord = {
  id: string
  upload_id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
}