import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';

interface ImageUploadProps {
  currentImage?: string | null;
  onImageChange: (imageUrl: string | undefined) => void;
  className?: string;
  folder?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  currentImage, 
  onImageChange, 
  className = '',
  folder = 'menu-images'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const { uploadImage, uploading, uploadProgress } = useImageUpload(folder);
  
  // Use local image URL if available, otherwise use prop
  const displayImage = localImageUrl || currentImage || null;
  
  // Log when currentImage changes to debug and sync with local state
  useEffect(() => {
    console.log('🖼️ ImageUpload currentImage prop changed:', {
      currentImage,
      localImageUrl,
      displayImage: localImageUrl || currentImage || null,
      type: typeof currentImage,
      hasValue: !!currentImage,
      length: currentImage?.length || 0
    });
    
    // Sync local state with prop when it changes from parent (but don't overwrite if we just set it locally)
    if (currentImage && currentImage !== localImageUrl) {
      console.log('🖼️ Syncing local image URL with prop from parent');
      setLocalImageUrl(currentImage);
    } else if (!currentImage && localImageUrl && !uploading) {
      // If prop is cleared and we're not uploading, clear local too (but keep it during upload)
      console.log('🖼️ Clearing local image URL because prop was cleared');
      setLocalImageUrl(null);
    }
  }, [currentImage]); // Only depend on currentImage to avoid loops

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('❌ Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('❌ Image size must be less than 5MB');
      return;
    }

    try {
      // Upload to Supabase Storage
      console.log('🚀 Starting image upload...');
      console.log('📁 File details:', { name: file.name, size: file.size, type: file.type });
      
      const imageUrl = await uploadImage(file);
      console.log('✅ Upload complete, received image URL:', imageUrl);
      console.log('✅ URL type:', typeof imageUrl, 'URL length:', imageUrl?.length);
      
      if (!imageUrl || imageUrl.trim() === '') {
        throw new Error('Upload succeeded but no URL was returned');
      }
      
      // Ensure we pass a valid string URL
      const validUrl = imageUrl.trim();
      console.log('📤 Calling onImageChange with URL:', validUrl.substring(0, 80) + '...');
      
      // Immediately update local state to show preview
      setLocalImageUrl(validUrl);
      console.log('✅ Local image URL set for immediate preview');
      
      // Call the callback with the URL to update parent state
      onImageChange(validUrl);
      
      // Verify callback was called
      console.log('✅ onImageChange callback executed');
    } catch (error) {
      console.error('❌ Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Show user-friendly error message
      let userMessage = `❌ Failed to upload image: ${errorMessage}`;
      
      if (errorMessage.includes('Bucket not found') || errorMessage.includes('not found')) {
        userMessage += '\n\n💡 Solution: Run CREATE_STORAGE_BUCKET.sql in Supabase SQL Editor to create the storage bucket.';
      } else if (errorMessage.includes('timeout')) {
        userMessage += '\n\n💡 This might mean the storage bucket doesn\'t exist. Check your Supabase Storage settings.';
      } else if (errorMessage.includes('row-level security') || errorMessage.includes('policy')) {
        userMessage += '\n\n💡 Solution: Run CREATE_STORAGE_BUCKET.sql to set up storage policies.';
      }
      
      alert(userMessage);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setLocalImageUrl(null);
    onImageChange(undefined);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {displayImage ? (
        <div className="relative group">
          <img
            src={displayImage}
            alt="Preview"
            className="w-full max-w-2xl object-contain rounded-2xl border-2 border-sky-200 shadow-lg hover:shadow-xl transition-all"
            loading="lazy"
            decoding="async"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
            disabled={uploading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
            <div
              onClick={triggerFileSelect}
              className="w-full max-w-2xl border-2 border-dashed border-sky-300 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition-all duration-300 bg-gradient-to-br from-sky-50/30 to-blue-50/30"
            >
                  <ImageIcon className="h-16 w-16 text-sky-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Click to upload product image</p>
                  <p className="text-sm text-gray-500 mb-1">or drag and drop</p>
                  <p className="text-xs text-gray-400">JPEG, PNG, WebP (max 5MB)</p>
            </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {!displayImage && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={uploading}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-5 w-5" />
            <span>Choose File</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;