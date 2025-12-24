// UI Manager
class UIManager {
  constructor() {
    this.sidebar = document.getElementById("sidebar");
    this.overlay = document.getElementById("overlay");
    this.menuToggle = document.getElementById("menuToggle");
    this.sidebarClose = document.getElementById("sidebarClose");
    this.notificationBtn = document.getElementById("notificationBtn");
    this.notificationPanel = document.getElementById("notificationPanel");
    this.closeNotificationPanel = document.getElementById(
      "closeNotificationPanel"
    );
    this.userMenuBtn = document.getElementById("userMenuBtn");
    this.userMenu = document.getElementById("userMenu");
    this.loading = document.getElementById("loading");
    this.toastContainer = document.getElementById("toastContainer");

    this.initEventListeners();
  }

  initEventListeners() {
    // Sidebar toggle
    this.menuToggle?.addEventListener("click", () => this.toggleSidebar());
    this.sidebarClose?.addEventListener("click", () => this.closeSidebar());
    this.overlay?.addEventListener("click", () => this.closeAll());

    // Notification panel
    this.notificationBtn?.addEventListener("click", () =>
      this.toggleNotificationPanel()
    );
    this.closeNotificationPanel?.addEventListener("click", () =>
      this.closeNotificationPanel()
    );

    // User menu
    this.userMenuBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleUserMenu();
    });

    document.addEventListener("click", (e) => {
      if (!this.userMenu?.contains(e.target)) {
        this.closeUserMenu();
      }
    });

    // Close sidebar on window resize
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024) {
        this.closeSidebar();
      }
    });
  }

  toggleSidebar() {
    this.sidebar?.classList.toggle("active");
    this.overlay?.classList.toggle("active");
  }

  closeSidebar() {
    this.sidebar?.classList.remove("active");
    this.overlay?.classList.remove("active");
  }

  toggleNotificationPanel() {
    this.notificationPanel?.classList.toggle("active");
    this.overlay?.classList.toggle("active");
  }

  closeNotificationPanel() {
    this.notificationPanel?.classList.remove("active");
    this.overlay?.classList.remove("active");
  }

  toggleUserMenu() {
    this.userMenu?.classList.toggle("active");
  }

  closeUserMenu() {
    this.userMenu?.classList.remove("active");
  }

  closeAll() {
    this.closeSidebar();
    this.closeNotificationPanel();
    this.closeUserMenu();
  }

  showLoading() {
    this.loading?.classList.remove("hidden");
  }

  hideLoading() {
    this.loading?.classList.add("hidden");
  }

  showToast(message, type = "info", duration = APP_CONSTANTS.TOAST_DURATION) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
    };

    const titles = {
      success: "Success",
      error: "Error",
      warning: "Warning",
      info: "Info",
    };

    toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      toast.remove();
    });

    this.toastContainer?.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, duration);
  }

  updateUserInfo(user) {
    const userName = `${user.profile.first_name} ${user.profile.last_name}`;
    const userRole = user.roles?.[0]?.role || "customer";

    // Update top nav
    document.getElementById("userName").textContent = userName;
    document.getElementById("userAvatar").src = user.profile.avatar_url || "";

    // Update sidebar
    document.getElementById("sidebarUserName").textContent = userName;
    document.getElementById("sidebarUserRole").textContent =
      USER_ROLES[userRole] || userRole;
    document.getElementById("sidebarAvatar").src =
      user.profile.avatar_url || "";

    // Show/hide menu sections based on role
    if (user.roles.some((r) => r.role === "provider")) {
      document.getElementById("providerMenu")?.style.removeProperty("display");
    }

    if (user.roles.some((r) => ["admin", "super_admin"].includes(r.role))) {
      document.getElementById("adminMenu")?.style.removeProperty("display");
    }

    // Show Driver Bulaao for customers
    if (user.roles.some((r) => r.role === "customer")) {
      document
        .getElementById("driverBulaaoMenu")
        ?.style.removeProperty("display");
    }

    // Show Driver menu for drivers
    if (user.roles.some((r) => r.role === "driver")) {
      document.getElementById("driverMenu")?.style.removeProperty("display");
    }

    // Show Dispatcher menu for dispatchers
    if (user.roles.some((r) => r.role === "dispatcher")) {
      document
        .getElementById("dispatcherMenu")
        ?.style.removeProperty("display");
    }
  }

  updateNotificationBadge(count) {
    const badge = document.getElementById("notificationBadge");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "block" : "none";
    }
  }

  setActiveNavItem(page) {
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
      if (item.dataset.page === page) {
        item.classList.add("active");
      }
    });
  }

  renderNotifications(notifications) {
    const content = document.getElementById("notificationContent");
    if (!content) return;

    if (!notifications || notifications.length === 0) {
      content.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
      return;
    }

    content.innerHTML = notifications
      .map(
        (notif) => `
            <div class="notification-item ${
              notif.read ? "read" : "unread"
            }" data-id="${notif._id}">
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notif.type)}"></i>
                </div>
                <div class="notification-content">
                    <h4>${notif.title}</h4>
                    <p>${notif.message}</p>
                    <span class="notification-time">${this.formatTime(
                      notif.created_at
                    )}</span>
                </div>
            </div>
        `
      )
      .join("");
  }

  getNotificationIcon(type) {
    const icons = {
      job_created: "fa-calendar-plus",
      job_assigned: "fa-user-check",
      job_status: "fa-info-circle",
      payment: "fa-credit-card",
      message: "fa-comment",
      system: "fa-bell",
    };
    return icons[type] || "fa-bell";
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  }

  createModal(title, content) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

    const closeBtn = modal.querySelector(".modal-close");
    const overlay = modal.querySelector(".modal-overlay");

    const closeModal = () => modal.remove();
    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", closeModal);

    document.body.appendChild(modal);
    return modal;
  }

  confirm(title, message) {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className = "modal";
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>${title}</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: flex-end; padding: 1rem;">
            <button class="btn btn-outline" id="confirmCancel">Cancel</button>
            <button class="btn btn-primary" id="confirmOk">Confirm</button>
          </div>
        </div>
      `;

      const closeModal = (result) => {
        modal.remove();
        resolve(result);
      };

      modal
        .querySelector("#confirmOk")
        .addEventListener("click", () => closeModal(true));
      modal
        .querySelector("#confirmCancel")
        .addEventListener("click", () => closeModal(false));
      modal
        .querySelector(".modal-overlay")
        .addEventListener("click", () => closeModal(false));

      document.body.appendChild(modal);
    });
  }
}

// Export global instance
const ui = new UIManager();
