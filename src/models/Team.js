import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const teamSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Team description is required'],
    trim: true,
  },
  reminderTime: {
    type: String,
    required: [true, 'Reminder time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:mm)!`
    }
  },
  createdBy: {
    type: String,
    required: [true, 'Creator ID is required'],
    ref: 'User',
  },
  members: [{
    userId: {
      type: String,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update the updatedAt timestamp before saving
teamSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add index for team name
teamSchema.index({ name: 1 });

// Add any virtual fields if needed
teamSchema.virtual('id').get(function() {
  return this._id;
});

// Ensure virtuals are included in JSON output
teamSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
  },
});

const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);

export default Team; 