const User = require("../models/User");
const Job = require("../models/Job");
const cloudinary = require("../config/cloudinary");

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-auth.password_hash -auth.refresh_token")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "GET_PROFILE_FAILED", message: error.message },
      });
  }
};

// @desc    Update current user profile
// @route   PUT /api/v1/users/me
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, email, date_of_birth, gender, avatar } =
      req.body;

    const user = await User.findById(req.userId);
    if (!user)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });

    if (first_name) user.profile.first_name = first_name;
    if (last_name) user.profile.last_name = last_name;
    if (email) user.profile.email = email;
    if (date_of_birth) user.profile.date_of_birth = date_of_birth;
    if (gender) user.profile.gender = gender;

    if (avatar) {
      if (typeof avatar === "string" && avatar.startsWith("data:image")) {
        const uploadResult = await cloudinary.uploader.upload(avatar, {
          folder: "avatars",
          public_id: `user_${user._id}`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
          ],
        });
        user.profile.avatar_url = uploadResult.secure_url;
      } else {
        user.profile.avatar_url = avatar;
      }
    }

    await user.save();

    const userResponse = user.toObject();
    if (userResponse.auth) {
      delete userResponse.auth.password_hash;
      delete userResponse.auth.refresh_token;
    }

    res.json({ success: true, data: { user: userResponse } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "UPDATE_PROFILE_FAILED", message: error.message },
      });
  }
};

// @desc    Add new address
// @route   POST /api/v1/users/me/addresses
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    const {
      label,
      line1,
      line2,
      city,
      state,
      pincode,
      latitude,
      longitude,
      is_default,
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });

    if (is_default) user.addresses.forEach((addr) => (addr.is_default = false));

    const addressId = `addr_${Date.now()}`;

    user.addresses.push({
      address_id: addressId,
      label,
      line1,
      line2,
      city,
      state,
      pincode,
      location: { type: "Point", coordinates: [longitude, latitude] },
      is_default: is_default || user.addresses.length === 0,
    });

    await user.save();

    res
      .status(201)
      .json({
        success: true,
        data: { address_id: addressId, addresses: user.addresses },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "ADD_ADDRESS_FAILED", message: error.message },
      });
  }
};

// @desc    Update address
// @route   PUT /api/v1/users/me/addresses/:address_id
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const { address_id } = req.params;
    const updates = req.body;

    const user = await User.findById(req.userId);
    if (!user)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });

    const address = user.addresses.find((a) => a.address_id === address_id);
    if (!address)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "ADDRESS_NOT_FOUND", message: "Address not found" },
        });

    if (updates.label) address.label = updates.label;
    if (updates.line1) address.line1 = updates.line1;
    if (updates.line2) address.line2 = updates.line2;
    if (updates.city) address.city = updates.city;
    if (updates.state) address.state = updates.state;
    if (updates.pincode) address.pincode = updates.pincode;
    if (updates.latitude && updates.longitude)
      address.location.coordinates = [updates.longitude, updates.latitude];

    if (updates.is_default)
      user.addresses.forEach(
        (addr) => (addr.is_default = addr.address_id === address_id)
      );

    await user.save();

    res.json({ success: true, data: { addresses: user.addresses } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "UPDATE_ADDRESS_FAILED", message: error.message },
      });
  }
};

// @desc    Delete address
// @route   DELETE /api/v1/users/me/addresses/:address_id
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const { address_id } = req.params;
    const user = await User.findById(req.userId);
    if (!user)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });

    const addressIndex = user.addresses.findIndex(
      (a) => a.address_id === address_id
    );
    if (addressIndex === -1)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "ADDRESS_NOT_FOUND", message: "Address not found" },
        });

    user.addresses.splice(addressIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: "Address deleted successfully",
      data: { addresses: user.addresses },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "DELETE_ADDRESS_FAILED", message: error.message },
      });
  }
};

// @desc    Update provider availability
// @route   PUT /api/v1/users/me/availability
// @access  Private (Provider)
exports.updateAvailability = async (req, res) => {
  try {
    const { is_available, latitude, longitude, working_hours } = req.body;
    const user = await User.findById(req.userId);

    if (!user || !user.hasRole("provider")) {
      return res
        .status(403)
        .json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only providers can update availability",
          },
        });
    }

    if (typeof is_available === "boolean")
      user.availability.is_available = is_available;

    if (latitude && longitude) {
      user.availability.current_location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
      user.availability.updated_at = new Date();
    }

    if (working_hours) user.availability.working_hours = working_hours;

    await user.save();

    const socketManager = req.app.get("socketManager");
    if (socketManager) {
      socketManager.emitToTenant(
        req.tenantId,
        "provider:availability-changed",
        {
          providerId: user._id,
          isAvailable: user.availability.is_available,
          location: user.availability.current_location,
        }
      );
    }

    res.json({
      success: true,
      data: {
        is_available: user.availability.is_available,
        current_location: user.availability.current_location,
        working_hours: user.availability.working_hours,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "UPDATE_AVAILABILITY_FAILED", message: error.message },
      });
  }
};

// @desc    Find nearby available providers
// @route   GET /api/v1/users/providers/nearby
// @access  Private (Customer)
exports.getNearbyProviders = async (req, res) => {
  try {
    const {
      service_id,
      latitude,
      longitude,
      radius = 5000,
      limit = 10,
    } = req.query;

    if (!latitude || !longitude)
      return res
        .status(400)
        .json({
          success: false,
          error: {
            code: "LOCATION_REQUIRED",
            message: "Latitude and longitude required",
          },
        });

    const query = {
      tenant_id: req.tenantId,
      roles: { $elemMatch: { role: "provider", status: "active" } },
      "availability.is_available": true,
      status: "active",
      "availability.current_location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(radius),
        },
      },
    };

    if (service_id) query["roles.provider_details.services"] = service_id;

    const providers = await User.find(query)
      .select("profile stats availability roles")
      .limit(parseInt(limit))
      .lean();

    const providersWithDistance = providers.map((provider) => {
      const providerCoords = provider.availability.current_location.coordinates;
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        providerCoords[1],
        providerCoords[0]
      );

      return {
        user_id: provider._id,
        name: `${provider.profile.first_name} ${provider.profile.last_name}`,
        avatar: provider.profile.avatar_url,
        phone: provider.profile.phone,
        rating: provider.stats.average_rating,
        total_jobs: provider.stats.completed_jobs,
        distance: Math.round(distance * 10) / 10,
        current_location: {
          latitude: providerCoords[1],
          longitude: providerCoords[0],
        },
        services:
          provider.roles.find((r) => r.role === "provider")?.provider_details
            ?.services || [],
        experience_years:
          provider.roles.find((r) => r.role === "provider")?.provider_details
            ?.experience_years || 0,
      };
    });

    res.json({
      success: true,
      data: {
        providers: providersWithDistance,
        count: providersWithDistance.length,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "GET_PROVIDERS_FAILED", message: error.message },
      });
  }
};

// @desc    Get user statistics
// @route   GET /api/v1/users/me/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("stats roles");
    if (!user)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });

    let additionalStats = {};

    if (user.hasRole("provider")) {
      const jobs = await Job.find({
        tenant_id: req.tenantId,
        provider_id: req.userId,
      });
      const completedJobs = jobs.filter((j) => j.status === "completed");
      const totalEarnings = completedJobs.reduce(
        (sum, j) =>
          sum + (j.pricing?.commission_split?.provider_net_amount || 0),
        0
      );
      const thisMonthJobs = completedJobs.filter((j) => {
        const jobDate = new Date(j.createdAt);
        const now = new Date();
        return (
          jobDate.getMonth() === now.getMonth() &&
          jobDate.getFullYear() === now.getFullYear()
        );
      }).length;

      additionalStats = {
        total_earnings: Math.round(totalEarnings),
        this_month_jobs: thisMonthJobs,
        pending_jobs: jobs.filter((j) =>
          ["assigned", "accepted"].includes(j.status)
        ).length,
      };
    }

    if (user.hasRole("customer")) {
      const jobs = await Job.find({
        tenant_id: req.tenantId,
        customer_id: req.userId,
      });
      additionalStats = {
        total_bookings: jobs.length,
        completed_bookings: jobs.filter((j) => j.status === "completed").length,
        active_bookings: jobs.filter(
          (j) => !["completed", "cancelled"].includes(j.status)
        ).length,
        total_spent: jobs
          .filter((j) => j.payment?.status === "completed")
          .reduce((sum, j) => sum + (j.pricing?.total_amount || 0), 0),
      };
    }

    res.json({ success: true, data: { ...user.stats, ...additionalStats } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "GET_STATS_FAILED", message: error.message },
      });
  }
};

// @desc    Update provider documents
// @route   PUT /api/v1/users/me/documents
// @access  Private (Provider)
exports.updateDocuments = async (req, res) => {
  try {
    const { id_proof, address_proof, license, pan, gstin } = req.body;
    const user = await User.findById(req.userId);
    if (!user || !user.hasRole("provider"))
      return res
        .status(403)
        .json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only providers can update documents",
          },
        });

    const providerRole = user.roles.find((r) => r.role === "provider");

    if (id_proof) providerRole.provider_details.documents.id_proof = id_proof;
    if (address_proof)
      providerRole.provider_details.documents.address_proof = address_proof;
    if (license) providerRole.provider_details.documents.license = license;

    if (pan) user.payment_accounts.pan = pan;
    if (gstin) user.payment_accounts.gstin = gstin;

    providerRole.provider_details.verification_status = "pending";

    await user.save();

    res.json({
      success: true,
      message: "Documents uploaded successfully. Verification pending.",
      data: {
        documents: providerRole.provider_details.documents,
        verification_status: providerRole.provider_details.verification_status,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "UPDATE_DOCUMENTS_FAILED", message: error.message },
      });
  }
};

// @desc    Update bank details
// @route   PUT /api/v1/users/me/bank-details
// @access  Private (Provider)
exports.updateBankDetails = async (req, res) => {
  try {
    const {
      account_holder_name,
      account_number,
      ifsc_code,
      bank_name,
      branch,
      upi_id,
    } = req.body;
    const user = await User.findById(req.userId);
    if (!user || !user.hasRole("provider"))
      return res
        .status(403)
        .json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only providers can update bank details",
          },
        });

    if (!user.payment_accounts) user.payment_accounts = {};
    if (!user.payment_accounts.bank_details)
      user.payment_accounts.bank_details = {};

    if (account_holder_name)
      user.payment_accounts.bank_details.account_holder_name =
        account_holder_name;
    if (account_number)
      user.payment_accounts.bank_details.account_number = account_number;
    if (ifsc_code) user.payment_accounts.bank_details.ifsc_code = ifsc_code;
    if (bank_name) user.payment_accounts.bank_details.bank_name = bank_name;
    if (branch) user.payment_accounts.bank_details.branch = branch;
    if (upi_id) user.payment_accounts.bank_details.upi_id = upi_id;

    await user.save();

    if (!user.payment_accounts.razorpay_account_id) {
      try {
        const razorpayService = require("../services/razorpayService");
        const tenant = await require("../models/Tenant").findById(req.tenantId);
        const accountId = await razorpayService.createLinkedAccount(
          user,
          tenant
        );
        user.payment_accounts.razorpay_account_id = accountId;
        await user.save();
      } catch (razorpayError) {
        console.error("Razorpay account creation failed:", razorpayError);
      }
    }

    res.json({
      success: true,
      message: "Bank details updated successfully",
      data: {
        bank_details: {
          account_holder_name:
            user.payment_accounts.bank_details.account_holder_name,
          bank_name: user.payment_accounts.bank_details.bank_name,
          branch: user.payment_accounts.bank_details.branch,
          ifsc_code: user.payment_accounts.bank_details.ifsc_code,
          upi_id: user.payment_accounts.bank_details.upi_id,
        },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "UPDATE_BANK_DETAILS_FAILED", message: error.message },
      });
  }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = exports;
