import express from 'express';
import {
    cancelDeliveryByPartner,
    completeDeliveryWithOTP,
    getAssignedDeliveries,
    getDeliveryDetails,
    loginDeliveryPartner,
    updateLiveLocation,
    updateOrderStatusByPartner
} from '../controllers/deliveryPartner.controllers';
import { deliveryAuth } from '../../middlewares/deliveryAuth.middlewares';

const deliveryPartnerRouter = express.Router();

deliveryPartnerRouter.post('/login', loginDeliveryPartner);
deliveryPartnerRouter.get('/my-deliveries', deliveryAuth, getAssignedDeliveries);
deliveryPartnerRouter.get('/my-deliveries/:id', deliveryAuth, getDeliveryDetails);
deliveryPartnerRouter.put('/my-deliveries/:id/completed', deliveryAuth, completeDeliveryWithOTP);
deliveryPartnerRouter.put('/my-deliveries/:id/cancel', deliveryAuth, cancelDeliveryByPartner);
deliveryPartnerRouter.put('/my-deliveries/:id/status', deliveryAuth, updateOrderStatusByPartner);
deliveryPartnerRouter.put('/my-deliveries/:id/location', deliveryAuth, updateLiveLocation);

export default deliveryPartnerRouter;
