// Driver Bulaao Module - Customer View
class DriverBulaao {
  constructor() {
    this.vehicles = [];
    this.bookings = [];
    this.activeBooking = null;
  }

  async render() {
    const pageContent = document.getElementById("pageContent");
    const user = auth.getUser();

    pageContent.innerHTML = `
            <div class="driver-bulaao-header mb-4">
                <h1 class="text-3xl font-bold text-gray-900">Driver Bulaao</h1>
                <p class="text-gray-600 mt-1">Professional driver service at your command</p>
            </div>

            <!-- Quick Book Section -->
            <div class="card mb-4" style="background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%); color: white;">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold mb-2">Need a Driver?</h2>
                        <p class="opacity-90">Professional drivers for your vehicle</p>
                    </div>
                    <button class="btn" style="background: white; color: var(--primary);" onclick="driverBulaao.showBookingForm()">
                        <i class="fas fa-plus"></i>
                        Book Now
                    </button>
                </div>
            </div>

            <!-- Service Types -->
            <div class="grid grid-cols-4 gap-4 mb-4">
                <div class="card text-center cursor-pointer hover:shadow-lg transition" onclick="driverBulaao.selectService('4hr')">
                    <i class="fas fa-clock text-4xl text-primary mb-2"></i>
                    <h3 class="font-bold text-gray-900">4 Hours</h3>
                    <p class="text-sm text-gray-600">₹800</p>
                    <p class="text-xs text-gray-500 mt-1">Perfect for short trips</p>
                </div>
                <div class="card text-center cursor-pointer hover:shadow-lg transition" onclick="driverBulaao.selectService('8hr')">
                    <i class="fas fa-history text-4xl text-primary mb-2"></i>
                    <h3 class="font-bold text-gray-900">8 Hours</h3>
                    <p class="text-sm text-gray-600">₹1,500</p>
                    <p class="text-xs text-gray-500 mt-1">Full day coverage</p>
                </div>
                <div class="card text-center cursor-pointer hover:shadow-lg transition" onclick="driverBulaao.selectService('fullday')">
                    <i class="fas fa-sun text-4xl text-primary mb-2"></i>
                    <h3 class="font-bold text-gray-900">Full Day</h3>
                    <p class="text-sm text-gray-600">₹2,000</p>
                    <p class="text-xs text-gray-500 mt-1">12+ hours service</p>
                </div>
                <div class="card text-center cursor-pointer hover:shadow-lg transition" onclick="driverBulaao.selectService('outstation')">
                    <i class="fas fa-route text-4xl text-primary mb-2"></i>
                    <h3 class="font-bold text-gray-900">Outstation</h3>
                    <p class="text-sm text-gray-600">₹2,500+</p>
                    <p class="text-xs text-gray-500 mt-1">Long distance trips</p>
                </div>
            </div>

            <!-- My Vehicles -->
            <div class="card mb-4">
                <div class="card-header">
                    <h3 class="card-title">My Vehicles</h3>
                    <button class="btn btn-outline" onclick="driverBulaao.addVehicle()">
                        <i class="fas fa-plus"></i>
                        Add Vehicle
                    </button>
                </div>
                <div id="vehiclesList">
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-car text-4xl mb-3"></i>
                        <p>Loading vehicles...</p>
                    </div>
                </div>
            </div>

            <!-- My Bookings -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">My Bookings</h3>
                    <div class="flex gap-2">
                        <button class="btn btn-sm ${
                          this.bookingFilter === "all"
                            ? "btn-primary"
                            : "btn-outline"
                        }" onclick="driverBulaao.filterBookings('all')">All</button>
                        <button class="btn btn-sm ${
                          this.bookingFilter === "active"
                            ? "btn-primary"
                            : "btn-outline"
                        }" onclick="driverBulaao.filterBookings('active')">Active</button>
                        <button class="btn btn-sm ${
                          this.bookingFilter === "completed"
                            ? "btn-primary"
                            : "btn-outline"
                        }" onclick="driverBulaao.filterBookings('completed')">Completed</button>
                    </div>
                </div>
                <div id="bookingsList">
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-calendar-alt text-4xl mb-3"></i>
                        <p>Loading bookings...</p>
                    </div>
                </div>
            </div>
        `;

    await this.loadVehicles();
    await this.loadBookings();
  }

  selectService(serviceType) {
    this.selectedService = serviceType;
    this.showBookingForm();
  }

  async loadVehicles() {
    try {
      const response = await api.get("/driver-service/customer/vehicles");

      if (response.success) {
        this.vehicles = response.data.vehicles || [];
        this.renderVehicles();
      }
    } catch (error) {
      console.error("Failed to load vehicles:", error);
    }
  }

  renderVehicles() {
    const container = document.getElementById("vehiclesList");

    if (this.vehicles.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-car text-4xl mb-3"></i>
                    <p>No vehicles added yet</p>
                    <button class="btn btn-primary mt-3" onclick="driverBulaao.addVehicle()">
                        <i class="fas fa-plus"></i>
                        Add Your First Vehicle
                    </button>
                </div>
            `;
      return;
    }

    container.innerHTML = `
            <div class="grid grid-cols-3 gap-3">
                ${this.vehicles
                  .map(
                    (vehicle) => `
                    <div class="border border-gray-200 rounded-lg p-4 hover:border-primary transition cursor-pointer">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <h4 class="font-bold text-gray-900">${
                                  vehicle.details.brand
                                } ${vehicle.details.model}</h4>
                                <p class="text-sm text-gray-600">${
                                  vehicle.details.registration_number
                                }</p>
                            </div>
                            <span class="px-2 py-1 rounded text-xs font-semibold bg-${
                              vehicle.status === "active" ? "green" : "gray"
                            }-100 text-${
                      vehicle.status === "active" ? "green" : "gray"
                    }-700">
                                ${vehicle.status}
                            </span>
                        </div>
                        <div class="text-xs text-gray-500">
                            <p>${vehicle.vehicle_type.toUpperCase()} • ${
                      vehicle.details.fuel_type
                    }</p>
                            <p>${vehicle.details.color || ""} • ${
                      vehicle.details.year || ""
                    }</p>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  async loadBookings() {
    try {
      const response = await api.get("/driver-service/customer/bookings");

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

    let filteredBookings = this.bookings;
    if (this.bookingFilter === "active") {
      filteredBookings = this.bookings.filter(
        (b) => !["trip_completed", "closed", "cancelled"].includes(b.status)
      );
    } else if (this.bookingFilter === "completed") {
      filteredBookings = this.bookings.filter((b) =>
        ["trip_completed", "closed"].includes(b.status)
      );
    }

    if (filteredBookings.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-calendar-times text-4xl mb-3"></i>
                    <p>No bookings found</p>
                </div>
            `;
      return;
    }

    container.innerHTML = filteredBookings
      .map(
        (booking) => `
            <div class="border-b border-gray-100 py-4 last:border-0 cursor-pointer hover:bg-gray-50" onclick="driverBulaao.viewBooking('${
              booking._id
            }')">
                <div class="flex items-start justify-between">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center text-white">
                            <i class="fas fa-user-tie text-xl"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900">${
                              booking.booking_number
                            }</h4>
                            <p class="text-sm text-gray-600">${booking.service_type.toUpperCase()} Service</p>
                            <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span><i class="fas fa-calendar mr-1"></i>${new Date(
                                  booking.schedule.scheduled_for
                                ).toLocaleDateString()}</span>
                                <span><i class="fas fa-clock mr-1"></i>${
                                  booking.schedule.preferred_time_slot ||
                                  "Flexible"
                                }</span>
                            </div>
                            ${
                              booking.driver_id
                                ? `
                                <p class="text-sm text-gray-700 mt-2">
                                    <i class="fas fa-user mr-1"></i>
                                    Driver: ${
                                      booking.driver_id.user_id?.profile
                                        ?.first_name || "Assigned"
                                    }
                                </p>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold" style="background-color: var(--primary); color: white;">
                            ${booking.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <p class="text-lg font-bold text-primary mt-2">₹${booking.pricing.final_amount.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  showBookingForm() {
    const modal = ui.createModal(
      "Book a Driver",
      `
                <form id="bookDriverForm">
                    <div class="form-group">
                        <label class="form-label">Select Vehicle</label>
                        <select class="form-select" id="vehicleSelect" required>
                            <option value="">Choose your vehicle</option>
                            ${this.vehicles
                              .map(
                                (v) => `
                                <option value="${v._id}">${v.details.brand} ${v.details.model} - ${v.details.registration_number}</option>
                            `
                              )
                              .join("")}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Service Type</label>
                        <select class="form-select" id="serviceType" required>
                            <option value="4hr" ${
                              this.selectedService === "4hr" ? "selected" : ""
                            }>4 Hours - ₹800</option>
                            <option value="8hr" ${
                              this.selectedService === "8hr" ? "selected" : ""
                            }>8 Hours - ₹1,500</option>
                            <option value="fullday" ${
                              this.selectedService === "fullday"
                                ? "selected"
                                : ""
                            }>Full Day - ₹2,000</option>
                            <option value="outstation" ${
                              this.selectedService === "outstation"
                                ? "selected"
                                : ""
                            }>Outstation - ₹2,500+</option>
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" class="form-input" id="bookingDate" required min="${
                              new Date().toISOString().split("T")[0]
                            }">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Time Slot</label>
                            <select class="form-select" id="timeSlot" required>
                                <option value="morning">Morning (6 AM - 12 PM)</option>
                                <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                                <option value="evening">Evening (6 PM - 12 AM)</option>
                                <option value="night">Night (12 AM - 6 AM)</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Pickup Location</label>
                        <input type="text" class="form-input" id="pickupLocation" required placeholder="Enter pickup address">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Drop Location (Optional)</label>
                        <input type="text" class="form-input" id="dropLocation" placeholder="Enter drop address if known">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Special Instructions (Optional)</label>
                        <textarea class="form-textarea" id="specialInstructions" placeholder="Any specific requirements..."></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary w-full">
                        <i class="fas fa-check"></i>
                        Confirm Booking
                    </button>
                </form>
            `
    );

    document
      .getElementById("bookDriverForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.submitBooking();
      });
  }

  async submitBooking() {
    try {
      ui.showLoading();

      const formData = {
        vehicle_id: document.getElementById("vehicleSelect").value,
        service_type: document.getElementById("serviceType").value,
        schedule: {
          scheduled_for: document.getElementById("bookingDate").value,
          preferred_time_slot: document.getElementById("timeSlot").value,
        },
        locations: {
          pickup: {
            address: document.getElementById("pickupLocation").value,
            lat: 0, // Add geolocation later
            lng: 0,
          },
          drop: {
            address: document.getElementById("dropLocation").value || "",
          },
        },
        notes: {
          customer_notes: document.getElementById("specialInstructions").value,
        },
      };

      const response = await api.post(
        "/driver-service/customer/bookings",
        formData
      );

      if (response.success) {
        ui.showToast("Booking created successfully!", "success");
        document.querySelectorAll(".modal").forEach((m) => m.remove());

        // Show PIN
        ui.showToast(`Your trip PIN: ${response.data.trip_pin}`, "info", 10000);

        await this.loadBookings();
      }
    } catch (error) {
      console.error("Booking failed:", error);
      ui.showToast(error.error || "Booking failed", "error");
    } finally {
      ui.hideLoading();
    }
  }

  addVehicle() {
    const modal = ui.createModal(
      "Add Vehicle",
      `
                <form id="addVehicleForm">
                    <div class="form-group">
                        <label class="form-label">Vehicle Type</label>
                        <select class="form-select" id="vehicleType" required>
                            <option value="car">Car</option>
                            <option value="suv">SUV</option>
                            <option value="sedan">Sedan</option>
                            <option value="hatchback">Hatchback</option>
                            <option value="luxury">Luxury</option>
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="form-group">
                            <label class="form-label">Brand</label>
                            <input type="text" class="form-input" id="brand" required placeholder="e.g., Toyota">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Model</label>
                            <input type="text" class="form-input" id="model" required placeholder="e.g., Innova">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Registration Number</label>
                        <input type="text" class="form-input" id="regNumber" required placeholder="e.g., DL01AB1234">
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="form-group">
                            <label class="form-label">Fuel Type</label>
                            <select class="form-select" id="fuelType" required>
                                <option value="petrol">Petrol</option>
                                <option value="diesel">Diesel</option>
                                <option value="electric">Electric</option>
                                <option value="cng">CNG</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Transmission</label>
                            <select class="form-select" id="transmission" required>
                                <option value="manual">Manual</option>
                                <option value="automatic">Automatic</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary w-full">
                        <i class="fas fa-plus"></i>
                        Add Vehicle
                    </button>
                </form>
            `
    );

    document
      .getElementById("addVehicleForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
          ui.showLoading();

          const vehicleData = {
            vehicle_type: document.getElementById("vehicleType").value,
            details: {
              brand: document.getElementById("brand").value,
              model: document.getElementById("model").value,
              registration_number: document.getElementById("regNumber").value,
              fuel_type: document.getElementById("fuelType").value,
              transmission: document.getElementById("transmission").value,
            },
          };

          const response = await api.post(
            "/driver-service/customer/vehicles",
            vehicleData
          );

          if (response.success) {
            ui.showToast("Vehicle added successfully!", "success");
            document.querySelectorAll(".modal").forEach((m) => m.remove());
            await this.loadVehicles();
          }
        } catch (error) {
          console.error("Failed to add vehicle:", error);
          ui.showToast(error.error || "Failed to add vehicle", "error");
        } finally {
          ui.hideLoading();
        }
      });
  }

  async viewBooking(bookingId) {
    try {
      ui.showLoading();

      const response = await api.get(
        `/driver-service/customer/bookings/${bookingId}`
      );

      if (response.success) {
        this.showBookingDetails(
          response.data.booking,
          response.data.tripSession
        );
      }
    } catch (error) {
      console.error("Failed to load booking details:", error);
      ui.showToast("Failed to load booking details", "error");
    } finally {
      ui.hideLoading();
    }
  }

  showBookingDetails(booking, tripSession) {
    const modal = ui.createModal(
      `Booking ${booking.booking_number}`,
      `
                <div class="booking-details-modal">
                    <!-- Status Banner -->
                    <div class="bg-gradient-to-r from-primary to-primary-light text-white p-4 rounded-lg mb-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-xl font-bold">${booking.status
                                  .replace(/_/g, " ")
                                  .toUpperCase()}</h3>
                                <p class="text-sm opacity-90">${booking.service_type.toUpperCase()} Service</p>
                            </div>
                            ${
                              tripSession && tripSession.trip_pin
                                ? `
                                <div class="text-center">
                                    <p class="text-xs opacity-75">Trip PIN</p>
                                    <p class="text-3xl font-bold">${tripSession.trip_pin}</p>
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>

                    <!-- Driver Info -->
                    ${
                      booking.driver_id
                        ? `
                        <div class="bg-gray-50 p-4 rounded-lg mb-4">
                            <h4 class="font-bold text-gray-900 mb-2">Your Driver</h4>
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                    ${
                                      booking.driver_id.user_id?.profile
                                        ?.first_name?.[0] || "D"
                                    }
                                </div>
                                <div>
                                    <p class="font-semibold">${
                                      booking.driver_id.user_id?.profile
                                        ?.first_name || "Driver"
                                    }</p>
                                    <p class="text-sm text-gray-600">${
                                      booking.driver_id.user_id?.profile
                                        ?.phone || ""
                                    }</p>
                                    <div class="flex items-center gap-1 text-sm">
                                        <i class="fas fa-star text-yellow-500"></i>
                                        <span>${
                                          booking.driver_id.performance
                                            ?.rating_avg || "5.0"
                                        }</span>
                                        <span class="text-gray-400">•</span>
                                        <span>${
                                          booking.driver_id.performance
                                            ?.completed_trips || 0
                                        } trips</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `
                        : '<p class="text-gray-600 mb-4">Driver will be assigned soon...</p>'
                    }

                    <!-- Booking Details -->
                    <div class="space-y-3 mb-4">
                        <div>
                            <p class="text-sm text-gray-600">Schedule</p>
                            <p class="font-semibold">${new Date(
                              booking.schedule.scheduled_for
                            ).toLocaleString()}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Pickup Location</p>
                            <p class="font-semibold">${
                              booking.locations.pickup.address
                            }</p>
                        </div>
                        ${
                          booking.locations.drop?.address
                            ? `
                            <div>
                                <p class="text-sm text-gray-600">Drop Location</p>
                                <p class="font-semibold">${booking.locations.drop.address}</p>
                            </div>
                        `
                            : ""
                        }
                    </div>

                    <!-- Pricing -->
                    <div class="bg-gray-50 p-4 rounded-lg mb-4">
                        <h4 class="font-bold text-gray-900 mb-2">Pricing</h4>
                        <div class="space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span>Base Fare</span>
                                <span>₹${booking.pricing.base_fare}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>GST (18%)</span>
                                <span>₹${booking.pricing.gst}</span>
                            </div>
                            <div class="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                <span>Total</span>
                                <span class="text-primary">₹${
                                  booking.pricing.final_amount
                                }</span>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    ${
                      booking.status === "requested" ||
                      booking.status === "searching_driver"
                        ? `
                        <button class="btn btn-secondary w-full" onclick="driverBulaao.cancelBooking('${booking._id}')">
                            <i class="fas fa-times"></i>
                            Cancel Booking
                        </button>
                    `
                        : ""
                    }
                    ${
                      booking.status === "trip_completed" &&
                      !booking.ratings?.by_customer
                        ? `
                        <button class="btn btn-primary w-full" onclick="driverBulaao.rateDriver('${booking._id}')">
                            <i class="fas fa-star"></i>
                            Rate Driver
                        </button>
                    `
                        : ""
                    }
                </div>
            `
    );
  }

  filterBookings(filter) {
    this.bookingFilter = filter;
    this.renderBookings();
  }
}

// Export
const driverBulaao = new DriverBulaao();
