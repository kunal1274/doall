// Services Module
class Services {
  constructor() {
    this.services = [];
    this.selectedCategory = "all";
  }

  async render() {
    const pageContent = document.getElementById("pageContent");

    pageContent.innerHTML = `
            <div class="services-header mb-4">
                <h1 class="text-3xl font-bold text-gray-900">Our Services</h1>
                <p class="text-gray-600 mt-1">Choose from our wide range of quality services</p>
            </div>

            <div class="card mb-4">
                <div class="flex flex-wrap gap-2">
                    <button class="btn btn-primary category-btn active" data-category="all">
                        <i class="fas fa-th"></i> All Services
                    </button>
                    ${Object.entries(SERVICE_CATEGORIES)
                      .map(
                        ([key, cat]) => `
                        <button class="btn btn-outline category-btn" data-category="${key}">
                            <i class="fas ${cat.icon}"></i> ${cat.name}
                        </button>
                    `
                      )
                      .join("")}
                </div>
            </div>

            <div id="servicesGrid" class="grid grid-cols-3 gap-4">
                ${this.renderLoadingSkeleton()}
            </div>
        `;

    this.attachEventListeners();
    await this.loadServices();
  }

  renderLoadingSkeleton() {
    return Array(6)
      .fill(0)
      .map(
        () => `
            <div class="card animate-pulse">
                <div class="bg-gray-200 h-48 rounded-lg mb-3"></div>
                <div class="bg-gray-200 h-6 rounded mb-2"></div>
                <div class="bg-gray-200 h-4 rounded w-3/4"></div>
            </div>
        `
      )
      .join("");
  }

  attachEventListeners() {
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".category-btn").forEach((b) => {
          b.classList.remove("btn-primary", "active");
          b.classList.add("btn-outline");
        });
        btn.classList.remove("btn-outline");
        btn.classList.add("btn-primary", "active");

        this.selectedCategory = btn.dataset.category;
        this.filterServices();
      });
    });
  }

  async loadServices() {
    try {
      ui.showLoading();

      const response = await api.getServices({ status: "active" });

      if (response.success) {
        this.services = response.data.services || [];
        this.renderServices();
      }
    } catch (error) {
      console.error("Failed to load services:", error);
      ui.showToast("Failed to load services", "error");
    } finally {
      ui.hideLoading();
    }
  }

  filterServices() {
    this.renderServices();
  }

  renderServices() {
    const grid = document.getElementById("servicesGrid");

    let filteredServices = this.services;
    if (this.selectedCategory !== "all") {
      filteredServices = this.services.filter(
        (s) => s.category === this.selectedCategory
      );
    }

    if (filteredServices.length === 0) {
      grid.innerHTML = `
                <div class="col-span-3 card text-center py-12">
                    <i class="fas fa-search text-5xl text-gray-300 mb-4"></i>
                    <p class="text-gray-600">No services found in this category</p>
                </div>
            `;
      return;
    }

    grid.innerHTML = filteredServices
      .map(
        (service) => `
            <div class="card cursor-pointer hover:shadow-lg transition" onclick="services.viewService('${
              service._id
            }')">
                <div class="h-48 bg-gradient-to-br from-primary to-primary-light rounded-lg mb-3 flex items-center justify-center">
                    <i class="fas ${
                      SERVICE_CATEGORIES[service.category]?.icon ||
                      "fa-concierge-bell"
                    } text-6xl text-white"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">${
                  service.name
                }</h3>
                <p class="text-gray-600 text-sm mb-3">${
                  service.description || "Quality service at your doorstep"
                }</p>
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-sm text-gray-500">Starting at</span>
                        <p class="text-lg font-bold text-primary">₹${
                          service.pricing.base_rate
                        }</p>
                    </div>
                    <button class="btn btn-primary btn-sm">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  async viewService(serviceId) {
    try {
      ui.showLoading();

      const response = await api.getServiceById(serviceId);

      if (response.success && response.data) {
        this.showServiceModal(response.data);
      }
    } catch (error) {
      console.error("Failed to load service details:", error);
      ui.showToast("Failed to load service details", "error");
    } finally {
      ui.hideLoading();
    }
  }

  showServiceModal(service) {
    const modal = ui.createModal(
      service.name,
      `
                <div class="service-details">
                    <div class="mb-4">
                        <div class="h-64 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center mb-4">
                            <i class="fas ${
                              SERVICE_CATEGORIES[service.category]?.icon ||
                              "fa-concierge-bell"
                            } text-8xl text-white"></i>
                        </div>
                        <p class="text-gray-700">${
                          service.description ||
                          "Quality service at your doorstep"
                        }</p>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg mb-4">
                        <h4 class="font-bold text-gray-900 mb-2">Pricing</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <span class="text-sm text-gray-600">Base Rate</span>
                                <p class="text-lg font-bold text-primary">₹${
                                  service.pricing.base_rate
                                }</p>
                            </div>
                            <div>
                                <span class="text-sm text-gray-600">Minimum Charge</span>
                                <p class="text-lg font-bold text-gray-900">₹${
                                  service.pricing.minimum_charge
                                }</p>
                            </div>
                        </div>
                    </div>
                    
                    ${
                      service.materials && service.materials.length > 0
                        ? `
                        <div class="mb-4">
                            <h4 class="font-bold text-gray-900 mb-2">Materials Available</h4>
                            <div class="grid grid-cols-2 gap-2">
                                ${service.materials
                                  .map(
                                    (m) => `
                                    <div class="border border-gray-200 rounded p-2">
                                        <p class="font-semibold text-sm">${m.name}</p>
                                        <p class="text-xs text-gray-600">₹${m.price} / ${m.unit}</p>
                                    </div>
                                `
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `
                        : ""
                    }
                    
                    <button class="btn btn-primary w-full" onclick="services.bookService('${
                      service._id
                    }')">
                        <i class="fas fa-calendar-plus"></i>
                        Book Now
                    </button>
                </div>
            `
    );
  }

  async bookService(serviceId) {
    // Close any open modals
    document.querySelectorAll(".modal").forEach((m) => m.remove());

    // Navigate to booking page
    app.navigateTo("bookings", { serviceId });
  }
}

// Export
const services = new Services();
