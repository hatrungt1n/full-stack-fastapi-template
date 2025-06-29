import React, { useState } from 'react'
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Box,
  Text,
  Divider,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { MediaUpload } from '@/components/ui/media-upload'
import { useMediaUpload } from '@/hooks/useMediaUpload'

interface ItemFormData {
  title: string
  description?: string
}

interface ItemFormWithMediaProps {
  onSubmit: (data: ItemFormData & { mediaUrl?: string; mediaType?: string }) => void
  initialData?: ItemFormData & { image_url?: string; video_url?: string; media_type?: string }
  isLoading?: boolean
  submitText?: string
}

export const ItemFormWithMedia: React.FC<ItemFormWithMediaProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  submitText = 'Create Item',
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(
    initialData?.image_url || initialData?.video_url || null
  )
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(
    (initialData?.media_type as 'image' | 'video' | null) || null
  )

  const { uploadMedia, isUploading } = useMediaUpload()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ItemFormData>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
    },
  })

  const handleMediaUpload = async (file: File) => {
    try {
      const result = await uploadMedia(file)
      setMediaUrl(result.url)
      setMediaType(result.resource_type as 'image' | 'video')
    } catch (error) {
      console.error('Media upload failed:', error)
      throw error
    }
  }

  const handleMediaRemove = () => {
    setMediaUrl(null)
    setMediaType(null)
  }

  const handleFormSubmit = (data: ItemFormData) => {
    onSubmit({
      ...data,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
    })
  }

  return (
    <Box as="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <VStack spacing={6} align="stretch">
        {/* Basic Item Fields */}
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={!!errors.title}>
            <FormLabel>Title</FormLabel>
            <Input
              {...register('title', { required: 'Title is required' })}
              placeholder="Enter item title"
            />
            {errors.title && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.title.message}
              </Text>
            )}
          </FormControl>

          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              {...register('description')}
              placeholder="Enter item description (optional)"
              rows={3}
            />
          </FormControl>
        </VStack>

        <Divider />

        {/* Media Upload Section */}
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="medium">
            Media (Optional)
          </Text>
          <Text fontSize="sm" color="gray.600">
            Add an image or video to your item. Supported formats: JPEG, PNG, GIF, WebP, MP4, WebM, OGG, MOV
          </Text>
          
          <MediaUpload
            onUpload={handleMediaUpload}
            onRemove={handleMediaRemove}
            currentUrl={mediaUrl}
            mediaType={mediaType}
            isLoading={isUploading}
            maxSize={10}
          />
        </VStack>

        <Divider />

        {/* Submit Button */}
        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          isLoading={isLoading || isUploading}
          loadingText={isUploading ? 'Uploading...' : 'Saving...'}
        >
          {submitText}
        </Button>
      </VStack>
    </Box>
  )
} 