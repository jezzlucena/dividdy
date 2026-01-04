# Dividdy

**Free and Open-source Splitwise alternative. Split expenses with friends, track group spending, and settle balances. Self-hostable & privacy-first.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Group Expenses**: Create groups for trips, roommates, or any shared spending
- **Smart Splitting**: Split bills equally, by percentage, shares, or exact amounts
- **Balance Tracking**: Real-time balance calculation with debt simplification
- **Settlements**: Record payments and track settlement history
- **Categories**: Organize expenses with customizable categories
- **Receipt Attachments**: Upload and attach receipts to expenses
- **Comments**: Add notes and comments to expenses
- **Privacy First**: Self-host on your own server for complete data control
- **Modern UI**: Beautiful, responsive interface with dark mode support

## Tech Stack

- **Frontend**: Next.js 15, React 19, Chakra UI, TypeScript
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: Email/Password + Magic Links (JWT)
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+ (or use Docker)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dividdy.git
   cd dividdy
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the database** (using Docker)
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

4. **Configure environment**
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Edit .env with your configuration
   ```

5. **Run database migrations**
   ```bash
   pnpm db:push
   ```

6. **Start development servers**
   ```bash
   pnpm dev
   ```

   - Web app: http://localhost:3000
   - API: http://localhost:4000
   - MailHog (email testing): http://localhost:8025

## Self-Hosting with Docker

### Quick Deploy

1. **Create environment file**
   ```bash
   cat > .env << EOF
   # Database
   DB_USER=dividdy
   DB_PASSWORD=your-secure-password
   DB_NAME=dividdy

   # Security (CHANGE THESE!)
   JWT_SECRET=$(openssl rand -base64 32)
   JWT_REFRESH_SECRET=$(openssl rand -base64 32)
   MAGIC_LINK_SECRET=$(openssl rand -base64 32)

   # Email (optional, for magic links)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-email-password
   SMTP_FROM=Dividdy <noreply@example.com>

   # URLs
   FRONTEND_URL=https://dividdy.yourdomain.com
   NEXT_PUBLIC_API_URL=https://dividdy.yourdomain.com/api
   EOF
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker compose up -d
   ```

3. **Access Dividdy**
   - Web app: http://localhost:3000
   - API: http://localhost:4000

### Production Considerations

- Use a reverse proxy (nginx, Caddy, Traefik) for HTTPS
- Set strong, unique secrets for JWT and magic link tokens
- Configure proper SMTP settings for magic link emails
- Set up regular database backups
- Consider using an external PostgreSQL instance for data persistence

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret for access tokens | - |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | - |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `MAGIC_LINK_SECRET` | Secret for magic links | - |
| `MAGIC_LINK_EXPIRES_IN` | Magic link expiry | `15m` |
| `SMTP_HOST` | SMTP server host | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |
| `SMTP_FROM` | Email sender address | - |
| `FRONTEND_URL` | Frontend URL for links | `http://localhost:3000` |
| `UPLOAD_DIR` | Directory for uploads | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `5242880` |

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/magic-link` | POST | Request magic link |
| `/api/auth/verify` | POST | Verify magic link |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout (revoke tokens) |

### Groups

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/groups` | GET | List user's groups |
| `/api/groups` | POST | Create new group |
| `/api/groups/:id` | GET | Get group details |
| `/api/groups/:id` | PATCH | Update group |
| `/api/groups/:id` | DELETE | Delete group |
| `/api/groups/join/:code` | POST | Join group via invite |

### Expenses

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/groups/:id/expenses` | GET | List group expenses |
| `/api/groups/:id/expenses` | POST | Create expense |
| `/api/expenses/:id` | PATCH | Update expense |
| `/api/expenses/:id` | DELETE | Delete expense |
| `/api/expenses/:id/receipt` | POST | Upload receipt |

### Balances & Settlements

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/groups/:id/balances` | GET | Get group balances |
| `/api/groups/:id/settlements` | GET | List settlements |
| `/api/groups/:id/settlements` | POST | Record settlement |

## Project Structure

```
dividdy/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities & API client
│   │   └── theme/              # Chakra UI theme
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   ├── middleware/     # Auth, validation
│       │   ├── services/       # Business logic
│       │   └── utils/          # Helpers
│       └── prisma/
│           └── schema.prisma   # Database schema
├── packages/
│   ├── shared-types/           # Shared TypeScript types
│   ├── eslint-config/          # Shared ESLint config
│   └── tsconfig/               # Shared TS configs
├── docker-compose.yml          # Production deployment
├── docker-compose.dev.yml      # Development environment
└── turbo.json                  # Turborepo config
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [Splitwise](https://www.splitwise.com/)
- Built with [Next.js](https://nextjs.org/), [Chakra UI](https://chakra-ui.com/), [Prisma](https://www.prisma.io/)
