const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'My POS Store' },
    storeAddress: { type: String, default: '' },
    storePhone: { type: String, default: '' },
    storeEmail: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
    currencySymbol: { type: String, default: '$' },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    receiptFooter: { type: String, default: 'Thank you for your purchase!' },
    lowStockThreshold: { type: Number, default: 10 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);

