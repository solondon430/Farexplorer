'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DonateModal } from '@/components/DonateModal'

export function DonateButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="ghost"
        size="sm"
        className="text-xs gap-1 hover:bg-purple-50 transition-colors"
        title="Support this app"
      >
        <span>☕</span>
        <span className="hidden sm:inline">Donate</span>
      </Button>
      
      <DonateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
