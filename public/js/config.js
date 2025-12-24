// API Configuration
const API_CONFIG = {
  BASE_URL:
    window.location.hostname === "localhost"
      ? "http://localhost:5000/api/v1"
      : "/api/v1",
  TIMEOUT: 30000,
  SOCKET_URL:
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : window.location.origin,
};

// Application Constants
const APP_CONSTANTS = {
  TOKEN_KEY: "doall_auth_token",
  USER_KEY: "doall_user",
  TENANT_KEY: "doall_tenant",
  TOAST_DURATION: 4000,
  DEBOUNCE_DELAY: 300,
};

// Service Categories
const SERVICE_CATEGORIES = {
  home_services: { name: "Home Services", icon: "fa-home" },
  mobility: { name: "Mobility", icon: "fa-car" },
  maintenance: { name: "Maintenance", icon: "fa-tools" },
  construction: { name: "Construction", icon: "fa-hard-hat" },
  professional: { name: "Professional", icon: "fa-briefcase" },
};

// Job Status
const JOB_STATUS = {
  pending: { label: "Pending", color: "gray", icon: "fa-clock" },
  assigned: { label: "Assigned", color: "blue", icon: "fa-user-check" },
  accepted: { label: "Accepted", color: "green", icon: "fa-check" },
  on_the_way: { label: "On the Way", color: "purple", icon: "fa-route" },
  in_progress: { label: "In Progress", color: "orange", icon: "fa-spinner" },
  completed: { label: "Completed", color: "success", icon: "fa-check-circle" },
  cancelled: { label: "Cancelled", color: "error", icon: "fa-times-circle" },
  failed: { label: "Failed", color: "error", icon: "fa-exclamation-triangle" },
};

// User Roles
const USER_ROLES = {
  customer: "Customer",
  provider: "Service Provider",
  dispatcher: "Dispatcher",
  admin: "Admin",
  super_admin: "Super Admin",
};
