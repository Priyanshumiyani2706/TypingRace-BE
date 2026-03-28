# Backend Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Google Cloud Console account (for OAuth)

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Setup PostgreSQL Database

1. Install PostgreSQL if not already installed
2. Create a new database:

```sql
CREATE DATABASE cyberrace;
```

3. Create a user (optional):

```sql
CREATE USER cyberrace_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cyberrace TO cyberrace_user;
```

## Step 3: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
7. Copy the Client ID

## Step 4: Environment Variables

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update `.env` with your values:

```env
DATABASE_URL="postgresql://cyberrace_user:your_password@localhost:5432/cyberrace"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="cyberrace"
DB_USER="cyberrace_user"
DB_PASSWORD="your_password"

JWT_SECRET="your_super_secret_jwt_key_change_this_in_production"
JWT_EXPIRES_IN="7d"

GOOGLE_CLIENT_ID="your_google_client_id_from_step_3"

PORT=8080
NODE_ENV="development"

FRONTEND_URL="http://localhost:5173"
```

## Step 5: Run Migrations

```bash
npm run db:migrate
```

This will create all database tables.

## Step 6: Seed Database

```bash
npm run db:seed
```

This will populate:
- 6 default avatars
- 6 sample trophies

## Step 7: Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:8080`

## Step 8: Test the API

Visit `http://localhost:8080/health` - you should see:

```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

## API Endpoints

### Auth
- `POST /auth/google` - Google OAuth login
- `GET /auth/me` - Get current user (requires JWT)
- `POST /auth/logout` - Logout

### Users
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile
- `GET /api/users/:id/test-history` - Get test history
- `GET /api/users/:id/activity` - Get activity heatmap
- `GET /api/users/:id/trophies` - Get user trophies
- `GET /api/users/:id/avatars` - Get unlocked avatars
- `POST /api/users/:id/avatars/:avatarId/equip` - Equip avatar

### Test Results
- `POST /api/test-results` - Save test result
- `POST /api/test-results/check-trophies` - Check trophy unlocks

### Trophies
- `GET /api/trophies` - List all trophies
- `GET /api/trophies/:id` - Get trophy details

### Avatars
- `GET /api/avatars` - List all avatars
- `GET /api/avatars/:id` - Get avatar details

### Leaderboards
- `GET /api/leaderboards/global` - Global leaderboard

## Troubleshooting

### Database Connection Error

If you see "Unable to connect to database":
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql -U cyberrace_user -d cyberrace`

### Google OAuth Error

If Google login fails:
1. Verify GOOGLE_CLIENT_ID in `.env`
2. Check authorized origins in Google Console
3. Ensure frontend URL matches

### Port Already in Use

If port 8080 is busy:
1. Change PORT in `.env`
2. Update VITE_API_URL in frontend `.env`

## Next Steps

1. Setup frontend (see frontend README)
2. Configure Socket.io for real-time features (future)
3. Deploy to production (Railway, Render, or AWS)
