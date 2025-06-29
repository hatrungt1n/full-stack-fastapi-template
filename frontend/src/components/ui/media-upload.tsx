import React, { useState, useCallback } from 'react'
import {
  Box,
  Button,
  Image,
  VStack,
  HStack,
  Text,
  Progress,
  IconButton,
  Flex,
} from '@chakra-ui/react'
import { FiUpload, FiX, FiPlay, FiImage } from 'react-icons/fi'
import { useDropzone } from 'react-dropzone'
import useCustomToast from '@/hooks/useCustomToast'

interface MediaUploadProps {
  onUpload: (file: File) => Promise<void>
  onRemove?: () => void
  currentUrl?: string | null
  mediaType?: 'image' | 'video' | null
  isLoading?: boolean
  maxSize?: number // in MB
  accept?: string
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onUpload,
  onRemove,
  currentUrl,
  mediaType,
  isLoading = false,
  maxSize = 10,
  accept = 'image/*,video/*',
}) => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        showErrorToast(`Maximum file size is ${maxSize}MB`)
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 100)

        await onUpload(file)
        
        clearInterval(progressInterval)
        setUploadProgress(100)
        
        showSuccessToast('Media uploaded successfully')
      } catch (error) {
        showErrorToast(error instanceof Error ? error.message : 'Failed to upload file')
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [onUpload, maxSize, showSuccessToast, showErrorToast]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg', '.mov'],
    },
    multiple: false,
  })

  const handleRemove = () => {
    if (onRemove) {
      onRemove()
    }
  }

  return (
    <VStack gap={4} w="full">
      {currentUrl ? (
        <Box position="relative" w="full" maxW="400px">
          {mediaType === 'image' ? (
            <Image
              src={currentUrl}
              alt="Uploaded media"
              borderRadius="md"
              w="full"
              h="auto"
              maxH="300px"
              objectFit="cover"
            />
          ) : mediaType === 'video' ? (
            <video
              src={currentUrl}
              controls
              style={{
                borderRadius: '6px',
                width: '100%',
                maxHeight: '300px',
              }}
            />
          ) : null}
          
          {onRemove && (
            <IconButton
              aria-label="Remove media"
              size="sm"
              colorPalette="red"
              position="absolute"
              top={2}
              right={2}
              onClick={handleRemove}
              disabled={isLoading}
            >
              <FiX />
            </IconButton>
          )}
        </Box>
      ) : (
        <Box
          {...getRootProps()}
          border="2px dashed"
          borderColor={isDragActive ? 'blue.400' : 'gray.300'}
          borderRadius="md"
          p={8}
          textAlign="center"
          cursor="pointer"
          transition="all 0.2s"
          _hover={{
            borderColor: 'blue.400',
            bg: 'blue.50',
          }}
          w="full"
          maxW="400px"
        >
          <input {...getInputProps()} />
          <VStack gap={4}>
            {mediaType === 'image' ? (
              <FiImage size={48} color="#3182CE" />
            ) : mediaType === 'video' ? (
              <FiPlay size={48} color="#3182CE" />
            ) : (
              <FiUpload size={48} color="#3182CE" />
            )}
            
            <Text fontSize="lg" fontWeight="medium">
              {isDragActive
                ? 'Drop the file here'
                : 'Drag & drop a file here, or click to select'}
            </Text>
            
            <Text fontSize="sm" color="gray.500">
              {mediaType === 'image'
                ? 'Supports: JPEG, PNG, GIF, WebP'
                : mediaType === 'video'
                ? 'Supports: MP4, WebM, OGG, MOV'
                : 'Supports: Images and Videos'}
            </Text>
            
            <Text fontSize="xs" color="gray.400">
              Max size: {maxSize}MB
            </Text>
            
            <Button
              colorPalette="blue"
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Select File
            </Button>
          </VStack>
        </Box>
      )}

      {(isUploading || isLoading) && (
        <Box w="full" maxW="400px">
          <Progress.Root
            value={uploadProgress}
            colorPalette="blue"
            size="sm"
            borderRadius="md"
          >
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
          <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
            {isUploading ? 'Uploading...' : 'Loading...'}
          </Text>
        </Box>
      )}
    </VStack>
  )
} 