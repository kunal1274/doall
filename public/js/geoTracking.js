/**
 * GPS Tracking and Geo-Fencing Module
 * Handles real-time location tracking, service area management, and geo-alerts
 */

class GeoTrackingManager {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
    this.isTracking = false;
    this.updateInterval = 30000; // 30 seconds
    this.lastUpdate = null;
    this.tripMode = false;
  }

  /**
   * Request GPS permission from user
   */
  async requestPermission() {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by your browser");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };
          resolve(this.currentPosition);
        },
        (error) => {
          let errorMessage = "Unable to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location permission denied. Please enable location access.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Start tracking location (for active trips)
   */
  startTracking(bookingId, onUpdate) {
    if (this.isTracking) {
      console.log("Tracking already active");
      return;
    }

    this.isTracking = true;
    this.tripMode = true;

    // Watch position continuously
    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();

        // Only update if enough time has passed (30s interval)
        if (!this.lastUpdate || now - this.lastUpdate >= this.updateInterval) {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: new Date(position.timestamp),
          };

          this.lastUpdate = now;

          // Send to server
          try {
            await this.updateLocationOnServer(bookingId);
            if (onUpdate) onUpdate(this.currentPosition);
          } catch (error) {
            console.error("Failed to update location:", error);
          }
        }
      },
      (error) => {
        console.error("Tracking error:", error);
        if (onUpdate) onUpdate(null, error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    console.log("GPS tracking started for booking:", bookingId);
  }

  /**
   * Stop tracking location
   */
  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.tripMode = false;
    this.lastUpdate = null;
    console.log("GPS tracking stopped");
  }

  /**
   * Update location on server
   */
  async updateLocationOnServer(jobId) {
    if (!this.currentPosition) return;

    const response = await fetch("/api/v1/tracking/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        job_id: jobId,
        latitude: this.currentPosition.latitude,
        longitude: this.currentPosition.longitude,
        accuracy: this.currentPosition.accuracy,
        speed: this.currentPosition.speed,
        heading: this.currentPosition.heading,
        status: this.tripMode ? "active" : "idle",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update location");
    }

    return await response.json();
  }

  /**
   * Get current position once
   */
  async getCurrentPosition() {
    return await this.requestPermission();
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  /**
   * Calculate ETA in minutes
   */
  calculateETA(distanceKm, avgSpeedKmh = 40) {
    return Math.round((distanceKm / avgSpeedKmh) * 60);
  }
}

// Service Area Management
class ServiceAreaManager {
  constructor() {
    this.serviceAreas = [];
    this.currentArea = null;
  }

  /**
   * Load all service areas
   */
  async loadServiceAreas() {
    const response = await fetch("/api/v1/geo/service-areas", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load service areas");
    }

    const data = await response.json();
    this.serviceAreas = data.data.service_areas;
    return this.serviceAreas;
  }

  /**
   * Check if location is within service area
   */
  async checkServiceArea(latitude, longitude) {
    const response = await fetch("/api/v1/geo/check-service-area", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) {
      throw new Error("Failed to check service area");
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Find nearest drivers
   */
  async findNearestDrivers(latitude, longitude, maxDistanceKm = 10) {
    const response = await fetch("/api/v1/geo/find-nearest-drivers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        latitude,
        longitude,
        max_distance_km: maxDistanceKm,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to find drivers");
    }

    const data = await response.json();
    return data.data.drivers;
  }

  /**
   * Calculate pricing for a trip
   */
  async calculatePricing(
    pickupLat,
    pickupLng,
    dropLat,
    dropLng,
    serviceAreaId
  ) {
    const response = await fetch("/api/v1/geo/calculate-pricing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        drop_lat: dropLat,
        drop_lng: dropLng,
        service_area_id: serviceAreaId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to calculate pricing");
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Create new service area
   */
  async createServiceArea(areaData) {
    const response = await fetch("/api/v1/geo/service-areas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(areaData),
    });

    if (!response.ok) {
      throw new Error("Failed to create service area");
    }

    const data = await response.json();
    return data.data.service_area;
  }

  /**
   * Update service area
   */
  async updateServiceArea(areaId, updates) {
    const response = await fetch(`/api/v1/geo/service-areas/${areaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update service area");
    }

    const data = await response.json();
    return data.data.service_area;
  }

  /**
   * Delete service area
   */
  async deleteServiceArea(areaId) {
    const response = await fetch(`/api/v1/geo/service-areas/${areaId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete service area");
    }

    return true;
  }
}

// Geo Alert Manager
class GeoAlertManager {
  constructor() {
    this.alerts = [];
    this.listeners = [];
  }

  /**
   * Get alerts for a booking
   */
  async getBookingAlerts(bookingId) {
    const response = await fetch(`/api/v1/geo/alerts/booking/${bookingId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load alerts");
    }

    const data = await response.json();
    this.alerts = data.data.alerts;
    return this.alerts;
  }

  /**
   * Subscribe to alert updates
   */
  onAlert(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify listeners of new alert
   */
  notifyAlert(alert) {
    this.listeners.forEach((callback) => callback(alert));
  }

  /**
   * Show alert notification
   */
  showAlertNotification(alert) {
    // Show browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(alert.title || "Driver Update", {
        body: alert.message,
        icon: "/images/icon-192.png",
        badge: "/images/icon-192.png",
      });
    }

    // Also show in-app notification
    this.showInAppAlert(alert);
  }

  /**
   * Show in-app alert
   */
  showInAppAlert(alert) {
    const alertDiv = document.createElement("div");
    alertDiv.className = "geo-alert";
    alertDiv.innerHTML = `
      <div class="alert-icon">${this.getAlertIcon(alert.alert_type)}</div>
      <div class="alert-content">
        <h4>${this.getAlertTitle(alert.alert_type)}</h4>
        <p>${alert.message}</p>
      </div>
    `;

    document.body.appendChild(alertDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }

  /**
   * Get alert icon based on type
   */
  getAlertIcon(type) {
    const icons = {
      driver_approaching_pickup: "🚗",
      driver_arrived: "✅",
      driver_deviating_route: "⚠️",
      eta_update: "⏱️",
    };
    return icons[type] || "ℹ️";
  }

  /**
   * Get alert title based on type
   */
  getAlertTitle(type) {
    const titles = {
      driver_approaching_pickup: "Driver Approaching",
      driver_arrived: "Driver Arrived",
      driver_deviating_route: "Route Update",
      eta_update: "ETA Update",
    };
    return titles[type] || "Notification";
  }
}

// Export instances
const geoTracking = new GeoTrackingManager();
const serviceAreaManager = new ServiceAreaManager();
const geoAlerts = new GeoAlertManager();

// Request notification permission on load
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}
