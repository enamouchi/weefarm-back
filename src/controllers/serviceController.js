// src/controllers/serviceController.js
const { Service } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { calculateDistance } = require('../utils/distance');

const getServices = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    category, 
    name, 
    lat, 
    lng, 
    radius = 50 
  } = req.query;
  
  const offset = (page - 1) * limit;

  const whereClause = { isActive: true };
  
  if (category) {
    whereClause.category = category;
  }

  if (name) {
    whereClause.title = {
      [require('sequelize').Op.like]: `%${name}%`
    };
  }

  let services = await Service.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']]
  });

  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius);

    services = services.filter(service => {
      if (!service.lat || !service.lng) return true;
      
      const distance = calculateDistance(
        userLat, userLng,
        parseFloat(service.lat), parseFloat(service.lng)
      );
      
      service.dataValues.distance = distance;
      return distance <= maxRadius;
    });

    services.sort((a, b) => (a.dataValues.distance || 0) - (b.dataValues.distance || 0));
  }

  const totalItems = services.length;
  const paginatedServices = services.slice(offset, offset + parseInt(limit));

  res.json({
    message: 'Services retrieved successfully',
    services: paginatedServices,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: parseInt(limit)
    }
  });
});

const getServiceDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findOne({
    where: { id, isActive: true }
  });

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  if (req.query.lat && req.query.lng && service.lat && service.lng) {
    const distance = calculateDistance(
      parseFloat(req.query.lat), parseFloat(req.query.lng),
      parseFloat(service.lat), parseFloat(service.lng)
    );
    service.dataValues.distance = distance;
  }

  res.json({
    message: 'Service details retrieved successfully',
    service
  });
});

const getServiceCategories = asyncHandler(async (req, res) => {
  const categories = [
    { key: 'vet', label: 'خدمات بيطرية', description: 'رعاية صحية للحيوانات والماشية' },
    { key: 'equipment_rent', label: 'تأجير معدات', description: 'تأجير الآلات والمعدات الزراعية' },
    { key: 'equipment_buy', label: 'شراء معدات', description: 'بيع الآلات والمعدات الزراعية' },
    { key: 'administration', label: 'خدمات إدارية', description: 'خدمات حكومية وإدارية للمزارعين' }
  ];

  res.json({
    message: 'Service categories retrieved successfully',
    categories
  });
});

module.exports = {
  getServices,
  getServiceDetails,
  getServiceCategories
};