# Quick Start Guide - Sora2 Project

## TL;DR - Get Started in 3 Steps

```bash
# 1. Install dependencies (first time only)
npm install
cd apps/api && npm install && cd ../..

# 2. Start both servers
npm run dev:all

# 3. Open browser
# Frontend: http://localhost:3000 (or 3200)
# API Docs: http://localhost:3101/api-docs
```

## Available Commands

### Start Everything (Recommended)
```bash
npm run dev:all
```
This starts both backend API and frontend with automatic health checks and logging.

### Start Individually

**Backend API Only:**
```bash
npm run dev:api
# or
cd apps/api && npm run dev
```

**Frontend Only:**
```bash
npm run dev:frontend
# or
npm run dev
```

## Fixing "ECONNREFUSED" Error

This error means the backend API is not running. Fix it:

```bash
# Start the backend API
npm run dev:api

# Or use the all-in-one command
npm run dev:all
```

## Port Configuration

| Service | Default Port | Can Change? |
|---------|-------------|-------------|
| Frontend | 3200 | Yes (use `npm run dev -- -p XXXX`) |
| Backend API | 3101 | Yes (set `PORT` in `apps/api/.env`) |
| PostgreSQL | 5432 | N/A |
| Redis | 6379 | N/A |

## Environment Setup

### First Time Setup

1. **Copy environment files:**
```bash
# Root .env.local for frontend
cp .env .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3101" > .env.local

# Backend .env
cp .env apps/api/.env
```

2. **Update API keys (if needed):**
Edit `apps/api/.env` and set:
- `OPENAI_API_KEY` (for Sora video generation)
- `DATABASE_URL` (if not using default)
- `AWS_*` credentials (for S3 storage)

3. **Setup database:**
```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed  # Optional: seed with sample data
```

## Verification Checklist

✅ **Backend API is running:**
```bash
curl http://localhost:3101/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

✅ **Frontend can reach backend:**
```bash
curl http://localhost:3200/api/proxy/health
# Expected: Same as above
```

✅ **Database is connected:**
Check backend logs for "Database connected" message

✅ **No port conflicts:**
```bash
lsof -i :3101  # Backend API
lsof -i :3200  # Frontend
```

## Common Issues

### Issue: Port Already in Use

**Symptom:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Kill process on port 3101
lsof -ti:3101 | xargs kill -9

# Or let the script handle it
npm run dev:all
```

### Issue: Database Connection Failed

**Symptom:** Backend logs show "Cannot connect to database"

**Solution:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql

# Or use Docker
docker-compose up -d postgres
```

### Issue: "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules apps/api/node_modules
npm install
cd apps/api && npm install && cd ../..
```

### Issue: Proxy returns 503 error

**Symptom:** "Backend API Unavailable"

**Root Cause:** Backend API is not running or unhealthy

**Solution:**
1. Check if backend is running: `lsof -i :3101`
2. If not, start it: `npm run dev:api`
3. Check backend logs: `apps/api/logs/combined.log`

## Development Workflow

### Recommended Terminal Layout

**Option 1: Single Terminal**
```bash
npm run dev:all
```
Logs from both servers will be shown in one terminal.

**Option 2: Split Terminals**

Terminal 1 (Backend):
```bash
npm run dev:api
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```

### Hot Reload

Both servers support hot reload:
- **Frontend:** Changes to `.tsx`, `.ts` files reload automatically
- **Backend:** Changes to API code restart the server automatically

### Viewing Logs

When using `npm run dev:all`, logs are saved to:
- `logs/frontend.log` - Next.js frontend logs
- `logs/api.log` - Express backend logs

View in real-time:
```bash
tail -f logs/frontend.log
tail -f logs/api.log
```

## Project Structure

```
sora2-web/
├── src/                      # Frontend source
│   ├── app/                  # Next.js app directory
│   │   ├── api/
│   │   │   └── proxy/       # API proxy route (FIXED!)
│   │   └── ...
│   └── lib/                  # Shared utilities
├── apps/
│   └── api/                  # Backend API
│       ├── src/
│       ├── dist/            # Compiled JS
│       └── .env             # Backend config
├── .env.local               # Frontend config
├── start-dev.sh             # Startup script
└── package.json
```

## What Was Fixed?

The proxy route (`/src/app/api/proxy/[...path]/route.ts`) now has:

1. ✅ **Health Checks** - Verifies backend is running before proxying
2. ✅ **Retry Mechanism** - Retries failed requests 3 times
3. ✅ **Better Timeouts** - 30-second timeout with clear error messages
4. ✅ **Detailed Errors** - Tells you exactly what went wrong and how to fix it
5. ✅ **Request Logging** - Shows timing, retries, and response sizes

### Error Messages You'll See

**Before Fix:**
```
Proxy request failed: ECONNREFUSED
```

**After Fix:**
```json
{
  "error": "Backend API Connection Refused",
  "message": "Failed to connect to backend API at http://localhost:3101. The API server is not running.",
  "details": {
    "suggestion": "Please start the backend API server:\n1. cd apps/api\n2. npm run dev"
  }
}
```

## Next Steps

1. **Read Full Documentation:**
   - [API_CONNECTION_GUIDE.md](./API_CONNECTION_GUIDE.md) - Detailed troubleshooting

2. **Check API Documentation:**
   - http://localhost:3101/api-docs (Swagger UI)

3. **Run Tests:**
   ```bash
   npm test
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

## Need Help?

1. Check logs: `logs/frontend.log` and `logs/api.log`
2. Review [API_CONNECTION_GUIDE.md](./API_CONNECTION_GUIDE.md)
3. Verify all services are running
4. Check environment variables are set correctly

---

**Happy coding!** 🚀
