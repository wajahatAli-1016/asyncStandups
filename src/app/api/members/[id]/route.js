import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Team from '@/models/Team';
import Standup from '@/models/Standup';

// Shared update logic for both PUT and PATCH
async function updateUser(request, params) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Extract id from params
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // Get and validate update data from request body
    let updateData;
    try {
      updateData = await request.json();
      if (!updateData || Object.keys(updateData).length === 0) {
        return NextResponse.json({ 
          error: 'Request body is required with at least one field to update' 
        }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: error.message 
      }, { status: 400 });
    }
    
    // Find the user to be updated
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // List of allowed fields to update
    const allowedUpdates = ['name', 'email', 'timezone', 'role', 'team_id'];
    
    // Filter out any fields that aren't in allowedUpdates
    const filteredUpdateData = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    // If no valid fields to update
    if (Object.keys(filteredUpdateData).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update. Allowed fields: ' + allowedUpdates.join(', ')
      }, { status: 400 });
    }

    // If updating team_id, handle team membership
    if (filteredUpdateData.team_id) {
      // Validate that the new team exists
      const newTeam = await Team.findById(filteredUpdateData.team_id);
      if (!newTeam) {
        return NextResponse.json({ 
          error: 'New team not found' 
        }, { status: 400 });
      }

      // Remove from old team if exists
      if (userToUpdate.team_id) {
        await Team.updateOne(
          { _id: userToUpdate.team_id },
          { $pull: { members: { userId: userToUpdate._id } } }
        );
      }
      
      // Add to new team
      await Team.updateOne(
        { _id: filteredUpdateData.team_id },
        { $addToSet: { members: { userId: userToUpdate._id } } }
      );
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: filteredUpdateData },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from response

    return NextResponse.json({ 
      message: 'Member updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ 
      error: 'Failed to update member',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT handler
export async function PUT(request, { params }) {
  return updateUser(request, params);
}

// PATCH handler
export async function PATCH(request, { params }) {
  return updateUser(request, params);
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Extract id from params - must await params in App Router
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // Find the user to be deleted
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves - fix comparison
    if (userToDelete._id.toString() === session.user.id.toString()) {
      return NextResponse.json({ 
        error: 'You cannot delete your own account' 
      }, { status: 400 });
    }

    // Remove user from any teams they belong to
    if (userToDelete.team_id) {
      await Team.updateOne(
        { _id: userToDelete.team_id },
        { $pull: { members: { userId: userToDelete._id } } }
      );
    }

    // Delete any standups submitted by this user
    await Standup.deleteMany({ userId: userToDelete._id });

    // Delete the user
    await User.findByIdAndDelete(id);

    return NextResponse.json({ 
      message: 'Member deleted successfully',
      deletedUserId: id 
    });

  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ 
      error: 'Failed to delete member',
      details: error.message 
    }, { status: 500 });
  }
} 