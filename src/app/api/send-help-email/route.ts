import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message, priority } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Log the help request (for now, until we set up Formspree)
    console.log('Help request received:', {
      name,
      email,
      subject,
      message: message.substring(0, 100) + '...',
      priority,
      timestamp: new Date().toISOString()
    })
    
    // For now, return success so the form works
    // TODO: Set up Formspree for actual email delivery
    return NextResponse.json({ 
      success: true, 
      message: 'Help request received. We will contact you soon.',
      debug: {
        note: 'Formspree integration pending'
      }
    })
  } catch (error) {
    console.error('Error processing help request:', error)
    return NextResponse.json(
      { error: `Failed to send help request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}