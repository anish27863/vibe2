# Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

- [ ] All code committed to GitHub
- [ ] `.env.local.example` file exists with template variables
- [ ] `.gitignore` includes `.env.local` and `.env`
- [ ] `supabase/schema.sql` exists and is up to date
- [ ] All dependencies in `package.json` are correct

## 🔑 Required Environment Variables

Make sure you have these ready before deploying:

### 1. OpenRouteService API Key
- **Variable:** `ORS_API_KEY`
- **Get it from:** https://openrouteservice.org/dev/#/signup
- **Free tier:** 2,000 requests/day
- **Example:** `5b3ce3597851110001cf6248xxxxxxxxxxxxxxx`

### 2. Supabase Credentials
- **Variables:** 
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- **Get them from:** Supabase Dashboard → Project Settings → API
- **Example URL:** `https://abcdefghijk.supabase.co`

## 🚀 Deployment Steps

### Step 1: Prepare Supabase

1. Create a Supabase project at https://supabase.com
2. Copy `supabase/schema.sql` contents
3. Go to SQL Editor in Supabase Dashboard
4. Paste and run the schema
5. Note down your project URL and API keys

### Step 2: Get OpenRouteService Key

1. Sign up at https://openrouteservice.org/dev/#/signup
2. Confirm your email
3. Go to Dashboard → Tokens
4. Copy your API key

### Step 3: Deploy to Vercel

1. **Import Project:**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Connect your GitHub account
   - Select your repository
   - Click "Import"

2. **Configure Build Settings** (auto-detected):
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables:**
   
   Click "Environment Variables" and add all 4 variables:
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | `ORS_API_KEY` | Your ORS API key | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production, Preview, Development |

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)

### Step 4: Post-Deployment Configuration

1. **Update Supabase Auth Redirects:**
   ```
   Supabase Dashboard → Authentication → URL Configuration
   
   Redirect URLs:
   - https://your-app.vercel.app/auth/callback
   - http://localhost:3000/auth/callback (for local dev)
   ```

2. **Test Your Deployment:**
   - Visit your Vercel URL
   - Try searching for a route
   - Test sign in/sign up
   - Save a route (after signing in)

## 🔍 Verification

After deployment, check:

- [ ] App loads without errors
- [ ] Route search works
- [ ] Map displays correctly
- [ ] Authentication works (sign up/sign in)
- [ ] Saving routes works (when authenticated)
- [ ] Dark/light theme toggle works

## ❌ Common Issues & Solutions

### Build Fails with "Module not found"
- **Solution:** Run `npm install` locally and commit `package-lock.json`

### "ORS API error" at runtime
- **Check:** Is `ORS_API_KEY` set in Vercel environment variables?
- **Check:** Is the API key valid? Test it at https://openrouteservice.org/dev/#/api-docs/v2/directions

### "Supabase error" at runtime
- **Check:** Are all 3 Supabase env vars set correctly?
- **Check:** Copy-paste values directly from Supabase Dashboard → Project Settings → API

### Auth callback fails
- **Check:** Did you add `https://your-app.vercel.app/auth/callback` to Supabase redirect URLs?
- **Check:** Is the URL exactly correct (no trailing slash)?

### Routes not saving
- **Check:** Did you run `supabase/schema.sql` in Supabase SQL Editor?
- **Check:** Is `SUPABASE_SERVICE_ROLE_KEY` set in Vercel env vars?

### Build succeeds but app shows blank page
- **Check:** Browser console for JavaScript errors
- **Check:** Vercel Function Logs for server-side errors

## 🆘 Getting Help

If you're still stuck:

1. **Check Vercel Build Logs:**
   - Vercel Dashboard → Deployments → Click on failed deployment → View Logs

2. **Check Vercel Function Logs:**
   - Vercel Dashboard → Deployments → Click deployment → Functions tab

3. **Check Browser Console:**
   - Open your deployed app
   - Press F12 → Console tab
   - Look for error messages

4. **Resources:**
   - [Vercel Docs](https://vercel.com/docs)
   - [Next.js Deployment](https://nextjs.org/docs/deployment)
   - [Supabase Docs](https://supabase.com/docs)

## 📝 Notes

- **Free Tiers Used:**
  - Vercel: Hobby plan (free)
  - Supabase: Free tier (500 MB DB, 50K MAU)
  - OpenRouteService: Free tier (2000 requests/day)
  - Nominatim: Free (no key required)

- **All services are completely free** for personal projects and small-scale apps.

- **No credit card required** for any of the services.
