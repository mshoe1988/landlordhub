# SendGrid Setup Instructions

## Step 1: Create SendGrid Account
1. Go to **https://sendgrid.com**
2. Click **"Start for Free"**
3. Sign up with your email (mshoe88@gmail.com)
4. Verify your email address

## Step 2: Generate API Key
1. Go to **https://app.sendgrid.com/settings/api_keys**
2. Click **"Create API Key"**
3. Select **"Restricted Access"**
4. Give it a name: "LandlordHub Help Form"
5. Under **"Mail Send"**, select **"Full Access"**
6. Click **"Create & View"**
7. **Copy the API key** (starts with `SG.`)

## Step 3: Verify Sender Identity
1. Go to **https://app.sendgrid.com/settings/sender_auth**
2. Click **"Verify a Single Sender"**
3. Fill out the form:
   - **From Name**: LandlordHub
   - **From Email**: mshoe88@gmail.com
   - **Reply To**: mshoe88@gmail.com
   - **Company Address**: Your address
4. Click **"Create"**
5. **Check your email** and click the verification link

## Step 4: Update Vercel Environment Variables
1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add these variables:

**SENDGRID_API_KEY**
- Value: Your SendGrid API key (starts with SG.)

**SENDGRID_FROM_EMAIL**
- Value: mshoe88@gmail.com

## Step 5: Test the Help Form
1. Go to your app: https://landlordly-jfozoo8qq-matthew-shoemakers-projects.vercel.app
2. Scroll to footer, click **"Need Help?"**
3. Fill out the form and submit
4. Check your email at **mshoe88@gmail.com**

## SendGrid Benefits
- ✅ **100 emails/day free** (perfect for help forms)
- ✅ **No domain verification** needed for single sender
- ✅ **Reliable delivery** (less likely to go to spam)
- ✅ **Professional service** (used by major companies)
- ✅ **Easy setup** (much simpler than Gmail SMTP)

## Troubleshooting
- Make sure sender email is verified in SendGrid
- Check spam folder if email doesn't arrive
- Verify API key has "Mail Send" permissions
- Ensure environment variables are saved in Vercel
