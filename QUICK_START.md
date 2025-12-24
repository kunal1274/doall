# Doall - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Prerequisites Check

```bash
node --version  # Should be v14+
mongod --version  # Should be v4.4+
redis-server --version  # Should be v6+
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create .env File

Create a `.env` file in the root directory with these essential variables:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/doall
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-this-in-production
```

### 4. Start MongoDB and Redis

```bash
# Terminal 1 - Start MongoDB
mongod

# Terminal 2 - Start Redis
redis-server
```

### 5. Run the Application

```bash
# Terminal 3 - Start the app
npm run dev
```

### 6. Access the Application

Open your browser and go to: `http://localhost:5000`

## 📱 First Login

### Create a Test Account

1. Click "Sign Up" tab
2. Fill in:
   - First Name: `Test`
   - Last Name: `User`
   - Phone: `+919999999999`
   - Password: `test123`
3. Click "Create Account"

### Login

- Phone: `+919999999999`
- Password: `test123`

## 🎨 PWA Installation

### On Desktop (Chrome/Edge)

1. Look for the install icon in the address bar
2. Click "Install Doall"
3. The app will open in its own window

### On Mobile

1. Open in Chrome/Safari
2. Tap the browser menu (three dots)
3. Select "Add to Home Screen"
4. Tap "Add"

## 🧪 Testing Features

### Test Service Booking

1. Navigate to "Services" from sidebar
2. Click on any service
3. Click "Book Now"
4. Fill in the booking form
5. Submit

### Test Real-time Features

1. Open the app in two browser windows
2. Login as different users
3. Book a service in one window
4. See notifications in the other

## 🎯 Key Pages

- **Dashboard**: Overview and quick actions
- **Services**: Browse and book services
- **My Bookings**: View and manage bookings
- **Messages**: Chat with providers
- **Profile**: Update your profile

## 🛠️ Development Commands

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run migrations
npm run migrate:indexes

# Run tests
npm test
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find and kill the process using port 5000
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Error

```bash
# Make sure MongoDB is running
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

### Redis Connection Error

```bash
# Make sure Redis is running
sudo systemctl start redis  # Linux
brew services start redis  # macOS
```

### Can't Register/Login

- Check if MongoDB is running
- Verify MONGODB_URI in .env
- Check server console for errors

## 📚 Next Steps

1. **Customize Theme**: Edit [public/css/styles.css](public/css/styles.css)
2. **Add Services**: Use admin panel to add services
3. **Configure Payments**: Set up Razorpay credentials
4. **Enable SMS**: Configure Twilio for SMS notifications
5. **Set up Email**: Configure SMTP for email notifications

## 💡 Tips

- Use Chrome DevTools for debugging
- Check the Network tab for API calls
- Use Application tab to inspect Service Worker
- View Console for any JavaScript errors

## 🎉 You're Ready!

Start building atomic habits of excellence with Doall!

For detailed documentation, see [FRONTEND_README.md](FRONTEND_README.md)
