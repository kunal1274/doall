// Authentication Manager
class AuthManager {
  constructor() {
    this.user = null;
    this.token = null;
    this.init();
  }

  init() {
    this.token = localStorage.getItem(APP_CONSTANTS.TOKEN_KEY);
    const userData = localStorage.getItem(APP_CONSTANTS.USER_KEY);
    this.user = userData ? JSON.parse(userData) : null;
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  getUserRole() {
    return this.user?.roles?.[0]?.role || "customer";
  }

  hasRole(role) {
    return this.user?.roles?.some((r) => r.role === role);
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem(APP_CONSTANTS.TOKEN_KEY, token);
    localStorage.setItem(APP_CONSTANTS.USER_KEY, JSON.stringify(user));
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(APP_CONSTANTS.TOKEN_KEY);
    localStorage.removeItem(APP_CONSTANTS.USER_KEY);
    localStorage.removeItem(APP_CONSTANTS.TENANT_KEY);
  }

  async login(phone, password) {
    try {
      const response = await api.login({ phone, password });

      if (response.success && response.data) {
        this.setAuth(response.data.token, response.data.user);

        // Store tenant info
        if (response.data.tenant) {
          localStorage.setItem(
            APP_CONSTANTS.TENANT_KEY,
            JSON.stringify(response.data.tenant)
          );
        }

        return { success: true, user: response.data.user };
      }

      throw new Error(response.message || "Login failed");
    } catch (error) {
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await api.register(userData);

      if (response.success && response.data) {
        this.setAuth(response.data.token, response.data.user);

        if (response.data.tenant) {
          localStorage.setItem(
            APP_CONSTANTS.TENANT_KEY,
            JSON.stringify(response.data.tenant)
          );
        }

        return { success: true, user: response.data.user };
      }

      throw new Error(response.message || "Registration failed");
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearAuth();
      window.location.href = "/";
    }
  }

  async refreshToken() {
    try {
      const response = await api.refreshToken();

      if (response.success && response.data) {
        this.setAuth(response.data.token, response.data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearAuth();
      return false;
    }
  }

  async loadProfile() {
    try {
      const response = await api.getProfile();

      if (response.success && response.data) {
        this.user = response.data;
        localStorage.setItem(
          APP_CONSTANTS.USER_KEY,
          JSON.stringify(response.data)
        );
        return response.data;
      }

      throw new Error("Failed to load profile");
    } catch (error) {
      throw error;
    }
  }
}

// Export global instance
const auth = new AuthManager();
