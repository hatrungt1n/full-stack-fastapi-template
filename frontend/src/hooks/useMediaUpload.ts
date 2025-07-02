import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ItemsService, OpenAPI } from '@/client'

export const useMediaUpload = () => {
  const queryClient = useQueryClient()

  const uploadMediaMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${OpenAPI.BASE}/api/v1/items/upload-media`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate items cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

  const addMediaToItemMutation = useMutation({
    mutationFn: async ({ itemId, file }: { itemId: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${OpenAPI.BASE}/api/v1/items/${itemId}/media`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate items cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

  return {
    uploadMedia: uploadMediaMutation.mutateAsync,
    addMediaToItem: addMediaToItemMutation.mutateAsync,
    isUploading: uploadMediaMutation.isPending || addMediaToItemMutation.isPending,
    error: uploadMediaMutation.error || addMediaToItemMutation.error,
  }
} 