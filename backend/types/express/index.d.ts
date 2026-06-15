import type { User, DeliveryPartner } from "../../generated/prisma/client";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                isAdmin?: boolean;
                role?: string;
            }
            partner?: DeliveryPartner;
        }
    }
}

export {};