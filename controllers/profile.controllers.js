const path = require("path");
const imagekit = require("../libs/imagekit");
const prisma = require("../libs/prisma");

// function to phone indonesia
function formatToIndonesiaPhoneNumber(phoneNumber) {
  let digitsOnly = phoneNumber.replace(/\D/g, "");

  if (digitsOnly.startsWith("0")) {
    return "+62" + digitsOnly.substring(1);
  }

  if (!digitsOnly.startsWith("62")) {
    return "+62" + digitsOnly;
  }

  return digitsOnly;
}

module.exports = {
  // update profile
  updateProfile: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { fullName, phoneNumber, gender } = req.body;
      const file = req.file;

      let user = await prisma.users.findUnique({
        where: {
          userId,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          err: null,
          data: null,
        });
      }

      let profile = await prisma.profiles.findUnique({
        where: {
          userId,
        },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
          err: null,
          data: null,
        });
      }

      let formattedPhoneNumber = phoneNumber
        ? formatToIndonesiaPhoneNumber(phoneNumber)
        : profile.phoneNumber;

      let imageProfileUrl = profile.imageProfile;
      if (file) {
        let strFile = file.buffer.toString("base64");
        let { url } = await imagekit.upload({
          fileName: Date.now() + path.extname(file.originalname),
          file: strFile,
        });
        imageProfileUrl = url;
      }

      const updateProfileUser = await prisma.profiles.update({
        where: {
          userId: userId,
        },
        data: {
          fullName,
          phoneNumber: formattedPhoneNumber,
          gender,
          imageProfile: imageProfileUrl,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Successfully updated user profile",
        err: null,
        data: updateProfileUser,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      res.status(500).json({
        success: false,
        message: "An error occurred while updating the profile",
      });
      next(error);
    }
  },

  // get profiles
  getProfile: async (req, res, next) => {
    try {
      const { userId } = req.user;
      let user = await prisma.users.findUnique({
        where: {
          userId,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          err: null,
          data: null,
        });
      }

      let profile = await prisma.profiles.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
          err: null,
          data: null,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Successfully retrieved user profile",
        err: null,
        data: profile,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      res.status(500).json({
        success: false,
        message: "An error occurred while retrieving the profile",
      });
      next(error);
    }
  },
};
