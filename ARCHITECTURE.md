# Sora2 Architecture & Request Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Sora2 Web Application                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────┐
│   User Browser   │────────▶│  Next.js Frontend │────────▶│ Database │
│  (Port 3000/3200)│         │   (Port 3200)     │         │ (Port    │
└──────────────────┘         └──────────────────┘         │  5432)   │
                                      │                    └──────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │   API Proxy       │
                             │   Route (NEW!)    │
                             │                   │
                             │ • Health Check    │
                             │ • Retry Logic     │
                             │ • Timeout Control │
                             └──────────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐         ┌──────────┐
                             │  Express Backend  │────────▶│  Redis   │
                             │   API (Port 3101) │         │ (Port    │
                             └──────────────────┘         │  6379)   │
                                      │                    └──────────┘
                                      ▼
                             ┌──────────────────┐
                             │  External APIs    │
                             │  • OpenAI/Sora    │
                             │  • AWS S3         │
                             └──────────────────┘
```

## Request Flow (Before Fix)

```
User Request
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js Frontend (Port 3200)                                 │
│                                                               │
│  Client-side Code                                             │
│  ├── axios.create({ baseURL: '/api/proxy' })                │
│  └── api.get('/users')                                       │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ Proxy Route: /api/proxy/[...path]/route.ts                   │
│                                                               │
│  ❌ OLD CODE (Before Fix):                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ try {                                                     ││
│  │   const response = await fetch(targetUrl)                ││
│  │   return new NextResponse(responseData)                  ││
│  │ } catch (error) {                                        ││
│  │   return NextResponse.json({ error: 'Failed' })          ││
│  │ }                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  PROBLEMS:                                                    │
│  • No retry ❌                                                │
│  • No timeout ❌                                              │
│  • Unclear errors ❌                                          │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
                        ❌ ECONNREFUSED
                     (Backend not running)
                                │
                                ▼
                    User sees cryptic error:
                    "Proxy request failed"
```

## Request Flow (After Fix)

```
User Request
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js Frontend (Port 3200)                                 │
│                                                               │
│  Client-side Code                                             │
│  ├── axios.create({ baseURL: '/api/proxy' })                │
│  └── api.get('/users')                                       │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ Proxy Route: /api/proxy/[...path]/route.ts (ENHANCED!)       │
│                                                               │
│  ✅ STEP 1: Health Check                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ const isHealthy = await checkBackendHealth()             ││
│  │ if (!isHealthy) {                                        ││
│  │   return 503 with helpful message                        ││
│  │ }                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                │                              │
│                                ▼                              │
│  ✅ STEP 2: Retry Loop                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ for (attempt = 1; attempt <= 3; attempt++) {             ││
│  │   try {                                                   ││
│  │     // Set timeout                                        ││
│  │     const controller = new AbortController()             ││
│  │     setTimeout(() => controller.abort(), 30000)          ││
│  │                                                           ││
│  │     const response = await fetch(targetUrl, {            ││
│  │       signal: controller.signal                          ││
│  │     })                                                    ││
│  │                                                           ││
│  │     ✅ Success! Return response                           ││
│  │   } catch (error) {                                      ││
│  │     if (attempt < 3) {                                   ││
│  │       await sleep(1000 * attempt) // Retry with backoff  ││
│  │     }                                                     ││
│  │   }                                                       ││
│  │ }                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                │                              │
│                                ▼                              │
│  ✅ STEP 3: Error Handling                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ if (error.code === 'ECONNREFUSED') {                     ││
│  │   return 503 with:                                       ││
│  │   • Clear error message                                  ││
│  │   • Solution suggestion                                  ││
│  │   • How to start backend                                 ││
│  │ }                                                         ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
                        ✅ Clear Error Message:
                        {
                          "error": "Backend API Connection Refused",
                          "message": "Failed to connect...",
                          "details": {
                            "suggestion": "Run: npm run dev:api"
                          }
                        }
```

## Retry Mechanism Flow

```
Request Attempt 1
     │
     ▼
  Success?
     │
     ├─── YES ──▶ Return Response ✅
     │
     └─── NO ───▶ Wait 1 second
                      │
                      ▼
              Request Attempt 2
                      │
                      ▼
                  Success?
                      │
                      ├─── YES ──▶ Return Response ✅
                      │
                      └─── NO ───▶ Wait 2 seconds
                                      │
                                      ▼
                              Request Attempt 3
                                      │
                                      ▼
                                  Success?
                                      │
                                      ├─── YES ──▶ Return Response ✅
                                      │
                                      └─── NO ───▶ Return Error with:
                                                   • Error type
                                                   • Retry count (3)
                                                   • Total duration
                                                   • Helpful suggestion ❌
```

## Health Check Caching

```
Request comes in
     │
     ▼
Check cache age
     │
     ├─── Cache < 5s old ──▶ Use cached result (healthy/unhealthy)
     │                                │
     │                                ▼
     │                         Return cached status
     │
     └─── Cache expired ────▶ Perform new health check
                                      │
                                      ▼
                              GET /api/health (3s timeout)
                                      │
                                      ├─── Success ──▶ Cache: healthy ✅
                                      │                Update timestamp
                                      │
                                      └─── Failed ───▶ Cache: unhealthy ❌
                                                       Update timestamp
```

## Error Types & Response Codes

```
┌────────────────────────────────────────────────────────────────┐
│                     Error Handling Matrix                       │
├────────────────────┬──────────┬──────────────────────────────────┤
│ Error Type         │ HTTP Code│ Response                         │
├────────────────────┼──────────┼──────────────────────────────────┤
│ ECONNREFUSED       │   503    │ Backend API not running          │
│ (Backend down)     │          │ + How to start it                │
├────────────────────┼──────────┼──────────────────────────────────┤
│ AbortError         │   504    │ Request timeout (>30s)           │
│ (Timeout)          │          │ + Timeout duration               │
├────────────────────┼──────────┼──────────────────────────────────┤
│ Health Check Fail  │   503    │ Backend API unavailable          │
│                    │          │ + Health check failed            │
├────────────────────┼──────────┼──────────────────────────────────┤
│ Other Errors       │   500    │ Generic proxy error              │
│                    │          │ + Stack trace (dev only)         │
└────────────────────┴──────────┴──────────────────────────────────┘
```

## Timing Diagram

```
Timeline: Request to Backend API

0ms ─────────────────────────────────────────────────────────────▶
│
├─ Health Check (if needed)
│  └─ Max 3000ms timeout
│      │
│      ├─ Cache hit ──▶ ~0ms
│      └─ Cache miss ──▶ 10-3000ms
│
├─ Attempt 1
│  └─ Max 30000ms timeout
│      │
│      ├─ Success ──▶ Return (typically 10-500ms) ✅
│      │
│      └─ Failed ──▶ Wait 1000ms (1s)
│                      │
│                      ├─ Attempt 2
│                      │  └─ Max 30000ms timeout
│                      │      │
│                      │      ├─ Success ──▶ Return ✅
│                      │      │
│                      │      └─ Failed ──▶ Wait 2000ms (2s)
│                      │                      │
│                      │                      ├─ Attempt 3
│                      │                      │  └─ Max 30000ms timeout
│                      │                      │      │
│                      │                      │      ├─ Success ──▶ Return ✅
│                      │                      │      │
│                      │                      │      └─ Failed ──▶ Return Error ❌
│                      │                      │
│                      │                      Max: ~93 seconds
│                      │                      (3 × 30s + 1s + 2s + overhead)
│                      │
│                      Max: ~63 seconds
│                      (2 × 30s + 1s + overhead)
│
Best case: ~10-500ms (first attempt succeeds)
Worst case: ~93 seconds (all 3 attempts timeout)
```

## Component Interaction

```
┌──────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                           │
│                                                                   │
│  ┌────────────┐      ┌────────────┐      ┌─────────────┐        │
│  │  UI/Pages  │─────▶│  API Client │─────▶│  /api/proxy │        │
│  │            │      │  (axios)    │      │   Routes    │        │
│  │ • Login    │◀─────│             │◀─────│             │        │
│  │ • Generate │      │ baseURL:    │      │ • GET       │        │
│  │ • Gallery  │      │ /api/proxy  │      │ • POST      │        │
│  └────────────┘      └────────────┘      │ • PUT       │        │
│                                           │ • DELETE    │        │
│                                           │ • PATCH     │        │
│                                           └──────┬──────┘        │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
                                                   │ HTTP Request
                                                   │
┌──────────────────────────────────────────────────┼───────────────┐
│                  Proxy Route Middleware          │               │
│                                                   │               │
│  ┌───────────────────┐    ┌────────────────────┐│               │
│  │  Health Check     │    │  Retry Mechanism   ││               │
│  │                   │    │                    ││               │
│  │ • Cache (5s TTL)  │    │ • Max 3 attempts   ││               │
│  │ • 3s timeout      │    │ • Exponential      ││               │
│  │ • /api/health     │    │   backoff          ││               │
│  └───────────────────┘    └────────────────────┘│               │
│                                                   │               │
│  ┌───────────────────┐    ┌────────────────────┐│               │
│  │  Timeout Control  │    │  Error Handler     ││               │
│  │                   │    │                    ││               │
│  │ • AbortController │    │ • ECONNREFUSED     ││               │
│  │ • 30s limit       │    │ • Timeout          ││               │
│  │ • Per-request     │    │ • Generic errors   ││               │
│  └───────────────────┘    └────────────────────┘│               │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
                                                   │ HTTP Request
                                                   │
┌──────────────────────────────────────────────────┼───────────────┐
│                    Backend API (Express)         ▼               │
│                                                                   │
│  ┌────────────┐    ┌────────────┐    ┌──────────────┐          │
│  │  Health    │    │  Auth      │    │  Video       │          │
│  │  Endpoint  │    │  Routes    │    │  Routes      │          │
│  └────────────┘    └────────────┘    └──────────────┘          │
│                                                                   │
│  ┌────────────┐    ┌────────────┐    ┌──────────────┐          │
│  │  Database  │    │  Redis     │    │  External    │          │
│  │  (Prisma)  │    │  Cache     │    │  APIs        │          │
│  └────────────┘    └────────────┘    └──────────────┘          │
└───────────────────────────────────────────────────────────────────┘
```

## Configuration Flow

```
Environment Variables
         │
         ├─── Frontend (.env.local)
         │    │
         │    └─── NEXT_PUBLIC_API_URL=http://localhost:3101
         │              │
         │              ▼
         │         next.config.js
         │              │
         │              ▼
         │         Proxy Route (route.ts)
         │              │
         │              └─── const API_URL = process.env.NEXT_PUBLIC_API_URL
         │
         └─── Backend (apps/api/.env)
              │
              ├─── PORT=3101
              ├─── DATABASE_URL=...
              ├─── JWT_SECRET=...
              ├─── REDIS_URL=...
              └─── OPENAI_API_KEY=...
                   │
                   ▼
              Backend Server
                   │
                   └─── app.listen(PORT)
```

## Development Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Development Setup                              │
└──────────────────────────────────────────────────────────────────┘

Terminal 1: Backend API               Terminal 2: Frontend
     │                                      │
     ├─ cd apps/api                         ├─ npm run dev:frontend
     ├─ npm run dev                         │   (or npm run dev)
     │                                      │
     ▼                                      ▼
┌─────────────────┐                  ┌──────────────────┐
│ Express Server  │                  │  Next.js Server  │
│                 │                  │                  │
│ Port: 3101      │◀────────────────▶│  Port: 3200      │
│                 │   HTTP Requests  │                  │
│ Status: Running │                  │  Status: Running │
└─────────────────┘                  └──────────────────┘
     │                                      │
     │                                      │
     ▼                                      ▼
 Logs to:                            Logs to:
 • Console                           • Console
 • apps/api/logs/                    • logs/frontend.log
   combined.log                        (when using dev:all)

───────────────────────────────────────────────────────────────────

Alternative: One-Command Startup

     npm run dev:all
          │
          ├─── Starts Backend (Terminal 1)
          │    │
          │    └─── Port 3101
          │
          └─── Starts Frontend (Terminal 2)
               │
               └─── Port 3200 (or 3000)

     All logs combined in one view
     Press Ctrl+C to stop both servers
```

## Summary of Improvements

```
┌────────────────────────────────────────────────────────────────┐
│                   Before Fix      │      After Fix             │
├────────────────────────────────────┼────────────────────────────┤
│ ❌ No retry                        │ ✅ 3 retries with backoff  │
│ ❌ No timeout                      │ ✅ 30s timeout per request │
│ ❌ No health check                 │ ✅ Cached health checks    │
│ ❌ Generic errors                  │ ✅ Specific error messages │
│ ❌ No suggestion                   │ ✅ How-to-fix suggestions  │
│ ❌ Manual startup                  │ ✅ One-command startup     │
│ ❌ No documentation                │ ✅ Comprehensive docs      │
│ ❌ Poor DX                         │ ✅ Excellent DX            │
└────────────────────────────────────┴────────────────────────────┘

DX = Developer Experience
```

---

**Last Updated:** 2025-10-25
**Version:** 1.0.0
