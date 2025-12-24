# Doall - Multi-Tenant Service Booking Platform

A comprehensive PWA (Progressive Web App) for multi-tenant service booking with an Atomic Habits theme. Built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 🎨 Design Theme

- **Atomic Habits Inspired**: Deep red (#8B1C1C) color scheme
- **Clean & Modern**: Minimalist design with smooth transitions
- **Responsive**: Mobile-first design, works on all devices
- **PWA Ready**: Installable, offline-capable, fast

## 🚀 Features

### Core Functionality

- ✅ Multi-tenant architecture
- ✅ User authentication (JWT-based)
- ✅ Service browsing and booking
- ✅ Real-time chat (Socket.io)
- ✅ Location tracking
- ✅ Payment integration (Razorpay)
- ✅ Push notifications
- ✅ Admin dashboard

### User Roles

- **Customer**: Browse services, book, track, pay
- **Provider**: Accept jobs, update status, receive payments
- **Dispatcher**: Assign jobs, monitor operations
- **Admin**: Manage users, services, analytics

### PWA Features

- 📱 Installable on mobile and desktop
- 🔄 Service worker for offline support
- 🔔 Push notifications
- ⚡ Fast loading and caching
- 📲 Add to home screen

## 🛠️ Tech Stack

### Backend

- Node.js & Express.js
- MongoDB with Mongoose
- Socket.io for real-time features
- Redis for caching
- JWT authentication
- Razorpay payment gateway

### Frontend

- Vanilla JavaScript (ES6+)
- CSS3 with custom properties
- Font Awesome icons
- Service Worker API
- Fetch API for HTTP requests

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- npm or yarn

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd doall
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/doall

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-password

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Generate PWA Icons

Generate icons in multiple sizes (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512) and place them in `public/images/` directory.

You can use tools like:

- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### 5. Set up MongoDB indexes

```bash
npm run migrate:indexes
```

### 6. Start the application

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The application will be available at `http://localhost:5000`

## 📱 Using the App

### First Time Setup

1. **Access the application**: Open `http://localhost:5000` in your browser

2. **Create an account**:

   - Click on "Sign Up" tab
   - Fill in your details
   - Create your account

3. **Login**:
   - Use your phone number and password
   - You'll be redirected to the dashboard

### Customer Workflow

1. **Browse Services**: Navigate to "Services" from the sidebar
2. **Select a Service**: Click on any service to view details
3. **Book Service**:
   - Fill in the booking form
   - Select date and time slot
   - Provide service address
   - Confirm booking
4. **Track Booking**: View status updates in "My Bookings"
5. **Pay**: Complete payment when prompted
6. **Rate**: Rate the service after completion

### Provider Workflow

1. **View Jobs**: Check "My Jobs" for assigned services
2. **Accept Job**: Accept incoming job requests
3. **Update Status**: Update job status as you progress
4. **Complete Job**: Mark job as completed
5. **View Earnings**: Check earnings in "Earnings" section

## 🎨 Theme Customization

### Color Scheme

The Atomic Habits theme uses a deep red color palette. You can customize it by editing CSS variables in [public/css/styles.css](public/css/styles.css):

```css
:root {
  --primary-dark: #6b0f0f;
  --primary: #8b1c1c;
  --primary-light: #a52a2a;
  --primary-lighter: #c93838;
  --accent-gold: #d4af37;
}
```

## 📁 Project Structure

```
doall/
├── public/                 # Frontend files
│   ├── css/
│   │   └── styles.css     # Main stylesheet
│   ├── js/
│   │   ├── app.js         # Main application logic
│   │   ├── auth.js        # Authentication module
│   │   ├── api.js         # API service
│   │   ├── ui.js          # UI manager
│   │   ├── config.js      # Configuration
│   │   ├── dashboard.js   # Dashboard module
│   │   ├── services.js    # Services module
│   │   └── bookings.js    # Bookings module
│   ├── images/            # PWA icons
│   ├── index.html         # Main HTML file
│   ├── manifest.json      # PWA manifest
│   └── service-worker.js  # Service worker
├── src/
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── socket/            # Socket.io handlers
├── db/
│   └── schemas/           # MongoDB schemas
├── scripts/
│   └── migrations/        # Database migrations
├── server.js              # Main server file
├── package.json
└── README.md
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Helmet.js for HTTP headers security
- CORS configuration
- Input validation with express-validator
- MongoDB injection prevention

## 🧪 Testing

```bash
npm test
```

## 📦 Building for Production

1. Set `NODE_ENV=production` in `.env`
2. Configure production MongoDB and Redis URLs
3. Set up SSL certificates for HTTPS
4. Configure production domain in manifest.json
5. Deploy to your server

## 🚀 Deployment

### Option 1: Traditional Server

1. Set up Node.js on your server
2. Install MongoDB and Redis
3. Clone the repository
4. Install dependencies
5. Configure environment variables
6. Run with PM2:

```bash
npm install -g pm2
pm2 start server.js --name doall
pm2 save
pm2 startup
```

### Option 2: Docker

```bash
docker build -t doall .
docker run -p 5000:5000 --env-file .env doall
```

### Option 3: Cloud Platforms

- **Heroku**: Ready for deployment
- **AWS**: Use Elastic Beanstalk or EC2
- **Google Cloud**: App Engine or Compute Engine
- **DigitalOcean**: App Platform or Droplets

## 📊 Database Schema

The application uses MongoDB with the following main collections:

- **tenants**: Multi-tenant configuration
- **users**: User accounts and profiles
- **services**: Available services
- **jobs**: Service bookings
- **chat_messages**: Chat history
- **notifications**: User notifications
- **location_tracking**: Real-time location data
- **settlements**: Payment settlements
- **audit_logs**: System audit trail

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 💡 Inspiration

This project is inspired by James Clear's "Atomic Habits" - the idea of making small, consistent improvements that compound over time. The theme reflects the book's emphasis on building systems that enable continuous growth.

## 📞 Support

For support, email support@doall.com or create an issue in the repository.

## 🎯 Roadmap

- [ ] Voice commands integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile apps (React Native)
- [ ] AI-powered service recommendations
- [ ] Subscription plans
- [ ] Referral system

---

**Built with ❤️ using Atomic Habits principles**
