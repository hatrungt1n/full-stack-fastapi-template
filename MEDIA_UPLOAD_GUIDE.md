# Media Upload Implementation Guide

## Overview
This guide shows how to add image and video support to your FastAPI items using Cloudinary as the storage solution.

## 🥇 Recommended Solution: Cloudinary

### Why Cloudinary?
- **Free Tier**: 25 GB storage, 25 GB bandwidth/month
- **Automatic Optimization**: Images and videos are automatically optimized
- **CDN**: Global content delivery network included
- **Transformations**: Resize, crop, format conversion on-the-fly
- **Easy Integration**: Simple API with Python SDK

### Setup Steps

#### 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Get your credentials from the dashboard:
   - Cloud Name
   - API Key
   - API Secret

#### 2. Environment Configuration
Add these variables to your `.env` file:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=ml_default
```

#### 3. Backend Implementation

The backend has been updated with:

**Dependencies Added:**
- `cloudinary<2.0.0,>=1.37.0`
- `python-magic<1.0.0,>=0.4.27`

**New Files:**
- `backend/app/core/media.py` - Media upload service
- Updated `backend/app/models.py` - Added media fields
- Updated `backend/app/api/routes/items.py` - New upload endpoints

**Database Changes:**
- Added `image_url`, `video_url`, `media_type` fields to items table
- Migration file: `41fceeeff981_add_media_fields_to_items.py`

#### 4. Frontend Implementation

**Dependencies Added:**
- `react-dropzone: ^14.2.3`

**New Files:**
- `frontend/src/components/ui/media-upload.tsx` - Drag & drop upload component
- `frontend/src/hooks/useMediaUpload.ts` - Upload hook
- `frontend/src/components/items/item-form-with-media.tsx` - Example form integration

## 🥈 Alternative Solutions

### 1. AWS S3 (Pay-as-you-go)
**Cost**: ~$0.023/GB/month + transfer costs
**Pros**: 
- Highly scalable
- Reliable
- Good for high-traffic applications
**Cons**: 
- More complex setup
- No free tier for storage

### 2. Google Cloud Storage (Pay-as-you-go)
**Cost**: ~$0.020/GB/month + transfer costs
**Pros**: 
- Good integration with Google services
- Reliable
**Cons**: 
- More complex setup
- No free tier for storage

### 3. Local Storage (Free)
**Cost**: Free (uses your server storage)
**Pros**: 
- Completely free
- Full control
**Cons**: 
- Limited by server storage
- No CDN
- Manual backup management
- Not scalable

### 4. Firebase Storage (Free Tier)
**Free Tier**: 5 GB storage, 1 GB/day transfer
**Pros**: 
- Good free tier
- Easy integration
- Google ecosystem
**Cons**: 
- Smaller free tier than Cloudinary
- Less image optimization features

## 🥉 Local Development Setup

### Option 1: Use Cloudinary (Recommended)
1. Set up Cloudinary account
2. Add credentials to `.env`
3. Test uploads immediately

### Option 2: Mock Storage (Development Only)
For development without external services:

```python
# backend/app/core/media.py (development mode)
import os
from pathlib import Path

class MockMediaService:
    def __init__(self):
        self.upload_dir = Path("uploads")
        self.upload_dir.mkdir(exist_ok=True)
    
    def upload_file(self, file: UploadFile) -> dict:
        # Save to local directory
        file_path = self.upload_dir / f"{uuid.uuid4()}_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        
        return {
            "url": f"/uploads/{file_path.name}",
            "public_id": str(file_path),
            "resource_type": "image" if file.content_type.startswith("image/") else "video"
        }
```

## API Endpoints

### Upload Media
```http
POST /api/v1/items/upload-media
Content-Type: multipart/form-data

file: [binary file]
```

### Add Media to Item
```http
POST /api/v1/items/{item_id}/media
Content-Type: multipart/form-data

file: [binary file]
```

### Response Format
```json
{
  "url": "https://res.cloudinary.com/...",
  "public_id": "items/filename",
  "resource_type": "image",
  "format": "jpg",
  "width": 1920,
  "height": 1080,
  "bytes": 123456
}
```

## Frontend Usage

### Basic Media Upload Component
```tsx
import { MediaUpload } from '@/components/ui/media-upload'
import { useMediaUpload } from '@/hooks/useMediaUpload'

const MyComponent = () => {
  const { uploadMedia, isUploading } = useMediaUpload()

  const handleUpload = async (file: File) => {
    try {
      const result = await uploadMedia(file)
      console.log('Uploaded:', result.url)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  return (
    <MediaUpload
      onUpload={handleUpload}
      isLoading={isUploading}
      maxSize={10}
    />
  )
}
```

### Integration with Item Form
```tsx
import { ItemFormWithMedia } from '@/components/items/item-form-with-media'

const CreateItemPage = () => {
  const handleSubmit = (data) => {
    // data includes: title, description, mediaUrl, mediaType
    console.log('Item data:', data)
  }

  return (
    <ItemFormWithMedia
      onSubmit={handleSubmit}
      submitText="Create Item"
    />
  )
}
```

## Security Considerations

### File Validation
- **Size Limits**: 10MB max file size
- **Type Validation**: Only allowed image/video formats
- **Content Detection**: Uses python-magic for MIME type detection

### Access Control
- **Authentication Required**: All upload endpoints require login
- **Ownership**: Users can only upload to their own items
- **Admin Access**: Superusers can upload to any item

### Cloudinary Security
- **Upload Presets**: Use signed uploads for production
- **Folder Structure**: Organize uploads by user/item
- **Transformations**: Apply security transformations (strip metadata)

## Performance Optimization

### Image Optimization
- **Automatic Resizing**: Cloudinary creates optimized versions
- **Format Conversion**: Automatic WebP conversion for browsers
- **Lazy Loading**: Implement lazy loading for images

### Video Optimization
- **Compression**: Cloudinary automatically compresses videos
- **Multiple Formats**: Generate MP4 and WebM versions
- **Thumbnails**: Automatic thumbnail generation

## Cost Optimization

### Cloudinary Free Tier Limits
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month

### Optimization Strategies
1. **Compress Before Upload**: Use client-side compression
2. **Resize Images**: Upload appropriate sizes
3. **Use Transformations**: Leverage Cloudinary transformations
4. **Monitor Usage**: Track bandwidth and storage usage

## Deployment Considerations

### Environment Variables
```bash
# Production
CLOUDINARY_CLOUD_NAME=your_production_cloud
CLOUDINARY_API_KEY=your_production_key
CLOUDINARY_API_SECRET=your_production_secret

# Development
CLOUDINARY_CLOUD_NAME=your_dev_cloud
CLOUDINARY_API_KEY=your_dev_key
CLOUDINARY_API_SECRET=your_dev_secret
```

### Docker Configuration
The Docker setup already supports the new dependencies. No additional configuration needed.

### Monitoring
- Monitor Cloudinary usage in dashboard
- Set up alerts for approaching limits
- Track upload success/failure rates

## Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check Cloudinary credentials
   - Verify file size and type
   - Check network connectivity

2. **Images Not Displaying**
   - Verify CORS settings
   - Check image URL format
   - Ensure proper authentication

3. **Videos Not Playing**
   - Check video format support
   - Verify video URL
   - Test in different browsers

### Debug Commands
```bash
# Test Cloudinary connection
docker-compose exec backend python -c "
import cloudinary
cloudinary.config(cloud_name='test', api_key='test', api_secret='test')
print('Cloudinary config OK')
"

# Check database migration
docker-compose exec backend alembic current
```

## Next Steps

1. **Set up Cloudinary account** and add credentials
2. **Test the upload functionality** with small files
3. **Customize the UI** to match your design
4. **Add image/video preview** in item lists
5. **Implement lazy loading** for better performance
6. **Add image editing features** (crop, resize, filters)
7. **Set up monitoring** and usage alerts

## Support

For issues with:
- **Cloudinary**: Check their [documentation](https://cloudinary.com/documentation)
- **FastAPI**: Check [FastAPI docs](https://fastapi.tiangolo.com)
- **React**: Check [React docs](https://react.dev)

This implementation provides a solid foundation for media uploads that can scale with your application needs. 