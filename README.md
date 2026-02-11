# Dating Cuba 💕

A modern dating app for Cubans built with Next.js 14 and Supabase.

## Features

- 🔐 Google OAuth Authentication (email/password disabled)
- ⚡ Next.js 14 with App Router
- 🎨 Tailwind CSS for styling
- 🔒 Supabase for authentication and backend
- 🚀 TypeScript for type safety

## Prerequisites

Before you begin, ensure you have:

- Node.js 18.x or later installed
- A Supabase account and project
- Google OAuth credentials configured in Supabase

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Authentication > Providers
3. **Disable Email provider** (we only want Google OAuth)
4. **Enable Google provider**:
   - Add your Google OAuth Client ID
   - Add your Google OAuth Client Secret
   - Set the redirect URL to: `http://localhost:3000/auth/callback` (for development)

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-supabase-project.supabase.co/auth/v1/callback` (Supabase)
6. Copy your Client ID and Client Secret

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

You can find these values in your Supabase project settings under API.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── auth/
│   │   ├── callback/      # OAuth callback handler
│   │   └── signout/       # Sign out route
│   ├── login/             # Login page with Google OAuth
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (protected)
│   └── globals.css        # Global styles
├── utils/
│   └── supabase/
│       ├── client.ts      # Supabase client for browser
│       ├── server.ts      # Supabase client for server
│       └── middleware.ts  # Auth middleware utilities
├── middleware.ts          # Next.js middleware for auth
└── ...config files
```

## Authentication Flow

1. User visits the app
2. Middleware checks for authentication
3. Unauthenticated users are redirected to `/login`
4. User clicks "Sign in with Google"
5. OAuth flow redirects to Google
6. Google redirects back to `/auth/callback`
7. User is authenticated and redirected to home page

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Update Supabase OAuth redirect URL to your production URL
5. Deploy!

### Environment Variables for Production

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Security Notes

- Email/password authentication is disabled by design
- Only Google OAuth is enabled
- All routes except `/login` and `/auth/*` are protected
- Session management is handled by Supabase

## Support

For issues or questions, please open an issue on GitHub.

## License

ISC
