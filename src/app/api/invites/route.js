import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Invite from '@/models/Invite';
import Team from '@/models/Team';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get invites for the current user's email
    const invites = await Invite.find({ 
      email: session.user.email 
    }).sort({ createdAt: -1 });

    // Manually populate the data
    const populatedInvites = await Promise.all(
      invites.map(async (invite) => {
        const team = await Team.findById(invite.teamId);
        const invitedBy = await User.findById(invite.invitedBy);
        
        return {
          _id: invite._id,
          status: invite.status,
          createdAt: invite.createdAt,
          team: team ? {
            _id: team._id,
            name: team.name,
            description: team.description
          } : null,
          invitedBy: invitedBy ? {
            email: invitedBy.email,
            name: invitedBy.name
          } : null
        };
      })
    );

    return NextResponse.json({ 
      invites: populatedInvites.filter(invite => invite.team && invite.invitedBy)
    });

  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
} 