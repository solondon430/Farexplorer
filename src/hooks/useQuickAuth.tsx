'use client'
import { useEffect } from 'react'

interface UseQuickAuthOptions {
  onSuccess?: (userData: unknown) => void
  onError?: (error: Error) => void
}

export function useQuickAuth(
  isInFarcaster: boolean,
  options?: UseQuickAuthOptions
): void {
  useEffect(() => {
    if (!isInFarcaster) {
      const initQuickAuth = async (): Promise<void> => {
        try {
          console.log('Quick Auth initialized for non-Farcaster context')
        } catch (error) {
          console.error('Quick Auth error:', error)
          if (options?.onError && error instanceof Error) {
            options.onError(error)
          }
        }
      }
      initQuickAuth()
    }
  }, [isInFarcaster, options])
}
