# Connect to Your Existing GitHub Repository

## Your code is already committed! Now connect to GitHub:

### Step 1: Find Your GitHub Repository URL

1. Go to https://github.com and log in
2. Navigate to your landlordhub repository
3. Click the green **"Code"** button
4. Copy the HTTPS URL (looks like: `https://github.com/YOUR_USERNAME/landlordhub.git`)

### Step 2: Connect and Push

Run these commands (replace with YOUR repo URL):

```bash
# Add your existing GitHub repo as remote
git remote add origin https://github.com/YOUR_USERNAME/landlordhub.git

# Push your changes
git push -u origin main
```

**If you get an error that origin already exists:**
```bash
# Remove old remote
git remote remove origin

# Add correct remote
git remote add origin https://github.com/YOUR_USERNAME/landlordhub.git

# Push
git push -u origin main
```

### Step 3: Vercel Will Auto-Deploy

If Vercel is connected to your GitHub repo, it will automatically deploy your changes!

To verify Vercel connection:
1. Go to https://vercel.com/dashboard
2. Find your landlordhub project
3. Check Settings → Git → should show your GitHub repo

If not connected:
1. In Vercel Dashboard → Your Project → Settings → Git
2. Click "Connect Git Repository"
3. Select your landlordhub repository
4. Vercel will auto-deploy on every push

## After Push

1. Check Vercel dashboard for deployment status
2. Once deployed, visit https://landlordhubapp.com
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Rent payment feature should now be visible!

