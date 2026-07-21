import {mongoose} from 'mongoose';

const subscriptionSchema = new mongoose.Schema({

  user : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true , 
    index: true
  },
  name : {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100
  } , 
  price : {
    type: Number,
    required: true,
    min: 0, 
    maxlength: 100 
  },
  currency : {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD'],
    default: 'USD'
  } , 
  duration : {
    type: Number,
    required: [true, 'Duration is required'] , 
    min : [1, 'Duration must be at least 1 month'] 
  } , 
  status : {
    type: String,
    enum: ['active', 'inactive' , 'expired'] ,
    default: 'active'
  } , 
  frequency : {
    type: String,
    enum: ['monthly', 'yearly'] ,
    default: 'monthly'
  } ,
  category : {
    type: String,
    enum: ['sport ', 'news', 'entertainment', 'education', 'lifestyle', 'technology', 'health', 'finance', 'travel', 'food', 'fashion', 'music', 'gaming', 'other'] ,
    default: 'basic' 
  } ,
  paymentMethod : {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto', 'other'] ,
    default: 'credit_card' 
  } ,
  startDate : {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value >= new Date();
      },
      message: 'Start date must be a future date'
    },
    default: Date.now
  }
  ,
    renewalDate : {
    type: Date,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'Renewal date must be a future date'
    },
    default: Date.now
  }


}, { timestamps: true });


// auto calculate renewal date if missing 

subscriptionSchema.pre('save', function(next) {
  if (!this.renewalDate) {
    const renewalPeriod = this.frequency === 'monthly' ? 1 : 12;
    const renewalDate = new Date(this.startDate);
    renewalDate.setMonth(renewalDate.getMonth() + renewalPeriod);
    this.renewalDate = renewalDate;
  } 

  // auto update the status if renewal date has passed 

  if( this.renewalDate < new Date() && this.status === 'active') {
    this.status = 'expired';
  }

  next();
});


const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;