// Bookings Module
class Bookings {
  constructor() {
    this.bookings = [];
    this.currentFilter = "all";
  }

  async render(params = {}) {
    const pageContent = document.getElementById("pageContent");

    if (params.serviceId) {
      // Show booking form
      this.renderBookingForm(params.serviceId);
    } else {
      // Show bookings list
      pageContent.innerHTML = `
                <div class="bookings-header mb-4">
                    <h1 class="text-3xl font-bold text-gray-900">My Bookings</h1>
                    <p class="text-gray-600 mt-1">Manage and track your service bookings</p>
                </div>

                <div class="card mb-4">
                    <div class="flex flex-wrap gap-2">
                        <button class="btn btn-primary filter-btn active" data-filter="all">
                            All Bookings
                        </button>
                        <button class="btn btn-outline filter-btn" data-filter="active">
                            Active
                        </button>
                        <button class="btn btn-outline filter-btn" data-filter="completed">
                            Completed
                        </button>
                        <button class="btn btn-outline filter-btn" data-filter="cancelled">
                            Cancelled
                        </button>
                    </div>
                </div>

                <div id="bookingsList">
                    ${this.renderLoadingSkeleton()}
                </div>
            `;

      this.attachEventListeners();
      await this.loadBookings();
    }
  }

  renderLoadingSkeleton() {
    return Array(3)
      .fill(0)
      .map(
        () => `
            <div class="card mb-3 animate-pulse">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div class="flex-1">
                        <div class="bg-gray-200 h-6 rounded mb-2 w-1/3"></div>
                        <div class="bg-gray-200 h-4 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  attachEventListeners() {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".filter-btn").forEach((b) => {
          b.classList.remove("btn-primary", "active");
          b.classList.add("btn-outline");
        });
        btn.classList.remove("btn-outline");
        btn.classList.add("btn-primary", "active");

        this.currentFilter = btn.dataset.filter;
        this.filterBookings();
      });
    });
  }

  async loadBookings() {
    try {
      ui.showLoading();

      const response = await api.getJobs({ sort: "-created_at" });

      if (response.success) {
        this.bookings = response.data.jobs || [];
        this.renderBookings();
      }
    } catch (error) {
      console.error("Failed to load bookings:", error);
      ui.showToast("Failed to load bookings", "error");
    } finally {
      ui.hideLoading();
    }
  }

  filterBookings() {
    this.renderBookings();
  }

  renderBookings() {
    const container = document.getElementById("bookingsList");

    let filteredBookings = this.bookings;

    if (this.currentFilter === "active") {
      filteredBookings = this.bookings.filter((b) =>
        [
          "pending",
          "assigned",
          "accepted",
          "on_the_way",
          "in_progress",
        ].includes(b.status)
      );
    } else if (this.currentFilter === "completed") {
      filteredBookings = this.bookings.filter((b) => b.status === "completed");
    } else if (this.currentFilter === "cancelled") {
      filteredBookings = this.bookings.filter((b) =>
        ["cancelled", "failed"].includes(b.status)
      );
    }

    if (filteredBookings.length === 0) {
      container.innerHTML = `
                <div class="card text-center py-12">
                    <i class="fas fa-calendar-times text-5xl text-gray-300 mb-4"></i>
                    <p class="text-gray-600 mb-4">No bookings found</p>
                    <button class="btn btn-primary" onclick="app.navigateTo('services')">
                        <i class="fas fa-plus"></i>
                        Book a Service
                    </button>
                </div>
            `;
      return;
    }

    container.innerHTML = filteredBookings
      .map(
        (booking) => `
            <div class="card mb-3 cursor-pointer hover:shadow-md transition" onclick="bookings.viewBooking('${
              booking._id
            }')">
                <div class="flex items-start justify-between">
                    <div class="flex items-start gap-4">
                        <div class="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                            <i class="fas ${
                              JOB_STATUS[booking.status]?.icon || "fa-circle"
                            } text-2xl text-white"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">${
                              booking.service_name
                            }</h3>
                            <p class="text-sm text-gray-600">${
                              booking.job_number
                            }</p>
                            <div class="flex items-center gap-3 mt-2">
                                <span class="text-sm text-gray-500">
                                    <i class="fas fa-calendar mr-1"></i>
                                    ${new Date(
                                      booking.schedule.preferred_date
                                    ).toLocaleDateString()}
                                </span>
                                <span class="text-sm text-gray-500">
                                    <i class="fas fa-clock mr-1"></i>
                                    ${
                                      booking.schedule.preferred_time_slot ||
                                      "Flexible"
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold" style="background-color: var(--${
                          JOB_STATUS[booking.status]?.color
                        }); color: white;">
                            ${
                              JOB_STATUS[booking.status]?.label ||
                              booking.status
                            }
                        </span>
                        ${
                          booking.pricing
                            ? `
                            <p class="text-lg font-bold text-primary mt-2">₹${
                              booking.pricing.final_amount ||
                              booking.pricing.base_amount
                            }</p>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  async viewBooking(bookingId) {
    try {
      ui.showLoading();

      const response = await api.getJobById(bookingId);

      if (response.success && response.data) {
        this.showBookingModal(response.data);
      }
    } catch (error) {
      console.error("Failed to load booking details:", error);
      ui.showToast("Failed to load booking details", "error");
    } finally {
      ui.hideLoading();
    }
  }

  showBookingModal(booking) {
    const statusInfo = JOB_STATUS[booking.status] || {};

    const modal = ui.createModal(
      `Booking Details - ${booking.job_number}`,
      `
                <div class="booking-details">
                    <div class="bg-gray-50 p-4 rounded-lg mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-xl font-bold text-gray-900">${
                              booking.service_name
                            }</h3>
                            <span class="px-3 py-1 rounded-full text-sm font-semibold" style="background-color: var(--${
                              statusInfo.color
                            }); color: white;">
                                ${statusInfo.label || booking.status}
                            </span>
                        </div>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="text-gray-600">Date:</span>
                                <p class="font-semibold">${new Date(
                                  booking.schedule.preferred_date
                                ).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <span class="text-gray-600">Time Slot:</span>
                                <p class="font-semibold">${
                                  booking.schedule.preferred_time_slot ||
                                  "Flexible"
                                }</p>
                            </div>
                        </div>
                    </div>

                    ${
                      booking.location
                        ? `
                        <div class="mb-4">
                            <h4 class="font-bold text-gray-900 mb-2">Service Location</h4>
                            <p class="text-gray-700 text-sm">
                                ${booking.location.address.line1}<br>
                                ${booking.location.address.city}, ${booking.location.address.state} - ${booking.location.address.pincode}
                            </p>
                        </div>
                    `
                        : ""
                    }

                    ${
                      booking.pricing
                        ? `
                        <div class="bg-gray-50 p-4 rounded-lg mb-4">
                            <h4 class="font-bold text-gray-900 mb-3">Pricing Details</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Base Amount:</span>
                                    <span class="font-semibold">₹${
                                      booking.pricing.base_amount
                                    }</span>
                                </div>
                                ${
                                  booking.pricing.taxes
                                    ? `
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Taxes:</span>
                                        <span class="font-semibold">₹${booking.pricing.taxes}</span>
                                    </div>
                                `
                                    : ""
                                }
                                ${
                                  booking.pricing.discount
                                    ? `
                                    <div class="flex justify-between text-green-600">
                                        <span>Discount:</span>
                                        <span class="font-semibold">-₹${booking.pricing.discount}</span>
                                    </div>
                                `
                                    : ""
                                }
                                <div class="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Total:</span>
                                    <span class="text-primary">₹${
                                      booking.pricing.final_amount ||
                                      booking.pricing.base_amount
                                    }</span>
                                </div>
                            </div>
                        </div>
                    `
                        : ""
                    }

                    ${
                      booking.provider_id
                        ? `
                        <div class="mb-4">
                            <h4 class="font-bold text-gray-900 mb-2">Service Provider</h4>
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                    ${
                                      booking.provider_id.profile
                                        ?.first_name?.[0] || "P"
                                    }
                                </div>
                                <div>
                                    <p class="font-semibold">${
                                      booking.provider_id.profile?.first_name ||
                                      "Provider"
                                    }</p>
                                    <p class="text-sm text-gray-600">${
                                      booking.provider_id.profile?.phone || ""
                                    }</p>
                                </div>
                            </div>
                        </div>
                    `
                        : ""
                    }

                    <div class="flex gap-2">
                        ${
                          [
                            "pending",
                            "assigned",
                            "accepted",
                            "on_the_way",
                            "in_progress",
                          ].includes(booking.status)
                            ? `
                            <button class="btn btn-outline flex-1" onclick="bookings.trackBooking('${booking._id}')">
                                <i class="fas fa-map-marker-alt"></i>
                                Track
                            </button>
                            <button class="btn btn-outline flex-1" onclick="bookings.contactProvider('${booking._id}')">
                                <i class="fas fa-comments"></i>
                                Chat
                            </button>
                            <button class="btn btn-secondary" onclick="bookings.cancelBooking('${booking._id}')">
                                <i class="fas fa-times"></i>
                                Cancel
                            </button>
                        `
                            : ""
                        }
                        ${
                          booking.status === "completed" && !booking.review
                            ? `
                            <button class="btn btn-primary flex-1" onclick="bookings.rateService('${booking._id}')">
                                <i class="fas fa-star"></i>
                                Rate Service
                            </button>
                        `
                            : ""
                        }
                    </div>
                </div>
            `
    );
  }

  async renderBookingForm(serviceId) {
    try {
      ui.showLoading();

      const response = await api.getServiceById(serviceId);

      if (!response.success || !response.data) {
        throw new Error("Service not found");
      }

      const service = response.data;
      const pageContent = document.getElementById("pageContent");

      pageContent.innerHTML = `
                <div class="max-w-3xl mx-auto">
                    <div class="mb-4">
                        <button class="btn btn-outline" onclick="app.navigateTo('services')">
                            <i class="fas fa-arrow-left"></i>
                            Back to Services
                        </button>
                    </div>

                    <div class="card">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">Book ${
                          service.name
                        }</h2>
                        
                        <form id="bookingForm">
                            <div class="form-group">
                                <label class="form-label">Service Date</label>
                                <input type="date" class="form-input" id="serviceDate" required min="${
                                  new Date().toISOString().split("T")[0]
                                }">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Preferred Time Slot</label>
                                <select class="form-select" id="timeSlot" required>
                                    <option value="">Select time slot</option>
                                    <option value="morning">Morning (8 AM - 12 PM)</option>
                                    <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                                    <option value="evening">Evening (4 PM - 8 PM)</option>
                                    <option value="flexible">Flexible</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Service Address</label>
                                <textarea class="form-textarea" id="serviceAddress" required placeholder="Enter your complete address"></textarea>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Additional Notes (Optional)</label>
                                <textarea class="form-textarea" id="notes" placeholder="Any specific requirements or instructions"></textarea>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                                <h4 class="font-bold text-gray-900 mb-2">Estimated Cost</h4>
                                <div class="flex justify-between text-lg font-bold">
                                    <span>Starting from:</span>
                                    <span class="text-primary">₹${
                                      service.pricing.base_rate
                                    }</span>
                                </div>
                                <p class="text-sm text-gray-600 mt-2">Final cost will be determined by the service provider</p>
                            </div>

                            <button type="submit" class="btn btn-primary w-full">
                                <i class="fas fa-check"></i>
                                Confirm Booking
                            </button>
                        </form>
                    </div>
                </div>
            `;

      document.getElementById("bookingForm").addEventListener("submit", (e) => {
        e.preventDefault();
        this.submitBooking(serviceId);
      });
    } catch (error) {
      console.error("Failed to load booking form:", error);
      ui.showToast("Failed to load booking form", "error");
      app.navigateTo("services");
    } finally {
      ui.hideLoading();
    }
  }

  async submitBooking(serviceId) {
    try {
      ui.showLoading();

      const formData = {
        service_id: serviceId,
        schedule: {
          booking_type: "scheduled",
          preferred_date: document.getElementById("serviceDate").value,
          preferred_time_slot: document.getElementById("timeSlot").value,
        },
        location: {
          address: {
            line1: document.getElementById("serviceAddress").value,
          },
        },
        notes: document.getElementById("notes").value,
      };

      const response = await api.createJob(formData);

      if (response.success) {
        ui.showToast("Booking created successfully!", "success");
        app.navigateTo("bookings");
      } else {
        throw new Error(response.message || "Booking failed");
      }
    } catch (error) {
      console.error("Failed to create booking:", error);
      ui.showToast(error.message || "Failed to create booking", "error");
    } finally {
      ui.hideLoading();
    }
  }

  async cancelBooking(bookingId) {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      ui.showLoading();

      const response = await api.cancelJob(bookingId, "Customer cancelled");

      if (response.success) {
        ui.showToast("Booking cancelled successfully", "success");
        document.querySelectorAll(".modal").forEach((m) => m.remove());
        this.loadBookings();
      }
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      ui.showToast("Failed to cancel booking", "error");
    } finally {
      ui.hideLoading();
    }
  }

  trackBooking(bookingId) {
    app.navigateTo("tracking", { bookingId });
  }

  contactProvider(bookingId) {
    app.navigateTo("chat", { jobId: bookingId });
  }

  rateService(bookingId) {
    ui.showToast("Rating feature coming soon!", "info");
  }
}

// Export
const bookings = new Bookings();
