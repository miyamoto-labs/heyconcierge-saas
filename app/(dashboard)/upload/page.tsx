'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PhotoUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // Max dimensions
          const MAX_WIDTH = 1920
          const MAX_HEIGHT = 1920
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = height * (MAX_WIDTH / width)
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = width * (MAX_HEIGHT / height)
              height = MAX_HEIGHT
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }))
            }
          }, 'image/jpeg', 0.85)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Check file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    // Compress image
    const compressed = await compressImage(file)
    
    // Check compressed size (max 2MB)
    if (compressed.size > 2 * 1024 * 1024) {
      setError('Compressed image is still too large. Please choose a smaller image.')
      return
    }

    setSelectedFile(compressed)
    
    // Create preview
    const previewUrl = URL.createObjectURL(compressed)
    setPreview(previewUrl)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('You must be logged in to upload photos')
      }

      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-photos')
        .getPublicUrl(fileName)

      // Store metadata in database (optional - you can add this later)
      // await supabase.from('photos').insert({
      //   user_id: user.id,
      //   filename: selectedFile.name,
      //   size: selectedFile.size,
      //   url: publicUrl
      // })

      setProgress(100)
      
      // Reset form
      setTimeout(() => {
        setSelectedFile(null)
        setPreview(null)
        setProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 1000)

    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload photo')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Upload Photo</h1>

          {/* File Input */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-input"
            />
            <label
              htmlFor="photo-input"
              className="block w-full py-4 px-6 bg-black text-white text-center rounded-lg cursor-pointer hover:bg-gray-800 transition text-lg font-semibold"
            >
              📷 Take Photo / Choose from Gallery
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="mb-6">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto rounded-lg shadow-md"
              />
              <p className="text-sm text-gray-600 mt-2 text-center">
                Size: {(selectedFile!.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-black h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          {selectedFile && !uploading && (
            <button
              onClick={handleUpload}
              className="w-full py-4 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg font-semibold"
            >
              ✓ Upload Photo
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Photos are automatically compressed to save space.</p>
          <p>Maximum file size: 2MB after compression</p>
        </div>
      </div>
    </div>
  )
}
