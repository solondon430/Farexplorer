import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    fid: string
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

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

async function fetchUserData(fid: string): Promise<NeynarUser | null> {
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
    console.error('Error fetching user:', error)
    return null
  }
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const { fid } = resolvedParams
  
  const user = await fetchUserData(fid)
  
  if (!user) {
    return {
      title: 'Farcaster Explorer',
      description: 'Explore Farcaster profiles',
    }
  }
  
  const quotientRank = calculateQuotientRank(user)
  const neynarScore = user.experimental?.neynar_user_score || user.neynar_user_score || 0
  const scorePercent = Math.round(neynarScore * 100)
  
  const description = `${user.display_name} (@${user.username})\n🏆 ${quotientRank.rank}\n📊 Score: ${scorePercent}/100\n👥 ${user.follower_count.toLocaleString()} Followers`
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://suit-national-054.app.ohara.ai'
  // Use direct PNG URL without cache busting in metadata (Farcaster will cache based on URL)
  const ogImageUrl = `${baseUrl}/og/farcaster/${fid}.png`
  
  return {
    title: `${user.display_name} - Farcaster Explorer`,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: 'website',
      url: `${baseUrl}/profile/${fid}`,
      title: `${user.display_name} (@${user.username})`,
      description: `🏆 ${quotientRank.rank} • 📊 ${scorePercent}/100 • 👥 ${user.follower_count.toLocaleString()} Followers`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${user.display_name}'s Farcaster Profile`,
          type: 'image/png'
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${user.display_name} (@${user.username})`,
      description: `🏆 ${quotientRank.rank} • 📊 ${scorePercent}/100 • 👥 ${user.follower_count.toLocaleString()} Followers`,
      images: [ogImageUrl],
    },
    other: {
      'fc:frame': 'vNext',
      'fc:frame:image': ogImageUrl,
      'fc:frame:image:aspect_ratio': '1.91:1',
      'fc:frame:button:1': 'Open Farcaster Explorer',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': `${baseUrl}?fid=${fid}`
    }
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const resolvedParams = await params
  const { fid } = resolvedParams
  
  redirect(`/?fid=${fid}`)
}
