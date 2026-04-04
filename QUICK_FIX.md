# Quick Start: Deploy to Vercel

## The Problem You're Facing

Your Vercel deployment is failing because the build log cuts off. Based on the project analysis, here are the **most likely causes**:

### 🎯 Most Likely Issue: Missing Environment Variables

The build is probably failing because Vercel doesn't have the required environment variables. Your code references `process.env.ORS_API_KEY` which must exist during build.

## ✅ SOLUTION: Follow These Steps

### Step 1: Get Your API Keys (5 minutes)

#### A. OpenRouteService API Key
1. Go to https://openrouteservice.org/dev/#/signup
2. Sign up with email
3. Confirm email
4. Go to Dashboard → Tokens
5. Copy your API key

#### B. Supabase Credentials
1. Go to https://supabase.com
2. Create a new project (or use existing)
3. Wait for project setup (~2 minutes)
4. Go to Project Settings → API
5. Copy these 3 values:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

### Step 2: Configure Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project (`vibe2`)
3. Go to **Settings** → **Environment Variables**
4. Add these 4 variables:

```
ORS_API_KEY=5b3ce3597851110001cf6248xxxxx (your actual key)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp... (your actual key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp... (your actual key)
```

**IMPORTANT:** 
- Select **ALL** environments (Production, Preview, Development)
- Click "Save" after adding each variable

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Find the latest failed deployment
3. Click the ⋯ (three dots) menu
4. Click "Redeploy"

**OR** push a new commit:

```bash
git add .
git commit -m "Add vercel config"
git push
```

Vercel will automatically rebuild.

### Step 4: Setup Supabase Database (After successful deploy)

1. Go to Supabase → SQL Editor
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and click "Run"

### Step 5: Configure Auth Redirect

1. In Supabase → Authentication → URL Configuration
2. Add your Vercel URL: `https://your-app.vercel.app/auth/callback`

## 🎉 Success!

Your app should now be live! Test it:
- Visit your Vercel URL
- Search for routes
- Try authentication

## 📁 Files Created for You

To make deployment easier, I've created:

- ✅ `vercel.json` - Vercel configuration
- ✅ `DEPLOYMENT_SUMMARY.md` - Complete deployment guide
- ✅ `VERCEL_CHECKLIST.md` - Step-by-step checklist
- ✅ `setup-deployment.bat` - Windows setup script
- ✅ `setup-deployment.sh` - Linux/Mac setup script
- ✅ Updated `README.md` - With deployment section

## 🔧 Before You Deploy

### Quick Local Test (Optional but Recommended)

Run this to ensure there are no build errors:

**On Windows:**
```cmd
setup-deployment.bat
npm install
npm run build
```

**On Mac/Linux:**
```bash
chmod +x setup-deployment.sh
./setup-deployment.sh
npm install
npm run build
```

If the build succeeds locally, it will succeed on Vercel (once env vars are added).

## ⚠️ Common Mistakes to Avoid

1. **Forgetting to set env vars for ALL environments** - Make sure Production, Preview, AND Development are checked
2. **Typos in variable names** - They must be EXACT (case-sensitive)
3. **Not running the Supabase schema** - Routes won't save without the database tables
4. **Forgetting auth redirect URL** - OAuth won't work without it

## 🆘 Still Failing?

### Check Build Logs

1. Go to Vercel → Deployments
2. Click on the failed deployment
3. Look for the specific error message
4. Common errors:

| Error Message | Solution |
|---------------|----------|
| "ORS_API_KEY is not defined" | Add it to Vercel env vars |
| "Cannot find module" | Run `npm install` and commit `package-lock.json` |
| "Unexpected token" | TypeScript error - run `npm run build` locally |
| "Supabase error" | Check all 3 Supabase env vars |

### Get the Full Build Log

The log you shared was cut off. To see the full error:

1. Vercel Dashboard → Deployments
2. Click the failed deployment
3. Click "View Build Logs"
4. Scroll to the bottom to see the actual error
5. Look for lines starting with "Error:" or "Failed:"

## 📚 Full Documentation

For complete documentation, see:
- **Quick Reference:** This file (you're reading it!)
- **Step-by-Step Guide:** `VERCEL_CHECKLIST.md`
- **Detailed Explanation:** `DEPLOYMENT_SUMMARY.md`
- **General Info:** `README.md`

---

**TL;DR:** Add the 4 environment variables to Vercel, then redeploy. That should fix it! 🚀
