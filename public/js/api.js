// API Service
class APIService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  getAuthHeader() {
    const token = localStorage.getItem(APP_CONSTANTS.TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  getTenantHeader() {
    const tenant = JSON.parse(
      localStorage.getItem(APP_CONSTANTS.TENANT_KEY) || "{}"
    );
    return tenant.id ? { "X-Tenant-ID": tenant.id } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...this.getAuthHeader(),
      ...this.getTenantHeader(),
      ...options.headers,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Request failed");
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: "GET" });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  // Upload file
  async upload(endpoint, formData) {
    const headers = {
      ...this.getAuthHeader(),
      ...this.getTenantHeader(),
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Upload failed");
    }

    return data;
  }

  // Auth APIs
  async login(credentials) {
    return this.post("/auth/login", credentials);
  }

  async register(userData) {
    return this.post("/auth/register", userData);
  }

  async refreshToken() {
    return this.post("/auth/refresh");
  }

  async logout() {
    return this.post("/auth/logout");
  }

  // User APIs
  async getProfile() {
    return this.get("/users/profile");
  }

  async updateProfile(data) {
    return this.put("/users/profile", data);
  }

  async getUserAddresses() {
    return this.get("/users/addresses");
  }

  async addAddress(address) {
    return this.post("/users/addresses", address);
  }

  // Service APIs
  async getServices(params = {}) {
    return this.get("/services", params);
  }

  async getServiceById(id) {
    return this.get(`/services/${id}`);
  }

  // Job APIs
  async createJob(jobData) {
    return this.post("/jobs", jobData);
  }

  async getJobs(params = {}) {
    return this.get("/jobs", params);
  }

  async getJobById(id) {
    return this.get(`/jobs/${id}`);
  }

  async updateJobStatus(id, status) {
    return this.patch(`/jobs/${id}/status`, { status });
  }

  async cancelJob(id, reason) {
    return this.post(`/jobs/${id}/cancel`, { reason });
  }

  // Payment APIs
  async createPaymentOrder(jobId) {
    return this.post("/payments/create-order", { job_id: jobId });
  }

  async verifyPayment(paymentData) {
    return this.post("/payments/verify", paymentData);
  }

  // Notification APIs
  async getNotifications(params = {}) {
    return this.get("/notifications", params);
  }

  async markNotificationRead(id) {
    return this.patch(`/notifications/${id}/read`);
  }

  async markAllNotificationsRead() {
    return this.post("/notifications/mark-all-read");
  }

  // Chat APIs
  async getChatMessages(jobId, params = {}) {
    return this.get(`/chat/${jobId}/messages`, params);
  }

  async sendChatMessage(jobId, message) {
    return this.post(`/chat/${jobId}/messages`, { message });
  }

  // Tracking APIs
  async getLocationTracking(jobId) {
    return this.get(`/tracking/job/${jobId}`);
  }

  async updateLocation(jobId, location) {
    return this.post(`/tracking/update`, {
      job_id: jobId,
      location,
    });
  }
}

// Export global instance
const api = new APIService();
