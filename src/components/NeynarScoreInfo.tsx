'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'

export function NeynarScoreInfo() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 ml-2"
        onClick={() => setOpen(true)}
        title="How to improve Neynar Score"
      >
        <Info className="h-4 w-4 text-green-600" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              📊 How to Improve Your Neynar Score
            </DialogTitle>
            <DialogDescription className="text-base">
              Boost your influence and credibility on Farcaster
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Introduction */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                <strong>Neynar Score</strong> is a comprehensive metric that evaluates your activity, 
                engagement quality, and influence within the Farcaster ecosystem. Here's how to improve it:
              </p>
            </div>

            {/* Tips Section */}
            <div className="space-y-4">
              {/* Tip 1 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 text-green-700 rounded-full h-8 w-8 flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">🎯 Post Quality Content Regularly</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Share valuable, original content that resonates with your audience. Focus on:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pl-2">
                      <li>Original insights and thoughts</li>
                      <li>High-quality images and media</li>
                      <li>Engaging discussions and questions</li>
                      <li>Helpful information for your community</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tip 2 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full h-8 w-8 flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">💬 Engage Authentically</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Build genuine connections through meaningful interactions:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pl-2">
                      <li>Reply thoughtfully to others' casts</li>
                      <li>Like and recast content you genuinely appreciate</li>
                      <li>Participate in community discussions</li>
                      <li>Avoid spam or generic comments</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tip 3 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 text-purple-700 rounded-full h-8 w-8 flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">👥 Build Your Network Strategically</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Focus on quality over quantity:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pl-2">
                      <li>Follow accounts relevant to your interests</li>
                      <li>Engage before following to build relationships</li>
                      <li>Maintain a healthy follower-to-following ratio</li>
                      <li>Avoid mass following/unfollowing behavior</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tip 4 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 text-orange-700 rounded-full h-8 w-8 flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">✅ Verify Your Identity</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Build trust by verifying your accounts:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pl-2">
                      <li>Connect your Ethereum wallet</li>
                      <li>Verify email addresses</li>
                      <li>Link your social media accounts</li>
                      <li>Complete your profile information</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tip 5 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 text-indigo-700 rounded-full h-8 w-8 flex items-center justify-center font-bold flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">🔥 Stay Consistent & Active</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Regular activity shows you're an engaged community member:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pl-2">
                      <li>Post regularly (daily or several times a week)</li>
                      <li>Maintain consistent engagement</li>
                      <li>Join and participate in channels</li>
                      <li>Respond to replies and mentions promptly</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tip 6 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-pink-100 text-pink-700 rounded-full h-8 w-8 flex items-center justify-center font-bold flex-shrink-0">
                    6
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">🎨 Participate in Channels</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Join relevant communities and become an active member:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside pl-2">
                      <li>Follow channels related to your interests</li>
                      <li>Post valuable content in channels</li>
                      <li>Help moderate or contribute to channel discussions</li>
                      <li>Build your reputation within niche communities</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* What to Avoid */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2">⚠️ What to Avoid</h3>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>Spam or low-quality content</li>
                <li>Mass following/unfollowing</li>
                <li>Buying followers or engagement</li>
                <li>Copy-pasting generic comments</li>
                <li>Aggressive self-promotion</li>
              </ul>
            </div>

            {/* Bottom Note */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>💡 Pro Tip:</strong> Your Neynar Score improves gradually over time as you build genuine 
                connections and contribute value to the Farcaster community. Focus on quality engagement rather 
                than gaming the system.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setOpen(false)} className="bg-gradient-to-r from-green-600 to-emerald-600">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
