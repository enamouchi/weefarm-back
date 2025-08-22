// src/utils/distance.js
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function findNearestLocation(userLat, userLng, locations) {
  if (!locations || locations.length === 0) {
    return null;
  }

  let nearest = null;
  let shortestDistance = Infinity;

  locations.forEach(location => {
    if (location.lat && location.lng) {
      const distance = calculateDistance(userLat, userLng, location.lat, location.lng);
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearest = {
          ...location,
          distance
        };
      }
    }
  });

  return nearest;
}

function filterByRadius(userLat, userLng, locations, radiusKm) {
  if (!locations || locations.length === 0) {
    return [];
  }

  return locations.filter(location => {
    if (!location.lat || !location.lng) {
      return false;
    }

    const distance = calculateDistance(userLat, userLng, location.lat, location.lng);
    location.distance = distance;
    
    return distance <= radiusKm;
  }).sort((a, b) => a.distance - b.distance);
}

module.exports = {
  calculateDistance,
  findNearestLocation,
  filterByRadius,
  toRadians
};