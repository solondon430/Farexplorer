import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

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
}

function getTierColor(tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'): { primary: string; secondary: string; badge: string } {
  const colors = {
    'S': { primary: '#d97706', secondary: '#fef3c7', badge: '#f59e0b' },
    'A': { primary: '#059669', secondary: '#d1fae5', badge: '#10b981' },
    'B': { primary: '#2563eb', secondary: '#dbeafe', badge: '#3b82f6' },
    'C': { primary: '#7c3aed', secondary: '#ede9fe', badge: '#8b5cf6' },
    'D': { primary: '#4b5563', secondary: '#f3f4f6', badge: '#6b7280' },
    'F': { primary: '#64748b', secondary: '#f1f5f9', badge: '#94a3b8' }
  }
  return colors[tier] || colors.F
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
        cache: 'no-store'
      }
    )
    
    if (!response.ok) {
      console.error('Neynar API error:', response.status)
      return null
    }
    
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fid: string }> }
) {
  const resolvedParams = await context.params
  const { fid } = resolvedParams
  
  if (!fid || !/^\d+$/.test(fid)) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 72, fontWeight: 900, color: 'white', marginBottom: 20 }}>
              Farcaster Explorer
            </div>
            <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.9)' }}>
              Discover Your Farcaster Profile
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }

  try {
    const user = await fetchUserFromNeynar(fid)
    
    if (!user) {
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
            }}
          >
            <div style={{ fontSize: 60, fontWeight: 900, color: 'white', marginBottom: 20 }}>
              User Not Found
            </div>
            <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)' }}>
              FID: {fid}
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
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
      followers: user.follower_count
    }

    const colors = getTierColor(stats.quotientTier)

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 50%, #ddd6fe 100%)',
            padding: 60,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              background: 'white',
              borderRadius: 24,
              padding: 40,
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            }}
          >
            {/* Header with avatar and name */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 40,
              }}
            >
              <img
                src={stats.avatarUrl}
                alt={stats.displayName}
                width={140}
                height={140}
                style={{
                  borderRadius: 70,
                  border: `5px solid ${colors.secondary}`,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginLeft: 30,
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 48, fontWeight: 700, color: '#1f2937' }}>
                  {stats.displayName}
                </div>
                <div style={{ fontSize: 32, fontWeight: 400, color: '#6b7280', marginTop: 5 }}>
                  @{stats.username}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: 15,
                    padding: '8px 20px',
                    background: '#e5e7eb',
                    borderRadius: 20,
                    width: 'fit-content',
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: 600, color: '#374151' }}>
                    FID: {stats.fid}
                  </span>
                </div>
              </div>
              
              {/* Branding in top right */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#7c3aed',
                  padding: '15px 30px',
                  borderRadius: 12,
                  opacity: 0.9,
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>
                  Farcaster Explorer
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div
              style={{
                display: 'flex',
                gap: 20,
                width: '100%',
              }}
            >
              {/* Quotient Rank */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: colors.secondary,
                  borderRadius: 16,
                  padding: 30,
                  flex: 1,
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>
                  Quotient Rank
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: colors.primary }}>
                  {stats.quotientRank}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 15,
                    right: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    background: colors.badge,
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontSize: 36, fontWeight: 900, color: 'white' }}>
                    {stats.quotientTier}
                  </span>
                </div>
              </div>

              {/* Neynar Score */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#d1fae5',
                  borderRadius: 16,
                  padding: 30,
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>
                  Neynar Score
                </div>
                <div style={{ fontSize: 48, fontWeight: 700, color: '#059669' }}>
                  {stats.neynarScore}/100
                </div>
              </div>

              {/* Followers */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#dbeafe',
                  borderRadius: 16,
                  padding: 30,
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>
                  Followers
                </div>
                <div style={{ fontSize: 42, fontWeight: 700, color: '#2563eb' }}>
                  {stats.followers.toLocaleString()}
                </div>
              </div>

              {/* Influence */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fef3c7',
                  borderRadius: 16,
                  padding: 30,
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>
                  Influence
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
                  {stats.influenceLevel}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginTop: 30,
              }}
            >
              <span style={{ fontSize: 16, color: '#9ca3af' }}>
                Updated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        }
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 900, color: 'white', marginBottom: 20 }}>
            Error Loading Profile
          </div>
          <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)' }}>
            Please try again later
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }
}

export const runtime = 'edge'
