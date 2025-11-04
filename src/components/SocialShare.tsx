'use client'

import { Facebook, Twitter, Linkedin, Share2 } from 'lucide-react'

interface SocialShareProps {
  url?: string
  title?: string
  description?: string
}

export default function SocialShare({ 
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = 'LandlordHub - Property Management Software',
  description = 'Manage your rental properties with ease. Track income, expenses, maintenance, and generate tax reports.'
}: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=landlordhubapp`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  }

  const handleShare = async (platform: 'facebook' | 'twitter' | 'linkedin' | 'native') => {
    if (platform === 'native') {
      if (navigator.share) {
        try {
          await navigator.share({
            title,
            text: description,
            url,
          })
        } catch (err) {
          // User cancelled or error occurred
          console.log('Share cancelled')
        }
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
      }
      return
    }

    const width = 600
    const height = 400
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2

    window.open(
      shareLinks[platform],
      'share',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0`
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 font-medium">Share:</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleShare('facebook')}
          aria-label="Share on Facebook"
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Facebook className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleShare('twitter')}
          aria-label="Share on Twitter"
          className="p-2 text-gray-600 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Twitter className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleShare('linkedin')}
          aria-label="Share on LinkedIn"
          className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Linkedin className="w-5 h-5" />
        </button>
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button
            onClick={() => handleShare('native')}
            aria-label="Share using native share"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

