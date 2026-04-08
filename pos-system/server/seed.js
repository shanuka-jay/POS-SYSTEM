const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Settings = require('./models/Settings');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_system');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Settings.deleteMany({});

    // Create users
    const users = await User.create([
      { name: 'Admin User', email: 'admin@pos.com', password: 'admin123', role: 'admin' },
      { name: 'John Manager', email: 'manager@pos.com', password: 'manager123', role: 'manager' },
      { name: 'Jane Cashier', email: 'cashier@pos.com', password: 'cashier123', role: 'cashier' },
    ]);
    console.log('Users created:', users.length);

    // Create products
    const products = await Product.create([
      { name: 'Coca Cola 500ml', sku: 'BEV-001', category: 'Beverages', price: 1.99, cost: 0.80, stock: 150, lowStockThreshold: 20 },
      { name: 'Pepsi 500ml', sku: 'BEV-002', category: 'Beverages', price: 1.99, cost: 0.80, stock: 120, lowStockThreshold: 20 },
      { name: 'Water Bottle 1L', sku: 'BEV-003', category: 'Beverages', price: 0.99, cost: 0.30, stock: 200, lowStockThreshold: 30 },
      { name: 'Orange Juice 1L', sku: 'BEV-004', category: 'Beverages', price: 3.49, cost: 1.50, stock: 8, lowStockThreshold: 10 },
      { name: 'White Bread', sku: 'BAK-001', category: 'Bakery', price: 2.49, cost: 1.00, stock: 45, lowStockThreshold: 10 },
      { name: 'Whole Wheat Bread', sku: 'BAK-002', category: 'Bakery', price: 3.29, cost: 1.40, stock: 30, lowStockThreshold: 10 },
      { name: 'Chocolate Cake Slice', sku: 'BAK-003', category: 'Bakery', price: 4.99, cost: 2.00, stock: 5, lowStockThreshold: 10 },
      { name: 'Potato Chips 150g', sku: 'SNK-001', category: 'Snacks', price: 2.79, cost: 1.00, stock: 80, lowStockThreshold: 15 },
      { name: 'Popcorn Salted', sku: 'SNK-002', category: 'Snacks', price: 1.99, cost: 0.70, stock: 60, lowStockThreshold: 15 },
      { name: 'Mixed Nuts 200g', sku: 'SNK-003', category: 'Snacks', price: 5.99, cost: 3.00, stock: 35, lowStockThreshold: 10 },
      { name: 'Whole Milk 1L', sku: 'DAI-001', category: 'Dairy', price: 1.79, cost: 0.90, stock: 90, lowStockThreshold: 20 },
      { name: 'Cheddar Cheese 250g', sku: 'DAI-002', category: 'Dairy', price: 4.49, cost: 2.50, stock: 40, lowStockThreshold: 10 },
      { name: 'Greek Yogurt 500g', sku: 'DAI-003', category: 'Dairy', price: 3.99, cost: 2.00, stock: 25, lowStockThreshold: 10 },
      { name: 'Eggs 12 Pack', sku: 'DAI-004', category: 'Dairy', price: 3.49, cost: 2.00, stock: 7, lowStockThreshold: 10 },
      { name: 'Paracetamol 500mg', sku: 'MED-001', category: 'Medicine', price: 4.99, cost: 2.00, stock: 50, lowStockThreshold: 15 },
      { name: 'Vitamin C 1000mg', sku: 'MED-002', category: 'Medicine', price: 8.99, cost: 4.00, stock: 30, lowStockThreshold: 10 },
    ]);
    console.log('Products created:', products.length);

    // Create customers
    const customers = await Customer.create([
      { name: 'Alice Johnson', phone: '555-0101', email: 'alice@email.com', totalPurchases: 15, totalSpent: 245.50 },
      { name: 'Bob Smith', phone: '555-0102', email: 'bob@email.com', totalPurchases: 8, totalSpent: 132.20 },
      { name: 'Carol Davis', phone: '555-0103', email: 'carol@email.com', totalPurchases: 22, totalSpent: 389.75 },
      { name: 'David Wilson', phone: '555-0104', email: 'david@email.com', totalPurchases: 5, totalSpent: 67.80 },
      { name: 'Eva Martinez', phone: '555-0105', email: 'eva@email.com', totalPurchases: 31, totalSpent: 512.40 },
    ]);
    console.log('Customers created:', customers.length);

    // Create settings
    await Settings.create({
      storeName: 'QuickMart POS',
      storeAddress: '123 Main Street, Colombo, Sri Lanka',
      storePhone: '+94 11 234 5678',
      storeEmail: 'info@quickmart.lk',
      currency: 'USD',
      currencySymbol: '$',
      taxRate: 8,
      receiptFooter: 'Thank you for shopping at QuickMart!',
      lowStockThreshold: 10,
    });
    console.log('Settings created');

    console.log('\n✅ Seed data inserted successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin:   admin@pos.com   / admin123');
    console.log('  Manager: manager@pos.com / manager123');
    console.log('  Cashier: cashier@pos.com / cashier123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();

