import express from "express";
import { createOrder, getOrderById, getOrderLocation, getUserOrders } from "../controllers/order.controllers";
import { auth } from "../../middlewares/auth.middlewares";

const orderRouter = express.Router();

orderRouter.post('/', auth, createOrder);
orderRouter.get('/', auth, getUserOrders);
orderRouter.get('/:id', auth, getOrderById);
orderRouter.get('/:id/location', auth, getOrderLocation);

export default orderRouter;