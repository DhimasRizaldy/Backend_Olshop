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
      const notifications = await prisma.notifications.findMany({
        where: {
          userId: req.user.userId,
          isDeleted: false,
        },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json({
        status: true,
        message: "Get my notifications successfully",
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

      const notifications = await prisma.notifications.findUnique({
        where: {
          notificationId: Number(notificationId),
          userId: req.user.userId,
        },
      });

      if (!notifications) {
        return res.status(404).json({
          status: false,
          message: "Notifications not found",
        });
      }

      const updatedNotifications = await prisma.notifications.update({
        where: {
          notificationId: Number(notificationId),
          userId: req.user.userId,
        },
        data: {
          isRead: true,
        },
      });

      res.status(200).json({
        status: true,
        message: "Notifications updated successfully",
        data: updatedNotifications,
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
};
