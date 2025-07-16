import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const standupSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User',
  },
  teamId: {
    type: String,
    required: [true, 'Team ID is required'],
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: props => `${props.value} is not a valid date format (YYYY-MM-DD)!`
    }
  },
  textResponse: {
    type: {
      yesterday: {
        type: String,
        required: [true, 'Yesterday\'s update is required']
      },
      today: {
        type: String,
        required: [true, 'Today\'s update is required']
      },
      blockers: {
        type: String,
        required: [true, 'Blockers field is required']
      }
    },
    required: true
  },
  media: [{
    fileName: String,
    fileType: String,
    fileUrl: String
  }],
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
standupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Standup = mongoose.models.Standup || mongoose.model('Standup', standupSchema);

export default Standup; 