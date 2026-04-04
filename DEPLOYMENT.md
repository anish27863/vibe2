# Vercel Deployment Guide for SmartRoute

## Prerequisites

Before deploying to Vercel, you need:

1. **OpenRouteService API Key** (Free - 2000 requests/day)
   - Sign up at: https://openrouteservice.org/dev/#/signup
   - Get your API key from the dashboard

2. **Supabase Project**
   - Create a project at: https://supabase.com
   - Get your credentials from: Project Settings → API
   - Run the SQL schema: Copy contents of `supabase/schema.sql` and run in Supabase SQL Editor

## Deployment Steps

### 1. Push to GitHub (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```env
ORS_API_KEY=your_actual_ors_api_key
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

**IMPORTANT:** 
- Set these for **Production**, **Preview**, and **Development** environments
- Never commit actual API keys to your repository

### 4. Deploy

Click "Deploy" - Vercel will:
- Install dependencies (`npm install`)
- Build the project (`npm run build`)
- Deploy to production

### 5. Post-Deployment Setup

1. **Update Supabase Auth Redirect URL:**
   - Go to Supabase → Authentication → URL Configuration
   - Add your Vercel domain: `https://your-app.vercel.app/auth/callback`

2. **Test the deployment:**
   - Visit your Vercel URL
   - Try searching for routes
   - Test authentication

## Troubleshooting

### Build Fails

- **Check build logs** in Vercel dashboard for specific errors
- **Verify all environment variables** are set correctly
- **Ensure API keys** are valid and have proper permissions

### Runtime Errors

- **Check Function Logs** in Vercel dashboard
- **Verify Supabase connection** - check credentials
- **Check ORS API quota** - free tier has 2000 requests/day limit

### Common Issues

1. **"ORS API error"** - Check your ORS_API_KEY is correct
2. **"Supabase error"** - Verify all three Supabase env vars are set
3. **Auth callback fails** - Update redirect URL in Supabase settings

## Local Development

```bash
# Copy example env file
cp .env.local.example .env.local

# Add your actual API keys to .env.local
# Then start dev server
npm run dev
```

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- OpenRouteService Docs: https://openrouteservice.org/dev/#/api-docs
