import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB  from '@/lib/db';
import Team from '@/models/Team';
import User from '@/models/User';
import Invite from '@/models/Invite';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get invites for the current user's email
    const invites = await Invite.find({ 
      email: session.user.email 
    })
    .sort({ createdAt: -1 })
    .populate('invitedBy', 'email name')
    .populate('teamId', 'name description');

    return NextResponse.json({ 
      invites: invites.map(invite => ({
        _id: invite._id,
        status: invite.status,
        createdAt: invite.createdAt,
        team: {
          _id: invite.teamId._id,
          name: invite.teamId.name,
          description: invite.teamId.description
        },
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