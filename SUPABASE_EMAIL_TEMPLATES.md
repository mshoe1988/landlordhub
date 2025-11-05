# Supabase Email Templates Setup Guide

## Problem
Currently, Supabase sends generic confirmation emails that say "Confirm your signup" with Supabase branding instead of LandlordHub branding.

## Solution
Configure custom email templates in your Supabase dashboard to include LandlordHub branding.

## Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your LandlordHub project
4. Go to **Authentication** → **Email Templates**

## Step 2: Configure Email Confirmation Template

### Subject Line
Change from: `Confirm your signup`
Change to: `Verify your LandlordHub account`

### Email Body Template
Replace the default template with this branded version:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 60px; height: 60px; background-color: #3b82f6; border-radius: 50%; margin-bottom: 15px;">
      <div style="color: white; font-size: 24px; line-height: 60px;">🏠</div>
    </div>
    <h1 style="color: #1f2937; margin: 0; font-size: 28px;">Welcome to LandlordHub</h1>
    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 16px;">Property Management Suite</p>
  </div>
  
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
    
    <p style="color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">
      Thank you for signing up for LandlordHub! To complete your account setup, please verify your email address by clicking the button below.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Verify Email Address
      </a>
    </div>
    
    <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 14px; line-height: 1.5;">
      If the button doesn't work, you can also copy and paste this link into your browser:
    </p>
    <p style="color: #3b82f6; margin: 5px 0 0 0; font-size: 14px; word-break: break-all;">
      {{ .ConfirmationURL }}
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; margin: 0; font-size: 14px;">
      This email was sent by LandlordHub. If you didn't sign up for an account, you can safely ignore this email.
    </p>
    <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">
      © 2025 LandlordHub. All rights reserved.
    </p>
  </div>
</div>
```

## Step 3: Configure Password Reset Template

### Subject Line
Change from: `Reset your password`
Change to: `Reset your LandlordHub password`

### Email Body Template
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 60px; height: 60px; background-color: #3b82f6; border-radius: 50%; margin-bottom: 15px;">
      <div style="color: white; font-size: 24px; line-height: 60px;">🏠</div>
    </div>
    <h1 style="color: #1f2937; margin: 0; font-size: 28px;">LandlordHub</h1>
    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 16px;">Property Management Suite</p>
  </div>
  
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
    
    <p style="color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">
      You requested to reset your password for your LandlordHub account. Click the button below to create a new password.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 14px; line-height: 1.5;">
      If the button doesn't work, you can also copy and paste this link into your browser:
    </p>
    <p style="color: #3b82f6; margin: 5px 0 0 0; font-size: 14px; word-break: break-all;">
      {{ .ConfirmationURL }}
    </p>
    
    <p style="color: #ef4444; margin: 20px 0 0 0; font-size: 14px; line-height: 1.5;">
      <strong>Security Note:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; margin: 0; font-size: 14px;">
      This email was sent by LandlordHub. If you didn't request a password reset, you can safely ignore this email.
    </p>
    <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">
      © 2025 LandlordHub. All rights reserved.
    </p>
  </div>
</div>
```

## Step 4: Configure Magic Link Template (Optional)

### Subject Line
Change to: `Your LandlordHub login link`

### Email Body Template
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 60px; height: 60px; background-color: #3b82f6; border-radius: 50%; margin-bottom: 15px;">
      <div style="color: white; font-size: 24px; line-height: 60px;">🏠</div>
    </div>
    <h1 style="color: #1f2937; margin: 0; font-size: 28px;">LandlordHub</h1>
    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 16px;">Property Management Suite</p>
  </div>
  
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Your Login Link</h2>
    
    <p style="color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">
      Click the button below to sign in to your LandlordHub account. This link will expire in 1 hour for your security.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Sign In to LandlordHub
      </a>
    </div>
    
    <p style="color: #6b7280; margin: 20px 0 0 0; font-size: 14px; line-height: 1.5;">
      If the button doesn't work, you can also copy and paste this link into your browser:
    </p>
    <p style="color: #3b82f6; margin: 5px 0 0 0; font-size: 14px; word-break: break-all;">
      {{ .ConfirmationURL }}
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; margin: 0; font-size: 14px;">
      This email was sent by LandlordHub. If you didn't request this login link, you can safely ignore this email.
    </p>
    <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">
      © 2025 LandlordHub. All rights reserved.
    </p>
  </div>
</div>
```

## Step 5: Save and Test

1. **Save all templates** in the Supabase dashboard
2. **Test the email confirmation** by creating a new account
3. **Test password reset** by using the forgot password feature
4. **Verify the emails** now show LandlordHub branding

## Benefits

✅ **Professional branding** - All emails now show LandlordHub instead of Supabase  
✅ **Consistent experience** - Users see your brand throughout the signup process  
✅ **Better trust** - Users know the emails are legitimate from LandlordHub  
✅ **Custom styling** - Emails match your app's design and colors  

## Template Variables

Supabase provides these variables you can use in templates:
- `{{ .ConfirmationURL }}` - The confirmation/reset link
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your app's URL
- `{{ .Token }}` - The confirmation token

## Troubleshooting

- **Templates not updating?** Clear your browser cache and refresh the Supabase dashboard
- **Emails still generic?** Wait 5-10 minutes for changes to propagate
- **Links not working?** Check that your app URL is correctly configured in Supabase settings







