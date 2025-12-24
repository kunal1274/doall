const ServiceArea = require("../models/ServiceArea");
const DriverBooking = require("../models/DriverBooking");
const Driver = require("../models/Driver");

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate ETA based on distance and average speed
const calculateETA = (distance_km, avg_speed_kmh = 40) => {
  return Math.round((distance_km / avg_speed_kmh) * 60); // in minutes
};

// Create service area
exports.createServiceArea = async (req, res) => {
  try {
    const {
      name,
      city,
      area_type,
      boundaries,
      pricing,
      zone_code,
      max_distance_km,
    } = req.body;

    // Generate zone code if not provided
    const finalZoneCode =
      zone_code || `${city.substring(0, 3).toUpperCase()}-${Date.now()}`;

    const serviceArea = await ServiceArea.create({
      tenant_id: req.tenantId,
      name,
      city,
      zone_code: finalZoneCode,
      area_type,
      boundaries,
      pricing,
      max_distance_km: max_distance_km || 50,
    });

    res.status(201).json({
      success: true,
      data: { service_area: serviceArea },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
};

// Get all service areas
exports.getServiceAreas = async (req, res) => {
  try {
    const { active, city } = req.query;
    const filter = { tenant_id: req.tenantId };

    if (active !== undefined) filter.active = active === "true";
    if (city) filter.city = city;

    const areas = await ServiceArea.find(filter).sort({ city: 1, name: 1 });

    res.json({
      success: true,
      data: { service_areas: areas, count: areas.length },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
};

// Get service area by ID
exports.getServiceAreaById = async (req, res) => {
  try {
    const area = await ServiceArea.findOne({
      _id: req.params.id,
      tenant_id: req.tenantId,
    });

    if (!area) {
      return res.status(404).json({
        success: false,
        error: { message: "Service area not found" },
      });
    }

    res.json({
      success: true,
      data: { service_area: area },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
};

// Update service area
exports.updateServiceArea = async (req, res) => {
  try {
    const area = await ServiceArea.findOneAndUpdate(
      { _id: req.params.id, tenant_id: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!area) {
      return res.status(404).json({
        success: false,
        error: { message: "Service area not found" },
      });
    }

    res.json({
      success: true,
      data: { service_area: area },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
};

// Delete service area
exports.deleteServiceArea = async (req, res) => {
  try {
    const area = await ServiceArea.findOneAndDelete({
      _id: req.params.id,
      tenant_id: req.tenantId,
    });

    if (!area) {
      return res.status(404).json({
        success: false,
        error: { message: "Service area not found" },
      });
    }

    res.json({
      success: true,
      data: { message: "Service area deleted" },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
};

// Check if location is within service area
exports.checkServiceArea = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: { message: "Latitude and longitude required" },
      });
    }

    // Find service areas with polygon boundaries
    const polygonAreas = await ServiceArea.find({
      tenant_id: req.tenantId,
      active: true,
      area_type: "polygon",
      "boundaries.polygon.coordinates": { $exists: true },
    });

    // Find service areas with radius boundaries
    const radiusAreas = await ServiceArea.find({
      tenant_id: req.tenantId,
      active: true,
      area_type: "radius",
      "boundaries.radius.center.coordinates": { $exists: true },
    });

    let matchedAreas = [];

    // Check polygon areas
    for (const area of polygonAreas) {
      const isInside = await ServiceArea.findOne({
        _id: area._id,
        "boundaries.polygon": {
          $geoIntersects: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
          },
        },
      });

      if (isInside) matchedAreas.push(area);
    }

    // Check radius areas
    for (const area of radiusAreas) {
      const [centerLng, centerLat] = area.boundaries.radius.center.coordinates;
      const distance = calculateDistance(
        latitude,
        longitude,
        centerLat,
        centerLng
      );

      if (distance <= area.boundaries.radius.radius_km) {
        matchedAreas.push(area);
      }
    }

    res.json({
      success: true,
      data: {
        in_service_area: matchedAreas.length > 0,
        matched_areas: matchedAreas,
        location: { latitude, longitude },
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
};

// Find nearest available drivers in service area
exports.findNearestDrivers = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      service_area_id,
      max_distance_km = 10,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: { message: "Latitude and longitude required" },
      });
    }

    // Find available drivers
    const drivers = await Driver.find({
      tenant_id: req.tenantId,
      status: "available",
      "current_location.coordinates": { $exists: true },
    }).populate("user_id", "name phone email");

    // Calculate distances and filter
    const nearbyDrivers = drivers
      .map((driver) => {
        const [driverLng, driverLat] = driver.current_location.coordinates;
        const distance = calculateDistance(
          latitude,
          longitude,
          driverLat,
          driverLng
        );
        const eta = calculateETA(distance);

        return {
          driver,
          distance_km: parseFloat(distance.toFixed(2)),
          eta_minutes: eta,
        };
      })
      .filter((d) => d.distance_km <= max_distance_km)
      .sort((a, b) => a.distance_km - b.distance_km);

    res.json({
      success: true,
      data: {
        drivers: nearbyDrivers,
        count: nearbyDrivers.length,
        search_location: { latitude, longitude },
        search_radius_km: max_distance_km,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
};

// Calculate pricing based on distance and service area
exports.calculatePricing = async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, service_area_id } =
      req.body;

    if (!pickup_lat || !pickup_lng) {
      return res.status(400).json({
        success: false,
        error: { message: "Pickup location required" },
      });
    }

    let serviceArea;
    if (service_area_id) {
      serviceArea = await ServiceArea.findOne({
        _id: service_area_id,
        tenant_id: req.tenantId,
        active: true,
      });
    }

    let distance_km = 0;
    let estimated_time_minutes = 0;

    if (drop_lat && drop_lng) {
      distance_km = calculateDistance(
        pickup_lat,
        pickup_lng,
        drop_lat,
        drop_lng
      );
      estimated_time_minutes = calculateETA(distance_km);
    }

    let pricing = {
      base_fare: serviceArea?.pricing?.base_fare || 50,
      per_km_charge: serviceArea?.pricing?.per_km_charge || 15,
      per_minute_charge: serviceArea?.pricing?.per_minute_charge || 2,
    };

    const distance_charge = distance_km * pricing.per_km_charge;
    const time_charge = estimated_time_minutes * pricing.per_minute_charge;
    const subtotal = pricing.base_fare + distance_charge + time_charge;
    const gst = subtotal * 0.05; // 5% GST
    const total = subtotal + gst;

    res.json({
      success: true,
      data: {
        distance_km: parseFloat(distance_km.toFixed(2)),
        estimated_time_minutes,
        pricing: {
          ...pricing,
          distance_charge: parseFloat(distance_charge.toFixed(2)),
          time_charge: parseFloat(time_charge.toFixed(2)),
          subtotal: parseFloat(subtotal.toFixed(2)),
          gst: parseFloat(gst.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          currency: "INR",
        },
        service_area: serviceArea ? serviceArea.name : "Default",
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
};

module.exports.calculateDistance = calculateDistance;
module.exports.calculateETA = calculateETA;
