import {Router} from 'express';
import authorize from '../middleware/auth.middleware.js';
import createSubscription from '../controllers/subscriptions.controllers.js';

const subscriptionRouter = Router();

subscriptionRouter.get('/', authorize, (req, res) => {
  res.send('get user subscriptions route');
});

subscriptionRouter.get('/:id', authorize, (req, res) => {
  res.send('get user subscriptions route');
});


subscriptionRouter.post('/', authorize, createSubscription);

subscriptionRouter.put('/:id', (req, res) => {
  res.send(`update subscription with id ${req.params.id} route`);
});

subscriptionRouter.get('/user/:id', (req, res) => {
  res.send('get user subscriptions route');
});


subscriptionRouter.delete('/:id/cancel', (req, res) => {
  res.send(`delete subscription with id ${req.params.id} route`);
}); 

subscriptionRouter.get('/upcoming-renewals', (req, res) => {
  res.send('get user subscriptions route');
});

export default subscriptionRouter;
