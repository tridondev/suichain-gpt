import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "Learn DeFi API ready to roll!" });
});

export default router;