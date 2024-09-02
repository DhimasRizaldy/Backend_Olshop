const express = require("express");
const router = express.Router();
const axios = require("axios");

// Config Defaults Axios dengan Detail Akun RajaOngkir
axios.defaults.baseURL = "https://pro.rajaongkir.com/api";
axios.defaults.headers.common["key"] = process.env.RAJAONGKIR_API_KEY; // Gunakan variabel lingkungan untuk kunci API
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

// Router POST costs
router.post("/ongkos", async (req, res) => {
  const { asal, asalType, tujuan, tujuanType, berat, kurir } = req.body;
  try {
    const response = await axios.post(
      "/cost",
      new URLSearchParams({
        origin: asal,
        originType: asalType,
        destination: tujuan,
        destinationType: tujuanType,
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

// Router POST Waybill
router.post("/waybill", async (req, res) => {
  const { waybill, courier } = req.body;
  try {
    const response = await axios.post(
      "/waybill",
      new URLSearchParams({
        waybill: waybill,
        courier: courier, // Tambahkan field 'courier' seperti yang dibutuhkan oleh API RajaOngkir
      }).toString() // Pastikan parameter dikirim sebagai string
    );

    // Cek apakah respons dari RajaOngkir mengandung data yang diharapkan
    if (response.data && response.data.rajaongkir) {
      res.json(response.data.rajaongkir);
    } else {
      res
        .status(500)
        .json({ error: "Unexpected response format from RajaOngkir" });
    }
  } catch (err) {
    console.error("Error fetching waybill:", err.message);
    res
      .status(err.response?.status || 500)
      .json({ error: "Failed to fetch waybill" });
  }
});

module.exports = router;
