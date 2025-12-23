const Notification = require("../models/Notification");

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;

    const query = { user_id: req.userId, tenant_id: req.tenantId };
    if (unread_only === "true") query.status = { $ne: "read" };

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user_id: req.userId,
      tenant_id: req.tenantId,
      status: { $ne: "read" },
    });

    res.json({
      success: true,
      data: {
        notifications,
        unread_count: unreadCount,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "GET_NOTIFICATIONS_FAILED", message: error.message },
      });
  }
};

// @desc    Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notification_id,
        user_id: req.userId,
        tenant_id: req.tenantId,
      },
      { status: "read", read_at: new Date() },
      { new: true }
    );
    if (!notification)
      return res
        .status(404)
        .json({
          success: false,
          error: {
            code: "NOTIFICATION_NOT_FOUND",
            message: "Notification not found",
          },
        });
    res.json({ success: true, data: { notification } });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "MARK_READ_FAILED", message: error.message },
      });
  }
};

// @desc    Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.userId, tenant_id: req.tenantId, status: { $ne: "read" } },
      { status: "read", read_at: new Date() }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "MARK_ALL_READ_FAILED", message: error.message },
      });
  }
};

// @desc    Update FCM token
exports.updateFCMToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    const User = require("../models/User");
    const user = await User.findById(req.userId);
    if (!user)
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });

    user.auth.fcm_tokens = user.auth.fcm_tokens.filter((t) => t !== fcm_token);
    user.auth.fcm_tokens.push(fcm_token);

    await user.save();
    res.json({ success: true, message: "FCM token updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: { code: "UPDATE_FCM_TOKEN_FAILED", message: error.message },
      });
  }
};
