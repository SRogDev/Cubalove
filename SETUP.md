# 🚀 Quick Setup Guide - Dating Cuba

This guide will help you set up the Dating Cuba app with Google OAuth authentication through Supabase.

## Prerequisites

- Node.js 18.x or higher
- A Google account
- A Supabase account (free tier works)

## Step-by-Step Setup

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - Project name: `dating-cuba`
   - Database password: (generate a strong password)
   - Region: (choose closest to your users)
4. Click "Create new project" and wait ~2 minutes

### 3️⃣ Configure Google OAuth in Supabase

#### A. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. In the sidebar, go to "APIs & Services" > "Credentials"
4. Click "CREATE CREDENTIALS" > "OAuth client ID"
5. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: Dating Cuba
   - User support email: your email
   - Developer contact: your email
   - Save and continue through all steps
6. Back to "Create OAuth client ID":
   - Application type: Web application
   - Name: Dating Cuba
   - Authorized redirect URIs:
     - Add: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     - (Replace YOUR_PROJECT_REF with your actual Supabase project reference)
7. Click "Create" and copy:
   - Your Client ID
   - Your Client Secret

#### B. Configure Supabase Authentication

1. In your Supabase project dashboard, go to "Authentication" > "Providers"
2. **IMPORTANT: Disable Email Provider**
   - Find "Email" in the list
   - Click to expand
   - Toggle "Enable Email provider" to **OFF**
   - Click "Save"
3. **Enable Google Provider**
   - Find "Google" in the list
   - Click to expand
   - Toggle "Enable Google provider" to **ON**
   - Paste your Google Client ID
   - Paste your Google Client Secret
   - Click "Save"

### 4️⃣ Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. To find these values in Supabase:
   - Go to "Settings" > "API"
   - Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "Project API keys" > "anon public" → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5️⃣ Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6️⃣ Test the Authentication

1. You should be redirected to the login page
2. Click "Sign in with Google"
3. Select your Google account
4. Grant permissions
5. You'll be redirected back and logged in!

## 🔒 Security Notes

✅ **Email/password authentication is DISABLED** - only Google OAuth is available
✅ All routes are protected by middleware except `/login` and `/auth/*`
✅ User sessions are managed securely by Supabase
✅ OAuth tokens are never exposed to the client

## 🚀 Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Add environment configuration"
git push
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your Vercel URL, e.g., `https://dating-cuba.vercel.app`)
5. Click "Deploy"

### 3. Update Google OAuth Redirect URIs

After deployment, add your production URL to Google Cloud Console:
1. Go back to Google Cloud Console > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add to "Authorized redirect URIs":
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (if not already there)
   - `https://your-app.vercel.app/auth/callback`
4. Save

## 🎨 Customization

### Add More OAuth Providers

To add more providers (Facebook, Twitter, etc.):
1. Enable the provider in Supabase
2. Update the login page to include new sign-in buttons
3. Keep email/password disabled

### Modify Protected Routes

Edit `utils/supabase/middleware.ts` to customize which routes require authentication.

### Customize the UI

- Modify `app/login/page.tsx` for login page design
- Modify `app/page.tsx` for the home page
- Update `app/globals.css` for global styles

## 📱 Testing OAuth Flow

### Local Testing
- Make sure `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- Use `http://localhost:3000/auth/callback` in Google OAuth settings

### Production Testing
- Update `NEXT_PUBLIC_SITE_URL` to your production URL
- Add production callback URL to Google OAuth settings

## ❓ Troubleshooting

### "Error logging in" message
- Check that Google OAuth credentials are correct in Supabase
- Verify redirect URIs match exactly in Google Cloud Console
- Make sure the Email provider is disabled in Supabase

### Redirect loop
- Clear browser cookies
- Verify environment variables are set correctly
- Check that middleware is not blocking auth routes

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and rebuild: `rm -rf .next && npm run build`

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

## 🆘 Need Help?

If you encounter any issues, please open an issue on the GitHub repository with:
- Description of the problem
- Error messages (if any)
- Steps to reproduce
- Environment (local/production)

Happy coding! 💕
