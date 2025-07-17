import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Reminder from '@/models/Reminder';
import User from '@/models/User';
import Team from '@/models/Team';

// PUT - Update reminder status or details
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = params;
    const { action, status } = await request.json();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    if (action === 'updateStatus') {
      // Member updating their assignment status
      const assignmentIndex = reminder.assignedTo.findIndex(
        a => a.userId.toString() === user._id.toString()
      );

      if (assignmentIndex === -1) {
        return NextResponse.json({ 
          error: 'You are not assigned to this reminder' 
        }, { status: 403 });
      }

      // Update the assignment status
      reminder.assignedTo[assignmentIndex].status = status;
      
      if (status === 'acknowledged') {
        reminder.assignedTo[assignmentIndex].acknowledgedAt = new Date();
      } else if (status === 'completed') {
        reminder.assignedTo[assignmentIndex].completedAt = new Date();
      }

      await reminder.save();

      return NextResponse.json({ 
        message: 'Status updated successfully',
        status: reminder.assignedTo[assignmentIndex].status
      });

    } else if (action === 'edit' && user.role === 'admin') {
      // Admin editing reminder details
      const { title, description, type, priority, dueDate, dueTime, assignedTo } = await request.json();

      // Verify admin has access to this reminder's team
      const team = await Team.findById(reminder.teamId);
      const isAdmin = team.members.some(member => 
        member.userId.toString() === user._id.toString() && member.role === 'admin'
      );

      if (!isAdmin) {
        return NextResponse.json({ 
          error: 'Not authorized to edit this reminder' 
        }, { status: 403 });
      }

      // Update reminder fields
      if (title) reminder.title = title;
      if (description) reminder.description = description;
      if (type) reminder.type = type;
      if (priority) reminder.priority = priority;
      if (dueDate) reminder.dueDate = dueDate;
      if (dueTime) reminder.dueTime = dueTime;
      if (assignedTo) {
        reminder.assignedTo = assignedTo.map(userId => ({ userId }));
      }

      await reminder.save();

      return NextResponse.json({ 
        message: 'Reminder updated successfully',
        reminder: {
          id: reminder._id,
          title: reminder.title,
          dueDate: reminder.dueDate
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
  }
}

// DELETE - Delete reminder (admin only)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = params;

    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete reminders' }, { status: 403 });
    }

    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    // Verify admin has access to this reminder's team
    const team = await Team.findById(reminder.teamId);
    const isAdmin = team.members.some(member => 
      member.userId.toString() === user._id.toString() && member.role === 'admin'
    );

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Not authorized to delete this reminder' 
      }, { status: 403 });
    }

    // Soft delete by setting isActive to false
    reminder.isActive = false;
    await reminder.save();

    return NextResponse.json({ message: 'Reminder deleted successfully' });

  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
} 