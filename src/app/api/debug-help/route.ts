import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    hasFromEmail: !!process.env.FROM_EMAIL,
    adminEmail: process.env.ADMIN_EMAIL,
    fromEmail: process.env.FROM_EMAIL,
    resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
    timestamp: new Date().toISOString()
  })
}

