# Vercel Deployment - Quick Checklist

## ✅ Pre-Deployment (Done)
- [x] Fixed all TypeScript errors
- [x] Build passes locally (`pnpm build`)
- [x] Created `.env.example` for reference
- [x] Updated Prisma logging for production

## 🚀 Deploy to Vercel

### Step 1: Prepare Your Repository
```bash
# Commit all changes
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### Step 2: Deploy via Vercel Dashboard

1. **Go to Vercel**: https://vercel.com/new
2. **Import Repository**: Select your Git repository
3. **Configure Build Settings**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `pnpm build` or `next build`
   - Install Command: `pnpm install`
   - Output Directory: `.next` (default)

### Step 3: Add Environment Variables

**REQUIRED Variables** (Add these in Vercel Dashboard → Settings → Environment Variables):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database (Direct Connection - NOT Pooled)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Together AI
TOGETHER_API_KEY=your-together-ai-key-here

# Optional - AI Models (use defaults if not specified)
TOGETHER_AI_MODEL=Qwen/Qwen2.5-72B-Instruct-Turbo
TOGETHER_AI_VISION_MODEL=Qwen/Qwen3-VL-8B-Instruct
```

**Important**: 
- Set variables for **Production**, **Preview**, and **Development**
- Use the **Direct Connection** URL from Supabase, not the pooled connection

### Step 4: Deploy
Click **"Deploy"** and wait ~2-5 minutes

## 📋 Post-Deployment Checklist

### 1. Update Supabase Settings

After getting your Vercel URL (e.g., `https://your-app.vercel.app`):

#### Authentication URLs:
1. Go to: **Supabase Dashboard → Authentication → URL Configuration**
2. **Site URL**: `https://your-app.vercel.app`
3. **Redirect URLs**: Add:
   - `https://your-app.vercel.app/api/auth/callback`
   - `https://*.vercel.app/api/auth/callback` (for preview deployments)

#### CORS Settings:
1. Go to: **Supabase Dashboard → Settings → API**
2. Add to **Additional Allowed Origins**:
   - `https://your-app.vercel.app`
   - `https://*.vercel.app`

### 2. Test Your Deployment

Visit your deployed app and test:
- [ ] Home page loads
- [ ] Sign up new user
- [ ] Log in
- [ ] Create a subject
- [ ] Create a note (manual)
- [ ] Upload a PDF/image
- [ ] Generate quiz (with sufficient content)
- [ ] Generate flashcards
- [ ] Generate summary
- [ ] Check AI credit counting
- [ ] Test user limits

### 3. Monitor for Issues

Check for errors in:
- **Vercel Dashboard → Logs**: Runtime errors
- **Browser Console**: Client-side errors
- **Supabase Dashboard → Logs**: Database/auth errors
- **Together AI Dashboard**: AI usage and errors

## 🔧 Common Issues & Fixes

### Build Fails
```bash
# Test locally first
pnpm build

# If it fails, check TypeScript errors
pnpm lint
```

### Database Connection Errors
- Verify `DATABASE_URL` is the **direct connection** (port 5432), not pooled (port 6543)
- Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
- Get from: Supabase Dashboard → Settings → Database → Connection String → Direct

### Authentication Not Working
- Check Supabase redirect URLs include your Vercel domain
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check CORS settings allow your Vercel domain

### AI Features Return Errors
- Verify `TOGETHER_API_KEY` is set correctly
- Check Together AI account has available credits
- Ensure note content is sufficient (>50 characters)

### Environment Variables Not Working
- Make sure you set them for the right environment (Production/Preview/Development)
- After adding/changing env vars, **Redeploy**: Deployments → Latest → Redeploy

## 🎯 Production Best Practices

### Security
- [x] All secrets in environment variables
- [x] `.env.local` in `.gitignore`
- [x] RLS enabled on all tables
- [ ] Consider adding rate limiting
- [ ] Monitor for suspicious activity

### Performance
- Monitor Vercel Analytics (Settings → Analytics)
- Check database query performance in Supabase
- Monitor AI credit usage in Together AI dashboard

### Cost Management
- **Vercel Free Tier**: 100GB bandwidth, unlimited deployments
- **Supabase Free Tier**: 500MB database, 2GB bandwidth, 5GB storage
- **Together AI**: Pay-per-use, set usage alerts

### Monitoring
- Set up alerts in Vercel for errors
- Monitor database size in Supabase
- Track AI usage in Together AI dashboard

## 📱 Custom Domain (Optional)

1. **Add Domain**: Vercel Dashboard → Your Project → Settings → Domains
2. **Update DNS**: Follow Vercel's instructions
3. **Update Supabase**: Add custom domain to redirect URLs
4. **SSL**: Automatic via Vercel

## 🆘 Need Help?

If something goes wrong:
1. Check Vercel deployment logs
2. Check browser console for client errors
3. Check Supabase logs for database/auth errors
4. Verify all environment variables are set
5. Try redeploying after fixing issues

## ✨ You're Ready!

Your app should now be live at: `https://your-app.vercel.app`

For detailed documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)
