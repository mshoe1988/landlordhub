import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json({ error: 'Resend not configured' }, { status: 503 })
    }

    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 })
    }

    // Use the verified email address for testing
    const verifiedEmail = 'mizerikmate@gmail.com'
    
    const result = await resend.emails.send({
      from: 'LandlordHub <onboarding@resend.dev>',
      to: [verifiedEmail],
      subject: 'Test Email from LandlordHub',
      text: 'This is a test email from LandlordHub. If you receive this, the email system is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6;">🏠 LandlordHub Test Email</h1>
          <p>This is a test email from LandlordHub. If you receive this, the email system is working correctly!</p>
          <p>Your email system is now fully functional.</p>
        </div>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: result.data?.id
    })

  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
