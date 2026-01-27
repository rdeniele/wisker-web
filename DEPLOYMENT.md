# Deployment Guide for Vercel

## Pre-Deployment Checklist

### 1. Fix All Errors

- [ ] Run `pnpm lint` and fix all errors
- [ ] Run `pnpm build` locally to ensure no build errors
- [ ] Fix any TypeScript errors

### 2. Environment Variables Setup

Copy these environment variables to Vercel:

#### Required Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
DATABASE_URL=your-production-database-url
TOGETHER_API_KEY=your-together-ai-api-key
```

#### Optional (with defaults):

```
TOGETHER_AI_MODEL=Qwen/Qwen2.5-72B-Instruct-Turbo
TOGETHER_AI_VISION_MODEL=Qwen/Qwen3-VL-8B-Instruct
```

#### Will be set automatically by Vercel:

```
NEXT_PUBLIC_SITE_URL (will be your Vercel domain)
```

### 3. Database Setup

#### Update DATABASE_URL in Vercel:

1. Go to Supabase Dashboard → Settings → Database
2. Copy the "Connection String" (Direct connection, not pooled)
3. Add to Vercel environment variables
4. Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

#### Run Migrations:

```bash
# Before deploying, ensure migrations are up to date
npx prisma migrate deploy
```

### 4. Supabase Configuration

#### Update CORS Settings:

1. Supabase Dashboard → Settings → API
2. Add your Vercel domain to allowed origins:
   - `https://your-app.vercel.app`
   - `https://*.vercel.app` (for preview deployments)

#### Verify RLS Policies:

Ensure all RLS policies are properly configured for production.

### 5. Update Site URLs

After deployment, update these in Supabase:

1. Authentication → URL Configuration
2. Site URL: `https://your-app.vercel.app`
3. Redirect URLs: Add `https://your-app.vercel.app/api/auth/callback`

## Deployment Steps

### Method 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variables when prompted
```

### Method 2: Deploy via Vercel Dashboard

1. **Connect Repository:**
   - Go to https://vercel.com/new
   - Import your Git repository
   - Vercel will auto-detect Next.js

2. **Configure Project:**
   - Framework Preset: Next.js
   - Root Directory: `./` (or your project root)
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)

3. **Add Environment Variables:**
   - Go to Settings → Environment Variables
   - Add all variables from `.env.example`
   - Set for Production, Preview, and Development

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (~2-5 minutes)

## Post-Deployment

### 1. Test Your Deployment

- [ ] Visit your deployed URL
- [ ] Test authentication (signup/login)
- [ ] Test creating a subject
- [ ] Test creating a note
- [ ] Test PDF upload
- [ ] Test AI features (quiz, flashcards, summary)

### 2. Update Environment Variables

If you need to update env vars:

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit the variable
3. Redeploy: Deployments → Latest → Redeploy

### 3. Monitor Logs

- Vercel Dashboard → Your Project → Deployments → View Logs
- Check for any runtime errors

### 4. Set Up Custom Domain (Optional)

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase redirect URLs

## Troubleshooting

### Build Errors

```bash
# Test build locally first
pnpm build

# Clear cache if needed
rm -rf .next node_modules
pnpm install
pnpm build
```

### Database Connection Issues

- Ensure DATABASE_URL is the **direct connection** URL, not pooled
- Check if Supabase project is in the same region for better performance
- Verify connection string format is correct

### Authentication Issues

- Check Supabase redirect URLs include your Vercel domain
- Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Check CORS settings in Supabase

### AI Features Not Working

- Verify TOGETHER_API_KEY is set correctly
- Check Together AI account has credits
- Monitor usage in Together AI dashboard

## Performance Optimization

### Enable Caching

Vercel automatically caches static assets. For API routes:

```typescript
// Add to API routes that can be cached
export const revalidate = 60; // Cache for 60 seconds
```

### Database Connection Pooling

Consider using Supabase Pooler URL for better connection management:

- Pooled connection: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### Monitor Performance

- Vercel Analytics (Settings → Analytics)
- Together AI Dashboard for AI usage
- Supabase Dashboard for database metrics

## Security Checklist

- [x] Environment variables are not committed to Git
- [x] `.env.local` is in `.gitignore`
- [x] RLS is enabled on all tables
- [x] API routes validate authentication
- [x] CORS is properly configured
- [ ] Rate limiting is implemented (consider adding)
- [ ] Input validation is thorough

## Cost Management

### Together AI

- Monitor credit usage in Together AI dashboard
- Set usage alerts
- Implement rate limiting for AI features

### Supabase

- Free tier: 500MB database, 2GB bandwidth
- Monitor usage in Supabase dashboard
- Upgrade plan if needed

### Vercel

- Free tier: 100GB bandwidth, serverless function execution
- Monitor in Vercel dashboard
- Upgrade to Pro if needed for commercial use

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables
4. Test database connection
5. Check Supabase logs

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [Together AI Docs](https://docs.together.ai/)
