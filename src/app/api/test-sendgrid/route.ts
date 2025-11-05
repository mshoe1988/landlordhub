import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

export async function GET() {
  try {
    // Check if SendGrid API key is available
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json({
        error: 'SendGrid API key not configured',
        hasApiKey: false
      })
    }

    // Set SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    // Test email
    const msg = {
      to: 'mshoe88@gmail.com',
      from: 'mshoe88@gmail.com',
      subject: 'Test Email from LandlordHub',
      text: 'This is a test email to verify SendGrid is working.',
      html: '<p>This is a test email to verify SendGrid is working.</p>'
    }

    // Try to send test email
    const result = await sgMail.send(msg)
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result[0]?.headers?.['x-message-id']
    })

  } catch (error) {
    return NextResponse.json({
      error: 'SendGrid test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      hasApiKey: !!process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL
    })
  }
}









