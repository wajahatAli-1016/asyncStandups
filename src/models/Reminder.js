import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const reminderSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  title: {
    type: String,
    required: [true, 'Reminder title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Reminder description is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['standup', 'meeting', 'task', 'general'],
    default: 'general',
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: true,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  dueTime: {
    type: String,
    required: [true, 'Due time is required'],
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
  teamId: {
    type: String,
    required: [true, 'Team ID is required'],
    ref: 'Team',
  },
  assignedTo: [{
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'completed'],
      default: 'pending',
    },
    acknowledgedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    }
  }],
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: function() {
      return this.isRecurring;
    }
  },
  isActive: {
    type: Boolean,
    default: true,
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
reminderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes
reminderSchema.index({ teamId: 1, createdBy: 1 });
reminderSchema.index({ dueDate: 1, isActive: 1 });
reminderSchema.index({ 'assignedTo.userId': 1 });

// Virtual for checking if reminder is overdue
reminderSchema.virtual('isOverdue').get(function() {
  const now = new Date();
  const dueDateTime = new Date(this.dueDate);
  const [hours, minutes] = this.dueTime.split(':');
  dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return now > dueDateTime && this.isActive;
});

// Ensure virtuals are included in JSON output
reminderSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
  },
});

const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);

export default Reminder; 