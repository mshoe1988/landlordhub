import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  try {
    // Check if Gmail credentials are available
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({
        error: 'Gmail credentials not configured',
        hasUser: !!process.env.GMAIL_USER,
        hasPassword: !!process.env.GMAIL_APP_PASSWORD
      })
    }

    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })

    // Test the connection
    await transporter.verify()
    
    return NextResponse.json({
      success: true,
      message: 'Gmail SMTP connection successful',
      user: process.env.GMAIL_USER,
      hasPassword: !!process.env.GMAIL_APP_PASSWORD
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Gmail SMTP connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      user: process.env.GMAIL_USER,
      hasPassword: !!process.env.GMAIL_APP_PASSWORD
    })
  }
}





