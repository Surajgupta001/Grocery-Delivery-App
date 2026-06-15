import express from "express";
import { auth } from "../../middlewares/auth.middlewares.js";
import { admin } from "../../middlewares/admin.middlewares.js";
import { getAllOrders, updateOrderStatus } from "../controllers/admin.controllers.js";

const adminRouter = express.Router();

adminRouter.get('/all', auth, admin, getAllOrders);
adminRouter.put('/:id/status', auth, admin, updateOrderStatus);

export default adminRouter;