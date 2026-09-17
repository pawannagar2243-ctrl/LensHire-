require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Camera = require('./models/Camera');

const seed = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Camera.deleteMany({}),
  ]);

  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@camerabooking.com',
    phone: '8888888888',
    password: 'superadmin123',
    role: 'super_admin',
  });

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@camerabooking.com',
    phone: '9999999999',
    password: 'admin123',
    role: 'admin',
  });

  const user = await User.create({
    name: 'John Doe',
    email: 'user@example.com',
    phone: '9876543210',
    password: 'user123',
    role: 'user',
  });

  const categoryNames = [
    { name: 'DSLR', description: 'Digital Single-Lens Reflex cameras' },
    { name: 'Mirrorless', description: 'Compact mirrorless interchangeable lens cameras' },
    { name: 'Action Camera', description: 'Rugged cameras for sports and adventure' },
    { name: 'Cinema Camera', description: 'Professional cinema and video cameras' },
    { name: 'Professional Camera', description: 'High-end professional photography gear' },
    { name: 'Camera Lens', description: 'Prime and zoom lenses' },
    { name: 'Accessories', description: 'Tripods, lights, bags and more' },
  ];

  const categories = await Category.insertMany(categoryNames);
  const byName = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  const cameras = [
    {
      name: 'Canon EOS R5',
      brand: 'Canon',
      model: 'EOS R5',
      category: byName.Mirrorless,
      description: 'Full-frame mirrorless powerhouse with 45MP sensor and 8K video.',
      pricePerDay: 3500,
      securityDeposit: 15000,
      images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'],
      specifications: { Sensor: '45MP Full Frame', Video: '8K RAW', ISO: '100-51200' },
      availability: true,
      featured: true,
      rating: 4.8,
      stock: 2,
    },
    {
      name: 'Sony A7 IV',
      brand: 'Sony',
      model: 'ILCE-7M4',
      category: byName.Mirrorless,
      description: 'Versatile full-frame camera ideal for photo and video creators.',
      pricePerDay: 2800,
      securityDeposit: 12000,
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800'],
      specifications: { Sensor: '33MP Full Frame', Video: '4K 60p', Autofocus: '759 points' },
      availability: true,
      featured: true,
      rating: 4.7,
      stock: 3,
    },
    {
      name: 'Nikon D850',
      brand: 'Nikon',
      model: 'D850',
      category: byName.DSLR,
      description: 'Flagship DSLR with exceptional dynamic range and resolution.',
      pricePerDay: 2200,
      securityDeposit: 10000,
      images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800'],
      specifications: { Sensor: '45.7MP FX', Burst: '7 fps', ISO: '64-25600' },
      availability: true,
      featured: false,
      rating: 4.6,
      stock: 2,
    },
    {
      name: 'GoPro Hero 12',
      brand: 'GoPro',
      model: 'Hero 12 Black',
      category: byName['Action Camera'],
      description: 'Waterproof action camera with HyperSmooth stabilization.',
      pricePerDay: 800,
      securityDeposit: 3000,
      images: ['https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800'],
      specifications: { Video: '5.3K60', Waterproof: '10m', Battery: 'Enduro' },
      availability: true,
      featured: true,
      rating: 4.5,
      stock: 5,
    },
    {
      name: 'Blackmagic Pocket 6K',
      brand: 'Blackmagic',
      model: 'Pocket Cinema Camera 6K',
      category: byName['Cinema Camera'],
      description: 'Cinema camera with Super 35 sensor and Blackmagic RAW.',
      pricePerDay: 4000,
      securityDeposit: 20000,
      images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'],
      specifications: { Sensor: 'Super 35', Resolution: '6K', Codec: 'BRAW' },
      availability: true,
      featured: true,
      rating: 4.9,
      stock: 1,
    },
    {
      name: 'Canon RF 24-70mm f/2.8',
      brand: 'Canon',
      model: 'RF 24-70mm F2.8 L IS USM',
      category: byName['Camera Lens'],
      description: 'Professional standard zoom lens with image stabilization.',
      pricePerDay: 1500,
      securityDeposit: 8000,
      images: ['https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800'],
      specifications: { Focal: '24-70mm', Aperture: 'f/2.8', Mount: 'RF' },
      availability: true,
      featured: false,
      rating: 4.8,
      stock: 2,
    },
    {
      name: 'Sony FX3',
      brand: 'Sony',
      model: 'FX3',
      category: byName['Professional Camera'],
      description: 'Compact cinema line camera for professional filmmakers.',
      pricePerDay: 4500,
      securityDeposit: 22000,
      images: ['https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800'],
      specifications: { Sensor: 'Full Frame', Video: '4K 120p', Mount: 'E-mount' },
      availability: true,
      featured: true,
      rating: 4.9,
      stock: 1,
    },
    {
      name: 'DJI Ronin RS 3',
      brand: 'DJI',
      model: 'RS 3',
      category: byName.Accessories,
      description: '3-axis gimbal stabilizer for DSLR and mirrorless cameras.',
      pricePerDay: 900,
      securityDeposit: 4000,
      images: ['https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800'],
      specifications: { Payload: '3kg', Axes: '3-axis', Battery: '12 hours' },
      availability: true,
      featured: false,
      rating: 4.4,
      stock: 3,
    },
  ];

  await Camera.insertMany(cameras);

  console.log('Seed complete!');
  console.log('Super Admin: superadmin@camerabooking.com / superadmin123');
  console.log('Admin: admin@camerabooking.com / admin123');
  console.log('User:  user@example.com / user123');
  console.log(`Created ${categories.length} categories and ${cameras.length} cameras`);

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
