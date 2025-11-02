# Gmail SMTP Setup Instructions

## Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the prompts to enable 2FA (if not already enabled)

## Step 2: Generate App Password
1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", click **App passwords**
4. Select **Mail** as the app
5. Select **Other (Custom name)** as the device
6. Enter "LandlordHub Help Form" as the name
7. Click **Generate**
8. **Copy the 16-character password** (it will look like: abcd efgh ijkl mnop)

## Step 3: Update Vercel Environment Variables
1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your **LandlordHub project**
3. Go to **Settings** → **Environment Variables**
4. Find **GMAIL_APP_PASSWORD** and click **Edit**
5. Replace `your_gmail_app_password_here` with your actual 16-character app password
6. Click **Save**

## Step 4: Test the Help Form
1. Go to your app: https://landlordly-e832b8p3q-matthew-shoemakers-projects.vercel.app
2. Scroll to footer, click **"Need Help?"**
3. Fill out the form and submit
4. Check your email at **mizerikmate@gmail.com**

## Troubleshooting
- Make sure 2FA is enabled before generating app password
- App password is 16 characters with spaces (remove spaces when entering)
- Check spam folder if email doesn't arrive
- Verify environment variable is saved correctly in Vercel





