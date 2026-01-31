import { useState } from 'react'
import { sdk } from "@farcaster/miniapp-sdk"

export function useAddMiniApp() {
  const [isAdding, setIsAdding] = useState(false)

  const addMiniApp = async (): Promise<void> => {
    if (isAdding) return
    
    setIsAdding(true)
    try {
      await sdk.actions.addFrame()
      console.log('Mini app added successfully')
    } catch (error) {
      console.error('Failed to add mini app:', error)
      throw error
    } finally {
      setIsAdding(false)
    }
  }

  return { addMiniApp, isAdding }
}
