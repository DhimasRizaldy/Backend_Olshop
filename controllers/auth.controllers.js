require("dotenv").config();
const prisma = require("../libs/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpHandler = require("../libs/otpHandler");
const nodemailer = require("../libs/nodemailer");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { emailOtpVerify } = require("../libs/template-email/emailOtpVerify");
const {
  emailResetPassword,
} = require("../libs/template-email/emailResetPassword");

module.exports = {
  // login users
  loginUsers: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Validasi input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Bad Request",
          err: "Email and password are required",
          data: null,
        });
      }

      if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({
          success: false,
          message: "Bad Request",
          err: "Invalid input type",
          data: null,
        });
      }

      // Cari pengguna berdasarkan email
      const user = await prisma.users.findUnique({
        where: { email },
        include: { profiles: true },
      });

      // Periksa apakah pengguna ada dan memiliki peran "USER" atau "ADMIN"
      if (!user || (user.role !== "USER" && user.role !== "ADMIN")) {
        return res.status(400).json({
          success: false,
          message: "Bad Request",
          err: "User not found",
          data: null,
        });
      }
      // Periksa apakah pengguna menggunakan Google login
      if (user.googleId) {
        return res.status(400).json({
          success: false,
          message: "Use google login",
        });
      }

      // Periksa apakah password cocok
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Bad Request",
          err: "Wrong email or password",
          data: null,
        });
      }

      // Periksa apakah pengguna sudah terverifikasi
      if (!user.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Bad Request",
          err: "User not verified",
          data: null,
        });
      }

      // Buat token
      const payload = {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      // Hapus password dari respons
      delete user.password;

      return res.status(200).json({
        success: true,
        message: "Login successfully",
        err: null,
        data: {
          user: user,
          token: token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // register users
  registerUsers: async (req, res, next) => {
    try {
      let { username, email, password, confirmPassword } = req.body;
      const userId = uuidv4();

      // Validasi input
      if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "All fields are required",
          data: null,
        });
      }

      if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof confirmPassword !== "string"
      ) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Invalid input type",
          data: null,
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Passwords do not match",
          data: null,
        });
      }

      if (password.length < 8 || password.length > 30) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Password must be between 8 and 30 characters",
          data: null,
        });
      }

      const passwordRegex = /^[a-zA-Z0-9]{8,30}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Password must contain only alphanumeric characters",
          data: null,
        });
      }

      // Check email existence
      let emailExist = await prisma.users.findUnique({
        where: { email },
      });

      if (emailExist) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Email already exists",
          data: null,
        });
      }

      // Check username existence
      let usernameExist = await prisma.users.findUnique({
        where: { username },
      });

      if (usernameExist) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Username already exists",
          data: null,
        });
      }

      // Hash password
      let encryptedPassword = await bcrypt.hash(password, 10);

      // Create user
      let users = await prisma.users.create({
        data: {
          userId,
          username,
          email,
          password: encryptedPassword,
        },
      });

      // Create profile
      await prisma.profiles.create({
        data: {
          userId,
          fullName: null,
          phoneNumber: null,
          gender: null,
          imageProfile: null,
        },
      });

      // Remove password from user object
      delete users.password;

      // Generate token
      const token = jwt.sign(
        {
          email: users.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      const otp = await otpHandler.generateOTP(email);
      // Send email
      await nodemailer.sendEmail(
        email,
        "Account Verification OTP",
        emailOtpVerify(otp, token)
      );

      // Return success response
      return res.status(201).json({
        status: true,
        message: "User registered successfully",
        data: {
          user: users,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // register admin
  registerAdmin: async (req, res, next) => {
    try {
      let { username, email, password, confirmPassword } = req.body;
      let role = "ADMIN";
      let isVerified = true;
      const userId = uuidv4();

      // Validasi input
      if (!username || !email || !password || !confirmPassword || !role) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "All fields are required",
          data: null,
        });
      }

      if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof confirmPassword !== "string" ||
        typeof role !== "string"
      ) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Invalid input type",
          data: null,
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Passwords do not match",
          data: null,
        });
      }

      if (password.length < 8 || password.length > 30) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Password must be between 8 and 30 characters",
          data: null,
        });
      }

      const passwordRegex = /^[a-zA-Z0-9]{8,30}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Password must contain only alphanumeric characters",
          data: null,
        });
      }

      // Check email existence
      let emailExist = await prisma.users.findUnique({
        where: { email },
      });

      if (emailExist) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Email already exists",
          data: null,
        });
      }

      // Check username existence
      let usernameExist = await prisma.users.findUnique({
        where: { username },
      });

      if (usernameExist) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Username already exists",
          data: null,
        });
      }

      // Hash password
      let encryptedPassword = await bcrypt.hash(password, 10);

      // Validate role
      if (role !== "ADMIN") {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Invalid role",
          data: null,
        });
      }

      // Create user
      let users = await prisma.users.create({
        data: {
          userId,
          username,
          email,
          password: encryptedPassword,
          role,
          isVerified,
        },
      });

      // Create profile
      await prisma.profiles.create({
        data: {
          userId,
          fullName: null,
          phoneNumber: null,
          gender: null,
          imageProfile: null,
        },
      });

      // Remove password from user object
      delete users.password;

      // Generate token
      const token = jwt.sign({ email: users.email }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      // Return success response
      return res.status(201).json({
        status: true,
        message: "Admin registered successfully",
        data: {
          user: users,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // update admin
  updateAdmin: async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { username, email, password, confirmPassword, profileData } =
        req.body; // Tambahkan profileData untuk data profil
      let role = "ADMIN";
      let isVerified = true;
      const encryptedPassword = await bcrypt.hash(password, 10);

      // Validasi input
      if (
        !username ||
        !email ||
        !password ||
        !confirmPassword ||
        !role ||
        !profileData
      ) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "All fields are required",
          data: null,
        });
      }

      if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof confirmPassword !== "string" ||
        typeof role !== "string"
      ) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Invalid input type",
          data: null,
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Passwords do not match",
          data: null,
        });
      }

      if (password.length < 8 || password.length > 30) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Password must be between 8 and 30 characters",
          data: null,
        });
      }

      const passwordRegex = /^[a-zA-Z0-9]{8,30}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Password must contain only alphanumeric characters",
          data: null,
        });
      }

      // Update user and profile
      let users = await prisma.users.update({
        where: { userId },
        data: {
          username,
          email,
          password: encryptedPassword,
          role,
          isVerified,
          profiles: {
            update: {
              ...profileData, // Mengupdate profil terkait dengan data baru
            },
          },
        },
        include: {
          profiles: true, // Sertakan profil yang diperbarui dalam respons
        },
      });

      // Remove password from user object
      delete users.password;

      // Return success response
      return res.status(200).json({
        status: true,
        message: "Admin updated successfully",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete admin
  deleteAdmin: async (req, res, next) => {
    try {
      const { userId } = req.params; // Get the userId of the admin to be deleted from request parameters

      // Delete related profiles
      await prisma.profiles.deleteMany({
        where: { userId },
      });

      // Delete related addresses
      await prisma.address.deleteMany({
        where: { userId },
      });

      // Delete user
      const user = await prisma.users.delete({
        where: { userId },
      });

      // Return success response
      return res.status(200).json({
        status: true,
        message: "Admin deleted successfully",
        data: user,
      });
    } catch (error) {
      console.error("Error deleting admin and related data:", error.message);
      return res.status(500).json({
        status: false,
        message: "Failed to delete admin",
        error: error.message,
      });
    }
  },
  // authenticate users (whoami)
  authenticate: async (req, res, next) => {
    try {
      const { user } = req;

      delete user.password;
      let userDetail = null;

      userDetail = await prisma.users.findUnique({
        where: { userId: user.userId },
        include: { profiles: true },
      });

      delete userDetail.password;

      return res.status(200).json({
        status: true,
        message: "User authenticated successfully",
        data: {
          user: { ...userDetail },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // verify OTP activation
  verifyOTP: async (req, res, next) => {
    try {
      const { token, otp } = req.query;

      const decode = jwt.decode(token, process.env.JWT_SECRET);

      if (!decode) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Invalid token",
          data: null,
        });
      }

      const user = await prisma.users.findUnique({
        where: { email: decode.email },
      });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "User not found",
          data: null,
        });
      }

      const storedOtp = await otpHandler.getOTPFromStorage(decode.email);

      if (otp !== storedOtp) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "Invalid OTP",
          data: null,
        });
      }

      // OTP yang sesuai, tandai verifikasi pengguna
      await prisma.users.update({
        where: { email: decode.email },
        data: { isVerified: true, otp: null },
      });

      return res.status(200).json({
        status: true,
        message: "Account verified successfully",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },

  // forgot password
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await prisma.users.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "User not found",
          data: null,
        });
      } else {
        const token = jwt.sign(
          {
            userId: user.userId,
            name: user.username,
            email: user.email,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );

        await nodemailer.sendEmail(
          email,
          "Reset Password Request",
          emailResetPassword(token, user)
        );

        return res.json({
          status: true,
          message: "Password reset link sent to email successfully",
          err: null,
          data: {
            token, // Menyertakan token dalam respons
          },
        });
      }
    } catch (error) {
      next(error);
    }
  },

  // reset password
  resetPassword: async (req, res, next) => {
    try {
      const { token } = req.query;

      let decode;
      try {
        decode = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(400).json({
            status: false,
            message: "Token has expired",
            err: err.message,
            data: null,
          });
        } else if (err.name === "JsonWebTokenError") {
          return res.status(400).json({
            status: false,
            message: "Invalid token",
            err: err.message,
            data: null,
          });
        } else {
          return res.status(400).json({
            status: false,
            message: "Token verification failed",
            err: err.message,
            data: null,
          });
        }
      }

      const { password, confirmPassword } = req.body;

      if (!password || !confirmPassword) {
        return res.status(400).json({
          status: false,
          message: "Password and Confirm Password are required",
          err: null,
          data: null,
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          status: false,
          message: "Password & Confirm Password do not match!",
          err: null,
          data: null,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.users.update({
        where: { email: decode.email },
        data: { password: hashedPassword },
      });

      await prisma.notifications.create({
        data: {
          title: "Notification",
          notificationId: uuidv4(),
          body: "Password berhasil direset",
          description: "Password Anda telah berhasil direset.",
          userId: decode.userId,
        },
      });

      return res.status(200).json({
        status: true,
        message: "Password reset successfully",
        err: null,
        data: null,
      });
    } catch (error) {
      return next(error);
    }
  },

  // change password
  changePassword: async (req, res, next) => {
    try {
      const { old_password, new_password, confirm_password } = req.body;
      const { email } = req.user;

      if (new_password !== confirm_password) {
        return res.status(400).json({
          status: false,
          message: "Password & Confirm_Password do not match!",
          err: null,
          data: null,
        });
      }

      const user = await prisma.users.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "User not found",
          data: null,
        });
      }

      const isMatch = await bcrypt.compare(old_password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          status: false,
          message: "Old password is incorrect",
          err: null,
          data: null,
        });
      }

      const encryptedPassword = await bcrypt.hash(new_password, 10);
      await prisma.users.update({
        where: { email },
        data: { password: encryptedPassword },
      });

      await prisma.notifications.create({
        data: {
          title: "Notification",
          notificationId: uuidv4(),
          body: "Password berhasil diubah",
          description: "Password Anda telah berhasil diubah.",
          userId: user.userId,
        },
      });

      return res.status(200).json({
        status: true,
        message: "Password changed successfully",
        err: null,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },

  // resend otp
  resendOTP: async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await prisma.users.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "User not found",
          data: null,
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          status: false,
          message: "User already verified",
          err: null,
          data: null,
        });
      }

      // Buat OTP baru
      const otp = await otpHandler.generateOTP(email);

      // Perbarui OTP di database
      await prisma.users.update({
        where: { email },
        data: { otp },
      });

      const token = jwt.sign(
        {
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      // Kirim email
      await nodemailer.sendEmail(
        email,
        "Account Verification OTP",
        emailOtpVerify(otp, token)
      );

      return res.status(200).json({
        status: true,
        message: "OTP sent to email successfully",
        err: null,
        data: token,
      });
    } catch (error) {
      next(error);
    }
  },

  // login with google
  loginGoogle: async (req, res, next) => {
    try {
      const { access_token } = req.body;

      if (!access_token || typeof access_token !== "string") {
        return res.status(400).json({
          success: false,
          message: "Bad Request",
          err: "Valid access token required",
          data: null,
        });
      }

      const url = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`;

      https
        .get(url, (response) => {
          let data = "";

          response.on("data", (chunk) => {
            data += chunk;
          });

          response.on("end", async () => {
            try {
              const googleResponse = JSON.parse(data);
              const { email, name, picture, sub } = googleResponse;

              if (!email || !name || !picture || !sub) {
                return res.status(400).json({
                  success: false,
                  message: "Bad Request",
                  err: "Invalid response from Google API",
                  data: null,
                });
              }

              let user = await prisma.users.findUnique({
                where: { email: email },
                include: { profiles: true },
              });

              if (!user) {
                user = await prisma.users.upsert({
                  where: { email: email },
                  update: {
                    googleId: sub,
                    profiles: { update: { imageProfile: picture } },
                  },
                  create: {
                    username: name,
                    email: email,
                    googleId: sub,
                    isVerified: true,
                    profiles: {
                      create: {
                        fullName: name,
                        imageProfile: picture,
                      },
                    },
                  },
                });
              }

              delete user.password;

              let token = jwt.sign(
                {
                  userId: user.userId,
                  username: user.username,
                  email: user.email,
                },
                process.env.JWT_SECRET
              );

              return res.status(200).json({
                success: true,
                message: "OK",
                err: null,
                data: { ...user, token },
              });
            } catch (error) {
              console.error("Error processing Google response:", error);
              next(error);
            }
          });
        })
        .on("error", (error) => {
          console.error("Error during Google API request:", error);
          next(error);
        });
    } catch (error) {
      console.error("Error during Google login:", error);
      next(error);
    }
  },

  // update users
  updateUsers: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { fullName, phoneNumber, gender, imageProfile } = req.body;
      const user = await prisma.users.findUnique({
        where: { userId },
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          err: "User not found with id: " + userId,
          data: null,
        });
      }
      const updatedUser = await prisma.users.update({
        where: { userId },
        data: {
          fullName,
          phoneNumber,
          gender,
          imageProfile,
        },
      });
      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },

  // get all users
  getAllUsers: async (req, res, next) => {
    try {
      const users = await prisma.users.findMany();
      return res.status(200).json({
        success: true,
        message: "Get all users successfully",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  // get users by id
  getUsersById: async (req, res, next) => {
    try {
      const { userId: requestedUserId } = req.params;
      const { userId: currentUserId, role } = req.user; // Extract current user ID and role from the request

      // Check if the current user is an admin
      if (role !== "ADMIN" && requestedUserId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this user",
          data: null,
        });
      }

      // Find the requested user
      const user = await prisma.users.findUnique({
        where: { userId: requestedUserId },
      });

      // Check if the user exists
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          data: null,
        });
      }

      // Respond with the user details
      return res.status(200).json({
        success: true,
        message: "Get user by id successfully",
        data: user,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      next(error);
    }
  },
};
