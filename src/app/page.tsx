'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { sdk } from "@farcaster/miniapp-sdk"
import { useAddMiniApp } from "@/hooks/useAddMiniApp"
import { useQuickAuth } from "@/hooks/useQuickAuth"
import { useIsInFarcaster } from "@/hooks/useIsInFarcaster"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UserChannels from '@/components/UserChannels'
import UserWallets from '@/components/UserWallets'
import { NeynarScoreInfo } from '@/components/NeynarScoreInfo'
import { DailyCheckIn } from '@/components/DailyCheckIn'
import { DonateButton } from '@/components/DonateButton'
import { Toaster } from 'sonner'



interface NeynarUser {
  fid: number
  username: string
  display_name: string
  pfp_url: string
  follower_count: number
  following_count: number
  verifications?: string[]
  experimental?: {
    neynar_user_score?: number
  }
  neynar_user_score?: number
  profile?: {
    bio?: {
      text?: string
    }
  }
}



export default function FarcasterExplorer() {
  const searchParams = useSearchParams()
  const { addMiniApp } = useAddMiniApp()
  const isInFarcaster = useIsInFarcaster()
  useQuickAuth(isInFarcaster)
  
  useEffect(() => {
    const tryAddMiniApp = async (): Promise<void> => {
      try {
        await addMiniApp()
      } catch (error) {
        console.error('Failed to add mini app:', error)
      }
    }
    tryAddMiniApp()
  }, [addMiniApp])
  
  useEffect(() => {
    const initializeFarcaster = async (): Promise<void> => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (document.readyState !== 'complete') {
          await new Promise<void>(resolve => {
            if (document.readyState === 'complete') {
              resolve()
            } else {
              window.addEventListener('load', () => resolve(), { once: true })
            }
          })
        }
        
        await sdk.actions.ready()
        console.log('Farcaster SDK initialized successfully - app fully loaded')
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error)
        
        setTimeout(async () => {
          try {
            await sdk.actions.ready()
            console.log('Farcaster SDK initialized on retry')
          } catch (retryError) {
            console.error('Farcaster SDK retry failed:', retryError)
          }
        }, 1000)
      }
    }
    initializeFarcaster()
  }, [])
  
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [context, setContext] = useState<{user?: {fid: number}} | null>(null)
  const [searchFid, setSearchFid] = useState('')
  const [user, setUser] = useState<NeynarUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  
  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const ctx = await sdk.context
        setContext(ctx)
        setIsSDKLoaded(true)
        
        const fidParam = searchParams.get('fid')
        
        if (fidParam) {
          fetchUser(fidParam)
        } else if (ctx?.user?.fid) {
          fetchUser(ctx.user.fid.toString())
        }
      } catch (err) {
        console.error('SDK load error:', err)
        setIsSDKLoaded(true)
      }
    }
    load()
  }, [searchParams])



  const fetchUser = async (input: string): Promise<void> => {
    if (!input || input.trim() === '') {
      setError('Please enter a FID or username')
      return
    }

    setLoading(true)
    setError('')

    const trimmedInput = input.trim()
    const isFid = /^\d+$/.test(trimmedInput)
    const searchQuery = isFid ? trimmedInput : trimmedInput.toLowerCase()

    try {
      let response
      
      if (isFid) {
        response = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protocol: 'https',
            origin: 'api.neynar.com',
            path: `/v2/farcaster/user/bulk?fids=${searchQuery}`,
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'x-api-key': '2D812E54-6373-4A2D-902F-0FDAD0AFA754'
            }
          })
        })
      } else {
        response = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protocol: 'https',
            origin: 'api.neynar.com',
            path: `/v2/farcaster/user/by_username?username=${encodeURIComponent(searchQuery)}`,
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'x-api-key': '2D812E54-6373-4A2D-902F-0FDAD0AFA754'
            }
          })
        })
      }

      const data = await response.json()
      
      let userData: NeynarUser | null = null
      
      if (isFid && data.users && data.users.length > 0) {
        userData = data.users[0]
      } else if (!isFid && data.result?.user) {
        userData = data.result.user
      } else if (!isFid && data.user) {
        userData = data.user
      }
      
      if (userData) {
        setUser(userData)
      } else {
        setError(`User not found for ${isFid ? 'FID' : 'username'}: ${trimmedInput}`)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch user data')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault()
    fetchUser(searchFid)
  }

  const handleMyProfile = (): void => {
    if (context?.user?.fid) {
      setSearchFid(context.user.fid.toString())
      fetchUser(context.user.fid.toString())
    }
  }

  const handleShare = async (): Promise<void> => {
    if (!user) return

    const neynarScore = user.experimental?.neynar_user_score || user.neynar_user_score || 0
    const scorePercent = Math.round(neynarScore * 100)
    const quotientRank = calculateQuotientRank(user)
    const influence = calculateInfluence(user)
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://suit-national-054.app.ohara.ai'
    const profileUrl = `${baseUrl}/profile/${user.fid}`
    
    const text = `🏆 Quotient Rank: ${quotientRank.rank} (${quotientRank.tier})
📊 Neynar Score: ${scorePercent}/100
${influence}
👥 ${user.follower_count.toLocaleString()} Followers

━━━━━━━━━━━━━━━
Check your rank:
${profileUrl}`

    try {
      // Auto-generate OG image before sharing (pre-warm cache)
      const imageUrl = `${baseUrl}/og/farcaster/${user.fid}.png?v=${Date.now()}`
      
      // Pre-load the image to ensure it's ready
      const preloadPromise = new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => resolve() // Continue even if image fails
        img.src = imageUrl
        
        // Timeout after 3 seconds to avoid blocking
        setTimeout(() => resolve(), 3000)
      })
      
      await preloadPromise
      
      if (isSDKLoaded && sdk.actions.composeCast) {
        await sdk.actions.composeCast({ text, embeds: [profileUrl] })
      } else {
        await navigator.clipboard.writeText(text)
        alert('Text copied to clipboard!')
      }
    } catch (err) {
      console.error('Share error:', err)
      try {
        await navigator.clipboard.writeText(text)
        alert('Text copied to clipboard!')
      } catch {
        alert('Failed to share')
      }
    }
  }

  const handleViewProfile = async (): Promise<void> => {
    if (!user) return

    const warpcastUrl = `https://warpcast.com/${user.username}`

    try {
      if (isSDKLoaded && sdk.actions.openUrl) {
        await sdk.actions.openUrl(warpcastUrl)
      } else {
        window.open(warpcastUrl, '_blank')
      }
    } catch (err) {
      console.error('Failed to open profile:', err)
      window.open(warpcastUrl, '_blank')
    }
  }

  const calculateInfluence = (user: NeynarUser): string => {
    const ratio = user.follower_count / Math.max(user.following_count, 1)
    if (ratio >= 10) return '🔥 Influencer'
    if (ratio >= 3) return '⭐ Notable'
    if (ratio >= 1) return '📈 Growing'
    return '🌱 Emerging'
  }

  const detectSpam = (user: NeynarUser): { isSpam: boolean; reason: string; confidence: 'high' | 'medium' | 'low' } => {
    const neynarScore = user.experimental?.neynar_user_score || user.neynar_user_score || 0
    const followRatio = user.following_count / Math.max(user.follower_count, 1)
    const hasVerifications = user.verifications && user.verifications.length > 0
    const followerCount = user.follower_count
    
    let spamScore = 0
    let reasons: string[] = []
    
    if (neynarScore < 0.1 && neynarScore > 0) {
      spamScore += 3
      reasons.push('Very low Neynar score')
    }
    
    if (followRatio > 20) {
      spamScore += 3
      reasons.push('Following many more accounts than followers')
    } else if (followRatio > 10) {
      spamScore += 2
      reasons.push('High following-to-follower ratio')
    }
    
    if (!hasVerifications) {
      spamScore += 1
      reasons.push('No verified addresses')
    }
    
    if (followerCount < 3) {
      spamScore += 2
      reasons.push('Very few followers')
    } else if (followerCount < 10) {
      spamScore += 1
      reasons.push('Low follower count')
    }
    
    if (user.following_count > 500 && followerCount < 50) {
      spamScore += 2
      reasons.push('Mass following behavior')
    }
    
    if (spamScore >= 6) {
      return { isSpam: true, reason: reasons.join(', '), confidence: 'high' }
    } else if (spamScore >= 4) {
      return { isSpam: true, reason: reasons.join(', '), confidence: 'medium' }
    } else if (spamScore >= 2) {
      return { isSpam: true, reason: reasons.join(', '), confidence: 'low' }
    }
    
    return { isSpam: false, reason: '', confidence: 'low' }
  }

  const calculateQuotientRank = (user: NeynarUser): { 
    rank: string; 
    tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
    score: number;
    percentile: number;
    description: string;
  } => {
    const neynarScore = user.experimental?.neynar_user_score || user.neynar_user_score || 0
    const followerCount = user.follower_count
    const followingCount = user.following_count
    const hasVerifications = user.verifications && user.verifications.length > 0
    
    const followerRatio = followerCount / Math.max(followingCount, 1)
    
    let compositeScore = 0
    
    compositeScore += neynarScore * 400
    
    if (followerCount >= 10000) {
      compositeScore += 200
    } else if (followerCount >= 5000) {
      compositeScore += 150
    } else if (followerCount >= 1000) {
      compositeScore += 100
    } else if (followerCount >= 500) {
      compositeScore += 60
    } else if (followerCount >= 100) {
      compositeScore += 30
    } else if (followerCount >= 50) {
      compositeScore += 15
    }
    
    if (followerRatio >= 10) {
      compositeScore += 100
    } else if (followerRatio >= 5) {
      compositeScore += 70
    } else if (followerRatio >= 2) {
      compositeScore += 40
    } else if (followerRatio >= 1) {
      compositeScore += 20
    }
    
    if (hasVerifications) {
      compositeScore += 50
    }
    
    const normalizedScore = Math.min(Math.round(compositeScore), 1000)
    
    let tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
    let rank: string
    let percentile: number
    let description: string
    
    if (normalizedScore >= 800) {
      tier = 'S'
      rank = 'S-Tier Elite'
      percentile = 99
      description = 'Top 1% - Elite Farcaster influencer'
    } else if (normalizedScore >= 600) {
      tier = 'A'
      rank = 'A-Tier Power User'
      percentile = 95
      description = 'Top 5% - Highly influential member'
    } else if (normalizedScore >= 400) {
      tier = 'B'
      rank = 'B-Tier Active'
      percentile = 80
      description = 'Top 20% - Active community member'
    } else if (normalizedScore >= 200) {
      tier = 'C'
      rank = 'C-Tier Engaged'
      percentile = 60
      description = 'Top 40% - Engaged participant'
    } else if (normalizedScore >= 100) {
      tier = 'D'
      rank = 'D-Tier Growing'
      percentile = 40
      description = 'Growing account with potential'
    } else {
      tier = 'F'
      rank = 'F-Tier Starter'
      percentile = 20
      description = 'New or inactive account'
    }
    
    return { rank, tier, score: normalizedScore, percentile, description }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 pt-12">
      <Toaster position="top-center" richColors />
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_cmij0eo7d000004l1bn7b1wrq-BXT3HaSncdvzHnUxepVYVn72sLeiqn" 
              alt="Farcaster Explorer Logo" 
              className="h-10 w-10 rounded-lg shadow-md"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Farcaster Explorer</h1>
          </div>
          <div className="flex gap-2">
            <DonateButton />
            {context?.user?.fid && (
              <Button
                onClick={handleMyProfile}
                variant="secondary"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 font-semibold shadow-lg"
              >
                My Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mb-6 space-y-6">
        <DailyCheckIn />
          <Card>
            <CardHeader>
              <CardTitle>Search User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter FID or username (e.g. 3 or dwr)"
                  value={searchFid}
                  onChange={(e) => setSearchFid(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </form>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </CardContent>
          </Card>

          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : user ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="channels">Channels</TabsTrigger>
                <TabsTrigger value="wallets">Wallets</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.pfp_url} alt={user.display_name} />
                    <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-2xl font-bold mb-1">{user.display_name}</h2>
                  <p className="text-gray-500 mb-1">@{user.username}</p>
                  <div className="flex gap-2 items-center mb-4">
                    <Badge variant="secondary">FID: {user.fid}</Badge>
                    {(() => {
                      const spamInfo = detectSpam(user)
                      if (spamInfo.isSpam) {
                        const colorClass = spamInfo.confidence === 'high' 
                          ? 'bg-red-100 text-red-800 border-red-300' 
                          : spamInfo.confidence === 'medium' 
                            ? 'bg-orange-100 text-orange-800 border-orange-300'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        return (
                          <Badge className={`${colorClass} border`} title={spamInfo.reason}>
                            ⚠️ Potential Spam ({spamInfo.confidence})
                          </Badge>
                        )
                      }
                      return null
                    })()}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full mb-4">
                    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-4 rounded-lg text-center shadow-sm">
                      <p className="text-3xl font-bold text-purple-700">{user.follower_count.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Followers</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-100 to-blue-100 p-4 rounded-lg text-center shadow-sm">
                      <p className="text-3xl font-bold text-blue-700">{user.following_count.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Following</p>
                    </div>
                  </div>
                  
                  <div className="w-full space-y-3 mb-4">
                    {(() => {
                      const quotientRank = calculateQuotientRank(user)
                      const tierColors = {
                        'S': { bg: 'from-amber-50 to-amber-100', text: 'text-amber-800', badge: 'bg-amber-500' },
                        'A': { bg: 'from-emerald-50 to-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-500' },
                        'B': { bg: 'from-blue-50 to-blue-100', text: 'text-blue-800', badge: 'bg-blue-500' },
                        'C': { bg: 'from-purple-50 to-purple-100', text: 'text-purple-800', badge: 'bg-purple-500' },
                        'D': { bg: 'from-gray-50 to-gray-100', text: 'text-gray-700', badge: 'bg-gray-500' },
                        'F': { bg: 'from-slate-50 to-slate-100', text: 'text-slate-600', badge: 'bg-slate-400' }
                      }
                      const colors = tierColors[quotientRank.tier]
                      
                      return (
                        <div className={`bg-gradient-to-r ${colors.bg} p-3 rounded-lg flex items-center justify-between`}>
                          <div>
                            <p className="text-sm text-gray-600">Quotient Rank</p>
                            <p className={`text-lg font-semibold ${colors.text}`}>
                              {quotientRank.rank}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Score</p>
                              <p className={`text-lg font-bold ${colors.text}`}>{quotientRank.score}</p>
                            </div>
                            <div className={`${colors.badge} text-white px-3 py-2 rounded-lg text-xl font-bold`}>
                              {quotientRank.tier}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                    {(() => {
                      const spamInfo = detectSpam(user)
                      if (spamInfo.isSpam) {
                        const bgClass = spamInfo.confidence === 'high' 
                          ? 'from-red-50 to-red-100' 
                          : spamInfo.confidence === 'medium' 
                            ? 'from-orange-50 to-orange-100'
                            : 'from-yellow-50 to-yellow-100'
                        const textClass = spamInfo.confidence === 'high' 
                          ? 'text-red-700' 
                          : spamInfo.confidence === 'medium' 
                            ? 'text-orange-700'
                            : 'text-yellow-700'
                        return (
                          <div className={`bg-gradient-to-r ${bgClass} p-4 rounded-lg border-2 ${spamInfo.confidence === 'high' ? 'border-red-200' : spamInfo.confidence === 'medium' ? 'border-orange-200' : 'border-yellow-200'}`}>
                            <p className="text-sm text-gray-600 mb-1">⚠️ Spam Analysis</p>
                            <p className={`text-sm font-semibold ${textClass} mb-2`}>
                              {spamInfo.confidence.toUpperCase()} Confidence
                            </p>
                            <p className="text-xs text-gray-700">
                              <strong>Indicators:</strong> {spamInfo.reason}
                            </p>
                          </div>
                        )
                      }
                      return null
                    })()}
                    
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Influence Level</p>
                      <p className="text-lg font-semibold text-orange-700">{calculateInfluence(user)}</p>
                    </div>
                    
                    {(user.experimental?.neynar_user_score || user.neynar_user_score) && (
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center">
                              <p className="text-sm text-gray-600">Neynar Score</p>
                              <NeynarScoreInfo />
                            </div>
                            <p className="text-lg font-semibold text-green-700">
                              {Math.round((user.experimental?.neynar_user_score || user.neynar_user_score || 0) * 100)}/100
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
              <div className="flex gap-2 w-full">
                <Button onClick={handleViewProfile} className="flex-1">
                  View Profile
                </Button>
                <Button onClick={handleShare} variant="secondary" className="flex-1">
                  Share
                </Button>
              </div>
            </div>
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="channels">
                <UserChannels fid={user.fid} />
              </TabsContent>

              <TabsContent value="wallets">
                <UserWallets fid={user.fid} />
              </TabsContent>


            </Tabs>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Search for a user to view their profile</p>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  )
}
