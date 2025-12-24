// Dispatcher Dashboard Module
class DispatcherDashboard {
  constructor() {
    this.bookings = [];
    this.drivers = [];
    this.mapData = {};
    this.selectedBooking = null;
    this.refreshInterval = null;
  }

  async render() {
    const pageContent = document.getElementById("pageContent");

    pageContent.innerHTML = `
            <div class="dispatcher-dashboard">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">Dispatcher Control Center</h1>
                        <p class="text-gray-600 mt-1">Monitor and manage all driver operations</p>
                    </div>
                    <button class="btn btn-outline" onclick="dispatcherDashboard.refresh()">
                        <i class="fas fa-sync"></i>
                        Refresh
                    </button>
                </div>

                <!-- Dashboard Stats -->
                <div class="grid grid-cols-5 gap-4 mb-4">
                    <div class="card text-center">
                        <i class="fas fa-clock text-3xl text-yellow-500 mb-2"></i>
                        <p class="text-xs text-gray-600 uppercase">Pending</p>
                        <p class="text-2xl font-bold text-gray-900" id="statPending">0</p>
                    </div>
                    <div class="card text-center">
                        <i class="fas fa-car text-3xl text-blue-500 mb-2"></i>
                        <p class="text-xs text-gray-600 uppercase">Active</p>
                        <p class="text-2xl font-bold text-gray-900" id="statActive">0</p>
                    </div>
                    <div class="card text-center">
                        <i class="fas fa-check-circle text-3xl text-green-500 mb-2"></i>
                        <p class="text-xs text-gray-600 uppercase">Completed</p>
                        <p class="text-2xl font-bold text-gray-900" id="statCompleted">0</p>
                    </div>
                    <div class="card text-center">
                        <i class="fas fa-user-check text-3xl text-primary mb-2"></i>
                        <p class="text-xs text-gray-600 uppercase">Online Drivers</p>
                        <p class="text-2xl font-bold text-primary" id="statOnlineDrivers">0</p>
                    </div>
                    <div class="card text-center">
                        <i class="fas fa-rupee-sign text-3xl text-accent-gold mb-2"></i>
                        <p class="text-xs text-gray-600 uppercase">Today Revenue</p>
                        <p class="text-2xl font-bold text-accent-gold" id="statRevenue">₹0</p>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-3 gap-4">
                    <!-- Bookings Panel -->
                    <div class="col-span-1">
                        <div class="card" style="max-height: 600px; overflow-y: auto;">
                            <div class="card-header">
                                <h3 class="card-title">Active Bookings</h3>
                                <div class="flex gap-1">
                                    <button class="btn btn-sm ${
                                      this.statusFilter === "all"
                                        ? "btn-primary"
                                        : "btn-outline"
                                    }" 
                                            onclick="dispatcherDashboard.filterByStatus('all')">All</button>
                                    <button class="btn btn-sm ${
                                      this.statusFilter === "pending"
                                        ? "btn-primary"
                                        : "btn-outline"
                                    }" 
                                            onclick="dispatcherDashboard.filterByStatus('pending')">Pending</button>
                                    <button class="btn btn-sm ${
                                      this.statusFilter === "active"
                                        ? "btn-primary"
                                        : "btn-outline"
                                    }" 
                                            onclick="dispatcherDashboard.filterByStatus('active')">Active</button>
                                </div>
                            </div>
                            <div id="bookingsList">
                                <div class="text-center py-8 text-gray-500">
                                    <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
                                    <p>Loading bookings...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Map Panel -->
                    <div class="col-span-2">
                        <div class="card" style="height: 600px;">
                            <div class="card-header">
                                <h3 class="card-title">Live Map</h3>
                                <div class="flex items-center gap-3 text-sm">
                                    <span class="flex items-center gap-1">
                                        <span class="w-3 h-3 rounded-full bg-green-500"></span>
                                        Online
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
                                        Busy
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <span class="w-3 h-3 rounded-full bg-gray-400"></span>
                                        Offline
                                    </span>
                                </div>
                            </div>
                            <div id="mapContainer" class="w-full h-full bg-gray-100 flex items-center justify-center">
                                <div class="text-center text-gray-500">
                                    <i class="fas fa-map-marked-alt text-5xl mb-3"></i>
                                    <p>Map will load here</p>
                                    <p class="text-xs mt-2">Integrate Google Maps or Mapbox for live tracking</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Drivers List -->
                <div class="card mt-4">
                    <div class="card-header">
                        <h3 class="card-title">Available Drivers</h3>
                        <div class="flex gap-2">
                            <button class="btn btn-sm ${
                              this.driverFilter === "all"
                                ? "btn-primary"
                                : "btn-outline"
                            }" 
                                    onclick="dispatcherDashboard.filterDrivers('all')">All</button>
                            <button class="btn btn-sm ${
                              this.driverFilter === "online"
                                ? "btn-primary"
                                : "btn-outline"
                            }" 
                                    onclick="dispatcherDashboard.filterDrivers('online')">Online</button>
                            <button class="btn btn-sm ${
                              this.driverFilter === "busy"
                                ? "btn-primary"
                                : "btn-outline"
                            }" 
                                    onclick="dispatcherDashboard.filterDrivers('busy')">Busy</button>
                        </div>
                    </div>
                    <div id="driversList">
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
                            <p>Loading drivers...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

    this.statusFilter = "all";
    this.driverFilter = "all";

    await this.loadDashboardData();
    this.startAutoRefresh();
  }

  async loadDashboardData() {
    await Promise.all([
      this.loadStats(),
      this.loadBookings(),
      this.loadDrivers(),
    ]);
  }

  async loadStats() {
    try {
      const response = await api.get("/driver-service/dispatcher/stats");

      if (response.success) {
        const stats = response.data.stats;

        document.getElementById("statPending").textContent = stats.pending || 0;
        document.getElementById("statActive").textContent = stats.active || 0;
        document.getElementById("statCompleted").textContent =
          stats.completed_today || 0;
        document.getElementById("statOnlineDrivers").textContent =
          stats.online_drivers || 0;
        document.getElementById("statRevenue").textContent = `₹${(
          stats.today_revenue || 0
        ).toLocaleString()}`;
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }

  async loadBookings() {
    try {
      const params = new URLSearchParams();
      if (this.statusFilter && this.statusFilter !== "all") {
        params.append("status", this.statusFilter);
      }

      const response = await api.get(
        `/driver-service/dispatcher/bookings?${params}`
      );

      if (response.success) {
        this.bookings = response.data.bookings || [];
        this.renderBookings();
      }
    } catch (error) {
      console.error("Failed to load bookings:", error);
    }
  }

  renderBookings() {
    const container = document.getElementById("bookingsList");

    if (this.bookings.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>No bookings found</p>
                </div>
            `;
      return;
    }

    container.innerHTML = this.bookings
      .map(
        (booking) => `
            <div class="border-b border-gray-100 py-3 px-2 last:border-0 cursor-pointer hover:bg-gray-50 ${
              this.selectedBooking?._id === booking._id ? "bg-primary-50" : ""
            }" 
                 onclick="dispatcherDashboard.selectBooking('${booking._id}')">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <h4 class="font-bold text-gray-900 text-sm">${
                          booking.booking_number
                        }</h4>
                        <p class="text-xs text-gray-600">${
                          booking.customer_id?.profile?.first_name || "Customer"
                        }</p>
                    </div>
                    <span class="px-2 py-1 rounded text-xs font-semibold ${this.getStatusColor(
                      booking.status
                    )}">
                        ${booking.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                </div>
                <div class="text-xs text-gray-600">
                    <p><i class="fas fa-map-marker-alt mr-1"></i>${booking.locations.pickup.address.substring(
                      0,
                      40
                    )}...</p>
                    <p class="mt-1"><i class="fas fa-clock mr-1"></i>${new Date(
                      booking.schedule.scheduled_for
                    ).toLocaleString()}</p>
                </div>
                ${
                  !booking.driver_id && booking.status === "searching_driver"
                    ? `
                    <button class="btn btn-sm btn-primary w-full mt-2" onclick="event.stopPropagation(); dispatcherDashboard.assignDriver('${booking._id}')">
                        <i class="fas fa-user-plus"></i>
                        Assign Driver
                    </button>
                `
                    : booking.driver_id
                    ? `
                    <div class="text-xs text-gray-700 mt-2 flex items-center gap-2">
                        <i class="fas fa-user-tie"></i>
                        ${
                          booking.driver_id.user_id?.profile?.first_name ||
                          "Driver"
                        }
                    </div>
                `
                    : ""
                }
            </div>
        `
      )
      .join("");
  }

  getStatusColor(status) {
    const colors = {
      requested: "bg-blue-100 text-blue-700",
      searching_driver: "bg-yellow-100 text-yellow-700",
      driver_assigned: "bg-green-100 text-green-700",
      driver_arrived: "bg-green-200 text-green-800",
      trip_started: "bg-purple-100 text-purple-700",
      trip_completed: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  }

  async loadDrivers() {
    try {
      const params = new URLSearchParams();
      if (this.driverFilter && this.driverFilter !== "all") {
        params.append(
          "availability",
          this.driverFilter === "online" ? "true" : "false"
        );
      }

      const response = await api.get(
        `/driver-service/dispatcher/drivers?${params}`
      );

      if (response.success) {
        this.drivers = response.data.drivers || [];
        this.renderDrivers();
      }
    } catch (error) {
      console.error("Failed to load drivers:", error);
    }
  }

  renderDrivers() {
    const container = document.getElementById("driversList");

    if (this.drivers.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-user-slash text-4xl mb-3"></i>
                    <p>No drivers found</p>
                </div>
            `;
      return;
    }

    container.innerHTML = `
            <div class="grid grid-cols-5 gap-3">
                ${this.drivers
                  .map(
                    (driver) => `
                    <div class="border border-gray-200 rounded-lg p-3 hover:border-primary transition">
                        <div class="flex items-center justify-between mb-2">
                            <div class="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold">
                                ${
                                  driver.user_id?.profile?.first_name?.[0] ||
                                  "D"
                                }
                            </div>
                            <span class="w-3 h-3 rounded-full ${
                              driver.availability?.is_available
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }"></span>
                        </div>
                        <h4 class="font-bold text-gray-900 text-sm">${
                          driver.user_id?.profile?.first_name || "Driver"
                        }</h4>
                        <p class="text-xs text-gray-600">${
                          driver.user_id?.profile?.phone || ""
                        }</p>
                        <div class="flex items-center gap-2 mt-2 text-xs">
                            <span class="flex items-center gap-1">
                                <i class="fas fa-star text-yellow-500"></i>
                                ${
                                  driver.performance?.rating_avg?.toFixed(1) ||
                                  "5.0"
                                }
                            </span>
                            <span class="text-gray-400">•</span>
                            <span>${
                              driver.performance?.completed_trips || 0
                            } trips</span>
                        </div>
                        ${
                          driver.availability?.is_available
                            ? `
                            <button class="btn btn-sm btn-outline w-full mt-2" onclick="dispatcherDashboard.viewDriver('${driver._id}')">
                                View
                            </button>
                        `
                            : `
                            <div class="text-xs text-gray-500 text-center mt-2">Offline</div>
                        `
                        }
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  selectBooking(bookingId) {
    this.selectedBooking = this.bookings.find((b) => b._id === bookingId);
    this.renderBookings();

    // Show booking details in a panel or highlight on map
    if (this.selectedBooking) {
      console.log("Selected booking:", this.selectedBooking);
    }
  }

  assignDriver(bookingId) {
    // Filter available drivers
    const availableDrivers = this.drivers.filter(
      (d) =>
        d.availability?.is_available &&
        d.availability?.current_status !== "on_trip"
    );

    if (availableDrivers.length === 0) {
      ui.showToast("No drivers available at the moment", "warning");
      return;
    }

    const modal = ui.createModal(
      "Assign Driver",
      `
                <div class="mb-4">
                    <p class="text-gray-600 mb-3">Select a driver for booking <strong>${bookingId.substring(
                      0,
                      8
                    )}...</strong></p>
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${availableDrivers
                          .map(
                            (driver) => `
                            <div class="border border-gray-200 rounded-lg p-3 hover:border-primary cursor-pointer transition"
                                 onclick="dispatcherDashboard.confirmDriverAssignment('${bookingId}', '${
                              driver._id
                            }')">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold">
                                        ${
                                          driver.user_id?.profile
                                            ?.first_name?.[0] || "D"
                                        }
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-bold text-gray-900">${
                                          driver.user_id?.profile?.first_name ||
                                          "Driver"
                                        }</h4>
                                        <p class="text-sm text-gray-600">${
                                          driver.user_id?.profile?.phone || ""
                                        }</p>
                                        <div class="flex items-center gap-2 mt-1 text-xs">
                                            <span class="flex items-center gap-1">
                                                <i class="fas fa-star text-yellow-500"></i>
                                                ${
                                                  driver.performance?.rating_avg?.toFixed(
                                                    1
                                                  ) || "5.0"
                                                }
                                            </span>
                                            <span class="text-gray-400">•</span>
                                            <span>${
                                              driver.performance
                                                ?.completed_trips || 0
                                            } trips</span>
                                        </div>
                                    </div>
                                    <i class="fas fa-chevron-right text-gray-400"></i>
                                </div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            `
    );
  }

  async confirmDriverAssignment(bookingId, driverId) {
    try {
      ui.showLoading();

      const response = await api.post(
        `/driver-service/dispatcher/bookings/${bookingId}/assign`,
        {
          driver_id: driverId,
        }
      );

      if (response.success) {
        ui.showToast("Driver assigned successfully!", "success");
        document.querySelectorAll(".modal").forEach((m) => m.remove());

        await this.loadBookings();
        await this.loadStats();
      }
    } catch (error) {
      console.error("Failed to assign driver:", error);
      ui.showToast(error.error || "Failed to assign driver", "error");
    } finally {
      ui.hideLoading();
    }
  }

  filterByStatus(status) {
    this.statusFilter = status;
    this.loadBookings();
  }

  filterDrivers(filter) {
    this.driverFilter = filter;
    this.loadDrivers();
  }

  async refresh() {
    ui.showLoading();
    await this.loadDashboardData();
    ui.hideLoading();
    ui.showToast("Dashboard refreshed", "success");
  }

  startAutoRefresh() {
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 30000);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  viewDriver(driverId) {
    const driver = this.drivers.find((d) => d._id === driverId);
    if (!driver) return;

    const modal = ui.createModal(
      "Driver Details",
      `
                <div class="driver-details-modal">
                    <!-- Driver Header -->
                    <div class="text-center mb-4">
                        <div class="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3">
                            ${driver.user_id?.profile?.first_name?.[0] || "D"}
                        </div>
                        <h3 class="text-xl font-bold text-gray-900">${
                          driver.user_id?.profile?.first_name || "Driver"
                        }</h3>
                        <p class="text-gray-600">${
                          driver.user_id?.profile?.phone || ""
                        }</p>
                        <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                          driver.availability?.is_available
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }">
                            ${
                              driver.availability?.is_available
                                ? "Online"
                                : "Offline"
                            }
                        </span>
                    </div>

                    <!-- Performance Stats -->
                    <div class="grid grid-cols-3 gap-3 mb-4">
                        <div class="text-center p-3 bg-gray-50 rounded-lg">
                            <i class="fas fa-star text-yellow-500 text-2xl mb-1"></i>
                            <p class="text-xs text-gray-600">Rating</p>
                            <p class="font-bold text-gray-900">${
                              driver.performance?.rating_avg?.toFixed(1) ||
                              "5.0"
                            }</p>
                        </div>
                        <div class="text-center p-3 bg-gray-50 rounded-lg">
                            <i class="fas fa-route text-blue-500 text-2xl mb-1"></i>
                            <p class="text-xs text-gray-600">Trips</p>
                            <p class="font-bold text-gray-900">${
                              driver.performance?.completed_trips || 0
                            }</p>
                        </div>
                        <div class="text-center p-3 bg-gray-50 rounded-lg">
                            <i class="fas fa-rupee-sign text-green-500 text-2xl mb-1"></i>
                            <p class="text-xs text-gray-600">Earnings</p>
                            <p class="font-bold text-gray-900">₹${(
                              driver.earnings?.total_earnings || 0
                            ).toLocaleString()}</p>
                        </div>
                    </div>

                    <!-- License Info -->
                    <div class="bg-gray-50 p-4 rounded-lg mb-4">
                        <h4 class="font-bold text-gray-900 mb-2">License Information</h4>
                        <div class="space-y-1 text-sm">
                            <p><span class="text-gray-600">License Number:</span> <span class="font-semibold">${
                              driver.license_details?.license_number || "N/A"
                            }</span></p>
                            <p><span class="text-gray-600">Expiry:</span> <span class="font-semibold">${
                              driver.license_details?.expiry_date
                                ? new Date(
                                    driver.license_details.expiry_date
                                  ).toLocaleDateString()
                                : "N/A"
                            }</span></p>
                            <p><span class="text-gray-600">Verification:</span> 
                                <span class="px-2 py-1 rounded text-xs font-semibold ${
                                  driver.license_details
                                    ?.verification_status === "verified"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }">
                                    ${
                                      driver.license_details
                                        ?.verification_status || "pending"
                                    }
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            `
    );
  }
}

// Export
const dispatcherDashboard = new DispatcherDashboard();
