import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "Portfolio data is accessible!" });
});

export default router;