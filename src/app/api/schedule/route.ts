import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/schedule - Retrieve all daily tasks
export async function GET() {
  try {
    const tasks = await prisma.scheduleTask.findMany({
      orderBy: { created_at: 'asc' },
    });

    return NextResponse.json({ success: true, tasks });
  } catch (err: any) {
    console.error('Error fetching schedule tasks:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule tasks' },
      { status: 500 }
    );
  }
}

// POST /api/schedule - Create a new schedule task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { time_slot, task_title, category = 'general', priority = 'medium', remind_at } = body;

    if (!time_slot || !task_title) {
      return NextResponse.json(
        { success: false, error: 'time_slot and task_title are required' },
        { status: 400 }
      );
    }

    const task = await prisma.scheduleTask.create({
      data: {
        time_slot: time_slot.trim(),
        task_title: task_title.trim(),
        category,
        priority,
        remind_at: remind_at ? new Date(remind_at) : null,
      },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating schedule task:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule task' },
      { status: 500 }
    );
  }
}

// PATCH /api/schedule - Toggle completion or update task
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, is_completed } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.scheduleTask.update({
      where: { id },
      data: {
        is_completed: typeof is_completed === 'boolean' ? is_completed : undefined,
      },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (err: any) {
    console.error('Error updating schedule task:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update schedule task' },
      { status: 500 }
    );
  }
}

// DELETE /api/schedule - Delete a specific task or clear all
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await prisma.scheduleTask.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Task deleted' });
    }

    // Clear all tasks if no ID provided
    const { count } = await prisma.scheduleTask.deleteMany({});
    return NextResponse.json({ success: true, message: `Cleared ${count} schedule tasks` });
  } catch (err: any) {
    console.error('Error deleting schedule task(s):', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule task' },
      { status: 500 }
    );
  }
}
