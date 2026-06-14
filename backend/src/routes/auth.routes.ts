import express from 'express';
import { login, register } from '../controllers/auth.controllers';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.get('/login', login);

export default authRouter;