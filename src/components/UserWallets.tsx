'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Copy, Wallet } from 'lucide-react'

// Etherscan Logo Component
const EtherscanLogo = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 293.775 293.671" fill="currentColor">
    <path d="M146.878 0C65.786 0 0 65.786 0 146.878s65.786 146.878 146.878 146.878 146.878-65.786 146.878-146.878S227.969 0 146.878 0zm0 261.339c-63.139 0-114.461-51.322-114.461-114.461S83.739 32.417 146.878 32.417s114.461 51.322 114.461 114.461-51.322 114.461-114.461 114.461z"/>
    <path d="M146.878 62.196c-46.674 0-84.682 38.008-84.682 84.682s38.008 84.682 84.682 84.682 84.682-38.008 84.682-84.682-38.008-84.682-84.682-84.682zm24.728 122.424h-49.456v-15.496h49.456v15.496zm0-29.114h-49.456v-15.496h49.456v15.496zm0-29.114h-49.456V110.9h49.456v15.492z"/>
  </svg>
)

// Basescan Logo Component
const BasescanLogo = (): JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 111 111" fill="none">
    <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="#0052FF"/>
  </svg>
)

interface UserWalletsProps {
  fid: number
}

interface VerifiedAddress {
  address: string
  protocol: string
  verified_at?: number
  isPrimary?: boolean
}

export default function UserWallets({ fid }: UserWalletsProps): JSX.Element {
  const [wallets, setWallets] = useState<VerifiedAddress[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [copiedAddress, setCopiedAddress] = useState<string>('')

  useEffect(() => {
    fetchWallets()
  }, [fid])

  const fetchWallets = async (): Promise<void> => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'https',
          origin: 'api.neynar.com',
          path: `/v2/farcaster/user/bulk?fids=${fid}`,
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-api-key': 'NEYNAR_API_DOCS'
          }
        })
      })

      const data = await response.json()

      if (data.users && data.users.length > 0) {
        const user = data.users[0]
        
        // Get verified addresses from different possible fields
        const verifiedAddresses: VerifiedAddress[] = []
        
        // Get custody address (primary wallet)
        const custodyAddress = user.custody_address || user.custodyAddress
        if (custodyAddress) {
          verifiedAddresses.push({
            address: custodyAddress,
            protocol: 'ethereum',
            isPrimary: true
          })
        }
        
        // Check verifications array (simple string array)
        if (user.verifications && Array.isArray(user.verifications)) {
          user.verifications.forEach((addr: string) => {
            // Skip if it's the custody address (already added)
            if (addr.toLowerCase() !== custodyAddress?.toLowerCase()) {
              verifiedAddresses.push({
                address: addr,
                protocol: 'ethereum',
                isPrimary: false
              })
            }
          })
        }
        
        // Check verified_addresses (more detailed format)
        if (user.verified_addresses && Array.isArray(user.verified_addresses)) {
          user.verified_addresses.forEach((item: VerifiedAddress) => {
            // Avoid duplicates and skip custody address
            if (!verifiedAddresses.some(v => v.address.toLowerCase() === item.address.toLowerCase())) {
              verifiedAddresses.push({
                ...item,
                isPrimary: false
              })
            }
          })
        }

        // Sort: primary first, then others
        verifiedAddresses.sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1
          if (!a.isPrimary && b.isPrimary) return 1
          return 0
        })

        setWallets(verifiedAddresses)
      } else {
        setError('User not found')
      }
    } catch (err) {
      console.error('Error fetching wallets:', err)
      setError('Failed to fetch wallet data')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (address: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(''), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const openInEtherscan = (address: string): void => {
    window.open(`https://etherscan.io/address/${address}`, '_blank')
  }

  const openInBasescan = (address: string): void => {
    window.open(`https://basescan.org/address/${address}`, '_blank')
  }

  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getProtocolBadgeColor = (protocol: string): string => {
    const protocolLower = protocol.toLowerCase()
    if (protocolLower.includes('ethereum') || protocolLower === 'eth') {
      return 'bg-blue-100 text-blue-800'
    }
    if (protocolLower.includes('base')) {
      return 'bg-purple-100 text-purple-800'
    }
    if (protocolLower.includes('optimism')) {
      return 'bg-red-100 text-red-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 text-sm">{error}</p>
            <Button onClick={fetchWallets} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (wallets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 text-sm">No verified wallet addresses found</p>
            <p className="text-xs text-gray-400 mt-2">
              This user hasn't connected any wallet addresses to their Farcaster account
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <CardTitle>Verified Wallets</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {wallets.length}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Connected wallet addresses
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {wallets.map((wallet, index) => (
            <div
              key={`${wallet.address}-${index}`}
              className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Wallet className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    <Badge className={`${getProtocolBadgeColor(wallet.protocol)} text-xs`}>
                      {wallet.protocol.toUpperCase()}
                    </Badge>

                  </div>
                  <p className="text-xs font-mono text-gray-700 break-all mb-1">
                    {wallet.address}
                  </p>
                  <p className="text-xs text-gray-500">
                    {shortenAddress(wallet.address)}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(wallet.address)}
                    className="h-8 w-8 p-0"
                    title="Copy address"
                  >
                    {copiedAddress === wallet.address ? (
                      <span className="text-green-600 text-xs">✓</span>
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openInEtherscan(wallet.address)}
                    className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600"
                    title="View on Etherscan"
                  >
                    <EtherscanLogo />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openInBasescan(wallet.address)}
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                    title="View on Basescan"
                  >
                    <BasescanLogo />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
