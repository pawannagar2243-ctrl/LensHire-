require("dotenv").config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');

const authRoutes = require('./routes/authRoutes');
const cameraRoutes = require('./routes/cameraRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      process.env.ADMIN_URL,
      'https://lenshire-1.onrender.com',
      'https://lenshire.onrender.com',
      'http://localhost:5173',
      'http://localhost:5174',
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Camera Booking API is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/contact', contactRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error',
  });
});

const PORT = process.env.PORT || 5000;

const ensureDefaultAdmins = async () => {
  try {
    const defaults = [
      {
        name: 'Super Admin',
        email: 'superadmin@camerabooking.com',
        phone: '8888888888',
        password: 'superadmin123',
        role: 'super_admin',
      },
      {
        name: 'Admin',
        email: 'admin@camerabooking.com',
        phone: '9999999999',
        password: 'admin123',
        role: 'admin',
      },
    ];

    for (const account of defaults) {
      const exists = await User.findOne({ email: account.email.toLowerCase() });

      if (!exists) {
        await User.create(account);
        console.log(`Created default ${account.role} account: ${account.email}`);
        continue;
      }

      if (exists.role !== account.role) {
        exists.role = account.role;
        await exists.save();
        console.log(`Updated ${account.email} role to ${account.role}`);
      }
    }
  } catch (error) {
    console.error('Failed to ensure default admin accounts:', error.message);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await ensureDefaultAdmins();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
  }
};

startServer();