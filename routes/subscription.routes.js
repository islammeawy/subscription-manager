import {Router} from 'express';

const subscriptionRouter = Router();

subscriptionRouter.get('/', (req, res) => {
  res.send('get user subscriptions route');
});

subscriptionRouter.get('/:id', (req, res) => {
  res.send('get user subscriptions route');
});


subscriptionRouter.post('/', (req, res) => {
  res.send('add new subscription route');
}); 

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
