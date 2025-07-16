import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Team from '@/models/Team';
import User from '@/models/User';
import Invite from '@/models/Invite';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { teamId } = params;

    // Get the current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the team exists and the user has permission
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if the user is an admin of the team
    const userTeamMember = team.members.find(member => 
      member.userId.toString() === user._id.toString()
    );
    
    if (!userTeamMember || userTeamMember.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to view invites' }, { status: 403 });
    }

    // Get all invites for the team
    const invites = await Invite.find({ teamId })
      .sort({ createdAt: -1 })
      .populate('invitedBy', 'email name');

    return NextResponse.json({ 
      invites: invites.map(invite => ({
        _id: invite._id,
        email: invite.email,
        status: invite.status,
        createdAt: invite.createdAt,
        invitedBy: {
          email: invite.invitedBy.email,
          name: invite.invitedBy.name
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
} 