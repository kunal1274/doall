// Main Application
class App {
  constructor() {
    this.currentPage = "dashboard";
    this.pages = {
      dashboard,
      services,
      bookings,
      "driver-bulaao": driverBulaao,
      "driver-dashboard": driverDashboard,
      "dispatcher-dashboard": dispatcherDashboard,
      // Add more page modules here
    };
    this.init();
  }

  async init() {
    // Check authentication
    if (!auth.isAuthenticated()) {
      this.showLoginPage();
      return;
    }

    // Load user profile
    try {
      await auth.loadProfile();
      ui.updateUserInfo(auth.getUser());
      this.setupNavigation();
      this.setupSocketConnection();
      this.loadNotifications();
      this.navigateTo("dashboard");
    } catch (error) {
      console.error("Initialization failed:", error);
      this.showLoginPage();
    } finally {
      ui.hideLoading();
    }
  }

  setupNavigation() {
    // Navigation items
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) {
          this.navigateTo(page);
        }
      });
    });

    // User dropdown items
    document.querySelectorAll(".user-dropdown a[data-page]").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) {
          this.navigateTo(page);
        }
      });
    });

    // Logout button
    document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.logout();
    });
  }

  async navigateTo(page, params = {}) {
    this.currentPage = page;
    ui.setActiveNavItem(page);
    ui.closeSidebar();

    // Render page
    if (this.pages[page]) {
      await this.pages[page].render(params);
    } else {
      this.showNotImplemented(page);
    }
  }

  showNotImplemented(page) {
    const pageContent = document.getElementById("pageContent");
    pageContent.innerHTML = `
            <div class="card text-center py-12">
                <i class="fas fa-construction text-6xl text-gray-300 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">${page
                  .replace(/-/g, " ")
                  .toUpperCase()}</h2>
                <p class="text-gray-600 mb-4">This page is under construction</p>
                <button class="btn btn-primary" onclick="app.navigateTo('dashboard')">
                    <i class="fas fa-home"></i>
                    Back to Dashboard
                </button>
            </div>
        `;
  }

  showLoginPage() {
    document.body.innerHTML = `
            <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div class="max-w-md w-full">
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center gap-3 mb-4">
                            <i class="fas fa-infinity text-5xl text-primary"></i>
                        </div>
                        <h1 class="text-4xl font-bold text-gray-900">Doall</h1>
                        <p class="text-gray-600 mt-2">Build atomic habits of excellence</p>
                    </div>

                    <div class="card">
                        <div class="flex gap-2 mb-6 border-b">
                            <button class="flex-1 pb-3 font-semibold text-primary border-b-2 border-primary" id="loginTab">
                                Login
                            </button>
                            <button class="flex-1 pb-3 font-semibold text-gray-500" id="signupTab">
                                Sign Up
                            </button>
                        </div>

                        <!-- Login Form -->
                        <form id="loginForm">
                            <div class="form-group">
                                <label class="form-label">Phone Number</label>
                                <input type="tel" class="form-input" id="loginPhone" required placeholder="+91 1234567890">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-input" id="loginPassword" required placeholder="Enter your password">
                            </div>

                            <button type="submit" class="btn btn-primary w-full">
                                <i class="fas fa-sign-in-alt"></i>
                                Login
                            </button>
                        </form>

                        <!-- Signup Form -->
                        <form id="signupForm" class="hidden">
                            <div class="grid grid-cols-2 gap-3">
                                <div class="form-group">
                                    <label class="form-label">First Name</label>
                                    <input type="text" class="form-input" id="signupFirstName" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Last Name</label>
                                    <input type="text" class="form-input" id="signupLastName" required>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Phone Number</label>
                                <input type="tel" class="form-input" id="signupPhone" required placeholder="+91 1234567890">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Email (Optional)</label>
                                <input type="email" class="form-input" id="signupEmail" placeholder="your@email.com">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-input" id="signupPassword" required minlength="6">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Confirm Password</label>
                                <input type="password" class="form-input" id="signupPasswordConfirm" required>
                            </div>

                            <button type="submit" class="btn btn-primary w-full">
                                <i class="fas fa-user-plus"></i>
                                Create Account
                            </button>
                        </form>
                    </div>

                    <div class="text-center mt-6 text-sm text-gray-600">
                        <p>"Small changes, remarkable results"</p>
                        <p class="mt-2">- Atomic Habits</p>
                    </div>
                </div>
            </div>

            <div id="toastContainer" class="toast-container"></div>
        `;

    this.setupAuthForms();
    ui.hideLoading();
  }

  setupAuthForms() {
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    loginTab?.addEventListener("click", () => {
      loginTab.classList.add("text-primary", "border-b-2", "border-primary");
      signupTab.classList.remove(
        "text-primary",
        "border-b-2",
        "border-primary"
      );
      signupTab.classList.add("text-gray-500");
      loginForm.classList.remove("hidden");
      signupForm.classList.add("hidden");
    });

    signupTab?.addEventListener("click", () => {
      signupTab.classList.add("text-primary", "border-b-2", "border-primary");
      loginTab.classList.remove("text-primary", "border-b-2", "border-primary");
      loginTab.classList.add("text-gray-500");
      signupForm.classList.remove("hidden");
      loginForm.classList.add("hidden");
    });

    loginForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    signupForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSignup();
    });
  }

  async handleLogin() {
    const phone = document.getElementById("loginPhone").value;
    const password = document.getElementById("loginPassword").value;

    try {
      ui.showLoading();
      await auth.login(phone, password);
      ui.showToast("Login successful!", "success");
      window.location.reload();
    } catch (error) {
      console.error("Login failed:", error);
      ui.showToast(error.message || "Login failed", "error");
    } finally {
      ui.hideLoading();
    }
  }

  async handleSignup() {
    const password = document.getElementById("signupPassword").value;
    const passwordConfirm = document.getElementById(
      "signupPasswordConfirm"
    ).value;

    if (password !== passwordConfirm) {
      ui.showToast("Passwords do not match", "error");
      return;
    }

    const userData = {
      profile: {
        first_name: document.getElementById("signupFirstName").value,
        last_name: document.getElementById("signupLastName").value,
        phone: document.getElementById("signupPhone").value,
        email: document.getElementById("signupEmail").value,
      },
      password,
    };

    try {
      ui.showLoading();
      await auth.register(userData);
      ui.showToast("Account created successfully!", "success");
      window.location.reload();
    } catch (error) {
      console.error("Signup failed:", error);
      ui.showToast(error.message || "Signup failed", "error");
    } finally {
      ui.hideLoading();
    }
  }

  async logout() {
    if (confirm("Are you sure you want to logout?")) {
      await auth.logout();
    }
  }

  setupSocketConnection() {
    try {
      // Initialize Socket.io connection
      this.socket = io({
        auth: {
          token: auth.getToken(),
        },
      });

      // Connection events
      this.socket.on("connect", () => {
        console.log("Socket connected:", this.socket.id);
      });

      this.socket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      // Driver Bulaao events
      this.setupDriverBulaaoEvents();
    } catch (error) {
      console.error("Failed to setup socket connection:", error);
    }
  }

  setupDriverBulaaoEvents() {
    if (!this.socket) return;

    // Booking events
    this.socket.on("booking:created", (data) => {
      console.log("New booking created:", data);
      ui.showToast(`New booking: ${data.booking_number}`, "info");

      // Refresh dispatcher dashboard if active
      if (
        this.currentPage === "dispatcher-dashboard" &&
        window.dispatcherDashboard
      ) {
        dispatcherDashboard.loadDashboardData();
      }
    });

    this.socket.on("booking:assigned", (data) => {
      console.log("Booking assigned:", data);
      ui.showToast(
        `You've been assigned to booking ${data.booking_number}`,
        "success"
      );

      // Refresh driver dashboard if active
      if (this.currentPage === "driver-dashboard" && window.driverDashboard) {
        driverDashboard.checkActiveTrip();
      }
    });

    this.socket.on("booking:cancelled", (data) => {
      console.log("Booking cancelled:", data);
      ui.showToast(`Booking ${data.booking_number} was cancelled`, "warning");

      // Refresh driver dashboard if active
      if (this.currentPage === "driver-dashboard" && window.driverDashboard) {
        driverDashboard.activeTrip = null;
        document.getElementById("activeTripSection").style.display = "none";
      }
    });

    // Driver events
    this.socket.on("driver:en_route", (data) => {
      console.log("Driver en route:", data);
      ui.showToast("Driver is on the way!", "info");
    });

    this.socket.on("driver:availability_changed", (data) => {
      console.log("Driver availability changed:", data);

      // Refresh dispatcher dashboard if active
      if (
        this.currentPage === "dispatcher-dashboard" &&
        window.dispatcherDashboard
      ) {
        dispatcherDashboard.loadDrivers();
      }
    });

    this.socket.on("driver:location_update", (data) => {
      // Update driver location on map (if map is visible)
      if (
        this.currentPage === "dispatcher-dashboard" &&
        window.dispatcherDashboard
      ) {
        // Map update logic can be added here
        console.log("Driver location updated:", data);
      }
    });

    // Trip events
    this.socket.on("trip:started", (data) => {
      console.log("Trip started:", data);
      ui.showToast("Your trip has started!", "success");

      // Update customer view
      if (this.currentPage === "driver-bulaao" && window.driverBulaao) {
        driverBulaao.loadBookings();
      }
    });

    this.socket.on("trip:completed", (data) => {
      console.log("Trip completed:", data);
      ui.showToast("Trip completed successfully!", "success");

      // Update customer view
      if (this.currentPage === "driver-bulaao" && window.driverBulaao) {
        driverBulaao.loadBookings();
      }

      // Update driver dashboard
      if (this.currentPage === "driver-dashboard" && window.driverDashboard) {
        driverDashboard.activeTrip = null;
        document.getElementById("activeTripSection").style.display = "none";
        driverDashboard.loadTodayStats();
      }
    });

    // Notification events
    this.socket.on("notification", (data) => {
      console.log("New notification:", data);
      ui.showToast(data.message, data.type || "info");
      this.loadNotifications();
    });
  }

  async loadNotifications() {
    try {
      const response = await api.getNotifications({ limit: 20 });

      if (response.success) {
        const unreadCount =
          response.data.notifications?.filter((n) => !n.read).length || 0;
        ui.updateNotificationBadge(unreadCount);
        ui.renderNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});

// Handle browser back/forward
window.addEventListener("popstate", () => {
  // Handle navigation state
});

// Handle online/offline status
window.addEventListener("online", () => {
  ui.showToast("You are back online", "success");
});

window.addEventListener("offline", () => {
  ui.showToast("You are offline", "warning");
});

// Export for debugging
window.auth = auth;
window.api = api;
window.ui = ui;
