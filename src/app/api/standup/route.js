import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Standup from '@/models/Standup';
import User from '@/models/User';
import Team from '@/models/Team';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query based on filters
    let query = {};
    if (teamId && teamId !== 'all') {
      query.teamId = teamId;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = startDate;
      }
      if (endDate) {
        query.date.$lte = endDate;
      }
    }

    // Fetch standups with pagination
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const standups = await Standup.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Standup.countDocuments(query);

    // Get all users and teams to map details
    const userIds = [...new Set(standups.map(s => s.userId))];
    const teamIds = [...new Set(standups.map(s => s.teamId))];

    const [users, teams] = await Promise.all([
      User.find({ _id: { $in: userIds } }),
      Team.find({ _id: { $in: teamIds } })
    ]);

    const userMap = new Map(users.map(user => [user._id.toString(), user]));
    const teamMap = new Map(teams.map(team => [team._id.toString(), team]));

    // Map user and team details to standups
    const standupsWithDetails = standups.map(standup => {
      const standupObj = standup.toJSON();
      const user = userMap.get(standupObj.userId.toString());
      const team = teamMap.get(standupObj.teamId.toString());

      return {
        ...standupObj,
        user: user ? {
          id: user._id,
          name: user.name,
          email: user.email,
          timezone: user.timezone
        } : null,
        team: team ? {
          id: team._id,
          name: team.name
        } : null
      };
    });

    return NextResponse.json({
      standups: standupsWithDetails,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching standups:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch standups',
      details: error.message 
    }, { status: 500 });
  }
} 