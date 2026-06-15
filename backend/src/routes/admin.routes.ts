import express from "express";
import { auth } from "../../middlewares/auth.middlewares";
import { admin } from "../../middlewares/admin.middlewares";
import { assignDeliveryPartnerToOrder, createDeliveryPartner, getAdminDashboardStats, getAllOrders, getDeliveryPartners, updateDeliveryPartner, updateOrderStatus } from "../controllers/admin.controllers";

const adminRouter = express.Router();

adminRouter.get('/all', auth, admin, getAllOrders);
adminRouter.put('/:id/status', auth, admin, updateOrderStatus);
adminRouter.get('/stats', auth, admin, getAdminDashboardStats);
adminRouter.get('/delivery-partners', auth, admin, getDeliveryPartners);
adminRouter.post('/delivery-partners', auth, admin, createDeliveryPartner);
adminRouter.put('/delivery-partners/:id', auth, admin, updateDeliveryPartner);
adminRouter.put('/delivery-partners/:id/assign', auth, admin, assignDeliveryPartnerToOrder);

export default adminRouter;