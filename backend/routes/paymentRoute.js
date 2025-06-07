import express from "express";
import { isAdmin, requireSignIn } from "../middleware/authMiddleware.js";
import createSession from "../controllers/user/createSession.js";
import handleSuccess from "../controllers/user/handleSuccess.js";

const router = express.Router();

router.post("/create-order", requireSignIn, createSession);
router.post("/payment-success", requireSignIn, handleSuccess);

export default router;
