import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Reminder from '@/models/Reminder';
import Team from '@/models/Team';
import User from '@/models/User';

// GET - Fetch reminders based on user role
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let reminders = [];

    if (user.role === 'admin') {
      // Admin can see all reminders for their teams
      const adminTeams = await Team.find({
        'members.userId': user._id,
        'members.role': 'admin'
      });

      const teamIds = adminTeams.map(team => team._id);
      
      const query = teamId 
        ? { teamId, isActive: true } 
        : { teamId: { $in: teamIds }, isActive: true };
      
      reminders = await Reminder.find(query)
        .sort({ dueDate: 1, dueTime: 1 });

      // Manually populate data
      reminders = await Promise.all(
        reminders.map(async (reminder) => {
          const team = await Team.findById(reminder.teamId);
          const createdBy = await User.findById(reminder.createdBy);
          
          // Get assigned users details
          const assignedUsers = await Promise.all(
            reminder.assignedTo.map(async (assignment) => {
              const user = await User.findById(assignment.userId);
              return {
                ...assignment.toObject(),
                user: user ? {
                  _id: user._id,
                  name: user.name,
                  email: user.email
                } : null
              };
            })
          );

          return {
            ...reminder.toObject(),
            team: team ? { _id: team._id, name: team.name } : null,
            createdBy: createdBy ? { 
              _id: createdBy._id, 
              name: createdBy.name, 
              email: createdBy.email 
            } : null,
            assignedTo: assignedUsers.filter(a => a.user)
          };
        })
      );

    } else {
      // Members only see reminders assigned to them
      reminders = await Reminder.find({
        'assignedTo.userId': user._id,
        isActive: true
      }).sort({ dueDate: 1, dueTime: 1 });

      // Manually populate data
      reminders = await Promise.all(
        reminders.map(async (reminder) => {
          const team = await Team.findById(reminder.teamId);
          const createdBy = await User.findById(reminder.createdBy);
          
          // Filter to only show this user's assignment
          const userAssignment = reminder.assignedTo.find(
            a => a.userId.toString() === user._id.toString()
          );

          return {
            ...reminder.toObject(),
            team: team ? { _id: team._id, name: team.name } : null,
            createdBy: createdBy ? { 
              _id: createdBy._id, 
              name: createdBy.name, 
              email: createdBy.email 
            } : null,
            assignedTo: userAssignment ? [userAssignment] : []
          };
        })
      );
    }

    return NextResponse.json({ 
      reminders: reminders.filter(r => r.team && r.createdBy)
    });

  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

// POST - Create new reminder (admin only)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create reminders' }, { status: 403 });
    }

    const { 
      title, 
      description, 
      type, 
      priority, 
      dueDate, 
      dueTime, 
      teamId, 
      assignedTo,
      isRecurring,
      recurringPattern
    } = await request.json();

    // Validate required fields
    if (!title || !description || !dueDate || !dueTime || !teamId || !assignedTo || assignedTo.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Verify admin has access to this team
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isAdmin = team.members.some(member => 
      member.userId.toString() === user._id.toString() && member.role === 'admin'
    );

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Not authorized to create reminders for this team' 
      }, { status: 403 });
    }

    // Create reminder
    const reminder = new Reminder({
      title,
      description,
      type: type || 'general',
      priority: priority || 'medium',
      dueDate,
      dueTime,
      teamId,
      createdBy: user._id,
      assignedTo: assignedTo.map(userId => ({ userId })),
      isRecurring: isRecurring || false,
      recurringPattern: isRecurring ? recurringPattern : undefined
    });

    await reminder.save();

    return NextResponse.json({ 
      message: 'Reminder created successfully',
      reminder: {
        id: reminder._id,
        title: reminder.title,
        dueDate: reminder.dueDate,
        assignedCount: reminder.assignedTo.length
      }
    });

  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
} 