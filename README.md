# CYBER_RACE Backend

Backend API for the CYBER_RACE typing application.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Auth**: Google OAuth 2.0 + JWT
- **Language**: TypeScript

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
   - Database connection details
   - Google OAuth Client ID
   - JWT secret

4. Run migrations and seed data:
```bash
npm run db:migrate
npm run db:seed
```

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Auth
- `POST /auth/google` - Google OAuth login
- `GET /auth/me` - Get current user
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

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── models/          # Sequelize models
│   ├── middleware/      # Auth & validation
│   ├── services/        # Business logic
│   ├── db/              # Database config & seeds
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript types
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── .env.example
├── package.json
└── tsconfig.json
```
