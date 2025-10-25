# API Connection Guide - Sora2 Project

## Overview
This guide helps you resolve the ECONNREFUSED error and properly configure the connection between the Next.js frontend and the Express backend API.

## Problem: ECONNREFUSED Error

The error occurs when the Next.js frontend (running on port 3000 or 3200) tries to connect to the backend API (port 3101) but the backend server is not running.

## Solution

### 1. Start the Backend API Server

The backend API must be running for the frontend to work properly.

```bash
# Navigate to the API directory
cd apps/api

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

The API server should start on **port 3101** and display:
```
🚀 Server is running on http://localhost:3101
📚 API Documentation: http://localhost:3101/api-docs
```

### 2. Start the Frontend (in a separate terminal)

```bash
# From the project root
npm run dev

# Or if using a specific port
npm run dev -- -p 3000
```

### 3. Verify Both Servers Are Running

Open these URLs in your browser:
- Frontend: http://localhost:3000 (or 3200)
- Backend API Health: http://localhost:3101/api/health
- API Documentation: http://localhost:3101/api-docs

## Configuration

### Environment Variables

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3101
```

**Backend (apps/api/.env)**
```env
NODE_ENV=development
PORT=3101
FRONTEND_URL=http://localhost:3200
BACKEND_URL=http://localhost:3101
DATABASE_URL=postgresql://sora2user:sora2pass@localhost:5432/sora2?schema=public
JWT_SECRET=dev-secret-key-change-in-production
# ... other config
```

### Port Configuration

| Service | Port | Environment Variable |
|---------|------|---------------------|
| Frontend (Next.js) | 3000 or 3200 | N/A |
| Backend API (Express) | 3101 | PORT |
| PostgreSQL Database | 5432 | DATABASE_URL |
| Redis | 6379 | REDIS_URL |

## Proxy Route Improvements

The proxy route at `/src/app/api/proxy/[...path]/route.ts` now includes:

### 1. **Automatic Retry Mechanism**
- Retries failed requests up to 3 times
- Exponential backoff (1s, 2s, 3s)
- Helpful for temporary network issues

### 2. **Health Check Before Requests**
- Checks if backend is available before proxying
- Cached for 5 seconds to avoid overhead
- Returns clear error messages if backend is down

### 3. **Request Timeout**
- 30-second timeout prevents hanging requests
- Returns 504 Gateway Timeout error
- Configurable via `REQUEST_TIMEOUT` constant

### 4. **Detailed Error Messages**
- ECONNREFUSED: Backend server not running
- Timeout errors: Request took too long
- Clear suggestions on how to fix the issue

### 5. **Enhanced Logging**
- Request/response timing
- Retry attempts
- Body size information
- Header forwarding details

## Troubleshooting

### Error: "Backend API Connection Refused"

**Cause:** The backend API server is not running on port 3101.

**Solution:**
```bash
cd apps/api
npm run dev
```

### Error: "Request Timeout"

**Cause:** The backend API is running but responding slowly (>30 seconds).

**Solution:**
- Check backend API logs for errors
- Verify database connection is working
- Check if any long-running operations are blocking

### Error: "Backend API Unavailable"

**Cause:** Health check failed - backend might be starting up or experiencing issues.

**Solution:**
- Wait a few seconds and try again
- Check backend API logs: `apps/api/logs/combined.log`
- Verify all backend dependencies (PostgreSQL, Redis) are running

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3101`

**Solution:**
```bash
# Find process using port 3101
lsof -i :3101

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port
PORT=3102 npm run dev
```

### Database Connection Issues

If you see database errors in the backend logs:

```bash
# Make sure PostgreSQL is running
brew services start postgresql
# or
docker-compose up -d postgres

# Run database migrations
cd apps/api
npx prisma migrate dev
```

## Testing the Connection

### 1. Quick Health Check

```bash
# Test backend API directly
curl http://localhost:3101/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-25T..."}
```

### 2. Test Through Proxy

```bash
# Test frontend proxy to backend
curl http://localhost:3000/api/proxy/health

# Should return the same health status
```

### 3. Browser DevTools

Open browser DevTools (F12) → Network tab:
- Look for requests to `/api/proxy/*`
- Check response status codes
- View detailed error messages in response body

## Development Workflow

### Recommended Terminal Setup

**Terminal 1: Backend API**
```bash
cd apps/api
npm run dev
```

**Terminal 2: Frontend**
```bash
npm run dev
```

**Terminal 3: Database/Redis (if using Docker)**
```bash
docker-compose up postgres redis
```

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Next.js automatically reloads on file changes
- Backend: Uses `tsx` with watch mode for automatic restarts

## Production Considerations

In production, you should:

1. **Use environment-specific URLs**
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

2. **Disable detailed error messages**
   - The proxy already checks `NODE_ENV` for stack traces
   - Set `NODE_ENV=production` to hide sensitive info

3. **Adjust retry and timeout values**
   ```typescript
   const MAX_RETRIES = 2 // Reduce retries in production
   const REQUEST_TIMEOUT = 10000 // 10 seconds
   ```

4. **Use proper CORS configuration**
   - Update `Access-Control-Allow-Origin` to your domain
   - Configure in backend API's CORS settings

5. **Monitor API health**
   - Set up health check monitoring
   - Alert on connection failures
   - Log all proxy errors to external service

## Summary

The ECONNREFUSED error is now properly handled with:
- ✅ Automatic retry mechanism (3 attempts)
- ✅ Health checks before requests
- ✅ Clear error messages with solutions
- ✅ Request timeouts (30 seconds)
- ✅ Detailed logging
- ✅ CORS support for credentials

Always ensure both frontend and backend servers are running for the application to work correctly.
