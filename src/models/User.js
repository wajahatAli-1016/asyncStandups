import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  timezone: {
    type: String,
    required: [true, 'Timezone is required'],
    match: [/^UTC[+-](?:0\d|1[0-2]):[0-5]0$/, 'Please enter a valid timezone'],
  },
  team_id: {
    type: String,
    required: [true, 'Team ID is required'],
    ref: 'Team', // This will be used when you create the Team model
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'member'],
      message: '{VALUE} is not a valid role',
    },
    required: [true, 'Role is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add index for email
userSchema.index({ email: 1 });

// Add any virtual fields if needed
userSchema.virtual('id').get(function() {
  return this._id;
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Don't send password in JSON
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 