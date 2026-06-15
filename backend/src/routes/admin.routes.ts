import express from "express";
import { auth } from "../../middlewares/auth.middlewares";
import { admin } from "../../middlewares/admin.middlewares";
import { getAllOrders, updateOrderStatus } from "../controllers/admin.controllers";

const adminRouter = express.Router();

adminRouter.get('/all', auth, admin, getAllOrders);
adminRouter.put('/:id/status', auth, admin, updateOrderStatus);

export default adminRouter;