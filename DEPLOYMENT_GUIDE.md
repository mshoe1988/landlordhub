# Deployment Guide - Rent Payments Feature

## Overview
After running the SQL migration in Supabase, you need to deploy your code changes to make the rent payment feature visible on landlordhubapp.com.

## Workflow
1. **Commit changes locally** (your computer)
2. **Push to GitHub** 
3. **Vercel auto-deploys** from GitHub (if connected)

## Step-by-Step Instructions

### Option 1: Push to GitHub (Recommended)

1. **Check your changes:**
   ```bash
   git status
   ```

2. **Add the new files and changes:**
   ```bash
   git add .
   # Or add specific files:
   git add src/components/RentPaymentStatus.tsx
   git add src/lib/database.ts
   git add src/lib/types.ts
   git add src/app/properties/page.tsx
   ```

3. **Commit the changes:**
   ```bash
   git commit -m "Add rent payment tracking feature"
   ```

4. **Push to GitHub:**
   ```bash
   git push origin main
   # Or if your branch is named differently:
   git push origin master
   ```

5. **Vercel will automatically deploy** (if connected to GitHub)

### Option 2: Deploy directly with Vercel CLI

If you have Vercel CLI installed:

1. **Install Vercel CLI (if not already):**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Option 3: Manual Deployment via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Find your landlordly project
3. Click **Deployments** tab
4. Click **Redeploy** (this redeploys the current code)
   - Note: This only works if code is already in GitHub
   - For new files, you need to push to GitHub first

## Verify Deployment

After deployment completes:

1. Visit https://landlordhubapp.com
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Open browser console (F12) → Console tab
4. Look for: "Rent payments loaded: {...}"
5. Go to Properties page
6. If a property has a tenant name, you should see "Current Month Payment Status"

## Troubleshooting

### If you don't have a GitHub remote set up:

1. **Create a GitHub repository:**
   - Go to github.com
   - Click "New Repository"
   - Name it "landlordly" (or similar)
   - Don't initialize with README

2. **Add remote and push:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### If Vercel isn't connected to GitHub:

1. Go to Vercel Dashboard
2. Find your project → Settings → Git
3. Connect your GitHub repository
4. Vercel will auto-deploy on every push

### If deployment fails:

1. Check Vercel build logs for errors
2. Make sure all dependencies are in package.json
3. Check that TypeScript compiles without errors:
   ```bash
   npm run build
   ```

## Files That Need to Be Deployed

Make sure these files are included in your commit:

- `src/components/RentPaymentStatus.tsx` (NEW)
- `src/lib/database.ts` (MODIFIED - added rent payment functions)
- `src/lib/types.ts` (MODIFIED - added RentPayment interface)
- `src/app/properties/page.tsx` (MODIFIED - added payment status display)

## After Deployment

1. **Verify the table exists:**
   - Run `verify-rent-payments.sql` in Supabase SQL Editor
   - All checks should show ✓

2. **Test the feature:**
   - Add/edit a property with a tenant name
   - Payment status should appear below property details
   - Click "Mark Paid" to test

3. **Check browser console for errors:**
   - Any errors will appear in red
   - Share errors if the feature still doesn't work

