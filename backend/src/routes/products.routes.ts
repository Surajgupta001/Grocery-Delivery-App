import express from "express";
import { createProduct, deleteProduct, getFlashDeals, getProductById, getProducts, updateProduct } from "../controllers/product.controllers";
import { auth } from "../../middlewares/auth.middlewares";
import { admin } from "../../middlewares/admin.middlewares";

const productRouter = express.Router();

productRouter.get('/flash-deals', getFlashDeals);
productRouter.get('/', getProducts);
productRouter.get('/:id', getProductById);
productRouter.post('/', auth, admin, createProduct);
productRouter.put('/:id', auth, admin, updateProduct);
productRouter.delete('/:id', auth, admin, deleteProduct);

export default productRouter;