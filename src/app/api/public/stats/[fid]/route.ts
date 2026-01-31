import { NextRequest, NextResponse } from 'next/server'

interface NeynarUser {
  fid: number
  username: string
  display_name: string
  pfp_url: string
  follower_count: number
  following_count: number
  experimental?: {
    neynar_user_score?: number
  }
  neynar_user_score?: number
}

interface PublicStats {
  fid: number
  displayName: string
  username: string
  avatarUrl: string
  neynarScore: number
  influenceLevel: string
  quotientRank: string
  quotientTier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  followers: number
  casts: number
  publicShareEnabled: boolean
}

function calculateInfluence(followerCount: number, followingCount: number): string {
  const ratio = followerCount / Math.max(followingCount, 1)
  if (ratio >= 10) return '🔥 Influencer'
  if (ratio >= 3) return '⭐ Notable'
  if (ratio >= 1) return '📈 Growing'
  return '🌱 Emerging'
}

function calculateQuotientRank(user: NeynarUser): { 
  rank: string
  tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
} {
  const neynarScore = user.experimental?.neynar_user_score || user.neynar_user_score || 0
  const followerCount = user.follower_count
  const followingCount = user.following_count
  
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
  
  const normalizedScore = Math.min(Math.round(compositeScore), 1000)
  
  let tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  let rank: string
  
  if (normalizedScore >= 800) {
    tier = 'S'
    rank = 'S-Tier Elite'
  } else if (normalizedScore >= 600) {
    tier = 'A'
    rank = 'A-Tier Power User'
  } else if (normalizedScore >= 400) {
    tier = 'B'
    rank = 'B-Tier Active'
  } else if (normalizedScore >= 200) {
    tier = 'C'
    rank = 'C-Tier Engaged'
  } else if (normalizedScore >= 100) {
    tier = 'D'
    rank = 'D-Tier Growing'
  } else {
    tier = 'F'
    rank = 'F-Tier Starter'
  }
  
  return { rank, tier }
}

async function fetchUserFromNeynar(fid: string): Promise<NeynarUser | null> {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': '2D812E54-6373-4A2D-902F-0FDAD0AFA754'
        },
        next: { revalidate: 3600 }
      }
    )
    
    const data = await response.json()
    
    if (data.users && data.users.length > 0) {
      return data.users[0]
    }
    
    return null
  } catch (error) {
    console.error('Error fetching user from Neynar:', error)
    return null
  }
}

function checkPublicShareEnabled(fid: string): boolean {
  // In a real implementation, this would check a database
  // For now, we'll default to true (opt-out model)
  // You can integrate with SpacetimeDB or another storage solution
  
  // Check localStorage simulation (server-side would use DB)
  // For demo purposes, assume public share is enabled by default
  return true
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fid: string }> }
): Promise<NextResponse> {
  const resolvedParams = await context.params
  const { fid } = resolvedParams
  
  if (!fid || !/^\d+$/.test(fid)) {
    return NextResponse.json(
      { error: 'Invalid FID' },
      { status: 400 }
    )
  }
  
  // Check if public sharing is enabled for this user
  const publicShareEnabled = checkPublicShareEnabled(fid)
  
  if (!publicShareEnabled) {
    return NextResponse.json(
      {
        fid: parseInt(fid),
        publicShareEnabled: false,
        message: 'User has not enabled public share images'
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400'
        }
      }
    )
  }
  
  // Fetch user data from Neynar
  const user = await fetchUserFromNeynar(fid)
  
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  }
  
  const neynarScore = user.experimental?.neynar_user_score || user.neynar_user_score || 0
  const quotientRank = calculateQuotientRank(user)
  const influenceLevel = calculateInfluence(user.follower_count, user.following_count)
  
  const stats: PublicStats = {
    fid: user.fid,
    displayName: user.display_name,
    username: user.username,
    avatarUrl: user.pfp_url,
    neynarScore: Math.round(neynarScore * 100),
    influenceLevel,
    quotientRank: quotientRank.rank,
    quotientTier: quotientRank.tier,
    followers: user.follower_count,
    casts: user.following_count, // Using following_count as casts placeholder
    publicShareEnabled: true
  }
  
  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400'
    }
  })
}
