'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface Channel {
  id: string
  name: string
  description: string
  image_url: string
  follower_count: number
  lead?: {
    username: string
    display_name: string
    pfp_url: string
  }
  url?: string
  parent_url?: string
}

interface UserChannelsProps {
  fid: number
}

export default function UserChannels({ fid }: UserChannelsProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchChannels = async (): Promise<void> => {
      setLoading(true)
      setError('')

      try {
        // Use Neynar free tier API
        // Neynar API Key for free tier (you can get your own at neynar.com)
        const NEYNAR_API_KEY = 'NEYNAR_API_DOCS'
        
        console.log(`Fetching channels for FID: ${fid}`)
        
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protocol: 'https',
            origin: 'api.neynar.com',
            path: `/v2/farcaster/user/channels?fid=${fid}&limit=25`,
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'api_key': NEYNAR_API_KEY
            }
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error:', errorText)
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()

        // Debug: Log full response
        console.log('=== NEYNAR API RESPONSE ===')
        console.log('Response:', JSON.stringify(data, null, 2))
        console.log('Response keys:', Object.keys(data))

        let channelsData: Channel[] = []
        
        // Parse Neynar response format
        if (data.channels && Array.isArray(data.channels)) {
          console.log('Found channels array with', data.channels.length, 'items')
          
          channelsData = data.channels.map((ch: any) => ({
            id: ch.id || ch.channel_id || '',
            name: ch.name || ch.id || '',
            description: ch.description || `Farcaster channel: /${ch.id || ch.name}`,
            image_url: ch.image_url || ch.image || '',
            follower_count: ch.follower_count || 0,
            lead: ch.lead ? {
              username: ch.lead.username || '',
              display_name: ch.lead.display_name || ch.lead.username || '',
              pfp_url: ch.lead.pfp_url || ch.lead.pfp || ''
            } : undefined,
            url: ch.url || `https://warpcast.com/~/channel/${ch.id || ch.name}`,
            parent_url: ch.parent_url || ''
          }))
        } else if (data.result && data.result.channels && Array.isArray(data.result.channels)) {
          // Alternative response format
          console.log('Found result.channels array with', data.result.channels.length, 'items')
          
          channelsData = data.result.channels.map((ch: any) => ({
            id: ch.id || ch.channel_id || '',
            name: ch.name || ch.id || '',
            description: ch.description || `Farcaster channel: /${ch.id || ch.name}`,
            image_url: ch.image_url || ch.image || '',
            follower_count: ch.follower_count || 0,
            lead: ch.lead ? {
              username: ch.lead.username || '',
              display_name: ch.lead.display_name || ch.lead.username || '',
              pfp_url: ch.lead.pfp_url || ch.lead.pfp || ''
            } : undefined,
            url: ch.url || `https://warpcast.com/~/channel/${ch.id || ch.name}`,
            parent_url: ch.parent_url || ''
          }))
        }
        
        console.log('Final parsed channels count:', channelsData.length)
        console.log('Channels data:', channelsData)
        
        if (channelsData.length === 0) {
          setError('This user hasn\'t joined any channels yet')
        } else {
          setChannels(channelsData)
        }
      } catch (err) {
        console.error('Error fetching channels:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user channels'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (fid) {
      fetchChannels()
    }
  }, [fid])

  const handleOpenChannel = (channel: Channel): void => {
    // Open channel URL - browser will prompt to open in app if installed
    const webUrl = channel.url || channel.parent_url || `https://warpcast.com/~/channel/${channel.id}`
    window.open(webUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-orange-600 mb-2">{error}</p>
          <p className="text-center text-sm text-gray-500">
            Using Neynar free tier API. You can get your own API key at neynar.com for better access.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (channels.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">This user hasn't joined any channels yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Channels ({channels.length})</span>
            <Badge variant="secondary" className="text-sm">
              Following
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {channels.map((channel) => (
        <Card key={channel.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 rounded-lg">
                <AvatarImage src={channel.image_url} alt={channel.name} />
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700">
                  {channel.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold truncate">/{channel.name}</h3>
                  {channel.follower_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {channel.follower_count.toLocaleString()} followers
                    </Badge>
                  )}
                </div>

                {channel.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {channel.description}
                  </p>
                )}

                {channel.lead && (
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={channel.lead.pfp_url} alt={channel.lead.display_name} />
                      <AvatarFallback className="text-xs">
                        {channel.lead.display_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-gray-500">
                      Led by <span className="font-medium">@{channel.lead.username}</span>
                    </p>
                  </div>
                )}

                <Button 
                  onClick={() => handleOpenChannel(channel)} 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Visit Channel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
