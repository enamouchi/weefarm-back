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
      const locationsPath = path.join(__dirname, '../../assets/data/tunisia_locations.json');
      
      // Debug logging
      console.log('=== LOCATION HELPER DEBUG ===');
      console.log('__dirname:', __dirname);
      console.log('Computed path:', locationsPath);
      console.log('File exists:', fs.existsSync(locationsPath));
      
      if (!fs.existsSync(locationsPath)) {
        console.log('File does not exist! Checking alternative paths...');
        
        // Try alternative paths
        const alt1 = path.join(__dirname, '../assets/data/tunisia_locations.json');
        const alt2 = path.join(__dirname, '../../../assets/data/tunisia_locations.json');
        const alt3 = path.join(process.cwd(), 'assets/data/tunisia_locations.json');
        
        console.log('Alt path 1:', alt1, 'exists:', fs.existsSync(alt1));
        console.log('Alt path 2:', alt2, 'exists:', fs.existsSync(alt2));
        console.log('Alt path 3 (cwd):', alt3, 'exists:', fs.existsSync(alt3));
        
        // Try to use working path
        if (fs.existsSync(alt3)) {
          console.log('Using alternative path 3');
          const rawData = fs.readFileSync(alt3, 'utf8');
          this.locationsData = JSON.parse(rawData);
        } else if (fs.existsSync(alt1)) {
          console.log('Using alternative path 1');
          const rawData = fs.readFileSync(alt1, 'utf8');
          this.locationsData = JSON.parse(rawData);
        } else {
          throw new Error('tunisia_locations.json not found in any expected location');
        }
      } else {
        const rawData = fs.readFileSync(locationsPath, 'utf8');
        this.locationsData = JSON.parse(rawData);
      }
      
      console.log('Tunisia locations loaded successfully');
      console.log('Number of governorates loaded:', this.locationsData?.governorates?.length || 0);
      
      // Log first governorate as sample
      if (this.locationsData?.governorates?.length > 0) {
        console.log('Sample governorate:', JSON.stringify(this.locationsData.governorates[0], null, 2));
      }
      
      console.log('=== END DEBUG ===');
      
    } catch (error) {
      console.error('Error loading Tunisia locations:', error);
      this.locationsData = { governorates: [] };
    }
  }

  getAllGovernoratesWithDelegations() {
    console.log('getAllGovernoratesWithDelegations called');
    console.log('locationsData exists:', !!this.locationsData);
    console.log('governorates exists:', !!this.locationsData?.governorates);
    console.log('governorates length:', this.locationsData?.governorates?.length || 0);
    
    if (!this.locationsData || !this.locationsData.governorates) {
      console.error('Locations data not loaded');
      return [];
    }
    
    return this.locationsData.governorates;
  }

  getGovernorateById(id) {
    if (!this.locationsData || !this.locationsData.governorates) {
      return null;
    }
    
    return this.locationsData.governorates.find(gov => gov.id === parseInt(id));
  }

  getDelegationById(governorateId, delegationId) {
    const governorate = this.getGovernorateById(governorateId);
    if (!governorate || !governorate.delegations) {
      return null;
    }
    
    return governorate.delegations.find(del => del.id === parseInt(delegationId));
  }

  getLocationCoordinates(governorateId, delegationId) {
    try {
      const governorate = this.getGovernorateById(governorateId);
      if (!governorate) {
        console.error(`Governorate not found: ${governorateId}`);
        return null;
      }

      const delegation = this.getDelegationById(governorateId, delegationId);
      if (!delegation) {
        console.error(`Delegation not found: ${delegationId} in governorate ${governorateId}`);
        return null;
      }

      return {
        lat: delegation.lat,
        lng: delegation.lng,
        governorate: governorate.name_en || governorate.name_fr || governorate.name_ar,
        municipality: delegation.name_en || delegation.name_fr || delegation.name_ar,
        governorateId: governorate.id,
        delegationId: delegation.id
      };
    } catch (error) {
      console.error('Error getting location coordinates:', error);
      return null;
    }
  }

  searchLocation(query) {
    if (!this.locationsData || !this.locationsData.governorates) {
      return [];
    }

    const results = [];
    const searchTerm = query.toLowerCase();

    this.locationsData.governorates.forEach(governorate => {
      // Search in governorate names
      const govMatches = this.searchInNames(governorate, searchTerm);
      if (govMatches) {
        results.push({
          type: 'governorate',
          governorate: governorate,
          delegation: null
        });
      }

      // Search in delegation names
      if (governorate.delegations) {
        governorate.delegations.forEach(delegation => {
          const delMatches = this.searchInNames(delegation, searchTerm);
          if (delMatches) {
            results.push({
              type: 'delegation',
              governorate: governorate,
              delegation: delegation
            });
          }
        });
      }
    });

    return results;
  }

  searchInNames(location, searchTerm) {
    const names = [
      location.name_ar || '',
      location.name_fr || '',
      location.name_en || ''
    ];

    return names.some(name => 
      name.toLowerCase().includes(searchTerm)
    );
  }

  // Validate location IDs
  validateLocation(governorateId, delegationId) {
    const governorate = this.getGovernorateById(governorateId);
    if (!governorate) {
      return { valid: false, error: 'Invalid governorate ID' };
    }

    const delegation = this.getDelegationById(governorateId, delegationId);
    if (!delegation) {
      return { valid: false, error: 'Invalid delegation ID for the selected governorate' };
    }

    return { valid: true, governorate, delegation };
  }

  // Get all governorates (without delegations)
  getAllGovernorates() {
    if (!this.locationsData || !this.locationsData.governorates) {
      return [];
    }
    
    return this.locationsData.governorates.map(gov => ({
      id: gov.id,
      name_ar: gov.name_ar,
      name_fr: gov.name_fr,
      name_en: gov.name_en,
      code: gov.code,
      lat: gov.lat,
      lng: gov.lng
    }));
  }

  // Get delegations for a specific governorate
  getDelegationsByGovernorate(governorateId) {
    const governorate = this.getGovernorateById(governorateId);
    if (!governorate || !governorate.delegations) {
      return [];
    }
    
    return governorate.delegations;
  }
}

// Export singleton instance
module.exports = new LocationHelper();