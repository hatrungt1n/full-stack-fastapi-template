import cloudinary
import cloudinary.uploader
import magic
from fastapi import HTTPException, UploadFile
from typing import Optional
import os
from pathlib import Path

from app.core.config import settings


class MediaService:
    def __init__(self):
        self.use_cloudinary = all([
            settings.CLOUDINARY_CLOUD_NAME, 
            settings.CLOUDINARY_API_KEY, 
            settings.CLOUDINARY_API_SECRET
        ])
        
        if self.use_cloudinary:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
            )
        else:
            # Fallback to local storage for development
            self.upload_dir = Path("uploads")
            self.upload_dir.mkdir(exist_ok=True)

    def _validate_file(self, file: UploadFile, max_size_mb: int = 10) -> None:
        """Validate uploaded file"""
        # Check file size (convert MB to bytes)
        max_size_bytes = max_size_mb * 1024 * 1024
        if file.size and file.size > max_size_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {max_size_mb}MB"
            )

        # Read first few bytes to detect MIME type
        content = file.file.read(2048)
        file.file.seek(0)  # Reset file pointer
        
        mime_type = magic.from_buffer(content, mime=True)
        
        # Validate file type
        allowed_image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        allowed_video_types = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
        
        if mime_type not in allowed_image_types + allowed_video_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {mime_type}. Allowed: {', '.join(allowed_image_types + allowed_video_types)}"
            )

    def upload_file(self, file: UploadFile, folder: str = "items") -> dict:
        """Upload file to Cloudinary or local storage"""
        self._validate_file(file)
        
        if self.use_cloudinary:
            return self._upload_to_cloudinary(file, folder)
        else:
            return self._upload_to_local(file, folder)

    def _upload_to_cloudinary(self, file: UploadFile, folder: str) -> dict:
        """Upload file to Cloudinary"""
        try:
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                file.file,
                folder=folder,
                resource_type="auto",  # Auto-detect image/video
                eager=[
                    {"width": 800, "height": 600, "crop": "limit"},  # Optimized version
                    {"width": 400, "height": 300, "crop": "limit"},  # Thumbnail
                ],
                eager_async=True,
                eager_notification_url=None,
            )
            
            return {
                "url": result.get("secure_url"),
                "public_id": result.get("public_id"),
                "resource_type": result.get("resource_type"),
                "format": result.get("format"),
                "width": result.get("width"),
                "height": result.get("height"),
                "bytes": result.get("bytes"),
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Cloudinary upload failed: {str(e)}"
            )

    def _upload_to_local(self, file: UploadFile, folder: str) -> dict:
        """Upload file to local storage (development only)"""
        try:
            import uuid
            
            # Create folder structure
            folder_path = self.upload_dir / folder
            folder_path.mkdir(parents=True, exist_ok=True)
            
            # Generate unique filename
            file_extension = Path(file.filename).suffix if file.filename else ""
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = folder_path / unique_filename
            
            # Save file
            with open(file_path, "wb") as f:
                content = file.file.read()
                f.write(content)
            
            # Determine resource type
            resource_type = "image" if file.content_type and file.content_type.startswith("image/") else "video"
            
            return {
                "url": f"/uploads/{folder}/{unique_filename}",
                "public_id": str(file_path),
                "resource_type": resource_type,
                "format": file_extension.lstrip(".") if file_extension else "unknown",
                "width": None,
                "height": None,
                "bytes": len(content),
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Local upload failed: {str(e)}"
            )

    def delete_file(self, public_id: str) -> bool:
        """Delete file from Cloudinary or local storage"""
        if self.use_cloudinary:
            try:
                result = cloudinary.uploader.destroy(public_id)
                return result.get("result") == "ok"
            except Exception:
                return False
        else:
            # Delete local file
            try:
                file_path = Path(public_id)
                if file_path.exists():
                    file_path.unlink()
                    return True
                return False
            except Exception:
                return False


# Global media service instance
media_service = None

def get_media_service() -> MediaService:
    """Get media service instance"""
    global media_service
    if media_service is None:
        media_service = MediaService()
    return media_service 