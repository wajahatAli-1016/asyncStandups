import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import connectDB from '@/lib/db';
import Standup from '@/models/Standup';

export async function POST(req) {
  try {
    // Get user token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), 'public/uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    // Parse form data
    const formData = await req.formData();
    const files = formData.getAll('files');
    
    // Handle file uploads
    const uploadedFiles = [];
    for (const file of files) {
      if (file instanceof File) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = join(uploadDir, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);
        
        uploadedFiles.push({
          fileName,
          fileType: file.type,
          fileUrl: `/uploads/${fileName}`
        });
      }
    }

    // Format date as YYYY-MM-DD
    const today = new Date();
    const date = today.toISOString().split('T')[0];

    // Connect to database
    await connectDB();

    // Create standup entry
    const standup = await Standup.create({
      userId: token.id,
      teamId: token.team_id,
      date: date,
      textResponse: {
        yesterday: formData.get('yesterday'),
        today: formData.get('today'),
        blockers: formData.get('blockers')
      },
      media: uploadedFiles
    });

    return NextResponse.json(standup);
  } catch (error) {
    console.error('Standup submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 