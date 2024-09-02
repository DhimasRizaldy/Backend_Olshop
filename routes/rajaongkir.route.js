const express = require("express");
const router = express.Router();
const axios = require("axios");

// Config Defaults Axios dengan Detail Akun RajaOngkir
axios.defaults.baseURL = "https://pro.rajaongkir.com/api";
axios.defaults.headers.common["key"] = process.env.RAJAONGKIR_API_KEY; // Use environment variable for API key
axios.defaults.headers.post["Content-Type"] =
  "application/x-www-form-urlencoded";

// Router GET province
router.get("/provinsi", async (req, res) => {
  try {
    const response = await axios.get("/province");
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching provinces:", err.message);
    res
      .status(err.response?.status || 500)
      .json({ error: "Failed to fetch provinces" });
  }
});

// Router GET city by province_id
router.get("/kota/:provId", async (req, res) => {
  const id = req.params.provId;
  try {
    const response = await axios.get(`/city?province=${id}`);
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching cities:", err.message);
    res
      .status(err.response?.status || 500)
      .json({ error: "Failed to fetch cities" });
  }
});

// Router GET costs
router.get("/ongkos/:asal/:tujuan/:berat/:kurir", async (req, res) => {
  const { asal, tujuan, berat, kurir } = req.params;
  try {
    const response = await axios.post(
      "/cost",
      new URLSearchParams({
        origin: asal,
        destination: tujuan,
        weight: berat,
        courier: kurir,
      })
    );
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching shipping costs:", err.message);
    res
      .status(err.response?.status || 500)
      .json({ error: "Failed to fetch shipping costs" });
  }
});

module.exports = router;
