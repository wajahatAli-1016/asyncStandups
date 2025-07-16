import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
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

    const { teamId, email } = await request.json();

    if (!teamId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the current user
    const inviter = await User.findOne({ email: session.user.email });
    if (!inviter) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the team exists and the user has permission to invite
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if the user is an admin of the team
    const userTeamMember = team.members.find(member => 
      member.userId.toString() === inviter._id.toString()
    );
    
    if (!userTeamMember || userTeamMember.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to send invites' }, { status: 403 });
    }

    // Check if user is already a member of the team
    const targetUser = await User.findOne({ email });
    if (targetUser) {
      const existingMember = team.members.find(member => 
        member.userId?.toString() === targetUser._id.toString()
      );
      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 });
      }
    }

    // Check if there's already a pending invite
    const existingInvite = await Invite.findOne({ email, teamId, status: 'pending' });
    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 400 });
    }

    // Create new invite
    const invite = new Invite({
      email,
      teamId,
      invitedBy: inviter._id,
      status: 'pending'
    });

    await invite.save();

    return NextResponse.json({ 
      message: 'Invite sent successfully',
      invite: {
        id: invite._id,
        email: invite.email,
        status: invite.status,
        createdAt: invite.createdAt
      }
    });

  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
} 