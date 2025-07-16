import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  teamId: {
    type: String,
    ref: 'Team',
    required: true,
  },
  invitedBy: {
    type: String,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending',
  }
}, {
  timestamps: true
});

// Create a compound unique index on email and teamId
inviteSchema.index({ email: 1, teamId: 1 }, { unique: true });

const Invite = mongoose.models.Invite || mongoose.model('Invite', inviteSchema);

export default Invite; 