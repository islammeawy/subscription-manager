import {mongoose} from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3 ,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true , 
    trim: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address'] , 
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 100,
  }
} , { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;