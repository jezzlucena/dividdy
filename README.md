# Dividdy

An expense splitting web app for groups - track who paid for what and calculate who owes whom.

![Dividdy](https://img.shields.io/badge/status-in%20development-blue)

## Features

- **No Registration Required** - Create a group and share the link, no accounts needed
- **Multiple Split Methods** - Equal, percentage, shares, exact amounts, or itemized
- **Multi-Currency Support** - Track expenses in different currencies with automatic conversion
- **Simplified Settlements** - Minimized transactions algorithm to settle debts efficiently
- **Internationalization** - Available in English (US) and Spanish (Latin America)
- **Ad-Supported** - Google AdSense integration for monetization

## Tech Stack

### Frontend
- [Next.js 14](https://nextjs.org/) - React framework with App Router
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [next-intl](https://next-intl-docs.vercel.app/) - Internationalization
- [Lucide React](https://lucide.dev/) - Icons

### Backend
- [Express.js](https://expressjs.com/) - Node.js web framework
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Mongoose](https://mongoosejs.com/) - MongoDB ODM
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dividdy.git
cd dividdy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/dividdy
FRONTEND_URL=http://localhost:3000
EXCHANGE_RATE_API_KEY=your_api_key_here  # Optional, from exchangerate-api.com
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX  # Optional
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Start the development servers:
```bash
npm run dev
```

This will start:
- Frontend at http://localhost:3000
- Backend at http://localhost:3001

## Docker Deployment

For self-hosted deployment using Docker:

1. Create a `.env` file in the root directory:
```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com
EXCHANGE_RATE_API_KEY=your_api_key
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

2. Build and start the containers:
```bash
docker-compose up -d --build
```

3. Access the app at http://localhost:3000

## Project Structure

```
dividdy/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities, API client
│   │   ├── messages/        # i18n translations
│   │   ├── types/           # TypeScript types
│   │   └── i18n/            # i18n configuration
│   └── public/
│
├── backend/                  # Express API
│   └── src/
│       ├── controllers/     # Route handlers
│       ├── models/          # Mongoose models
│       ├── routes/          # API routes
│       └── services/        # Business logic
│
└── docker-compose.yml        # Docker configuration
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups` | Create new group |
| GET | `/api/groups/:shareCode` | Get group details |
| PUT | `/api/groups/:shareCode` | Update group |
| DELETE | `/api/groups/:shareCode` | Delete group |
| POST | `/api/groups/:shareCode/members` | Add member |
| DELETE | `/api/groups/:shareCode/members/:id` | Remove member |
| GET | `/api/groups/:shareCode/expenses` | List expenses |
| POST | `/api/groups/:shareCode/expenses` | Create expense |
| PUT | `/api/groups/:shareCode/expenses/:id` | Update expense |
| DELETE | `/api/groups/:shareCode/expenses/:id` | Delete expense |
| GET | `/api/groups/:shareCode/balances` | Get calculated balances |
| GET | `/api/groups/:shareCode/settlements` | Get settlement plan |
| GET | `/api/exchange-rates` | Get exchange rates |

## Split Methods

1. **Equal** - Split equally among selected members
2. **Percentage** - Assign percentages (must total 100%)
3. **Shares** - Assign share units (e.g., 2x share for someone)
4. **Exact Amounts** - Specify exact amount per person
5. **Itemized** - Add individual items and assign to specific members

## Settlement Algorithm

The app uses a greedy algorithm to minimize the number of transactions needed to settle all debts:

1. Calculate net balance for each member (paid - owes)
2. Separate into creditors (positive) and debtors (negative)
3. Match the largest debtor with the largest creditor
4. Transfer the minimum of their absolute amounts
5. Repeat until all balances are zero

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [Spliito](https://spliito.com/)
- Exchange rates from [exchangerate-api.com](https://www.exchangerate-api.com/)
