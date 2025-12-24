// Driver Dashboard Module
class DriverDashboard {
  constructor() {
    this.profile = null;
    this.activeTrip = null;
    this.isOnline = false;
    this.updateInterval = null;
  }

  async render() {
    const pageContent = document.getElementById("pageContent");

    pageContent.innerHTML = `
            <div class="driver-dashboard">
                <!-- Header -->
                <div class="driver-header mb-4">
                    <h1 class="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
                    <p class="text-gray-600 mt-1">Your command center for trips and earnings</p>
                </div>

                <!-- Availability Toggle -->
                <div class="card mb-4" style="background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%); color: white;">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-xl font-bold mb-1">You are <span id="statusText">Offline</span></h2>
                            <p class="text-sm opacity-90">Toggle to start receiving trip requests</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="availabilityToggle" onchange="driverDashboard.toggleAvailability()">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-4 gap-4 mb-4">
                    <div class="card text-center">
                        <i class="fas fa-route text-3xl text-primary mb-2"></i>
                        <p class="text-xs text-gray-600 uppercase">Today's Trips</p>
                        <p class="text-2xl font-bold text-gray-900" id="todayTrips">0</p>
                    </div>
                    <div class="card text-center">
                        <i class="fas fa-rupee-sign text-3xl text-green-600 mb-2"></i>
                        <p class="text-xs text-gray-600 uppercase">Today's Earnings</p>
                        <p class="text-2xl font-bold text-green-600" id="todayEarnings">₹0</p>
                    </div>
                    <div class="card text-center">
                        <i class="fas fa-star text-3xl text-yellow-500 mb-2"></i>
                        <p class="text-xs text-gray-600 uppercase">Rating</p>
                        <p class="text-2xl font-bold text-gray-900" id="driverRating">5.0</p>
                    </div>
                    <div class="card text-center">
                        <i class="fas fa-trophy text-3xl text-accent-gold mb-2"></i>
                        <p class="text-xs text-gray-600 uppercase">Total Trips</p>
                        <p class="text-2xl font-bold text-gray-900" id="totalTrips">0</p>
                    </div>
                </div>

                <!-- Active Trip Section -->
                <div id="activeTripSection" class="card mb-4" style="display: none;">
                    <div class="card-header">
                        <h3 class="card-title">Active Trip</h3>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            IN PROGRESS
                        </span>
                    </div>
                    <div id="activeTripDetails"></div>
                </div>

                <!-- Pending Bookings -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h3 class="card-title">Available Bookings</h3>
                        <button class="btn btn-sm btn-outline" onclick="driverDashboard.loadProfile()">
                            <i class="fas fa-sync"></i>
                        </button>
                    </div>
                    <div id="pendingBookings">
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-inbox text-4xl mb-3"></i>
                            <p>Go online to see available bookings</p>
                        </div>
                    </div>
                </div>

                <!-- Recent Trips -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Trips</h3>
                        <a href="#" onclick="app.navigateTo('earnings'); return false;" class="text-primary hover:text-primary-dark">
                            View All <i class="fas fa-arrow-right ml-1"></i>
                        </a>
                    </div>
                    <div id="recentTrips">
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-history text-4xl mb-3"></i>
                            <p>No recent trips</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PIN Input Modal Template (Hidden) -->
            <div id="pinModalTemplate" style="display: none;">
                <div class="text-center mb-4">
                    <i class="fas fa-lock text-5xl text-primary mb-3"></i>
                    <h3 class="text-xl font-bold text-gray-900">Enter Trip PIN</h3>
                    <p class="text-gray-600 mt-2">Ask the customer for their 4-digit PIN</p>
                </div>
                <form id="pinForm">
                    <div class="form-group">
                        <input type="text" class="form-input text-center text-2xl font-bold tracking-widest" 
                               id="tripPinInput" maxlength="4" placeholder="----" 
                               pattern="[0-9]{4}" required autofocus>
                    </div>
                    <button type="submit" class="btn btn-primary w-full">
                        <i class="fas fa-check"></i>
                        Start Trip
                    </button>
                </form>
            </div>
        `;

    await this.loadProfile();
    await this.checkActiveTrip();

    // Start location tracking if online
    if (this.isOnline) {
      this.startLocationTracking();
    }
  }

  async loadProfile() {
    try {
      const response = await api.get("/driver-service/drivers/profile");

      if (response.success) {
        this.profile = response.data.driver;
        this.updateStats();
        this.updateAvailabilityUI();
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  }

  updateStats() {
    if (!this.profile) return;

    // Update stats
    document.getElementById("driverRating").textContent =
      this.profile.performance?.rating_avg?.toFixed(1) || "5.0";
    document.getElementById("totalTrips").textContent =
      this.profile.performance?.completed_trips || "0";

    // Update availability toggle
    this.isOnline = this.profile.availability?.is_available || false;
    document.getElementById("availabilityToggle").checked = this.isOnline;

    // Load today's stats
    this.loadTodayStats();
  }

  async loadTodayStats() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get(
        `/driver-service/drivers/earnings?date=${today}`
      );

      if (response.success) {
        document.getElementById("todayTrips").textContent =
          response.data.earnings.total_trips || "0";
        document.getElementById("todayEarnings").textContent = `₹${(
          response.data.earnings.total_earnings || 0
        ).toLocaleString()}`;
      }
    } catch (error) {
      console.error("Failed to load today stats:", error);
    }
  }

  async toggleAvailability() {
    const toggle = document.getElementById("availabilityToggle");
    const newStatus = toggle.checked;

    try {
      ui.showLoading();

      // Get current location
      const location = await this.getCurrentLocation();

      const response = await api.patch("/driver-service/drivers/availability", {
        is_available: newStatus,
        current_location: location,
      });

      if (response.success) {
        this.isOnline = newStatus;
        this.updateAvailabilityUI();

        if (newStatus) {
          ui.showToast(
            "You are now online and can receive trip requests",
            "success"
          );
          this.startLocationTracking();
        } else {
          ui.showToast("You are now offline", "info");
          this.stopLocationTracking();
        }
      }
    } catch (error) {
      console.error("Failed to update availability:", error);
      toggle.checked = !newStatus; // Revert toggle
      ui.showToast(error.error || "Failed to update availability", "error");
    } finally {
      ui.hideLoading();
    }
  }

  updateAvailabilityUI() {
    const statusText = document.getElementById("statusText");
    if (this.isOnline) {
      statusText.textContent = "Online";
      statusText.className = "text-green-400 font-bold";
    } else {
      statusText.textContent = "Offline";
      statusText.className = "font-bold";
    }
  }

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback location (Delhi)
        resolve({ lat: 28.6139, lng: 77.209 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback location
          resolve({ lat: 28.6139, lng: 77.209 });
        }
      );
    });
  }

  async checkActiveTrip() {
    try {
      const response = await api.get("/driver-service/drivers/active-trip");

      if (response.success && response.data.activeTrip) {
        this.activeTrip = response.data.activeTrip;
        this.showActiveTrip();
      }
    } catch (error) {
      console.error("Failed to check active trip:", error);
    }
  }

  showActiveTrip() {
    const section = document.getElementById("activeTripSection");
    const details = document.getElementById("activeTripDetails");

    if (!this.activeTrip) {
      section.style.display = "none";
      return;
    }

    section.style.display = "block";

    const booking = this.activeTrip;
    details.innerHTML = `
            <div class="space-y-4">
                <!-- Customer Info -->
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                        ${booking.customer_id?.profile?.first_name?.[0] || "C"}
                    </div>
                    <div>
                        <p class="font-bold text-gray-900">${
                          booking.customer_id?.profile?.first_name || "Customer"
                        }</p>
                        <p class="text-sm text-gray-600">${
                          booking.customer_id?.profile?.phone || ""
                        }</p>
                    </div>
                </div>

                <!-- Trip Details -->
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-gray-600">Service Type</p>
                        <p class="font-semibold">${booking.service_type.toUpperCase()}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Booking #</p>
                        <p class="font-semibold">${booking.booking_number}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Pickup</p>
                        <p class="font-semibold">${
                          booking.locations.pickup.address
                        }</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Estimated Earning</p>
                        <p class="font-semibold text-green-600">₹${
                          booking.pricing.final_amount
                        }</p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                    ${
                      booking.status === "driver_assigned"
                        ? `
                        <button class="btn btn-primary flex-1" onclick="driverDashboard.startTrip('${booking._id}')">
                            <i class="fas fa-play"></i>
                            Start Trip
                        </button>
                    `
                        : booking.status === "trip_started"
                        ? `
                        <button class="btn btn-primary flex-1" onclick="driverDashboard.endTrip('${booking._id}')">
                            <i class="fas fa-stop"></i>
                            End Trip
                        </button>
                    `
                        : ""
                    }
                    <button class="btn btn-outline" onclick="driverDashboard.callCustomer('${
                      booking.customer_id?.profile?.phone
                    }')">
                        <i class="fas fa-phone"></i>
                    </button>
                </div>
            </div>
        `;
  }

  async acceptBooking(bookingId) {
    try {
      ui.showLoading();

      const response = await api.post(
        `/driver-service/drivers/bookings/${bookingId}/accept`
      );

      if (response.success) {
        ui.showToast(
          "Booking accepted! Heading to pickup location...",
          "success"
        );
        this.activeTrip = response.data.booking;
        this.showActiveTrip();
      }
    } catch (error) {
      console.error("Failed to accept booking:", error);
      ui.showToast(error.error || "Failed to accept booking", "error");
    } finally {
      ui.hideLoading();
    }
  }

  startTrip(bookingId) {
    // Show PIN input modal
    const modalContent = document.getElementById("pinModalTemplate").innerHTML;
    const modal = ui.createModal("Trip PIN Verification", modalContent);

    document.getElementById("pinForm").addEventListener("submit", async (e) => {
      e.preventDefault();

      const pin = document.getElementById("tripPinInput").value;

      try {
        ui.showLoading();

        const response = await api.post("/driver-service/drivers/trips/start", {
          booking_id: bookingId,
          trip_pin: pin,
        });

        if (response.success) {
          ui.showToast("Trip started successfully!", "success");
          document.querySelectorAll(".modal").forEach((m) => m.remove());

          this.activeTrip = response.data.booking;
          this.showActiveTrip();
        }
      } catch (error) {
        console.error("Failed to start trip:", error);
        ui.showToast(error.error || "Invalid PIN", "error");
      } finally {
        ui.hideLoading();
      }
    });
  }

  async endTrip(bookingId) {
    const confirm = await ui.confirm(
      "End Trip",
      "Are you sure you want to end this trip?"
    );

    if (!confirm) return;

    try {
      ui.showLoading();

      const response = await api.post("/driver-service/drivers/trips/end", {
        booking_id: bookingId,
      });

      if (response.success) {
        ui.showToast("Trip completed successfully!", "success");
        this.activeTrip = null;
        document.getElementById("activeTripSection").style.display = "none";

        // Show earnings
        const earnings = response.data.booking.pricing.final_amount;
        ui.showToast(
          `You earned ₹${earnings.toLocaleString()}!`,
          "success",
          5000
        );

        await this.loadTodayStats();
      }
    } catch (error) {
      console.error("Failed to end trip:", error);
      ui.showToast(error.error || "Failed to end trip", "error");
    } finally {
      ui.hideLoading();
    }
  }

  startLocationTracking() {
    if (this.updateInterval) return;

    // Update location every 30 seconds
    this.updateInterval = setInterval(async () => {
      const location = await this.getCurrentLocation();

      try {
        await api.post("/driver-service/drivers/location/update", {
          location,
          speed: 0, // Add speed tracking if available
          heading: 0,
        });
      } catch (error) {
        console.error("Failed to update location:", error);
      }
    }, 30000);
  }

  stopLocationTracking() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  callCustomer(phone) {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }
}

// Export
const driverDashboard = new DriverDashboard();
