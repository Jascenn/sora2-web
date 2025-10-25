# Sora2 Authentication System

## Overview

The Sora2 project uses a unified authentication system that supports:

- **Production Mode**: Full JWT-based authentication with httpOnly cookies
- **Development Mode**: Optional authentication bypass for easier local development

## Architecture

### Frontend (Next.js)

- **Auth Store** (`src/store/auth.store.ts`): Zustand-based state management
- **Auth Provider** (`src/components/auth-provider.tsx`): React context for auth state
- **API Client** (`src/lib/api.ts`): Axios instance with auth interceptors
- **API Proxy** (`src/app/api/proxy/[...path]/route.ts`): Next.js API route for CORS handling

### Backend (Express)

- **Auth Middleware** (`apps/api/src/middleware/auth.middleware.ts`): JWT verification and bypass logic
- **Auth Routes** (`apps/api/dist/routes/auth.routes.js`): Login, register, logout endpoints
- **User Routes** (`apps/api/dist/routes/user.routes.js`): Protected user profile endpoints

## Authentication Flow

### Production Mode (BYPASS_AUTH=false)

1. User submits credentials via login form
2. Backend validates credentials and generates JWT
3. JWT is stored in httpOnly cookie (secure, not accessible via JavaScript)
4. All subsequent requests include the cookie automatically
5. Backend middleware verifies JWT on protected routes
6. Frontend receives user data and updates auth store

### Development Mode (BYPASS_AUTH=true)

1. Frontend automatically sets mock admin user in auth store
2. Backend bypasses JWT verification
3. All requests are treated as authenticated admin user
4. No login required for development

## Configuration

### Environment Variables

#### Development (.env)

```bash
NODE_ENV="development"
BYPASS_AUTH=true  # Enable auth bypass for local development
```

#### Production (.env.production)

```bash
NODE_ENV="production"
BYPASS_AUTH=false  # CRITICAL: Must be false in production!
JWT_SECRET="your-strong-secret-key"  # Use: openssl rand -base64 64
JWT_EXPIRES_IN="7d"
```

### Frontend Configuration

The frontend automatically detects the environment:

```typescript
// In auth.store.ts
const BYPASS_LOGIN = process.env.NODE_ENV === 'development'
```

When `BYPASS_LOGIN` is true:
- Mock admin user is set in the store
- Auth provider skips server verification
- API client doesn't redirect on 401 errors

### Backend Configuration

The backend checks both `NODE_ENV` and `BYPASS_AUTH`:

```typescript
// In auth.middleware.ts
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development'
```

When `BYPASS_AUTH` is true:
- Middleware injects mock admin credentials
- No JWT verification is performed
- All routes become accessible

## Security Considerations

### Production Checklist

- [ ] `BYPASS_AUTH=false` in production environment
- [ ] Strong `JWT_SECRET` (min 32 characters, use `openssl rand -base64 64`)
- [ ] `NODE_ENV=production`
- [ ] HTTPS enabled (required for secure cookies)
- [ ] `SECURE_COOKIES=true` in production
- [ ] Proper CORS configuration (`CORS_ORIGIN` set to your domain)

### Why httpOnly Cookies?

1. **XSS Protection**: Cookies are not accessible via JavaScript
2. **Automatic Transmission**: Browser sends cookies with every request
3. **CSRF Protection**: Can be combined with CSRF tokens
4. **Secure Flag**: Only transmitted over HTTPS in production

### Bypass Mode Safety

The bypass mode is protected by multiple layers:

1. Only enabled when `NODE_ENV === 'development'`
2. Requires explicit `BYPASS_AUTH=true` setting
3. Logs warning message on startup
4. Should never be deployed to production

## Usage Examples

### Frontend: Using Auth Store

```typescript
import { useAuthStore } from '@/store/auth.store'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuthStore()

  if (!isAuthenticated) {
    return <div>Please log in</div>
  }

  return (
    <div>
      <h1>Welcome, {user?.nickname}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Backend: Protected Routes

```typescript
import { authenticate, requireAdmin } from './middleware/auth.middleware'

// Protected route - any authenticated user
router.get('/profile', authenticate, async (req, res) => {
  const userId = req.userId // Injected by middleware
  // ... fetch and return user profile
})

// Admin-only route
router.post('/admin/users', authenticate, requireAdmin, async (req, res) => {
  // Only admins can access this
})
```

### API Calls from Frontend

```typescript
import { api } from '@/lib/api'

// Automatically includes auth cookie
const response = await api.get('/users/profile')
const user = response.data.data.user

// Handles 401 errors automatically (unless in bypass mode)
try {
  await api.post('/videos/generate', { prompt: 'A cat playing' })
} catch (error) {
  if (error.response?.status === 401) {
    // User will be redirected to login (in production)
  }
}
```

## Troubleshooting

### Issue: "No token provided" error in development

**Solution**: Make sure `BYPASS_AUTH=true` is set in your `.env` file

### Issue: Auth works in dev but not in production

**Cause**: Bypass mode is still enabled in production

**Solution**: Verify `BYPASS_AUTH=false` in production environment

### Issue: Cookies not being sent with requests

**Cause**: CORS credentials not properly configured

**Solution**: Verify:
- Frontend API client has `withCredentials: true`
- Backend CORS has `credentials: true`
- API proxy forwards `Set-Cookie` headers

### Issue: User logged out on page refresh

**Cause**: Cookie not being persisted or local storage cleared

**Solution**: Check:
- httpOnly cookie is being set correctly
- Cookie domain/path configuration
- Browser dev tools > Application > Cookies

## Development Workflow

### Starting the Project

1. Ensure `.env` has `BYPASS_AUTH=true`
2. Start backend: `cd apps/api && npm run dev`
3. Start frontend: `cd apps/web && npm run dev`
4. You'll be automatically logged in as admin

### Testing Authentication

To test real authentication in development:

1. Set `BYPASS_AUTH=false` in `.env`
2. Restart backend server
3. Create an admin user: `npm run create-admin`
4. Use login form with created credentials

### Switching Modes

**Enable Bypass Mode:**
```bash
# In .env
BYPASS_AUTH=true
```

**Disable Bypass Mode:**
```bash
# In .env
BYPASS_AUTH=false
```

Remember to restart the backend server after changing environment variables.

## API Reference

### Public Endpoints (No Auth Required)

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/public/*` - Public content

### Protected Endpoints (Auth Required)

- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/videos/generate` - Generate video
- `GET /api/videos` - List user's videos

### Admin Endpoints (Admin Role Required)

- `GET /api/admin/users` - List all users
- `POST /api/admin/credits` - Manage user credits
- `GET /api/admin/stats` - System statistics

## Best Practices

1. **Never commit `.env` files** - Use `.env.example` templates
2. **Rotate JWT secrets regularly** in production
3. **Use strong passwords** for admin accounts
4. **Monitor authentication logs** for suspicious activity
5. **Keep bypass mode disabled** in production
6. **Test authentication flows** before deploying
7. **Use HTTPS in production** for secure cookie transmission
8. **Implement rate limiting** on auth endpoints (already configured)

## Migration Guide

### From Bearer Tokens to httpOnly Cookies

If migrating from bearer token authentication:

1. Frontend: Remove `Authorization` header logic
2. Frontend: Ensure `withCredentials: true` in API client
3. Backend: Keep bearer token support for backwards compatibility
4. Test cookie-based flow thoroughly
5. Remove bearer token support after transition period

### Enabling Bypass Mode on Existing Project

1. Add `BYPASS_AUTH=true` to `.env`
2. Update auth middleware (already done in this version)
3. Restart backend server
4. Frontend will automatically use bypass mode

## Related Files

- Frontend:
  - `/src/store/auth.store.ts` - Auth state management
  - `/src/components/auth-provider.tsx` - Auth context
  - `/src/lib/api.ts` - API client configuration
  - `/src/lib/auth.ts` - Auth helper functions

- Backend:
  - `/apps/api/src/middleware/auth.middleware.ts` - Auth verification
  - `/apps/api/dist/routes/auth.routes.js` - Auth endpoints
  - `/apps/api/dist/controllers/auth.controller.js` - Auth logic
  - `/apps/api/.env` - Backend environment configuration

## Support

For issues or questions about authentication:

1. Check this documentation
2. Review the troubleshooting section
3. Check browser console and server logs
4. Verify environment variables are set correctly
5. Test with bypass mode enabled first
