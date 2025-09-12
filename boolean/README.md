# WebRend.com - GitHub Repository Marketplace

WebRend.com is a platform that allows developers to buy and sell GitHub repositories. It features a modern UI built with Next.js and TypeScript, Firebase for backend services, GitHub API integration, and Stripe Connect for payment processing.

## Features

- **GitHub Integration**: Connect your GitHub account to list repositories for sale or purchase repositories from other developers
- **Stripe Connect**: Direct payments to sellers with platform fee support
- **Repository Marketplace**: Browse, search, and filter repositories for sale
- **Multiple Purchase Options**: 
  - One-time purchases (copies repo into WebRend org and transfers a fresh copy to buyer)
  - Subscription access (provides collaborator access for the subscription period)
- **Seller Dashboard**: Track sales, manage listings, and view analytics
- **Firebase Integration**: Authentication, database, and storage

## Tech Stack

- **Frontend**: Next.js, TypeScript, SCSS Modules
- **Authentication**: NextAuth.js with GitHub provider
- **Backend**: Firebase (Firestore, Authentication)
- **Payments**: Stripe Connect
- **API**: GitHub API, Stripe API
- **Styling**: SCSS Modules
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase account
- GitHub OAuth App
- Stripe account with Connect enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/webrend.git
   cd webrend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on `.env.local.example` and fill in your credentials:
   ```
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

   # GitHub OAuth Configuration
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=

   # Stripe Configuration
   STRIPE_SECRET_KEY=
   STRIPE_PUBLISHABLE_KEY=
   STRIPE_WEBHOOK_SECRET=

   # Platform Configuration
   PLATFORM_FEE_PERCENT=5
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Setting up Stripe Connect

1. Create a Stripe account and enable Connect
2. Set up your Connect settings in the Stripe Dashboard:
   - Configure your platform profile
   - Set default settings for connected accounts
   - Enable the payment methods you want to support
3. Set your platform fee percentage in the `.env.local` file

## Configuring GitHub OAuth

1. Create a GitHub OAuth App:
   - Go to your GitHub account settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set the Authorization callback URL to `http://localhost:3000/api/auth/callback/github` for development
2. Copy the Client ID and Client Secret to your `.env.local` file

## Firebase Setup

1. Create a Firebase project
2. Enable Firestore Database
3. Set up Authentication with Email/Password and GitHub providers
4. Create a web app and copy the configuration to your `.env.local` file

## Project Structure

```
webrend/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth configuration
│   │   ├── github/       # GitHub API routes
│   │   └── stripe/       # Stripe API routes
│   ├── marketplace/      # Marketplace pages
│   │   ├── [id]/         # Repository detail page
│   │   ├── sell/         # Sell repository page
│   │   └── success/      # Checkout success page
│   ├── profile/          # Profile page
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
├── lib/                  # Utility functions and services
│   ├── firebase.ts       # Firebase configuration
│   ├── github.ts         # GitHub API client
│   └── stripe.ts         # Stripe client
├── public/               # Static assets
└── styles/               # Global styles
```

## Marketplace Copy/Transfer Flow

One-time purchases no longer transfer the seller’s original repository. Instead, the platform creates a private copy in the WebRend org and transfers that copy to the buyer, enabling multiple sales per repo.

Flow:
- API: `POST /api/github/copy-transfer` creates an org repo and kicks off a GitHub Import from the seller’s repo, recording a job in `repoCopyJobs`.
- Worker: `scripts/cron.github-copy-worker.ts` polls jobs; when import completes, it transfers the org repo to the buyer’s GitHub.

Required env:
```
GITHUB_WEBREND_ORG=webrend-hq
GITHUB_WEBREND_TOKEN=ghp_... # org admin token with repo scope
```

Run worker manually:
```
npx ts-node scripts/cron.github-copy-worker.ts
```

## Deployment

The recommended way to deploy this application is with Vercel:

1. Push your code to a GitHub repository
2. Log in to Vercel and import your project
3. Configure your environment variables
4. Deploy

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Stripe](https://stripe.com/)
- [GitHub API](https://docs.github.com/en/rest)
