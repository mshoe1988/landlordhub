'use client'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Dashboard temporarily unavailable</h1>
      <p style={{ marginBottom: 12 }}>We’re applying a fix. Other pages are available.</p>
      <Link href="/" style={{ color: '#1C7C63', textDecoration: 'underline' }}>Go to Home</Link>
    </div>
  )
}
