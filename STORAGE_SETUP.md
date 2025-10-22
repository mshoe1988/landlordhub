# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for file uploads in LandlordHub.

## 1. Create Storage Bucket

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);
```

## 2. Set Up Storage Policies

Run the following SQL to create Row Level Security policies for the documents bucket:

```sql
-- Create storage policies for the documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 3. File Upload Features

### Supported File Types
- **PDF** (.pdf)
- **Images** (.jpg, .jpeg, .png)
- **Documents** (.doc, .docx)

### File Size Limits
- **Maximum size**: 5MB per file
- **Validation**: Client-side and server-side validation

### Storage Structure
Files are organized in the following structure:
```
documents/
├── {user_id}/
│   ├── receipts/
│   │   └── {timestamp}-{random}.{ext}
│   └── documents/
│       └── {timestamp}-{random}.{ext}
```

## 4. Features Implemented

### Expenses Page
- ✅ File upload for receipts (PDF, JPG, PNG)
- ✅ Receipt preview and download links
- ✅ File validation (size and type)
- ✅ Upload progress indication

### Documents Page
- ✅ File upload for documents (PDF, DOC, DOCX, JPG, PNG)
- ✅ Document preview and download links
- ✅ File validation (size and type)
- ✅ Upload progress indication

### Security Features
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access their own files
- ✅ Secure file upload with user authentication
- ✅ File type and size validation

## 5. Testing the Setup

1. **Create a test expense** with a receipt upload
2. **Create a test document** with file upload
3. **Verify files are accessible** via the download links
4. **Test file validation** by trying to upload invalid files
5. **Check storage bucket** in Supabase dashboard

## 6. Troubleshooting

### Common Issues

**Files not uploading:**
- Check Supabase Storage policies
- Verify bucket exists and is public
- Check file size and type restrictions

**Files not accessible:**
- Verify RLS policies are correct
- Check if bucket is set to public
- Ensure user is authenticated

**Upload errors:**
- Check file size (must be < 5MB)
- Verify file type is supported
- Check network connection

### Debug Steps

1. Check browser console for errors
2. Verify Supabase Storage bucket exists
3. Check RLS policies in Supabase dashboard
4. Test with smaller files first
5. Verify authentication is working

## 7. Production Considerations

- **File cleanup**: Implement cleanup for deleted records
- **CDN**: Consider using Supabase CDN for better performance
- **Backup**: Set up regular backups of storage bucket
- **Monitoring**: Monitor storage usage and costs
- **Security**: Regularly review and update RLS policies

## 8. Cost Optimization

- **File compression**: Consider compressing images before upload
- **Cleanup**: Remove orphaned files regularly
- **Size limits**: Enforce reasonable file size limits
- **Monitoring**: Track storage usage to avoid unexpected costs
