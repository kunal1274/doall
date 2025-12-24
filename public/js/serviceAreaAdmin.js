/**
 * Service Area Admin - Frontend Logic
 */

let map;
let drawMap;
let drawnItems;
let currentAreaType = "radius";
let editingAreaId = null;
let polygonCoordinates = [];

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  await loadServiceAreas();
  initializeMap();
});

/**
 * Load all service areas
 */
async function loadServiceAreas() {
  try {
    const areas = await serviceAreaManager.loadServiceAreas();
    displayServiceAreas(areas);
  } catch (error) {
    console.error("Failed to load service areas:", error);
    alert("Failed to load service areas");
  }
}

/**
 * Display service areas in list
 */
function displayServiceAreas(areas) {
  const container = document.getElementById("serviceAreasList");

  if (areas.length === 0) {
    container.innerHTML =
      "<p>No service areas configured. Create one to get started.</p>";
    return;
  }

  container.innerHTML = areas
    .map(
      (area) => `
    <div class="service-area-card">
      <div class="area-header">
        <div>
          <h3>${area.name}</h3>
          <p>${area.city} • ${area.zone_code}</p>
        </div>
        <div>
          <span class="area-badge ${
            area.active ? "badge-active" : "badge-inactive"
          }">
            ${area.active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
      
      <div class="pricing-grid">
        <div class="pricing-item">
          <div class="pricing-label">Base Fare</div>
          <div class="pricing-value">₹${area.pricing.base_fare}</div>
        </div>
        <div class="pricing-item">
          <div class="pricing-label">Per KM</div>
          <div class="pricing-value">₹${area.pricing.per_km_charge || 0}</div>
        </div>
        <div class="pricing-item">
          <div class="pricing-label">Per Minute</div>
          <div class="pricing-value">₹${
            area.pricing.per_minute_charge || 0
          }</div>
        </div>
        <div class="pricing-item">
          <div class="pricing-label">Max Distance</div>
          <div class="pricing-value">${area.max_distance_km} km</div>
        </div>
      </div>

      <div style="margin-top: 15px;">
        <strong>Type:</strong> ${area.area_type}
        ${
          area.area_type === "radius"
            ? `<br><strong>Radius:</strong> ${
                area.boundaries.radius?.radius_km || 0
              } km`
            : ""
        }
      </div>

      <div style="margin-top: 15px; display: flex; gap: 10px;">
        <button class="btn btn-primary" onclick="editArea('${
          area._id
        }')">Edit</button>
        <button class="btn btn-danger" onclick="deleteArea('${area._id}', '${
        area.name
      }')">Delete</button>
        <button class="btn btn-secondary" onclick="viewAreaOnMap('${
          area._id
        }')">View on Map</button>
      </div>
    </div>
  `
    )
    .join("");
}

/**
 * Initialize map for visualization
 */
function initializeMap() {
  map = L.map("map").setView([20.5937, 78.9629], 5); // India center

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Load and display all areas on map
  displayAreasOnMap();
}

/**
 * Display all service areas on map
 */
async function displayAreasOnMap() {
  const areas = await serviceAreaManager.loadServiceAreas();

  areas.forEach((area) => {
    if (area.area_type === "radius" && area.boundaries.radius) {
      const [lng, lat] = area.boundaries.radius.center.coordinates;
      const radiusKm = area.boundaries.radius.radius_km;

      L.circle([lat, lng], {
        color: area.active ? "#10b981" : "#ef4444",
        fillColor: area.active ? "#10b981" : "#ef4444",
        fillOpacity: 0.2,
        radius: radiusKm * 1000, // Convert to meters
      }).addTo(map).bindPopup(`
        <strong>${area.name}</strong><br>
        ${area.city}<br>
        Radius: ${radiusKm} km
      `);
    } else if (area.area_type === "polygon" && area.boundaries.polygon) {
      // Convert GeoJSON coordinates to Leaflet format
      const coords = area.boundaries.polygon.coordinates[0].map((coord) => [
        coord[1],
        coord[0],
      ]);

      L.polygon(coords, {
        color: area.active ? "#10b981" : "#ef4444",
        fillColor: area.active ? "#10b981" : "#ef4444",
        fillOpacity: 0.2,
      }).addTo(map).bindPopup(`
        <strong>${area.name}</strong><br>
        ${area.city}
      `);
    }
  });
}

/**
 * Show create modal
 */
function showCreateModal() {
  editingAreaId = null;
  document.getElementById("modalTitle").textContent = "Create Service Area";
  document.getElementById("serviceAreaForm").reset();
  document.getElementById("serviceAreaModal").style.display = "block";
  selectAreaType("radius");
}

/**
 * Close modal
 */
function closeModal() {
  document.getElementById("serviceAreaModal").style.display = "none";
  editingAreaId = null;
}

/**
 * Select area type
 */
function selectAreaType(type) {
  currentAreaType = type;

  // Update button states
  document.querySelectorAll(".area-type-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.closest(".area-type-btn").classList.add("active");

  // Show/hide config sections
  document.getElementById("radiusConfig").style.display =
    type === "radius" ? "block" : "none";
  document.getElementById("polygonConfig").style.display =
    type === "polygon" ? "block" : "none";

  if (type === "polygon" && !drawMap) {
    initializeDrawMap();
  }
}

/**
 * Initialize drawing map
 */
function initializeDrawMap() {
  drawMap = L.map("drawMap").setView([20.5937, 78.9629], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(drawMap);

  drawnItems = new L.FeatureGroup();
  drawMap.addLayer(drawnItems);
}

/**
 * Start drawing polygon
 */
function startDrawing() {
  if (!drawMap) return;

  polygonCoordinates = [];

  drawMap.on("click", (e) => {
    polygonCoordinates.push([e.latlng.lng, e.latlng.lat]);

    // Draw marker
    L.marker(e.latlng).addTo(drawnItems);

    // Draw polygon if we have enough points
    if (polygonCoordinates.length >= 3) {
      drawnItems.clearLayers();
      const coords = polygonCoordinates.map((coord) => [coord[1], coord[0]]);
      L.polygon(coords).addTo(drawnItems);
    }
  });
}

/**
 * Clear drawing
 */
function clearDrawing() {
  if (drawnItems) {
    drawnItems.clearLayers();
  }
  polygonCoordinates = [];
}

/**
 * Pick location on map
 */
function pickLocationOnMap() {
  alert("Click on the map to select center point");
  // Implement map picker logic
}

/**
 * Handle form submission
 */
document
  .getElementById("serviceAreaForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const areaData = {
      name: document.getElementById("areaName").value,
      city: document.getElementById("areaCity").value,
      zone_code: document.getElementById("areaZoneCode").value,
      area_type: currentAreaType,
      max_distance_km: parseInt(document.getElementById("maxDistance").value),
      active: document.getElementById("areaActive").checked,
      pricing: {
        base_fare: parseFloat(document.getElementById("baseFare").value),
        per_km_charge: parseFloat(document.getElementById("perKm").value),
        per_minute_charge: parseFloat(
          document.getElementById("perMinute").value
        ),
        min_fare: parseFloat(document.getElementById("minFare").value),
        night_surcharge_percent: parseFloat(
          document.getElementById("nightSurcharge").value
        ),
        peak_hour_surcharge_percent: parseFloat(
          document.getElementById("peakSurcharge").value
        ),
      },
    };

    // Add boundaries based on type
    if (currentAreaType === "radius") {
      const lat = parseFloat(document.getElementById("centerLat").value);
      const lng = parseFloat(document.getElementById("centerLng").value);
      const radius = parseFloat(document.getElementById("radiusKm").value);

      areaData.boundaries = {
        radius: {
          center: {
            type: "Point",
            coordinates: [lng, lat],
          },
          radius_km: radius,
        },
      };
    } else if (currentAreaType === "polygon") {
      if (polygonCoordinates.length < 3) {
        alert("Please draw a polygon with at least 3 points");
        return;
      }

      // Close the polygon
      const coords = [...polygonCoordinates, polygonCoordinates[0]];

      areaData.boundaries = {
        polygon: {
          type: "Polygon",
          coordinates: [coords],
        },
      };
    }

    try {
      if (editingAreaId) {
        await serviceAreaManager.updateServiceArea(editingAreaId, areaData);
        alert("Service area updated successfully");
      } else {
        await serviceAreaManager.createServiceArea(areaData);
        alert("Service area created successfully");
      }

      closeModal();
      await loadServiceAreas();
      displayAreasOnMap();
    } catch (error) {
      console.error("Failed to save service area:", error);
      alert("Failed to save service area: " + error.message);
    }
  });

/**
 * Edit area
 */
async function editArea(areaId) {
  editingAreaId = areaId;
  document.getElementById("modalTitle").textContent = "Edit Service Area";

  const areas = await serviceAreaManager.loadServiceAreas();
  const area = areas.find((a) => a._id === areaId);

  if (!area) return;

  // Fill form
  document.getElementById("areaName").value = area.name;
  document.getElementById("areaCity").value = area.city;
  document.getElementById("areaZoneCode").value = area.zone_code;
  document.getElementById("maxDistance").value = area.max_distance_km;
  document.getElementById("areaActive").checked = area.active;

  // Pricing
  document.getElementById("baseFare").value = area.pricing.base_fare;
  document.getElementById("perKm").value = area.pricing.per_km_charge || 0;
  document.getElementById("perMinute").value =
    area.pricing.per_minute_charge || 0;
  document.getElementById("minFare").value = area.pricing.min_fare || 0;
  document.getElementById("nightSurcharge").value =
    area.pricing.night_surcharge_percent || 0;
  document.getElementById("peakSurcharge").value =
    area.pricing.peak_hour_surcharge_percent || 0;

  // Area type specific
  selectAreaType(area.area_type);

  if (area.area_type === "radius" && area.boundaries.radius) {
    const [lng, lat] = area.boundaries.radius.center.coordinates;
    document.getElementById("centerLat").value = lat;
    document.getElementById("centerLng").value = lng;
    document.getElementById("radiusKm").value =
      area.boundaries.radius.radius_km;
  }

  document.getElementById("serviceAreaModal").style.display = "block";
}

/**
 * Delete area
 */
async function deleteArea(areaId, areaName) {
  if (!confirm(`Are you sure you want to delete "${areaName}"?`)) {
    return;
  }

  try {
    await serviceAreaManager.deleteServiceArea(areaId);
    alert("Service area deleted successfully");
    await loadServiceAreas();
    displayAreasOnMap();
  } catch (error) {
    console.error("Failed to delete service area:", error);
    alert("Failed to delete service area: " + error.message);
  }
}

/**
 * View area on map
 */
function viewAreaOnMap(areaId) {
  showTab("map");
  // Center map on this area
}

/**
 * Show tab
 */
function showTab(tabName) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.style.display = "none";
  });
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  document.getElementById(`${tabName}-tab`).style.display = "block";
  event.target.classList.add("active");
}

/**
 * Save settings
 */
function saveSettings() {
  const settings = {
    defaultMaxDistance: document.getElementById("defaultMaxDistance").value,
    gpsUpdateFrequency: document.getElementById("gpsUpdateFrequency").value,
    autoAssignEnabled: document.getElementById("autoAssignEnabled").value,
  };

  localStorage.setItem("geoSettings", JSON.stringify(settings));
  alert("Settings saved successfully");
}
