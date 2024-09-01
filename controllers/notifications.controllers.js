const prisma = require("../libs/prisma");

module.exports = {
  //  create notification
  createNotification: async (req, res, next) => {
    try {
      const { title, description, body } = req.body;
      const users = await prisma.users.findMany();
      const notificationId = uuidv4();

      const blastNotification = users.map((user) => {
        return {
          notificationId,
          userId: user.id,
          title,
          description,
          body,
          isRead: false,
        };
      });

      const notification = await prisma.$transaction([
        prisma.notifications.createMany({
          data: blastNotification,
        }),
      ]);

      return res.status(200).json({
        status: true,
        message: "Notification created successfully",
        err: null,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  },

  // get all notifications
  getAllNotifications: async (req, res, next) => {
    try {
      const notifications = await prisma.notifications.findMany({
        where: {
          isDeleted: false,
        },
        distinct: ["notificationId"],
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json({
        status: true,
        message: "Get all notifications successfully",
        err: null,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  },

  // get my notifications
  getMyNotifications: async (req, res, next) => {
    try {
      const userId = req.user.userId;

      if (!userId) {
        return res.status(400).json({
          status: false,
          message: "User ID is missing",
          err: null,
          data: null,
        });
      }

      const notifications = await prisma.notifications.findMany({
        where: {
          userId: userId,
          isDeleted: false,
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        status: true,
        message: "Notifications retrieved successfully",
        err: null,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  },

  // update my notifications
  updateMyNotifications: async (req, res, next) => {
    try {
      const { notificationId } = req.params;

      // Cari notifikasi yang sesuai dengan notificationId dan userId
      const notification = await prisma.notifications.findUnique({
        where: {
          notificationId: notificationId,
        },
      });

      // Cek apakah notifikasi ditemukan dan milik user yang sedang login
      if (!notification || notification.userId !== req.user.userId) {
        return res.status(404).json({
          status: false,
          message: "Notification not found",
          err: null,
          data: null,
        });
      }

      // Update isRead menjadi true
      const updatedNotification = await prisma.notifications.update({
        where: {
          notificationId: notificationId,
        },
        data: {
          isRead: true,
        },
      });

      return res.status(200).json({
        status: true,
        message: "Notification updated successfully",
        err: null,
        data: updatedNotification,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete my notifications
  deleteMyNotifications: async (req, res, next) => {
    try {
      const { notificationId } = req.params;
      const notification = await prisma.notifications.findUnique({
        where: {
          notificationId_userId: {
            notificationId,
            userId: req.user.userId,
          },
        },
      });
      if (!notification) {
        return res.status(404).json({
          status: false,
          message: "Notification not found",
          err: null,
          data: null,
        });
      }

      const deletedNotification = await prisma.notifications.update({
        where: {
          notificationId_userId: {
            notificationId,
            userId: req.user.userId,
          },
        },
        data: {
          isDeleted: true,
        },
      });

      return res.status(200).json({
        status: true,
        message: "Notification deleted successfully",
        err: null,
        data: deletedNotification,
      });
    } catch (error) {
      next(error);
    }
  },

  // get detail notifications
  getNotificationsById: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { notificationId } = req.params;
      const notification = await prisma.notifications.findUnique({
        where: {
          notificationId: notificationId,
        },
      });
      if (!notification) {
        return res.status(404).json({
          status: false,
          message: "Notification not found",
          err: null,
          data: null,
        });
      }

      return res.status(200).json({
        status: true,
        message: "Notification retrieved successfully",
        err: null,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  },
};
