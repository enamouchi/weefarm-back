// src/controllers/productController.js
const { Product, User, Order, Notification } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

const getMyProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, isActive } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = { farmerId: req.user.id };
  
  if (category) {
    whereClause.category = category;
  }
  
  if (isActive !== undefined) {
    whereClause.isActive = isActive === 'true';
  }

  const { count, rows: products } = await Product.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [{
      model: User,
      as: 'farmer',
      attributes: ['id', 'name', 'phone']
    }]
  });

  res.json({
    message: 'Products retrieved successfully',
    products,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    }
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, price, originalQuantity, unit = 'kg', category } = req.body;
  const farmerId = req.user.id;

  const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

  const product = await Product.create({
    farmerId,
    title: title.trim(),
    description: description ? description.trim() : null,
    price: parseFloat(price),
    originalQuantity: parseInt(originalQuantity),
    remainingQuantity: parseInt(originalQuantity),
    unit: unit.trim(),
    category: category ? category.trim() : null,
    images,
    lat: req.user.lat,
    lng: req.user.lng
  });

  const productWithFarmer = await Product.findByPk(product.id, {
    include: [{
      model: User,
      as: 'farmer',
      attributes: ['id', 'name', 'phone']
    }]
  });

  res.status(201).json({
    message: 'Product created successfully',
    product: productWithFarmer
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { title, description, price, originalQuantity, unit, category } = req.body;

  const product = await Product.findOne({
    where: { id, farmerId: req.user.id }
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found or you do not have permission to edit it' });
  }

  const updateData = {
    title: title || product.title,
    description: description !== undefined ? description : product.description,
    price: price ? parseFloat(price) : product.price,
    unit: unit || product.unit,
    category: category !== undefined ? category : product.category
  };

  if (originalQuantity) {
    const newOriginalQty = parseInt(originalQuantity);
    const difference = newOriginalQty - product.originalQuantity;
    updateData.originalQuantity = newOriginalQty;
    updateData.remainingQuantity = Math.max(0, product.remainingQuantity + difference);
    
    if (updateData.remainingQuantity > 0 && !product.isActive) {
      updateData.isActive = true;
    }
  }

  if (req.files && req.files.length > 0) {
    if (product.images && product.images.length > 0) {
      for (const imagePath of product.images) {
        try {
          const fullPath = path.join(__dirname, '../../', imagePath);
          await fs.unlink(fullPath);
        } catch (error) {
          console.log('Could not delete old image:', error.message);
        }
      }
    }
    updateData.images = req.files.map(file => `/uploads/products/${file.filename}`);
  }

  await product.update(updateData);

  const updatedProduct = await Product.findByPk(product.id, {
    include: [{
      model: User,
      as: 'farmer',
      attributes: ['id', 'name', 'phone']
    }]
  });

  res.json({
    message: 'Product updated successfully',
    product: updatedProduct
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOne({
    where: { id, farmerId: req.user.id }
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found or you do not have permission to delete it' });
  }

  await product.update({ isActive: false });

  if (product.images && product.images.length > 0) {
    for (const imagePath of product.images) {
      try {
        const fullPath = path.join(__dirname, '../../', imagePath);
        await fs.unlink(fullPath);
      } catch (error) {
        console.log('Could not delete image:', error.message);
      }
    }
  }

  res.json({ message: 'Product deleted successfully' });
});

const checkInventory = async (productId) => {
  const product = await Product.findByPk(productId);
  
  if (product && product.remainingQuantity <= 0 && product.isActive) {
    await product.update({ isActive: false });
    
    await Notification.create({
      userId: product.farmerId,
      type: 'out_of_stock',
      title: 'نفاد المخزون',
      body: `نفد مخزون المنتج "${product.title}". يرجى تحديث الكمية المتاحة.`,
      data: { productId: product.id }
    });
  }
};

module.exports = {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  checkInventory
};