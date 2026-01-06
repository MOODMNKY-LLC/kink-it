'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MagicCard } from '@/components/ui/magic-card'
import { BorderBeam } from '@/components/ui/border-beam'
import Image from 'next/image'
import { Trash2, RefreshCw, Image as ImageIcon, Loader2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAvatarGeneration } from '@/hooks/use-avatar-generation'
import supabaseImageLoader from '@/lib/supabase-image-loader'
import { formatDistanceToNow } from 'date-fns'

interface AvatarManagementProps {
  kinksterId: string
  userId: string
  currentAvatarUrl?: string | null
  characterData?: any
  onAvatarUpdate?: (newAvatarUrl: string) => void
}

interface AvatarHistory {
  id: string
  avatar_url: string
  avatar_prompt?: string
  created_at: string
  storage_path?: string
}

export function AvatarManagement({
  kinksterId,
  userId,
  currentAvatarUrl,
  characterData,
  onAvatarUpdate,
}: AvatarManagementProps) {
  const [avatarHistory, setAvatarHistory] = useState<AvatarHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const supabase = createClient()

  const { generateAvatar, progress, isGenerating } = useAvatarGeneration({
    kinksterId,
    userId,
    onComplete: (avatarUrl) => {
      toast.success('Avatar generated successfully!')
      if (onAvatarUpdate) {
        onAvatarUpdate(avatarUrl)
      }
      loadAvatarHistory()
    },
    onError: (error) => {
      toast.error(error || 'Failed to generate avatar')
    },
  })

  const loadAvatarHistory = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('kinksters')
        .select('id, avatar_url, avatar_prompt, created_at, updated_at')
        .eq('id', kinksterId)
        .order('updated_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // For now, we'll show the current avatar as history
      // In the future, we could track avatar history separately
      if (data && data.length > 0) {
        const history: AvatarHistory[] = data
          .filter((k) => k.avatar_url)
          .map((k) => ({
            id: k.id,
            avatar_url: k.avatar_url!,
            avatar_prompt: k.avatar_prompt || undefined,
            created_at: k.updated_at || k.created_at,
          }))
        setAvatarHistory(history)
      }
    } catch (error: any) {
      console.error('Error loading avatar history:', error)
      toast.error('Failed to load avatar history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAvatarHistory()
  }, [kinksterId])

  const handleDeleteAvatar = async (avatarUrl: string, storagePath?: string) => {
    if (!confirm('Are you sure you want to delete this avatar? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(avatarUrl)

      // Delete from storage if we have the path
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('kinkster-avatars')
          .remove([storagePath])

        if (storageError) {
          console.error('Error deleting from storage:', storageError)
          // Continue with database update even if storage delete fails
        }
      }

      // Update kinkster record
      const { error: updateError } = await supabase
        .from('kinksters')
        .update({ avatar_url: null, avatar_prompt: null })
        .eq('id', kinksterId)

      if (updateError) throw updateError

      toast.success('Avatar deleted successfully')
      loadAvatarHistory()
      if (onAvatarUpdate) {
        onAvatarUpdate('')
      }
    } catch (error: any) {
      console.error('Error deleting avatar:', error)
      toast.error('Failed to delete avatar')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRegenerate = async () => {
    if (!characterData) {
      toast.error('Character data is required to regenerate avatar')
      return
    }

    await generateAvatar(characterData)
  }

  const getProgressMessage = () => {
    if (!progress) return null
    switch (progress.status) {
      case 'generating':
        return 'Generating avatar with OpenAI...'
      case 'downloading':
        return 'Downloading image...'
      case 'uploading':
        return 'Uploading to storage...'
      case 'completed':
        return 'Avatar generated successfully!'
      default:
        return 'Processing...'
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Avatar Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Current Avatar
          </CardTitle>
          <CardDescription>
            Manage your kinkster's avatar image
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentAvatarUrl ? (
            <div className="relative group">
              <MagicCard className="relative aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-lg">
                <BorderBeam size={100} duration={12} />
                <Image
                  loader={supabaseImageLoader}
                  src={currentAvatarUrl}
                  alt="Kinkster avatar"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setPreviewUrl(currentAvatarUrl)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </MagicCard>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No avatar set</p>
              <Button onClick={handleRegenerate} disabled={!characterData || isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Generate Avatar
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Progress Indicator */}
          {isGenerating && progress && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{getProgressMessage()}</span>
              </div>
              {progress.status === 'generating' && (
                <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '33%' }} />
                </div>
              )}
              {progress.status === 'downloading' && (
                <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '66%' }} />
                </div>
              )}
              {progress.status === 'uploading' && (
                <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '90%' }} />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {currentAvatarUrl && (
            <div className="flex gap-2 mt-4 justify-center">
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={!characterData || isGenerating}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteAvatar(currentAvatarUrl)}
                disabled={deletingId === currentAvatarUrl}
              >
                {deletingId === currentAvatarUrl ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avatar History */}
      {avatarHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avatar History</CardTitle>
            <CardDescription>
              Previous avatars for this kinkster
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {avatarHistory.map((avatar) => (
                <div key={avatar.id} className="relative group">
                  <MagicCard className="relative aspect-square overflow-hidden rounded-lg">
                    <Image
                      loader={supabaseImageLoader}
                      src={avatar.avatar_url}
                      alt="Previous avatar"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => setPreviewUrl(avatar.avatar_url)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteAvatar(avatar.avatar_url)}
                          disabled={deletingId === avatar.avatar_url}
                        >
                          {deletingId === avatar.avatar_url ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {avatar.avatar_prompt && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="truncate">{avatar.avatar_prompt}</p>
                      </div>
                    )}
                  </MagicCard>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {formatDistanceToNow(new Date(avatar.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Avatar Preview</DialogTitle>
            <DialogDescription>Full-size avatar preview</DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <div className="relative aspect-square w-full max-w-2xl mx-auto">
              <Image
                loader={supabaseImageLoader}
                src={previewUrl}
                alt="Avatar preview"
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}



