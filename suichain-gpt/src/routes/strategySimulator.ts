import express from 'express';

const router = express.Router();

// GET /simulation
router.get("/", (req, res) => {
  // Return some dummy simulation results (this data can later come from your simulation engine)
  const simulationResult = {
    predictedGrowth: 12.5,
    riskLevel: "Medium",
    recommendation: "Hold",
  };
  res.json(simulationResult);
});

export default router;