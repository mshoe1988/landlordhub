# Email Reminders Setup Guide

This guide will help you set up automated email reminders for maintenance tasks using Resend API.

## 1. Resend API Setup

### Get Resend API Key
1. Go to [resend.com](https://resend.com) and create an account
2. Navigate to API Keys section
3. Create a new API key
4. Copy the API key

### Configure Environment Variables
Add the following to your `.env.local` file:

```env
# Resend Email API
RESEND_API_KEY=your_resend_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://landlordhub.vercel.app
```

## 2. Database Setup

### Update Supabase Schema
Add the following to your Supabase database to enable email reminders:

```sql
-- Create a table to track sent reminders (optional)
CREATE TABLE IF NOT EXISTS public.email_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at timestamp WITH TIME ZONE DEFAULT now(),
  email_id text,
  status text DEFAULT 'sent',
  created_at timestamp WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reminders" ON public.email_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert reminders" ON public.email_reminders
  FOR INSERT WITH CHECK (true);
```

## 3. Vercel Cron Job Setup

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy the application

### Verify Cron Job
The cron job is configured in `vercel.json` to run daily at 9 AM UTC:
```json
{
  "crons": [
    {
      "path": "/api/send-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## 4. Email Template Features

### Professional Design
- **LandlordHub branding** with logo and colors
- **Responsive layout** that works on all devices
- **Clear task information** with property details
- **Call-to-action button** to view in the app
- **Professional styling** with proper typography

### Email Content
- **Subject**: "Maintenance Reminder: [Task Name] due in 3 days"
- **Task details**: Name, property address, due date, notes
- **Visual indicators**: Warning styling for urgency
- **App link**: Direct link to maintenance page
- **Support information**: Contact details for help

## 5. Testing the System

### Manual Testing
1. **Create test maintenance tasks** with due dates 3 days from now
2. **Use the test button** in the maintenance page
3. **Check email delivery** in your inbox
4. **Verify email content** and formatting

### Test Button Features
- **One-click testing** for email reminders
- **Real-time feedback** with loading states
- **Result display** showing success/failure
- **Error handling** with detailed messages

## 6. Production Considerations

### Email Deliverability
- **Domain verification**: Set up SPF, DKIM, and DMARC records
- **Sender reputation**: Use a verified domain for sending
- **Rate limiting**: Respect Resend's rate limits
- **Bounce handling**: Monitor and handle bounced emails

### Monitoring
- **Email logs**: Check Resend dashboard for delivery status
- **Error tracking**: Monitor failed email sends
- **Performance**: Track email send times and success rates
- **User feedback**: Monitor user complaints about emails

### Security
- **API key protection**: Keep Resend API key secure
- **Rate limiting**: Prevent abuse of the email endpoint
- **User consent**: Ensure users want to receive emails
- **Unsubscribe**: Provide unsubscribe options

## 7. Troubleshooting

### Common Issues

**Emails not sending:**
- Check Resend API key is correct
- Verify environment variables are set
- Check Resend dashboard for errors
- Ensure Supabase connection is working

**Cron job not running:**
- Verify Vercel deployment is successful
- Check Vercel cron job configuration
- Monitor Vercel function logs
- Test the endpoint manually

**Email formatting issues:**
- Check HTML template syntax
- Test with different email clients
- Verify responsive design
- Check for broken links

### Debug Steps

1. **Test the API endpoint** manually using the test button
2. **Check Vercel function logs** for errors
3. **Verify Resend API key** in environment variables
4. **Test with a simple email** first
5. **Check Supabase queries** are working correctly

## 8. Advanced Features

### Email Customization
- **User preferences**: Allow users to set email frequency
- **Email templates**: Create different templates for different task types
- **Localization**: Support multiple languages
- **Rich content**: Add images and better formatting

### Analytics
- **Open tracking**: Monitor email open rates
- **Click tracking**: Track link clicks in emails
- **Delivery reports**: Monitor email delivery success
- **User engagement**: Track user interaction with emails

### Automation
- **Smart scheduling**: Send emails at optimal times
- **Task prioritization**: Different emails for urgent tasks
- **Follow-up reminders**: Send additional reminders if needed
- **Task completion**: Send confirmation emails

## 9. Cost Optimization

### Resend Pricing
- **Free tier**: 3,000 emails/month
- **Paid plans**: Scale based on usage
- **Bulk discounts**: Better rates for higher volumes
- **Monitoring**: Track usage to avoid overages

### Efficiency
- **Batch processing**: Send multiple emails efficiently
- **Duplicate prevention**: Avoid sending duplicate reminders
- **Smart filtering**: Only send relevant reminders
- **User preferences**: Respect user email settings

## 10. Security Best Practices

### API Security
- **Environment variables**: Never commit API keys to code
- **Rate limiting**: Prevent abuse of email endpoints
- **Authentication**: Secure API endpoints properly
- **Monitoring**: Track unusual email activity

### Data Protection
- **User privacy**: Respect user email preferences
- **Data retention**: Don't store unnecessary email data
- **GDPR compliance**: Follow data protection regulations
- **Secure transmission**: Use HTTPS for all communications
