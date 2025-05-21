import express from 'express';
import pool from './db';

const router = express.Router();

router.get('/portfolio', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM portfolio');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;