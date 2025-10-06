# Vendor Management System - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Stack](#technical-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Implementation Details](#implementation-details)
6. [Current Status](#current-status)
7. [Testing Credentials](#testing-credentials)
8. [Known Issues & Solutions](#known-issues--solutions)
9. [Future Enhancements](#future-enhancements)
10. [Deployment Guide](#deployment-guide)

---

## Project Overview

### Purpose
A web-based Vendor Management System that allows vendors to upload part files and managers to review and download them.

### User Roles
1. **Vendor**: Can upload parts with multiple files, view their own uploads
2. **Manager**: Can view all vendor uploads, filter/search, and download files

### Core Features
- Role-based authentication (Vendor/Manager)
- Multi-file upload per part
- File storage and download
- Upload history tracking
- Advanced filtering (by vendor, part number, date range)
- Clean, modern UI

---

## Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: React Hooks (useState, useEffect)
- **Notifications**: Sonner (toast notifications)

### Backend
- **BaaS**: Supabase
  - Authentication (Email/Password)
  - PostgreSQL Database
  - Storage (File uploads)
  - Row Level Security (RLS)

### Development Environment
- **IDE**: VS Code
- **OS**: Windows
- **Package Manager**: npm
- **Version Control**: Git

---

## System Architecture

### File Structure
```
vendor-management/
├── .env.local                 # Environment variables (Supabase credentials)
├── app/
│   ├── globals.css           # Global styles with Tailwind
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Login page
│   ├── vendor/               # Vendor portal
│   │   ├── layout.tsx        # Vendor layout with navigation
│   │   ├── upload/
│   │   │   └── page.tsx      # Upload form
│   │   └── my-uploads/
│   │       ├── page.tsx      # Uploads list
│   │       └── [id]/
│   │           └── page.tsx  # View files for specific upload
│   └── manager/              # Manager portal
│       ├── layout.tsx        # Manager layout with navigation
│       ├── dashboard/
│       │   └── page.tsx      # Dashboard with filters
│       └── uploads/
│           └── [id]/
│               └── page.tsx  # View files for any upload
├── lib/
│   ├── supabase.ts           # Supabase client & types
│   └── utils.ts              # Utility functions (from shadcn)
├── components/
│   └── ui/                   # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── card.tsx
│       ├── table.tsx
│       └── select.tsx
├── public/                   # Static assets
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
└── next.config.ts            # Next.js config
```

---

## Database Schema

### Tables

#### 1. users
Stores both vendors and managers in a single table with role differentiation.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('vendor', 'manager')),
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique identifier (UUID)
- `email`: User's email (unique)
- `name`: User's full name
- `role`: Either 'vendor' or 'manager'
- `company_name`: Company name (primarily for vendors)
- `created_at`: Timestamp of account creation

#### 2. uploads
Stores part upload metadata.

```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_uploads_vendor ON uploads(vendor_id);
```

**Fields:**
- `id`: Unique identifier
- `vendor_id`: Foreign key to users table
- `part_number`: Part identifier (e.g., "PART-001")
- `part_name`: Descriptive name
- `upload_date`: When the upload occurred
- `created_at`: Record creation timestamp

#### 3. files
Stores individual file records for each upload.

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_files_upload ON files(upload_id);
```

**Fields:**
- `id`: Unique identifier
- `upload_id`: Foreign key to uploads table
- `file_name`: Original filename
- `file_url`: Storage path in Supabase Storage
- `file_size`: File size in bytes
- `file_type`: MIME type
- `created_at`: Record creation timestamp

### Relationships
- **users → uploads**: One-to-Many (one vendor can have many uploads)
- **uploads → files**: One-to-Many (one upload can have many files)

---

## Row Level Security (RLS) Policies

All tables have RLS enabled for data security.

### users Table Policies

```sql
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Authenticated users can read all users (needed for vendor names)
CREATE POLICY "Authenticated users can read users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');
```

### uploads Table Policies

```sql
-- Vendors can read their own uploads, managers can read all
CREATE POLICY "Vendors can read own uploads" ON uploads
  FOR SELECT USING (
    auth.uid()::text = vendor_id::text OR
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'manager')
  );

-- Vendors can insert their own uploads
CREATE POLICY "Vendors can insert own uploads" ON uploads
  FOR INSERT WITH CHECK (auth.uid()::text = vendor_id::text);
```

### files Table Policies

```sql
-- Users can read files of accessible uploads
CREATE POLICY "Users can read files of accessible uploads" ON files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM uploads 
      WHERE uploads.id = files.upload_id 
      AND (
        uploads.vendor_id::text = auth.uid()::text OR
        EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'manager')
      )
    )
  );

-- Vendors can insert files for their own uploads
CREATE POLICY "Vendors can insert files for own uploads" ON files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploads 
      WHERE uploads.id = files.upload_id 
      AND uploads.vendor_id::text = auth.uid()::text
    )
  );
```

---

## Storage Configuration

### Bucket: part-files
- **Type**: Private
- **Purpose**: Store all uploaded part files

### Storage Policies

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'part-files');

-- Allow authenticated users to download
CREATE POLICY "Allow authenticated downloads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'part-files');
```

### Accepted File Types
- PDF (.pdf)
- Images (.png, .jpg, .jpeg)
- CAD files (.dwg, .dxf, .step, .stl)

### File Size Limit
- 10MB per file (adjustable in upload form)

---

## Implementation Details

### Authentication Flow

1. User enters email/password on login page
2. Supabase authenticates credentials
3. System queries `users` table to get user role
4. User redirected based on role:
   - Vendor → `/vendor/upload`
   - Manager → `/manager/dashboard`

### File Upload Process (Vendor)

1. Vendor fills form: Part Number, Part Name, selects files
2. On submit:
   - Creates record in `uploads` table
   - For each file:
     - Uploads to Supabase Storage (`part-files` bucket)
     - Creates record in `files` table with storage path
3. Success notification shown
4. Form resets

### File Storage Structure
```
part-files/
└── {upload_id}/
    ├── {timestamp}_{original_filename}
    ├── {timestamp}_{original_filename}
    └── ...
```

### Manager Dashboard Filters

**Filter Types:**
1. **Vendor Filter**: Dropdown of all vendors
2. **Part Number Search**: Text input (case-insensitive)
3. **Date Range**: From/To date pickers
4. **Clear Filters**: Reset all filters

**Filter Logic**: Client-side filtering using JavaScript array methods for instant results.

### Download Implementation

1. User clicks "Download" button
2. System calls `supabase.storage.from('part-files').download(fileUrl)`
3. Creates temporary blob URL
4. Programmatically triggers download via `<a>` element
5. Cleans up blob URL

---

## Current Status

### ✅ Completed Features

**Authentication:**
- ✅ Login page with email/password
- ✅ Role-based routing
- ✅ Session management
- ✅ Logout functionality

**Vendor Portal:**
- ✅ Upload form (part number, name, multiple files)
- ✅ My Uploads page with grid view
- ✅ View individual upload files
- ✅ Download files
- ✅ Navigation bar

**Manager Portal:**
- ✅ Dashboard with all uploads
- ✅ Filter by vendor
- ✅ Filter by part number
- ✅ Filter by date range
- ✅ View any vendor's files
- ✅ Download files
- ✅ Navigation bar

**Backend:**
- ✅ Supabase database tables
- ✅ Row Level Security policies
- ✅ Storage bucket with policies
- ✅ Test users created

**UI/UX:**
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Loading states
- ✅ Clean, modern interface

### 🔧 Issues Resolved During Development

1. **Tailwind CSS not loading**
   - **Solution**: Added `@import "tailwindcss";` to globals.css

2. **shadcn components not found**
   - **Solution**: Ran `npx shadcn@latest add button input label card table select`

3. **Supabase environment variables not loading**
   - **Solution**: Moved `.env.local` from `/public` to project root

4. **Vendor name showing as "Unknown" on manager dashboard**
   - **Solution**: Added RLS policy allowing authenticated users to read users table

5. **Infinite recursion in RLS policy**
   - **Solution**: Changed from complex nested query to simple `auth.role() = 'authenticated'` check

---

## Testing Credentials

### Vendor Account
- **Email**: vendor@test.com
- **Password**: vendor123
- **Company**: ABC Manufacturing
- **UUID**: 174b476e-2878-4041-9dde-971b69cd6473

### Manager Account
- **Email**: manager@test.com
- **Password**: manager123
- **Name**: John Manager
- **UUID**: [Insert actual UUID]

### Supabase Project
- **URL**: https://nqmrhmviqceeflimzjsr.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xbXJobXZpcWNlZWZsaW16anNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzY2MTYsImV4cCI6MjA3NTM1MjYxNn0.V-YGRxDd7yPgJ1vHGBTJ98wSaDn2wpzDnBKhJ4N2Yxw

---

## Future Enhancements

### Priority 1 (High Impact)
1. **Email Notifications**
   - Notify managers when vendors upload new parts
   - Use Supabase Functions + Email service (SendGrid/Resend)

2. **Pagination**
   - Implement for uploads lists when >50 records
   - Use Supabase `.range()` for server-side pagination

3. **Search Improvements**
   - Add full-text search across part names
   - Search within file names

4. **Bulk Actions**
   - Download all files for a part as ZIP
   - Bulk delete for managers

### Priority 2 (Quality of Life)
5. **File Preview**
   - PDF viewer inline
   - Image thumbnails
   - Use libraries like `react-pdf` or native browser preview

6. **Comments/Notes**
   - Managers can leave feedback on uploads
   - Add `comments` table with upload_id FK

7. **Upload Status**
   - Add status field: "Pending Review", "Approved", "Rejected"
   - Manager can change status

8. **Analytics Dashboard**
   - Charts showing upload trends
   - Vendor activity statistics
   - Use Recharts library

### Priority 3 (Advanced)
9. **Edit Uploads**
   - Allow vendors to update part details
   - Add version history

10. **User Management**
    - Admin role for creating new users
    - User invite system with email verification

11. **Audit Logs**
    - Track all actions (uploads, downloads, changes)
    - Compliance and security

12. **Advanced Permissions**
    - Manager teams with different access levels
    - Vendor-specific managers

---

## Deployment Guide

### Prerequisites
- Vercel account (free)
- GitHub account
- Supabase project (already set up)

### Step-by-Step Deployment to Vercel

#### 1. Prepare Repository
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Vendor Management System"

# Create GitHub repository and push
git remote add origin <your-github-repo-url>
git push -u origin main
```

#### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next

5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

6. Click "Deploy"

#### 3. Update Supabase Settings

In Supabase Dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Add your Vercel domain to **Site URL** and **Redirect URLs**
   - Example: `https://vendor-management.vercel.app`

#### 4. Test Production

1. Visit your Vercel URL
2. Test login for both vendor and manager
3. Test file upload and download
4. Verify all features work

### Post-Deployment Checklist
- ✅ Both user types can login
- ✅ File uploads work
- ✅ File downloads work
- ✅ Filters function correctly
- ✅ Navigation works on all pages
- ✅ Mobile responsive design works
- ✅ Error handling works (try invalid login)

---

## Troubleshooting Guide

### Common Issues

#### 1. "Module not found" errors
**Solution**: Run `npm install` to ensure all dependencies are installed

#### 2. Authentication not working
**Check**:
- `.env.local` file exists in root with correct Supabase credentials
- Supabase project is not paused
- Test users exist in Authentication → Users

#### 3. Files not uploading
**Check**:
- Storage bucket `part-files` exists
- Storage policies are configured
- File size under 10MB
- Browser console for specific errors

#### 4. Vendor name shows "Unknown"
**Check**:
- RLS policy "Authenticated users can read users" exists
- Vendor user has `company_name` filled in users table

#### 5. Manager can't see vendor uploads
**Check**:
- Manager role is set correctly in users table
- RLS policies on uploads table allow manager access

#### 6. Downloads not working
**Check**:
- Storage policies allow SELECT for authenticated users
- File URL is correct in files table
- Browser allows downloads (check popup blocker)

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Add shadcn component
npx shadcn@latest add <component-name>
```

---

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Database Maintenance

### Adding New Vendor
```sql
-- 1. Create auth user in Supabase Dashboard (Authentication → Users)
-- 2. Add to users table
INSERT INTO users (id, email, name, role, company_name)
VALUES 
  ('user-uuid-from-auth', 'newvendor@example.com', 'New Vendor', 'vendor', 'New Company Inc');
```

### Adding New Manager
```sql
-- 1. Create auth user in Supabase Dashboard
-- 2. Add to users table
INSERT INTO users (id, email, name, role, company_name)
VALUES 
  ('user-uuid-from-auth', 'newmanager@example.com', 'Manager Name', 'manager', NULL);
```

### Viewing All Uploads
```sql
SELECT 
  u.part_number,
  u.part_name,
  users.company_name as vendor,
  u.upload_date,
  COUNT(f.id) as file_count
FROM uploads u
LEFT JOIN users ON u.vendor_id = users.id
LEFT JOIN files f ON u.id = f.upload_id
GROUP BY u.id, users.company_name
ORDER BY u.upload_date DESC;
```

---

## API Reference (Supabase Queries)

### Authentication
```typescript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
await supabase.auth.signOut()
```

### Uploads
```typescript
// Create upload
const { data, error } = await supabase
  .from('uploads')
  .insert({
    vendor_id: userId,
    part_number: 'PART-001',
    part_name: 'Part Name'
  })
  .select()
  .single()

// Get vendor's uploads
const { data, error } = await supabase
  .from('uploads')
  .select('*, files(count)')
  .eq('vendor_id', userId)

// Get all uploads (manager)
const { data, error } = await supabase
  .from('uploads')
  .select(`
    *,
    users!uploads_vendor_id_fkey(company_name),
    files(count)
  `)
```

### Files
```typescript
// Upload file to storage
const { error } = await supabase.storage
  .from('part-files')
  .upload(filePath, file)

// Download file
const { data, error } = await supabase.storage
  .from('part-files')
  .download(filePath)

// Create file record
const { error } = await supabase
  .from('files')
  .insert({
    upload_id: uploadId,
    file_name: fileName,
    file_url: filePath,
    file_size: fileSize,
    file_type: fileType
  })
```

---

## Support & Contact

For questions or issues:
1. Check this documentation first
2. Review Supabase logs in Dashboard → Logs
3. Check browser console for client-side errors
4. Review Next.js terminal output for server errors

---

## Version History

### v1.1.0 (Current)
**Date**: October 7, 2025  
**Changes**:
- Fixed Tailwind CSS configuration (migrated from v4 beta to stable v3)
- Implemented professional corporate design system
- Added responsive layouts optimized for desktop and mobile
- Enhanced UI with proper spacing, colors, and visual hierarchy
- Added statistics cards on vendor and manager dashboards
- Improved navigation with active state indicators
- Enhanced file upload interface with better visual feedback

**Technical Updates**:
- Switched from Tailwind CSS v4 (beta) to v3.4.1 (stable)
- Removed Turbopack from dev scripts for better compatibility
- Created proper `tailwind.config.js` and `postcss.config.js`

### v1.0.0 
- ✅ Complete MVP with all core features
- ✅ Vendor and Manager portals
- ✅ File upload and download
- ✅ Filtering and search
- ✅ Responsive UI
- ✅ Full authentication and authorization

---

## License & Credits

**Built with:**
- Next.js 15 by Vercel
- Supabase (BaaS)
- Tailwind CSS
- shadcn/ui by shadcn
- React 19
- TypeScript

**Developer**: Built as a learning project
**Date**: October 2025

---

*Last Updated: October 7, 2025*