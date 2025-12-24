# Geo-Location & Driver On-Demand Implementation

## 🎉 Implementation Complete

This document outlines the complete implementation of geo-location, geo-fencing, GPS tracking, and driver on-demand service features.

---

## 📦 New Components Added

### Backend Components

#### 1. **Models**

- `src/models/ServiceArea.js` - Service area boundaries and pricing zones
- `src/models/GeoAlert.js` - Geo-fencing alerts and notifications

#### 2. **Controllers**

- `src/controllers/geoController.js` - Service area management and geo-calculations
- `src/services/geoAlertService.js` - Real-time geo-alert processing

#### 3. **Routes**

- `src/routes/geo.routes.js` - Geo-location and service area endpoints

#### 4. **Enhanced Controllers**

- `src/controllers/trackingController.js` - Updated with geo-alert integration
- `src/controllers/dispatcherController.js` - Added auto-assignment logic
- `src/controllers/driverServiceController.js` - Enhanced location updates

#### 5. **Model Updates**

- `src/models/Driver.js` - Added GeoJSON location field and service zone reference

### Frontend Components

#### 1. **JavaScript Modules**

- `public/js/geoTracking.js` - GPS tracking and service area management classes
- `public/js/serviceAreaAdmin.js` - Admin interface for service area configuration

#### 2. **HTML Pages**

- `public/service-areas.html` - Service area management dashboard with map integration

---

## 🚀 Features Implemented

### ✅ Geo-Fencing & Service Areas

#### Service Area Types:

1. **Radius-based** - Circular areas defined by center point and radius (e.g., 5km from city center)
2. **Polygon-based** - Custom drawn boundaries on map
3. **City-based** - Entire city boundaries

#### Features:

- Create/Read/Update/Delete service areas
- Zone-based pricing configuration per area
- Active/inactive status management
- Visual map interface for drawing boundaries
- Support for multiple cities (Bangalore, Ranchi, Delhi, etc.)

### ✅ Real-time GPS Tracking

#### Driver Side:

- Automatic GPS permission request
- 30-second update interval (configurable)
- Battery-optimized tracking
- Only tracks during active trips
- High-accuracy positioning with speed and heading

#### Customer Side:

- Real-time driver location on map
- Live route visualization
- ETA calculations and updates every 30 seconds
- Driver approaching notifications

### ✅ Distance Calculation

#### Implementation:

- Haversine formula for accurate distance calculation
- Distance-based pricing
- Considers pickup and drop locations
- Zone-based pricing variations
- Real-time fare estimation

### ✅ Driver Assignment

#### Manual Assignment (Priority 1):

- Dispatcher dashboard shows available drivers
- Filter drivers by status and location
- One-click manual assignment
- Visual map showing driver locations

#### Auto-Assignment:

- Finds nearest available drivers within configurable radius (default 10km)
- Automatically assigns to closest driver
- Same-zone preference (if enabled)
- Distance and ETA calculation
- Automatic trip PIN generation

### ✅ Geo-Alerts & Notifications

#### Alert Types Implemented:

1. **Driver Approaching Pickup** - Triggered when driver is within 2km
2. **Driver Arrived** - Triggered when driver is within 500m
3. **Route Deviation** - Alerts when driver deviates from expected route
4. **ETA Updates** - Continuous ETA updates every 30 seconds
5. **Service Area Entry/Exit** - Notifications when driver enters/leaves service area

#### Notification Methods:

- Browser push notifications (if permitted)
- In-app alerts
- WebSocket real-time updates
- SMS/Email integration ready

---

## 📡 API Endpoints

### Service Area Management

```
POST   /api/v1/geo/service-areas              Create service area (Admin)
GET    /api/v1/geo/service-areas              List all service areas
GET    /api/v1/geo/service-areas/:id          Get specific service area
PUT    /api/v1/geo/service-areas/:id          Update service area (Admin)
DELETE /api/v1/geo/service-areas/:id          Delete service area (Admin)
```

### Geo-Fencing Operations

```
POST   /api/v1/geo/check-service-area         Check if location is within service area
POST   /api/v1/geo/find-nearest-drivers       Find nearest available drivers
POST   /api/v1/geo/calculate-pricing          Calculate pricing based on distance
```

### Geo-Alerts

```
GET    /api/v1/geo/alerts/booking/:booking_id Get alerts for booking
GET    /api/v1/geo/alerts/driver/:driver_id   Get alerts for driver
```

### Location Tracking

```
POST   /api/v1/tracking/update                Update driver location
GET    /api/v1/tracking/live/:job_id          Get live location
GET    /api/v1/tracking/history/:job_id       Get route history
```

### Driver Assignment

```
POST   /api/v1/driver-service/dispatcher/bookings/:id/assign        Manual assignment
POST   /api/v1/driver-service/dispatcher/bookings/:id/auto-assign   Auto-assignment
```

---

## 🎯 Usage Examples

### 1. Create Service Area (Bangalore Central)

```javascript
const serviceArea = {
  name: "Bangalore Central",
  city: "Bangalore",
  zone_code: "BLR-001",
  area_type: "radius",
  boundaries: {
    radius: {
      center: {
        type: "Point",
        coordinates: [77.5946, 12.9716], // [lng, lat]
      },
      radius_km: 5,
    },
  },
  pricing: {
    base_fare: 50,
    per_km_charge: 15,
    per_minute_charge: 2,
    min_fare: 100,
    night_surcharge_percent: 20,
    peak_hour_surcharge_percent: 15,
  },
  max_distance_km: 50,
  active: true,
};

const response = await fetch("/api/v1/geo/service-areas", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_TOKEN",
  },
  body: JSON.stringify(serviceArea),
});
```

### 2. Start GPS Tracking (Driver App)

```javascript
// Request permission first
try {
  await geoTracking.requestPermission();

  // Start tracking for active trip
  geoTracking.startTracking(bookingId, (position, error) => {
    if (position) {
      console.log("Location updated:", position);
      // Update UI with new position
    } else {
      console.error("Tracking error:", error);
    }
  });
} catch (error) {
  alert("Please enable location access to continue");
}
```

### 3. Find Nearest Drivers

```javascript
const drivers = await serviceAreaManager.findNearestDrivers(
  12.9716, // latitude
  77.5946, // longitude
  10 // max distance in km
);

console.log(`Found ${drivers.length} nearby drivers`);
drivers.forEach((d) => {
  console.log(
    `${d.driver.user_id.profile.name} - ${d.distance_km}km away (ETA: ${d.eta_minutes} min)`
  );
});
```

### 4. Auto-Assign Driver

```javascript
const response = await fetch(
  `/api/v1/driver-service/dispatcher/bookings/${bookingId}/auto-assign`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer YOUR_TOKEN",
    },
    body: JSON.stringify({
      max_distance_km: 10,
    }),
  }
);

const { booking, assigned_driver, distance_km } = await response.json();
console.log(
  `Assigned ${assigned_driver.user_id.profile.name} (${distance_km}km away)`
);
```

### 5. Calculate Trip Pricing

```javascript
const pricing = await serviceAreaManager.calculatePricing(
  12.9716,
  77.5946, // pickup
  12.935,
  77.6244 // drop
);

console.log(`
  Distance: ${pricing.distance_km} km
  Estimated Time: ${pricing.estimated_time_minutes} min
  Base Fare: ₹${pricing.pricing.base_fare}
  Distance Charge: ₹${pricing.pricing.distance_charge}
  Time Charge: ₹${pricing.pricing.time_charge}
  GST: ₹${pricing.pricing.gst}
  Total: ₹${pricing.pricing.total}
`);
```

### 6. Listen for Geo-Alerts

```javascript
geoAlerts.onAlert((alert) => {
  console.log("New alert:", alert);
  geoAlerts.showAlertNotification(alert);
});

// Load booking alerts
const alerts = await geoAlerts.getBookingAlerts(bookingId);
console.log(`${alerts.length} alerts for this booking`);
```

---

## 🗺️ Service Area Configuration Guide

### Access Admin Panel

Navigate to: `https://your-domain.com/service-areas.html`

### Steps to Configure:

1. **Click "Add Service Area"**
2. **Enter Basic Details:**

   - Area Name (e.g., "Old Delhi")
   - City (e.g., "Delhi")
   - Zone Code (e.g., "DEL-001")

3. **Select Area Type:**

   - **Radius**: Enter center coordinates and radius
   - **Polygon**: Draw on map by clicking points
   - **City**: Select city from list

4. **Configure Pricing:**

   - Base Fare: Starting price
   - Per KM Charge: Additional per kilometer
   - Per Minute Charge: Time-based charge
   - Night/Peak Surcharges: % increase

5. **Set Distance Limit:**

   - Maximum distance for trips in this zone

6. **Activate and Save**

---

## 📱 Frontend Integration

### Include Required Scripts

```html
<!-- Leaflet for maps -->
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Geo-tracking module -->
<script src="/js/geoTracking.js"></script>
```

### Initialize Tracking in Driver App

```javascript
// Check if location is supported
if (!navigator.geolocation) {
  alert("GPS not supported on this device");
}

// Request permission
await geoTracking.requestPermission();

// Start tracking when trip begins
document.getElementById("startTrip").addEventListener("click", async () => {
  const bookingId = getCurrentBookingId();

  geoTracking.startTracking(bookingId, (position) => {
    updateMapMarker(position);
    updateETADisplay(position);
  });
});

// Stop tracking when trip ends
document.getElementById("endTrip").addEventListener("click", () => {
  geoTracking.stopTracking();
});
```

### Display Driver Location in Customer App

```javascript
// Initialize map
const map = L.map("map").setView([12.9716, 77.5946], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

let driverMarker;

// Listen for location updates via WebSocket
socket.on("driver:location_update", (data) => {
  const { lat, lng } = data.location;

  if (driverMarker) {
    driverMarker.setLatLng([lat, lng]);
  } else {
    driverMarker = L.marker([lat, lng], {
      icon: L.icon({ iconUrl: "/images/driver-icon.png" }),
    }).addTo(map);
  }

  // Update ETA
  const distance = geoTracking.calculateDistance(
    currentLocation.lat,
    currentLocation.lng,
    lat,
    lng
  );
  const eta = geoTracking.calculateETA(distance);
  document.getElementById("eta").textContent = `${eta} min`;
});
```

---

## ⚙️ Configuration

### GPS Update Frequency

Default: 30 seconds (configurable in `geoTracking.js`)

```javascript
geoTracking.updateInterval = 30000; // milliseconds
```

### Alert Thresholds

- Approaching pickup: 2 km
- Driver arrived: 500 m
- Route deviation: 1 km off expected path

Modify in `src/services/geoAlertService.js`

### Auto-Assignment Settings

- Default max distance: 10 km
- Prefer same zone: Yes
- Consider ratings: No (can be enabled)

---

## 🔒 Security & Permissions

### Location Permissions

- Requested only when needed
- Clear explanation to users
- Fallback for denied permissions
- Battery optimization notices

### API Access Control

- Admin-only routes protected
- Driver/Customer role-based access
- Tenant isolation enforced
- Rate limiting on geo queries

---

## 📊 Database Indexes

Optimized for geo-spatial queries:

```javascript
// Driver model
{ "availability.current_location": "2dsphere" }
{ "home_location.coordinates": "2dsphere" }

// LocationTracking model
{ "location": "2dsphere" }
{ "job_id": 1, "timestamp": -1 }

// ServiceArea model
{ "boundaries.polygon": "2dsphere" }
{ "boundaries.radius.center": "2dsphere" }
{ "tenant_id": 1, "active": 1 }

// GeoAlert model
{ "location": "2dsphere" }
{ "booking_id": 1, "alert_type": 1 }
```

---

## 🧪 Testing Checklist

### Service Areas

- [ ] Create radius-based service area
- [ ] Create polygon-based service area
- [ ] Check if location is within service area
- [ ] Update service area pricing
- [ ] Activate/deactivate service areas
- [ ] Delete service area

### GPS Tracking

- [ ] Request GPS permission
- [ ] Start tracking during trip
- [ ] Update location every 30 seconds
- [ ] Stop tracking after trip ends
- [ ] Track only during active trips

### Driver Assignment

- [ ] Manual assignment by dispatcher
- [ ] Auto-assign nearest driver
- [ ] Filter drivers within zone
- [ ] Calculate driver distance and ETA

### Geo-Alerts

- [ ] Alert when driver approaching (2km)
- [ ] Alert when driver arrived (500m)
- [ ] Alert on route deviation
- [ ] ETA updates every 30s
- [ ] Browser notifications working

### Pricing

- [ ] Calculate distance-based pricing
- [ ] Apply zone-based pricing
- [ ] Night surcharge calculation
- [ ] Peak hour surcharge
- [ ] Minimum fare enforcement

---

## 🚨 Troubleshooting

### GPS Not Working

1. Check browser permissions
2. Verify HTTPS connection (required for geolocation)
3. Check device GPS settings
4. Try manual location input

### Auto-Assignment Failing

1. Verify drivers have current_location set
2. Check driver status is "online"
3. Increase max_distance_km parameter
4. Verify service area is active

### Alerts Not Showing

1. Check browser notification permissions
2. Verify WebSocket connection
3. Check booking status
4. Review alert threshold settings

---

## 🎓 Next Steps

### Recommended Enhancements

1. Google Maps/Mapbox integration for better routes
2. Traffic-aware ETA calculations
3. Multi-stop trip support
4. Heat map of driver density
5. Predictive driver positioning
6. Surge pricing based on demand
7. Driver preferred zones
8. Historical route optimization

---

## 📞 Support

For issues or questions:

- Check console logs for errors
- Review API responses
- Test with sample coordinates
- Verify database indexes are created

---

## ✨ Summary

All requested features have been successfully implemented:

✅ **Geo-Fencing Boundaries** - Service areas with radius/polygon support  
✅ **Real-time GPS Tracking** - 30s intervals, battery optimized  
✅ **Distance Calculation** - Haversine formula with pricing  
✅ **Driver Availability Zones** - Zone-based pricing and assignment  
✅ **Auto-Assignment** - Nearest driver with manual override  
✅ **Geo-Alerts** - Approaching, arrived, deviation alerts  
✅ **ETA Calculations** - Real-time updates  
✅ **Route Visualization** - Customer app shows driver path  
✅ **Service Area Management** - Admin UI with map drawing  
✅ **Zone-based Pricing** - Configurable per city/zone

The system is now ready for testing and deployment!
