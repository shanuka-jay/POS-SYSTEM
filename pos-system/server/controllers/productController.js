const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    const filter = { isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (lowStock === 'true') {
      const products = await Product.find(filter);
      const low = products.filter((p) => p.stock <= p.lowStockThreshold);
      return res.json(low);
    }
    const products = await Product.find(filter).sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

