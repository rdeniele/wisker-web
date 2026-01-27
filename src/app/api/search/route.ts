import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search?q=query
 * Search subjects and notes
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.trim();

    // Search subjects
    const subjects = await prisma.subject.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    // Search notes
    const notes = await prisma.note.findMany({
      where: {
        subject: {
          userId: user.id,
        },
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { rawContent: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        subjectId: true,
        updatedAt: true,
        subject: {
          select: {
            title: true,
          },
        },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    // Format results
    const results = [
      ...subjects.map((subject) => ({
        id: subject.id,
        title: subject.title,
        type: 'subject' as const,
        lastAccessed: new Date(subject.updatedAt).toLocaleDateString(),
      })),
      ...notes.map((note) => ({
        id: note.subjectId,
        title: note.title,
        type: 'note' as const,
        subjectName: note.subject.title,
        lastAccessed: new Date(note.updatedAt).toLocaleDateString(),
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}
