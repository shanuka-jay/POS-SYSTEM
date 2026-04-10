const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold;
});

module.exports = mongoose.model('Product', productSchema);

