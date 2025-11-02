# Quick Deploy Instructions

## Your code is committed! Now deploy it:

### Step 1: Login to Vercel (if needed)
```bash
vercel login
```
Follow the prompts to authenticate.

### Step 2: Deploy to Production
```bash
vercel --prod
```

This will:
- Build your application
- Deploy to https://landlordhubapp.com
- Show you the deployment URL

### Alternative: Set up GitHub (for auto-deploys in future)

If you want Vercel to auto-deploy from GitHub in the future:

1. **Create a GitHub repository:**
   - Go to https://github.com/new
   - Name it "landlordly" (or your preferred name)
   - **Don't** initialize with README
   - Click "Create repository"

2. **Add remote and push:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

3. **Connect in Vercel:**
   - Go to https://vercel.com/dashboard
   - Find your project → Settings → Git
   - Connect your GitHub repository
   - Future pushes will auto-deploy

## After Deployment

1. **Verify the feature works:**
   - Visit https://landlordhubapp.com
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Go to Properties page
   - Properties with tenant names should show payment status

2. **Check browser console:**
   - Open DevTools (F12) → Console
   - Look for: "Rent payments loaded: {...}"
   - No errors should appear

3. **Test the feature:**
   - Edit a property and add a tenant name if needed
   - Payment status should appear below property details
   - Click "Mark Paid" to test

