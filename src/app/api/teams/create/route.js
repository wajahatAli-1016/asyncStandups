import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db';
import Team from '@/models/Team';
import User from '@/models/User';

export async function POST(req) {
  try {
    // Verify authentication and admin role
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (token.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create teams' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const { teamName, description, reminderTime } = await req.json();

    // Basic validation
    if (!teamName || !description || !reminderTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(reminderTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Please use HH:mm format (24-hour)' },
        { status: 400 }
      );
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({ name: teamName });
    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team name already exists' },
        { status: 400 }
      );
    }

    // Create new team
    const team = await Team.create({
      name: teamName,
      description,
      reminderTime,
      createdBy: token.id,
      members: [{
        userId: token.id,
        role: 'admin',
      }]
    });

    // Update user's team_id
    await User.findByIdAndUpdate(token.id, {
      team_id: team.id
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 