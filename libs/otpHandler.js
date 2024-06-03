const generateOTP = require("otp-generator");
const prisma = require("./prisma");

module.exports = {
  // generate otp dan menyimpannya ke database
  generateOTP: async (email) => {
    const otp = generateOTP.generate(6, {
      uppercase: false,
      specialChars: false,
      alphabets: false,
    });

    // menyimpan OTP dan tanggal kadaluwarsa ke database
    await prisma.users.update({
      where: { email },
      data: {
        otp,
      },
    });

    return otp;
  },

  // validasi OTP
  getOTPFromStorage: async (email) => {
    const user = await prisma.users.findUnique({
      where: { email },
    });
    return user ? user.otp : null;
  },

  // clear OTP
  clearOTPFromStorage: async (email) => {
    await prisma.users.update({
      where: { email },
      data: {
        otp: null,
      },
    });
  },
};
