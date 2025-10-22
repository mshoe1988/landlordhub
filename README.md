# 🏠 LandlordHub - Property Management Suite

A modern, production-ready SaaS application for managing rental properties. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

### 🏘️ Property Management
- Add and manage multiple rental properties
- Track monthly rent and tenant information
- Store lease end dates and purchase dates
- Property limit enforcement based on subscription plan

### 💰 Expense Tracking
- Record property-related expenses
- Categorize expenses (repairs, utilities, insurance, etc.)
- Upload and store receipt images
- CSV export functionality
- Date range filtering

### 🔧 Maintenance Management
- Create and track maintenance tasks
- Set due dates and priority levels
- Mark tasks as completed
- Automated email reminders (3 days before due date)
- Link tasks to specific properties

### 📄 Document Storage
- Upload and organize property documents
- Support for PDFs, images, and office documents
- Secure file storage with Supabase
- Download and view documents

### 📊 Financial Reports
- Profit & Loss by Property
- Expenses by Category (pie charts)
- Income vs Expenses over time
- Tax summary with exportable reports
- ROI calculations

### 💳 Subscription Billing
- **Free Plan**: 1 property
- **Starter Plan**: $19/month, up to 5 properties
- **Pro Plan**: $39/month, unlimited properties
- Stripe integration for secure payments
- Customer portal for billing management

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel
- **Charts**: Recharts
- **File Processing**: Papa Parse, jsPDF

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Resend account (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/landlordhub.git
   cd landlordhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Resend Email API
   RESEND_API_KEY=your_resend_api_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   STRIPE_STARTER_PRICE_ID=your_starter_price_id
   STRIPE_PRO_PRICE_ID=your_pro_price_id
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL scripts in order:
     - `supabase-schema.sql` (main database schema)
     - `supabase-billing-schema.sql` (subscription schema)
     - `supabase-storage-setup.sql` (file storage setup)

5. **Set up Stripe**
   - Follow the detailed guide in `STRIPE_SETUP.md`
   - Create products and prices in Stripe Dashboard
   - Set up webhook endpoints

6. **Set up Resend**
   - Follow the guide in `EMAIL_SETUP.md`
   - Configure email templates

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
landlordhub/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Dashboard page
│   │   ├── properties/         # Properties management
│   │   ├── maintenance/        # Maintenance tasks
│   │   ├── expenses/           # Expense tracking
│   │   ├── documents/          # Document storage
│   │   ├── reports/            # Financial reports
│   │   ├── pricing/            # Pricing page
│   │   ├── account/            # Account management
│   │   └── auth/               # Authentication pages
│   ├── components/             # Reusable components
│   ├── contexts/               # React contexts
│   └── lib/                   # Utilities and configurations
├── public/                    # Static assets
├── supabase-schema.sql        # Database schema
├── supabase-billing-schema.sql # Billing schema
├── supabase-storage-setup.sql # Storage setup
├── STRIPE_SETUP.md           # Stripe configuration guide
├── EMAIL_SETUP.md            # Email setup guide
└── PRODUCTION_CHECKLIST.md   # Production deployment checklist
```

## 🔧 Key Features Implementation

### Authentication
- Email/password authentication with Supabase Auth
- Protected routes with middleware
- Password reset functionality
- Session management

### Database Design
- Row Level Security (RLS) for data isolation
- Optimized indexes for performance
- Automatic timestamp updates
- Foreign key relationships

### File Upload
- Secure file storage with Supabase Storage
- File type and size validation
- Public URL generation
- Organized file structure

### Email System
- Automated maintenance reminders
- Professional HTML email templates
- Vercel Cron Jobs for scheduling
- Resend API integration

### Payment Processing
- Stripe Checkout for secure payments
- Webhook handling for subscription events
- Customer portal integration
- Plan-based feature restrictions

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Production Checklist
- Follow `PRODUCTION_CHECKLIST.md` for complete setup
- Set up monitoring and error tracking
- Configure domain and SSL
- Test all features in production

## 📊 Performance Optimizations

- Database indexes on frequently queried columns
- Lazy loading for components
- Image optimization with Next.js
- Efficient API caching
- Mobile-responsive design

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- User data isolation
- Secure file uploads
- Input validation and sanitization
- CSRF protection
- Rate limiting

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly interface
- Mobile-optimized tables
- Progressive Web App features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Check the documentation in the `/docs` folder
- Review the setup guides for each service
- Open an issue for bugs or feature requests

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Tenant portal
- [ ] Automated rent collection
- [ ] Property valuation tools
- [ ] Tax document generation
- [ ] Multi-currency support
- [ ] API for third-party integrations

---

Built with ❤️ for landlords and property managers.