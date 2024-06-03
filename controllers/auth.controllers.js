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
      const token = jwt.sign({ email: users.email }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

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

  // authenticate users (whoami)
  authenticate: async (req, res, next) => {
    try {
      const { user } = req;

      delete user.password;
      let userDetail = null;

      if (user.role === "USER") {
        userDetail = await prisma.users.findUnique({
          where: { userId: user.userId },
          include: { profiles: true },
        });
      } else if (user.role === "ADMIN") {
        userDetail = await prisma.users.findUnique({
          where: { userId: user.userId },
        });
      }

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

      const decode = jwt.verify(token, process.env.JWT_SECRET);

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
        data: { isVerified: true },
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
  // forgotPassword: async (req, res, next) => {
  //   try {
  //     const { email } = req.body;

  //     const user = await prisma.users.findUnique({
  //       where: { email },
  //     });

  //     if (!user) {
  //       return res.status(400).json({
  //         status: false,
  //         message: "Bad Request",
  //         err: "User not found",
  //         data: null,
  //       });
  //     } else {
  //       const token = jwt.sign(
  //         {
  //           userId: user.userId,
  //           name: user.username,
  //           email: user.email,
  //         },
  //         process.env.JWT_SECRET,
  //         {
  //           expiresIn: "1h",
  //         }
  //       );

  //       await nodemailer.sendEmail(
  //         email,
  //         "Reset Password Request",
  //         emailResetPassword(token, user)
  //       );

  //       return res.json({
  //         status: true,
  //         message: "Password reset link sent to email successfully",
  //         err: null,
  //         data: null,
  //       });
  //     }
  //   } catch (error) {
  //     next(error);
  //   }
  // },
};
