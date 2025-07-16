import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Team from '@/models/Team';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    let query = {};
    if (teamId && teamId !== 'all') {
      query.team_id = teamId;
    }

    // Fetch users with optional team filter
    const users = await User.find(query).sort({ createdAt: -1 });

    // Get all teams to map team details to users
    const teams = await Team.find({});
    const teamMap = new Map();
    teams.forEach(team => {
      teamMap.set(team._id.toString(), team);
    });

    // Map users with their team information
    const members = users.map(user => {
      const userObj = user.toJSON();
      
      if (userObj.team_id) {
        const teamKey = userObj.team_id.toString();
        if (teamMap.has(teamKey)) {
          const team = teamMap.get(teamKey);
          
          // Find user's role in the team
          const teamMember = team.members.find(m => m.userId.toString() === userObj.id.toString());
          
          userObj.team = {
            _id: team._id,
            name: team.name,
            role: teamMember?.role || 'member'
          };
        } else {
          userObj.team = null;
        }
      } else {
        userObj.team = null;
      }
      
      return userObj;
    });

    return NextResponse.json({ members });

  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch members',
      details: error.message 
    }, { status: 500 });
  }
} 