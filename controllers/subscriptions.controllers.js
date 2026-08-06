import Subscription from '../models/subscription.model.js';

const createSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id
    });
    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data : subscription
    });
  }catch(error) {
    res.status(500).json({ message: 'Error creating subscription', error });
  }
}; 

export default createSubscription;