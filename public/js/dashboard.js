// Dashboard Module
class Dashboard {
    constructor() {
        this.stats = null;
        this.recentJobs = [];
    }

    async render() {
        const pageContent = document.getElementById('pageContent');
        const user = auth.getUser();
        const userRole = auth.getUserRole();
        
        pageContent.innerHTML = `
            <div class="dashboard-header mb-4">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">
                        Welcome back, ${user.profile.first_name}!
                    </h1>
                    <p class="text-gray-600 mt-1">Here's what's happening with your services</p>
                </div>
            </div>

            ${this.renderStatsCards(userRole)}

            <div class="grid grid-cols-1 gap-4 mt-4">
                ${this.renderQuickActions(userRole)}
                ${this.renderRecentActivity()}
            </div>
        `;

        await this.loadDashboardData();
    }

    renderStatsCards(role) {
        if (role === 'customer') {
            return `
                <div class="grid grid-cols-4 gap-4 mb-4">
                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Active Bookings</p>
                                <h3 class="text-3xl font-bold text-gray-900 mt-1" id="stat-active">0</h3>
                            </div>
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-calendar-check text-blue-600 text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Completed</p>
                                <h3 class="text-3xl font-bold text-gray-900 mt-1" id="stat-completed">0</h3>
                            </div>
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Total Spent</p>
                                <h3 class="text-3xl font-bold text-gray-900 mt-1" id="stat-spent">₹0</h3>
                            </div>
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-wallet text-purple-600 text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Saved</p>
                                <h3 class="text-3xl font-bold text-gray-900 mt-1" id="stat-saved">₹0</h3>
                            </div>
                            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-piggy-bank text-orange-600 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (role === 'provider') {
            return `
                <div class="grid grid-cols-4 gap-4 mb-4">
                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Active Jobs</p>
                                <h3 class="text-3xl font-bold text-gray-900 mt-1" id="stat-active">0</h3>
                            </div>
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-briefcase text-blue-600 text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Completed Today</p>
                                <h3 class="text-3xl font-bold text-gray-900 mt-1" id="stat-today">0</h3>
                            </div>
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Today's Earnings</p>
                                <h3 class="text-3xl font-bold text-gray-900 mt-1" id="stat-earnings">₹0</h3>
                            </div>
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-dollar-sign text-purple-600 text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Rating</p>
                                <h3 class="text-3xl font-bold text-gray-900 mt-1" id="stat-rating">0.0</h3>
                            </div>
                            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-star text-orange-600 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        return '';
    }

    renderQuickActions(role) {
        if (role === 'customer') {
            return `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Quick Actions</h3>
                    </div>
                    <div class="grid grid-cols-3 gap-3">
                        <button class="btn btn-primary" onclick="app.navigateTo('services')">
                            <i class="fas fa-plus"></i>
                            Book Service
                        </button>
                        <button class="btn btn-outline" onclick="app.navigateTo('bookings')">
                            <i class="fas fa-calendar"></i>
                            View Bookings
                        </button>
                        <button class="btn btn-secondary" onclick="app.navigateTo('payments')">
                            <i class="fas fa-wallet"></i>
                            Payments
                        </button>
                    </div>
                </div>
            `;
        } else if (role === 'provider') {
            return `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Quick Actions</h3>
                    </div>
                    <div class="grid grid-cols-3 gap-3">
                        <button class="btn btn-primary" onclick="app.navigateTo('provider-jobs')">
                            <i class="fas fa-briefcase"></i>
                            My Jobs
                        </button>
                        <button class="btn btn-outline" onclick="app.navigateTo('provider-earnings')">
                            <i class="fas fa-dollar-sign"></i>
                            Earnings
                        </button>
                        <button class="btn btn-secondary" onclick="app.navigateTo('profile')">
                            <i class="fas fa-user"></i>
                            Profile
                        </button>
                    </div>
                </div>
            `;
        }
        return '';
    }

    renderRecentActivity() {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Activity</h3>
                    <a href="#" class="text-sm text-primary" onclick="app.navigateTo('bookings')">View All</a>
                </div>
                <div id="recentActivityList">
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-clock text-4xl mb-3"></i>
                        <p>Loading recent activity...</p>
                    </div>
                </div>
            </div>
        `;
    }

    async loadDashboardData() {
        try {
            ui.showLoading();
            
            // Load recent jobs
            const response = await api.getJobs({ limit: 5, sort: '-created_at' });
            
            if (response.success) {
                this.recentJobs = response.data.jobs || [];
                this.updateStats();
                this.renderRecentJobs();
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            ui.showToast('Failed to load dashboard data', 'error');
        } finally {
            ui.hideLoading();
        }
    }

    updateStats() {
        const activeJobs = this.recentJobs.filter(j => 
            ['pending', 'assigned', 'accepted', 'on_the_way', 'in_progress'].includes(j.status)
        );
        const completedJobs = this.recentJobs.filter(j => j.status === 'completed');
        
        document.getElementById('stat-active')?.textContent = activeJobs.length;
        document.getElementById('stat-completed')?.textContent = completedJobs.length;
        
        // Calculate total spent
        const totalSpent = completedJobs.reduce((sum, job) => 
            sum + (job.pricing?.final_amount || 0), 0
        );
        document.getElementById('stat-spent')?.textContent = `₹${totalSpent.toLocaleString()}`;
    }

    renderRecentJobs() {
        const container = document.getElementById('recentActivityList');
        
        if (!this.recentJobs || this.recentJobs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.recentJobs.map(job => `
            <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <i class="fas ${JOB_STATUS[job.status]?.icon || 'fa-circle'} text-gray-600"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-900">${job.service_name}</h4>
                        <p class="text-sm text-gray-600">${job.job_number}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-${JOB_STATUS[job.status]?.color}-100 text-${JOB_STATUS[job.status]?.color}-700">
                        ${JOB_STATUS[job.status]?.label || job.status}
                    </span>
                    <p class="text-sm text-gray-500 mt-1">${ui.formatTime(job.created_at)}</p>
                </div>
            </div>
        `).join('');
    }
}

// Export
const dashboard = new Dashboard();
