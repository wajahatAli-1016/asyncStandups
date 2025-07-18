import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Team from '@/models/Team';
import User from '@/models/User';
import Invite from '@/models/Invite';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { inviteId } = await request.json();

    if (!inviteId) {
      return NextResponse.json({ error: 'Missing invite ID' }, { status: 400 });
    }

    // Get the current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find and validate the invite
    const invite = await Invite.findById(inviteId);
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invite is no longer valid' }, { status: 400 });
    }

    if (invite.email !== session.user.email) {
      return NextResponse.json({ error: 'This invite is not for you' }, { status: 403 });
    }

    // Find the team
    const team = await Team.findById(invite.teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = team.members.find(member => 
      member.userId?.toString() === user._id.toString()
    );
    
    if (existingMember) {
      return NextResponse.json({ error: 'You are already a member of this team' }, { status: 400 });
    }

    // Update invite status
    invite.status = 'accepted';
    await invite.save();

    // Add user to team
    team.members.push({
      userId: user._id,
      role: 'member'
    });

    await team.save();

    // Update user's team_id if they don't have one or want to switch teams
    // For now, we'll assume users can only be in one team at a time
    user.team_id = team._id;
    await user.save();

    return NextResponse.json({ 
      message: 'Invite accepted successfully',
      team: {
        id: team._id,
        name: team.name,
        role: 'member'
      }
    });

  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }
} 