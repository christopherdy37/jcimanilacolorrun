# JCI Manila Color Run - Event Website

A production-ready event website for the JCI Manila Color Run at SM Mall of Asia, Pasay City with a deployment-agnostic architecture. Built with Next.js, PostgreSQL, and Stripe payments.

## Features

### Public Landing Page
- **Hero Section**: Eye-catching hero with event details and CTA
- **Event Details**: Comprehensive information about the color run
- **Ticket Section**: Premium ticket with pricing
- **Checkout Flow**: Secure payment processing with Stripe
- **Schedule**: Event timeline and activities
- **Sponsors**: Sponsor showcase section
- **FAQ**: Frequently asked questions
- **Responsive Design**: Mobile-first, works on all devices

### Admin Dashboard
- **Secure Authentication**: NextAuth-based admin login
- **Dashboard Overview**: Sales analytics and statistics
- **Order Management**: View, search, filter, and manage orders
- **Order Details**: Detailed order information and status updates
- **CSV Export**: Export orders to CSV for reporting
- **Responsive UI**: Works on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe (with abstraction layer for easy provider swapping)
- **Email**: Nodemailer (SMTP-based)

## Architecture

This application is designed to be **deployment-agnostic** and can run on:
- Vercel
- Traditional VPS (Docker)
- AWS / GCP
- Railway / Render
- Any Node.js hosting platform

### Key Design Decisions

1. **No Vendor Lock-in**: Avoids Vercel-specific or serverless-only features
2. **Environment-based Configuration**: All services configured via environment variables
3. **Payment Abstraction**: Payment provider can be swapped (Stripe → PayMongo/GCash)
4. **SMTP Email**: Uses standard SMTP, not vendor-specific email services

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Stripe account (for payments)
- SMTP email server (Gmail, SendGrid, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jcimanilacolorrun
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your application URL
   - `STRIPE_SECRET_KEY`: From Stripe dashboard
   - `STRIPE_PUBLISHABLE_KEY`: From Stripe dashboard
   - `STRIPE_WEBHOOK_SECRET`: From Stripe webhook settings
   - `SMTP_*`: Your SMTP server credentials
   - `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Initial admin credentials

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed initial data
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jcimanilacolorrun"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="JCI Manila Color Run <noreply@jcimanilacolorrun.com>"

# Admin (for seeding)
ADMIN_EMAIL="admin@jcimanilacolorrun.com"
ADMIN_PASSWORD="changeme"
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Note**: For webhooks, configure Stripe webhook URL: `https://yourdomain.com/api/payments/webhook`

### Docker / VPS

1. **Build the Docker image** (if using Docker):
   ```bash
   docker build -t jci-color-run .
   ```

2. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

3. **Start the application**:
   ```bash
   npm run build
   npm start
   ```

4. **Set up reverse proxy** (nginx example):
   ```nginx
   server {
       listen 80;
       server_name jcimanilacolorrun.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Railway / Render

1. Connect your GitHub repository
2. Add environment variables in the dashboard
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add PostgreSQL database addon
6. Update `DATABASE_URL` with the provided connection string

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select events: `payment_intent.succeeded`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

For local development, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

## Database Migrations

```bash
# Create a new migration
npm run db:migrate

# Apply migrations
npx prisma migrate deploy

# View database in Prisma Studio
npm run db:studio
```

## Project Structure

```
├── app/
│   ├── admin/              # Admin dashboard pages
│   ├── api/                 # API routes
│   ├── checkout/            # Payment pages
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── admin/               # Admin components
│   └── landing/             # Landing page components
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── email.ts             # Email service
│   ├── payment.ts           # Payment abstraction
│   ├── prisma.ts            # Prisma client
│   └── utils.ts             # Utility functions
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data
└── public/                  # Static assets
```

## Payment Provider Abstraction

The payment system uses an abstraction layer (`lib/payment.ts`) that allows swapping payment providers:

- **Current**: Stripe
- **Future**: PayMongo, GCash, etc.

To add a new provider:
1. Implement `PaymentProviderInterface` in `lib/payment.ts`
2. Update `getPaymentProvider()` factory function
3. Set `PAYMENT_PROVIDER` environment variable

## Admin Access

Default admin credentials (change after first login):
- Email: Set via `ADMIN_EMAIL` env variable
- Password: Set via `ADMIN_PASSWORD` env variable

**Important**: Change the default password after first login!

## Email Configuration

The application uses Nodemailer with SMTP. Supported providers:
- Gmail (with App Password)
- SendGrid
- AWS SES
- Any SMTP server

### Gmail Setup
1. Enable 2-factor authentication
2. Generate App Password
3. Use App Password in `SMTP_PASSWORD`

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall rules

### Payment Issues
- Verify Stripe keys are correct
- Check webhook configuration
- Ensure webhook secret matches

### Email Not Sending
- Verify SMTP credentials
- Check firewall/security settings
- Test SMTP connection separately

## Development

```bash
# Run development server
npm run dev

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Build for production
npm run build

# Start production server
npm start
```

## License

This project is proprietary software for JCI Manila Color Run.

## Support

For issues or questions, contact: info@jcimanilacolorrun.com

