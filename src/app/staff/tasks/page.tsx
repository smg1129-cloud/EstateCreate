import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createTask } from './actions'
import { TaskItem } from './TaskItem'

export default async function StaffTasksPage() {
  const session = await getServerSession(authOptions)

  const tasks = await db.staffTask.findMany({
    where: { assignedToId: session!.user.id },
    orderBy: [{ completedAt: 'asc' }, { dueAt: 'asc' }],
  })

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-gray-900">Your tasks</h1>

      <form action={createTask} className="mt-6 flex gap-2">
        <input
          name="title"
          required
          placeholder="New task…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input name="dueAt" type="date" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Add
        </button>
      </form>

      <ul className="mt-6 space-y-2">
        {tasks.map((t) => (
          <TaskItem key={t.id} task={t} />
        ))}
        {tasks.length === 0 && <p className="text-sm text-gray-500">No tasks.</p>}
      </ul>
    </div>
  )
}
