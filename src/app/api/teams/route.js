import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB  from '../../../lib/db';
import Team from '@/models/Team';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get the current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all teams where the user is a member and populate member details
    const teams = await Team.find({
      'members.userId': user._id
    }).populate('members.userId', 'email name').sort({ createdAt: -1 });

    return NextResponse.json({ 
      teams: teams.map(team => ({
        _id: team._id,
        name: team.name,
        description: team.description,
        members: team.members.map(member => ({
          userId: member.userId._id,
          email: member.userId.email,
          name: member.userId.name,
          role: member.role
        }))
      }))
    });

  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
} 