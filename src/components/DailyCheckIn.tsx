'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { sdk } from '@farcaster/miniapp-sdk'
import { createWalletClient, custom, encodeFunctionData, type Hash } from 'viem'
import { base } from 'viem/chains'
import { CONTRACT_ABI } from '@/lib/contractABI'
import { useAccount, useConnect, useWriteContract } from 'wagmi'
import { coinbaseWallet } from 'wagmi/connectors'
import type { Address } from 'viem'

// Contract configuration
const CONTRACT_ADDRESS = '0x5A7B3D699CE98aC329A34f74Cb48fFc1b980e65a' as Address
const CHAIN_ID = 8453 // Base mainnet

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on?: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
    }
  }
}

export function DailyCheckIn() {
  // Wagmi hooks for fallback mode (outside Farcaster)
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount()
  const { connect } = useConnect()
  const { writeContractAsync } = useWriteContract()
  
  // Farcaster mode states
  const [isInFarcaster, setIsInFarcaster] = useState(false)
  const [fid, setFid] = useState<number | null>(null)
  
  // Common states
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [lastCheckInHash, setLastCheckInHash] = useState<string | null>(null)
  const [showShareButton, setShowShareButton] = useState(false)
  
  // Detect Farcaster and get context
  useEffect(() => {
    const initFarcaster = async (): Promise<void> => {
      try {
        // Try to get Farcaster context
        const context = await sdk.context
        
        if (context?.user?.fid) {
          setIsInFarcaster(true)
          setFid(context.user.fid)
          console.log('✅ Running in Farcaster, FID:', context.user.fid)
        } else {
          setIsInFarcaster(false)
          console.log('❌ Not running in Farcaster')
        }
      } catch (error) {
        console.error('Farcaster detection error:', error)
        setIsInFarcaster(false)
      }
    }
    
    initFarcaster()
  }, [])
  
  // Check if user has already checked in today
  useEffect(() => {
    // Use FID for storage key when in Farcaster, wagmi address when outside
    const storageKey = isInFarcaster && fid 
      ? `checkin_fid_${fid}` 
      : wagmiAddress 
        ? `checkin_${wagmiAddress.toLowerCase()}` 
        : null

    if (!storageKey) return

    const storedCheckIn = localStorage.getItem(storageKey)
    
    if (storedCheckIn) {
      const { date } = JSON.parse(storedCheckIn)
      const today = new Date().toDateString()
      
      // If the stored date is today, user has already checked in
      if (date === today) {
        setHasCheckedInToday(true)
      } else {
        // If it's a new day, clear the old check-in
        localStorage.removeItem(storageKey)
        setHasCheckedInToday(false)
      }
    }
  }, [fid, wagmiAddress, isInFarcaster])

  const handleCheckInWithFarcaster = async (): Promise<void> => {
    if (!fid) {
      toast.error('Farcaster FID not found')
      return
    }

    try {
      setIsProcessing(true)
      console.log('🚀 Starting check-in with Farcaster wallet...')
      console.log('📋 FID:', fid)
      console.log('📋 Contract:', CONTRACT_ADDRESS)
      
      // Get Farcaster wallet provider from SDK
      const ethProvider = sdk.wallet.ethProvider
      
      if (!ethProvider) {
        toast.error('Farcaster wallet not detected. Please make sure you are using the Farcaster app.')
        setIsProcessing(false)
        return
      }
      
      console.log('✅ Farcaster wallet provider detected')
      
      // Create wallet client using Farcaster's provider
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(ethProvider)
      })
      
      // Request account access
      const [address] = await walletClient.requestAddresses()
      console.log('📋 Wallet address:', address)
      
      // Encode the checkIn function call
      const data = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'checkIn',
        args: []
      })
      
      console.log('📝 Encoded data:', data)
      
      toast.info('Please approve the transaction in Farcaster...')
      
      // Send transaction using viem wallet client
      const hash: Hash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACT_ADDRESS,
        data: data,
        chain: base
      })
      
      console.log('📝 Transaction hash:', hash)
      
      toast.success('✅ Check-in successful! Reward claimed.')
      
      // Save check-in status to localStorage using FID
      const checkInKey = `checkin_fid_${fid}`
      const today = new Date().toDateString()
      localStorage.setItem(checkInKey, JSON.stringify({ date: today }))
      
      setHasCheckedInToday(true)
      
      // Save hash and show share button
      setLastCheckInHash(hash)
      setShowShareButton(true)
    } catch (error) {
      console.error('❌ Check-in error:', error)
      console.error('❌ Error type:', typeof error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      handleCheckInError(error, fid)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCheckInWithWagmi = async (): Promise<void> => {
    console.log('🔗 Using Coinbase Wallet (outside Farcaster)...')
    
    // If not connected, trigger connection first
    if (!wagmiConnected) {
      try {
        setIsProcessing(true)
        toast.info('Connecting wallet...')
        
        await connect({
          connector: coinbaseWallet({
            appName: 'Farcaster Explorer',
            preference: 'smartWalletOnly'
          }),
          chainId: base.id
        })
        
        toast.success('Wallet connected! Click Check In again to continue.')
      } catch (error) {
        console.error('Connection error:', error)
        toast.error('Failed to connect wallet')
      } finally {
        setIsProcessing(false)
      }
      return
    }

    // If connected, execute check-in
    try {
      setIsProcessing(true)
      toast.info('Please approve the transaction...')
      
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'checkIn',
        args: [],
        chainId: CHAIN_ID
      })
      
      if (hash) {
        toast.success('✅ Check-in successful! Reward claimed.')
        
        console.log('Transaction hash:', hash)
        
        // Save check-in status to localStorage
        const checkInKey = `checkin_${wagmiAddress.toLowerCase()}`
        const today = new Date().toDateString()
        localStorage.setItem(checkInKey, JSON.stringify({ date: today }))
        
        setHasCheckedInToday(true)
        
        // Save hash and show share button (only in Farcaster mode)
        if (isInFarcaster) {
          setLastCheckInHash(hash)
          setShowShareButton(true)
        }
      }
    } catch (error) {
      console.error('Check-in error:', error)
      handleCheckInError(error, wagmiAddress)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCheckInError = (error: unknown, identifier: string | number | undefined): void => {
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      
      if (errorMsg.includes('user rejected') || errorMsg.includes('user denied')) {
        toast.error('Transaction cancelled')
      } else if (errorMsg.includes('cooldown') || errorMsg.includes('cannot check in yet')) {
        toast.error('You have already checked in within the last 24 hours.')
        // Mark as checked in to prevent further attempts
        if (identifier) {
          const checkInKey = isInFarcaster 
            ? `checkin_fid_${identifier}` 
            : `checkin_${identifier}`
          const today = new Date().toDateString()
          localStorage.setItem(checkInKey, JSON.stringify({ date: today }))
          setHasCheckedInToday(true)
        }
      } else if (errorMsg.includes('insufficient')) {
        toast.error('Contract does not have sufficient funds.')
      } else {
        toast.error(`Error: ${error.message}`)
      }
    } else {
      toast.error('An error occurred. Please try again.')
    }
  }

  const handleShareToFarcaster = async (): Promise<void> => {
    if (!lastCheckInHash) return
    
    try {
      const appUrl = window.location.origin
      
      await sdk.actions.composeCast({
        text: `✅ Daily check-in done! 🎁\n\nTry it: ${appUrl}`,
        embeds: [appUrl]
      })
      
      toast.success('Share window opened!')
      setShowShareButton(false) // Hide button after sharing
    } catch (error) {
      console.error('Share error:', error)
      toast.error('Failed to open share window')
    }
  }

  const handleCheckIn = async (): Promise<void> => {
    if (hasCheckedInToday) {
      toast.info('You have already checked in today!')
      return
    }

    console.log('🎯 handleCheckIn called, isInFarcaster:', isInFarcaster, 'fid:', fid)

    // Route to the correct handler based on environment
    if (isInFarcaster && fid) {
      console.log('✅ Routing to Farcaster wallet')
      await handleCheckInWithFarcaster()
    } else {
      console.log('✅ Routing to Coinbase wallet')
      await handleCheckInWithWagmi()
    }
  }

  // Button is disabled only if already checked in or currently processing
  const isDisabled = isProcessing || hasCheckedInToday

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={handleCheckIn}
        disabled={isDisabled}
        size="sm"
        className={
          isDisabled
            ? "bg-gray-400 hover:bg-gray-400 text-gray-700 cursor-not-allowed font-semibold px-8"
            : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg px-8 transform transition-transform hover:scale-105"
        }
      >
        Check In
      </Button>

      {/* Share Button - appears after successful check-in */}
      {showShareButton && isInFarcaster && (
        <Button
          onClick={handleShareToFarcaster}
          size="sm"
          variant="outline"
          className="border-purple-500 text-purple-500 hover:bg-purple-50"
        >
          📢 Share to Farcaster
        </Button>
      )}
    </div>
  )
}
