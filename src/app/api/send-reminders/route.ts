import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get all pending maintenance tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('maintenance_tasks')
      .select(`
        *,
        properties!inner(
          address,
          user_id
        )
      `)
      .eq('status', 'pending')

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Calculate date 3 days from now
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const targetDate = threeDaysFromNow.toISOString().split('T')[0]

    // Filter tasks due in exactly 3 days
    const upcomingTasks = tasks.filter(task => 
      task.due_date === targetDate
    )

    if (upcomingTasks.length === 0) {
      return NextResponse.json({ 
        message: 'No tasks due in 3 days',
        tasksFound: 0 
      })
    }

    // Get user emails for the tasks
    const userIds = [...new Set(upcomingTasks.map(task => task.properties.user_id))]
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Create user email lookup
    const userEmailMap = new Map(users.map(user => [user.id, user.email]))

    // Send emails for each task
    const emailResults = []
    
    for (const task of upcomingTasks) {
      const userEmail = userEmailMap.get(task.properties.user_id)
      
      if (!userEmail) {
        console.warn(`No email found for user ${task.properties.user_id}`)
        continue
      }

      try {
        const emailResult = await resend.emails.send({
          from: 'LandlordHub <noreply@landlordhub.com>',
          to: [userEmail],
          subject: `Maintenance Reminder: ${task.task} due in 3 days`,
          html: generateEmailTemplate(task)
        })

        emailResults.push({
          taskId: task.id,
          taskName: task.task,
          propertyAddress: task.properties.address,
          userEmail,
          emailId: emailResult.data?.id,
          success: true
        })
      } catch (emailError) {
        console.error(`Failed to send email for task ${task.id}:`, emailError)
        emailResults.push({
          taskId: task.id,
          taskName: task.task,
          propertyAddress: task.properties.address,
          userEmail,
          success: false,
          error: emailError
        })
      }
    }

    const successfulEmails = emailResults.filter(result => result.success).length
    const failedEmails = emailResults.filter(result => !result.success).length

    return NextResponse.json({
      message: `Reminder emails processed`,
      totalTasks: upcomingTasks.length,
      successfulEmails,
      failedEmails,
      results: emailResults
    })

  } catch (error) {
    console.error('Error in send-reminders API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateEmailTemplate(task: any) {
  const dueDate = new Date(task.due_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Maintenance Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🏠 LandlordHub</h1>
        <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Property Management Suite</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">Maintenance Reminder</h2>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">
            ⚠️ This maintenance task is due in 3 days
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">${task.task}</h3>
          
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Property:</strong> ${task.properties.address}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
            ${task.notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${task.notes}</p>` : ''}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://landlordhub.vercel.app'}/maintenance" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View in LandlordHub
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #6b7280;">
          <p>This is an automated reminder from LandlordHub. Please log in to your account to manage your maintenance tasks.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Send reminders endpoint is working',
    timestamp: new Date().toISOString()
  })
}
