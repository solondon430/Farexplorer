'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAccount } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { buildSendTransaction, isApiError } from '@/app/types/api'
import { 
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction'
import type { TransactionError, TransactionResponse } from '@coinbase/onchainkit/transaction'
import { toast } from 'sonner'

const DONATE_ADDRESS: Address = '0xB3258576638B18f2B06405fb3c25F8718b5ea635'
const USDC_BASE_ADDRESS: Address = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'

interface DonateModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DonateModal({ isOpen, onClose }: DonateModalProps) {
  const { address, isConnected } = useAccount()
  const [selectedToken, setSelectedToken] = useState<'ETH' | 'USDC'>('ETH')
  const [amount, setAmount] = useState<string>('0.001')
  const [contracts, setContracts] = useState<Array<{ to: Address; data: `0x${string}`; value?: bigint }>>([])

  const handlePrepareTransaction = async (): Promise<void> => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      const decimals = selectedToken === 'ETH' ? 18 : 6
      const amountInWei = parseUnits(amount, decimals)

      const txCall = buildSendTransaction({
        recipientAddress: DONATE_ADDRESS,
        tokenAddress: selectedToken === 'ETH' ? null : USDC_BASE_ADDRESS,
        amount: amountInWei,
      })

      if (isApiError(txCall)) {
        toast.error(txCall.message || 'Failed to build transaction')
        return
      }

      setContracts([txCall])
    } catch (error) {
      console.error('Error preparing transaction:', error)
      toast.error('Failed to prepare transaction')
    }
  }

  const handleSuccess = (response: TransactionResponse): void => {
    console.log('Donation successful:', response)
    toast.success('Thank you for your donation! ☕')
    setContracts([])
    onClose()
  }

  const handleError = (error: TransactionError): void => {
    console.error('Donation failed:', error)
    toast.error('Donation failed. Please try again.')
    setContracts([])
  }

  const presetAmounts = selectedToken === 'ETH' 
    ? ['0.001', '0.005', '0.01', '0.05']
    : ['1', '5', '10', '20']

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>☕</span> Buy me a coffee
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {!isConnected ? (
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">Please connect your wallet to donate</p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* Token Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Choose token</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={selectedToken === 'ETH' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedToken('ETH')
                      setAmount('0.001')
                      setContracts([])
                    }}
                    className="w-full"
                  >
                    ETH
                  </Button>
                  <Button
                    type="button"
                    variant={selectedToken === 'USDC' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedToken('USDC')
                      setAmount('1')
                      setContracts([])
                    }}
                    className="w-full"
                  >
                    USDC
                  </Button>
                </div>
              </div>

              {/* Preset Amounts */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quick amounts</label>
                <div className="grid grid-cols-4 gap-2">
                  {presetAmounts.map((preset: string) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAmount(preset)
                        setContracts([])
                      }}
                      className="text-xs"
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="text-sm font-medium mb-2 block">Custom amount</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setAmount(e.target.value)
                      setContracts([])
                    }}
                    placeholder="Enter amount"
                    className="flex-1"
                  />
                  <span className="flex items-center px-3 bg-gray-100 rounded-md text-sm font-medium">
                    {selectedToken}
                  </span>
                </div>
              </div>

              {/* Transaction */}
              {contracts.length === 0 ? (
                <Button 
                  onClick={handlePrepareTransaction}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Donate {amount} {selectedToken}
                </Button>
              ) : (
                <Transaction
                  contracts={contracts}
                  onError={handleError}
                  onSuccess={handleSuccess}
                >
                  <TransactionButton className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" />
                  <TransactionSponsor />
                  <TransactionStatus>
                    <TransactionStatusLabel />
                    <TransactionStatusAction />
                  </TransactionStatus>
                </Transaction>
              )}

              <p className="text-xs text-gray-500 text-center">
                All donations go to supporting the development of this app ❤️
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
