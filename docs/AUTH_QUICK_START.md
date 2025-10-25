# Authentication Quick Start Guide

## TL;DR

### Development Mode (Local Testing)

**Just want to code without dealing with login?**

```bash
# In your .env file
BYPASS_AUTH=true
```

Restart the backend, and you're automatically logged in as admin. No passwords needed!

### Production Mode (Real Deployment)

```bash
# In your .env.production file
BYPASS_AUTH=false
JWT_SECRET="$(openssl rand -base64 64)"
```

Full authentication with secure JWT tokens.

---

## Quick Setup

### 1. Development Environment

```bash
# Root .env file
NODE_ENV="development"
BYPASS_AUTH=true

# Backend .env file
BYPASS_AUTH=true
```

**Result**: Auto-login as admin, no authentication required

### 2. Production Environment

```bash
# .env.production
NODE_ENV="production"
BYPASS_AUTH=false
JWT_SECRET="your-super-secret-key-here"
SECURE_COOKIES=true
```

**Result**: Full JWT authentication with httpOnly cookies

---

## Common Scenarios

### Scenario 1: Local Development (Skip Login)

```bash
BYPASS_AUTH=true
```

✅ No login required
✅ Automatically admin user
✅ All features accessible
⚠️ Only for local development

### Scenario 2: Testing Auth Flow

```bash
BYPASS_AUTH=false
```

Then create test user:
```bash
cd apps/api
npm run create-admin
```

✅ Test real login flow
✅ Test permissions
✅ Test token expiration

### Scenario 3: Production Deployment

```bash
BYPASS_AUTH=false
JWT_SECRET="strong-random-secret"
NODE_ENV="production"
SECURE_COOKIES=true
```

✅ Secure authentication
✅ httpOnly cookies
✅ HTTPS required

---

## Troubleshooting

### Problem: Getting 401 errors in development

**Fix**: Set `BYPASS_AUTH=true` in `.env`

### Problem: Auth works locally but not on server

**Fix**: Make sure `BYPASS_AUTH=false` in production and JWT_SECRET is set

### Problem: Can't login even with correct password

**Check**:
1. Database is running
2. User exists in database
3. `BYPASS_AUTH=false` (can't login when bypass is enabled)

---

## Environment Variable Cheat Sheet

| Variable | Development | Production |
|----------|------------|------------|
| `NODE_ENV` | `development` | `production` |
| `BYPASS_AUTH` | `true` | `false` |
| `JWT_SECRET` | Any value | Strong secret (64+ chars) |
| `SECURE_COOKIES` | `false` | `true` |
| `FRONTEND_URL` | `http://localhost:3200` | `https://yourdomain.com` |

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION MODE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Browser                Next.js              Express API       │
│  ┌──────┐              ┌────────┐           ┌──────────┐       │
│  │ User │──login──────>│ Proxy  │──────────>│   Auth   │       │
│  └──────┘              └────────┘           │Middleware│       │
│     │                      │                └──────────┘       │
│     │                      │                     │              │
│     │<─── httpOnly Cookie ────────────────────────             │
│     │                                                           │
│     │ ✓ JWT in secure cookie                                   │
│     │ ✓ Auto-sent with requests                                │
│     │ ✓ Not accessible via JS                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DEVELOPMENT MODE                           │
│                      (BYPASS_AUTH=true)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Browser                Next.js              Express API       │
│  ┌──────┐              ┌────────┐           ┌──────────┐       │
│  │ User │──────────────>│  App   │──────────>│   Auth   │       │
│  └──────┘   (auto)     └────────┘           │Middleware│       │
│     │                                        └──────────┘       │
│     │                                             │              │
│     │<───── Mock Admin User ─────────────────────              │
│     │                                                           │
│     │ ✓ No login required                                       │
│     │ ✓ All routes accessible                                   │
│     │ ✓ Admin permissions                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Reminders

🔴 **NEVER** enable `BYPASS_AUTH` in production
🟡 **ALWAYS** use strong JWT secrets (64+ characters)
🟢 **ALWAYS** enable HTTPS in production
🟢 **ROTATE** JWT secrets regularly
🟢 **MONITOR** authentication logs

---

## Need More Details?

See the full documentation: [AUTHENTICATION.md](./AUTHENTICATION.md)
