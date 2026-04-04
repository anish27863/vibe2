# SmartRoute 🗺

> **Intelligent alternative navigation** based on traffic density, road type, and user preferences. Built with Next.js 14 App Router, Supabase, Google Maps API, and Tailwind CSS.

---

## ✨ Features

- 🔐 **Authentication** – Email/password + Google OAuth via Supabase Auth
- 🗺 **Interactive Google Map** – Dark/light map with route polylines
- 🧠 **Smart Route Scoring** – Custom algorithm ranking routes by time, traffic, distance, road type
- 🚗 **Vehicle Modes** – Car, Bike, Walking, Transit with different scoring weights
- 🚦 **Traffic Detection** – Real-time traffic via Google Directions API + traffic model
- 🚫 **Route Filters** – Avoid highways, avoid tolls, prefer shortest time/distance
- 💾 **Save Routes** – Authenticated users can save and view favourite routes
- 🌙 **Dark Mode** – Beautiful dark UI by default with light mode toggle
- 📱 **Responsive** – Works on mobile with drawer layout

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + React 18 |
| Styling | Tailwind CSS + custom design tokens |
| Maps | Google Maps JavaScript API + Directions/Places/Geocoding APIs |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + Google OAuth) |
| Hosting | Vercel (recommended) |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd smartroute
npm install
```

### 2. Environment Variables

Copy the example env file and fill in your keys:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```env
# Google Maps (server-side – for Directions, Places, Geocoding)
GOOGLE_MAPS_API_KEY=your_server_key_here

# Google Maps (client-side – only Maps JavaScript API)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_client_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> **Security tip**: Use separate Google API keys. The client key (`NEXT_PUBLIC_`) should only have **Maps JavaScript API** enabled. The server key should have **Directions API**, **Places API**, and **Geocoding API** enabled, with server-side IP restrictions.

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Enable **Google OAuth** in Authentication → Providers → Google
4. Set redirect URL to: `https://your-domain.com/auth/callback`

### 4. Enable Google APIs

In [Google Cloud Console](https://console.cloud.google.com):
- Enable: **Maps JavaScript API**, **Directions API**, **Places API**, **Geocoding API**
- Create 2 API keys: one for client (restrict to HTTP referrers), one for server (restrict to IPs)

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
smartroute/
├── app/
│   ├── layout.tsx              # Root layout + ThemeProvider
│   ├── page.tsx                # Main map page
│   ├── auth/callback/route.ts  # OAuth callback
│   └── api/
│       ├── routes/route.ts     # Google Directions proxy + scoring
│       ├── places/route.ts     # Google Places proxy
│       ├── geocode/route.ts    # Geocoding proxy
│       ├── saved-routes/       # Saved routes CRUD
│       └── preferences/        # User preferences CRUD
├── components/
│   ├── Map/MapView.tsx         # Google Map + polylines
│   ├── SearchBox/SearchBox.tsx # Autocomplete input
│   ├── RouteCard/
│   │   ├── RouteCard.tsx       # Single route card
│   │   └── RouteList.tsx       # Ranked route list
│   ├── Preferences/
│   │   └── PreferencesPanel.tsx
│   ├── Auth/AuthModal.tsx      # Login/signup modal
│   ├── Sidebar/Sidebar.tsx     # Left panel
│   └── UI/
│       ├── ThemeToggle.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── scoring.ts              # 🧠 Smart route scoring algorithm
│   ├── googleMaps.ts           # Google API helpers
│   ├── supabase.ts             # Supabase client
│   ├── types.ts                # TypeScript types
│   └── utils.ts                # cn() helper
├── hooks/
│   ├── useAuth.ts              # Auth state
│   ├── useRoutes.ts            # Route fetching + caching
│   ├── usePreferences.ts       # Preferences state + persistence
│   ├── useMap.ts               # Map state
│   └── usePlacesAutocomplete.ts
├── styles/
│   └── globals.css
├── supabase/
│   └── schema.sql              # DB schema (run in Supabase SQL editor)
└── .env.local.example
```

---

## 🧠 Route Scoring Algorithm

The scoring algorithm (`lib/scoring.ts`) works as follows:

1. **Fetch** up to 3 alternative routes from Google Directions API
2. **Infer road types** from step instructions (highway, arterial, local, bike path)
3. **Compute traffic level** from `duration_in_traffic / duration` ratio
4. **Normalise** time and distance across all routes (0-100 scale)
5. **Apply weights** dynamically based on user preferences:
   - Default: Time 35%, Traffic 35%, Distance 15%, Road Type 15%
   - "Fastest": Time 50%, Traffic 30%
   - "Avoid Traffic": Traffic 50%, Time 30%
   - "Bike Friendly": Road Type 35%, Traffic 25%, Time 25%
6. **Calculate final score** = weighted sum of all component scores
7. **Assign labels**: Fastest, Less Traffic, Shortest, Bike Optimized, etc.

---

## 🚢 Deploying to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

### Manual Deployment

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Add Environment Variables:**
   
   In Vercel Dashboard → Settings → Environment Variables, add:
   
   ```env
   ORS_API_KEY=your_ors_api_key
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Update Supabase Redirect URL:**
   - In Supabase → Authentication → URL Configuration
   - Add: `https://your-app.vercel.app/auth/callback`

5. **Deploy!**
   
   Click "Deploy" and wait for the build to complete.

📖 **Detailed deployment guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting and advanced configuration.

---

## 📄 License

MIT
