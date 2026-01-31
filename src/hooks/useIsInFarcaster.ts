import { useState, useEffect } from 'react'

export function useIsInFarcaster(): boolean {
  const [isInFarcaster, setIsInFarcaster] = useState(false)

  useEffect(() => {
    const checkFarcasterContext = (): void => {
      if (typeof window === 'undefined') return
      
      const inFarcaster = 
        window.parent !== window ||
        /farcaster/i.test(navigator.userAgent) ||
        document.referrer.includes('warpcast.com')
      
      setIsInFarcaster(inFarcaster)
    }

    checkFarcasterContext()
  }, [])

  return isInFarcaster
}
