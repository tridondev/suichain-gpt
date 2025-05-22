import express from 'express';
import pool from './db';

const router = express.Router();

// GET /transactions
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM transactions");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;