import {Router} from 'express';
import {authorize , authorizeAdmin} from '../middleware/auth.middleware.js';
import {
	createSubscription,
	getSubscriptions,
	getAllSubscriptions,
	updateSubscription,
	cancelSubscription,
	getUpcomingRenewals,
	getExpiredSubscriptions,
	getActiveSubscriptions,
	getCanceledSubscriptions
} from '../controllers/subscriptions.controllers.js';

const subscriptionRouter = Router();

subscriptionRouter.get('/', authorizeAdmin, getAllSubscriptions);


subscriptionRouter.get('/:id', authorize, getSubscriptions);


subscriptionRouter.post('/', authorize, createSubscription);

subscriptionRouter.put('/:id', authorize, updateSubscription);


subscriptionRouter.patch('/:id/cancel', authorize, cancelSubscription);

// user-specific filtered views (static routes before param route)
subscriptionRouter.get('/upcoming-renewals', authorize, getUpcomingRenewals);

subscriptionRouter.get('/expired', authorize, getExpiredSubscriptions);

subscriptionRouter.get('/active', authorize, getActiveSubscriptions);

subscriptionRouter.get('/canceled', authorize, getCanceledSubscriptions);


export default subscriptionRouter;
