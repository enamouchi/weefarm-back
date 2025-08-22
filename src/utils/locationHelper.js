// src/utils/locationHelper.js
const fs = require('fs');
const path = require('path');

class LocationHelper {
  constructor() {
    this.locationsData = null;
    this.loadLocations();
  }

  loadLocations() {
    try {
      const filePath = path.join(__dirname, '../../assets/data/tunisia_locations.json');
      const data = fs.readFileSync(filePath, 'utf8');
      this.locationsData = JSON.parse(data);
    } catch (error) {
      console.error('Error loading Tunisia locations data:', error);
      this.locationsData = { governorates: [] };
    }
  }

  getGovernorateById(id) {
    return this.locationsData.governorates.find(gov => gov.id === parseInt(id));
  }

  getDelegationById(governorateId, delegationId) {
    const governorate = this.getGovernorateById(governorateId);
    if (!governorate) return null;
    
    return governorate.delegations.find(del => del.id === parseInt(delegationId));
  }

  getLocationCoordinates(governorateId, delegationId) {
    const delegation = this.getDelegationById(governorateId, delegationId);
    if (delegation && delegation.lat && delegation.lng) {
      return {
        lat: delegation.lat,
        lng: delegation.lng,
        governorate: delegation.name_ar,
        municipality: delegation.name_ar
      };
    }

    // Fallback to governorate coordinates
    const governorate = this.getGovernorateById(governorateId);
    if (governorate && governorate.lat && governorate.lng) {
      return {
        lat: governorate.lat,
        lng: governorate.lng,
        governorate: governorate.name_ar,
        municipality: null
      };
    }

    return null;
  }

  getAllGovernoratesWithDelegations() {
    return this.locationsData.governorates.map(gov => ({
      id: gov.id,
      name_ar: gov.name_ar,
      name_fr: gov.name_fr,
      code: gov.code,
      lat: gov.lat,
      lng: gov.lng,
      delegations: gov.delegations.map(del => ({
        id: del.id,
        name_ar: del.name_ar,
        name_fr: del.name_fr,
        lat: del.lat,
        lng: del.lng
      }))
    }));
  }

  searchLocation(query) {
    const results = [];
    const searchTerm = query.toLowerCase();

    this.locationsData.governorates.forEach(gov => {
      // Search in governorate names
      if (gov.name_ar.includes(searchTerm) || 
          gov.name_fr.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'governorate',
          id: gov.id,
          name_ar: gov.name_ar,
          name_fr: gov.name_fr,
          lat: gov.lat,
          lng: gov.lng
        });
      }

      // Search in delegations
      gov.delegations.forEach(del => {
        if (del.name_ar.includes(searchTerm) || 
            del.name_fr.toLowerCase().includes(searchTerm)) {
          results.push({
            type: 'delegation',
            id: del.id,
            governorate_id: gov.id,
            name_ar: del.name_ar,
            name_fr: del.name_fr,
            governorate_name_ar: gov.name_ar,
            lat: del.lat,
            lng: del.lng
          });
        }
      });
    });

    return results;
  }
}

module.exports = new LocationHelper();