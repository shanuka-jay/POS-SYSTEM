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
      { name: 'Kamal Perera', email: 'admin@pos.com', password: 'admin123', role: 'admin' },
      { name: 'Nimal Fernando', email: 'manager@pos.com', password: 'manager123', role: 'manager' },
      { name: 'Sanduni Silva', email: 'cashier@pos.com', password: 'cashier123', role: 'cashier' },
    ]);
    console.log('Users created:', users.length);

    // Create products
    const products = await Product.create([
      // Beverages
      { name: 'Elephant House Ginger Beer 400ml', sku: 'BEV-001', category: 'Beverages', price: 120, cost: 70, stock: 150, lowStockThreshold: 20 },
      { name: 'Elephant House Cream Soda 400ml', sku: 'BEV-002', category: 'Beverages', price: 120, cost: 70, stock: 130, lowStockThreshold: 20 },
      { name: 'Coca Cola 330ml', sku: 'BEV-003', category: 'Beverages', price: 150, cost: 90, stock: 200, lowStockThreshold: 30 },
      { name: 'Nestomalt 400g', sku: 'BEV-004', category: 'Beverages', price: 580, cost: 380, stock: 45, lowStockThreshold: 10 },
      { name: 'Milo 200ml Tetra', sku: 'BEV-005', category: 'Beverages', price: 95, cost: 55, stock: 180, lowStockThreshold: 25 },
      { name: 'Water Bottle 1L', sku: 'BEV-006', category: 'Beverages', price: 60, cost: 30, stock: 300, lowStockThreshold: 50 },
      { name: 'Lion Lager 625ml', sku: 'BEV-007', category: 'Beverages', price: 380, cost: 250, stock: 80, lowStockThreshold: 15 },
      { name: 'Portello 400ml', sku: 'BEV-008', category: 'Beverages', price: 120, cost: 70, stock: 110, lowStockThreshold: 20 },

      // Bakery
      { name: 'Tiara Bread 450g', sku: 'BAK-001', category: 'Bakery', price: 190, cost: 130, stock: 50, lowStockThreshold: 10 },
      { name: 'Maliban Cream Crackers 200g', sku: 'BAK-002', category: 'Bakery', price: 210, cost: 140, stock: 70, lowStockThreshold: 15 },
      { name: 'Munchee Biscuit 100g', sku: 'BAK-003', category: 'Bakery', price: 130, cost: 80, stock: 90, lowStockThreshold: 20 },
      { name: 'Ribbon Short Eats 6pk', sku: 'BAK-004', category: 'Bakery', price: 350, cost: 220, stock: 30, lowStockThreshold: 8 },

      // Rice & Staples
      { name: 'Samba Rice 5kg', sku: 'STA-001', category: 'Rice & Staples', price: 1450, cost: 1100, stock: 60, lowStockThreshold: 10 },
      { name: 'Keeri Samba Rice 5kg', sku: 'STA-002', category: 'Rice & Staples', price: 1550, cost: 1150, stock: 55, lowStockThreshold: 10 },
      { name: 'Red Raw Rice 5kg', sku: 'STA-003', category: 'Rice & Staples', price: 1350, cost: 1000, stock: 40, lowStockThreshold: 8 },
      { name: 'Wheat Flour 1kg', sku: 'STA-004', category: 'Rice & Staples', price: 280, cost: 195, stock: 80, lowStockThreshold: 15 },
      { name: 'Dhal 500g', sku: 'STA-005', category: 'Rice & Staples', price: 320, cost: 220, stock: 70, lowStockThreshold: 15 },
      { name: 'Green Gram 500g', sku: 'STA-006', category: 'Rice & Staples', price: 295, cost: 200, stock: 50, lowStockThreshold: 10 },

      // Snacks
      { name: 'Rani Potato Chips 100g', sku: 'SNK-001', category: 'Snacks', price: 175, cost: 110, stock: 100, lowStockThreshold: 20 },
      { name: 'Munchee Marie 200g', sku: 'SNK-002', category: 'Snacks', price: 160, cost: 100, stock: 80, lowStockThreshold: 15 },
      { name: 'Astra Wafer 75g', sku: 'SNK-003', category: 'Snacks', price: 90, cost: 55, stock: 120, lowStockThreshold: 20 },
      { name: 'Kottu Mix 250g', sku: 'SNK-004', category: 'Snacks', price: 220, cost: 140, stock: 60, lowStockThreshold: 12 },

      // Dairy
      { name: 'Anchor Full Cream Milk Powder 400g', sku: 'DAI-001', category: 'Dairy', price: 990, cost: 720, stock: 40, lowStockThreshold: 10 },
      { name: 'Ambewela Fresh Milk 1L', sku: 'DAI-002', category: 'Dairy', price: 290, cost: 200, stock: 35, lowStockThreshold: 8 },
      { name: 'Richlife Yoghurt 80g', sku: 'DAI-003', category: 'Dairy', price: 80, cost: 50, stock: 60, lowStockThreshold: 15 },
      { name: 'Eggs 1 Dozen', sku: 'DAI-004', category: 'Dairy', price: 420, cost: 320, stock: 25, lowStockThreshold: 8 },
      { name: 'Milco Cheese Slice 10pk', sku: 'DAI-005', category: 'Dairy', price: 540, cost: 380, stock: 20, lowStockThreshold: 5 },

      // Spices & Condiments
      { name: 'MD Coconut Milk 400ml', sku: 'SPC-001', category: 'Spices & Condiments', price: 220, cost: 145, stock: 80, lowStockThreshold: 15 },
      { name: 'Larich Chilli Paste 200g', sku: 'SPC-002', category: 'Spices & Condiments', price: 185, cost: 115, stock: 55, lowStockThreshold: 10 },
      { name: 'MD Ketchup 375g', sku: 'SPC-003', category: 'Spices & Condiments', price: 290, cost: 190, stock: 45, lowStockThreshold: 10 },
      { name: 'Ceylon Cinnamon Sticks 50g', sku: 'SPC-004', category: 'Spices & Condiments', price: 180, cost: 100, stock: 40, lowStockThreshold: 10 },
      { name: 'Turmeric Powder 100g', sku: 'SPC-005', category: 'Spices & Condiments', price: 120, cost: 75, stock: 60, lowStockThreshold: 12 },

      // Medicine
      { name: 'Panadol 500mg 10s', sku: 'MED-001', category: 'Medicine', price: 85, cost: 50, stock: 100, lowStockThreshold: 20 },
      { name: 'Vitamin C 500mg 10s', sku: 'MED-002', category: 'Medicine', price: 120, cost: 75, stock: 60, lowStockThreshold: 15 },
      { name: 'ORS Sachets 5s', sku: 'MED-003', category: 'Medicine', price: 75, cost: 40, stock: 80, lowStockThreshold: 20 },
      { name: 'Dettol Antiseptic 100ml', sku: 'MED-004', category: 'Medicine', price: 320, cost: 210, stock: 35, lowStockThreshold: 10 },

      // Household
      { name: 'Sunlight Soap 110g', sku: 'HSH-001', category: 'Household', price: 95, cost: 60, stock: 120, lowStockThreshold: 25 },
      { name: 'Vim Dishwash Powder 500g', sku: 'HSH-002', category: 'Household', price: 290, cost: 190, stock: 55, lowStockThreshold: 12 },
      { name: 'Harpic Toilet Cleaner 500ml', sku: 'HSH-003', category: 'Household', price: 380, cost: 250, stock: 40, lowStockThreshold: 10 },
      { name: 'Clogard Toothpaste 120g', sku: 'HSH-004', category: 'Household', price: 195, cost: 125, stock: 65, lowStockThreshold: 15 },
    ]);
    console.log('Products created:', products.length);

    // Create customers
    const customers = await Customer.create([
      { name: 'Chamari Wickramasinghe', phone: '0771234567', email: 'chamari@gmail.com', totalPurchases: 18, totalSpent: 24500 },
      { name: 'Ruwan Jayasuriya', phone: '0712345678', email: 'ruwan@gmail.com', totalPurchases: 9, totalSpent: 13200 },
      { name: 'Dilani Rajapaksa', phone: '0761234567', email: 'dilani@gmail.com', totalPurchases: 25, totalSpent: 38750 },
      { name: 'Tharaka Bandara', phone: '0751234567', email: 'tharaka@gmail.com', totalPurchases: 6, totalSpent: 6800 },
      { name: 'Priya Gunasekara', phone: '0701234567', email: 'priya@gmail.com', totalPurchases: 34, totalSpent: 51240 },
      { name: 'Suresh Dissanayake', phone: '0779876543', email: 'suresh@gmail.com', totalPurchases: 12, totalSpent: 17890 },
      { name: 'Malini Senanayake', phone: '0714567890', email: 'malini@gmail.com', totalPurchases: 7, totalSpent: 9350 },
    ]);
    console.log('Customers created:', customers.length);

    // Create settings
    await Settings.create({
      storeName: 'Serendib Mart POS',
      storeAddress: '45 Galle Road, Colombo 03, Sri Lanka',
      storePhone: '+94 11 234 5678',
      storeEmail: 'info@serendibmart.lk',
      currency: 'LKR',
      currencySymbol: 'Rs.',
      taxRate: 8,
      receiptFooter: 'Thank you for shopping at Serendib Mart! | ස්තූතියි!',
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
