'use client'

import { useTransition } from 'react'
import type { StaffTask } from '@prisma/client'
import { completeTask } from './actions'

export function TaskItem({ task }: { task: StaffTask }) {
  const [pending, startTransition] = useTransition()

  return (
    <li className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={Boolean(task.completedAt)}
        disabled={pending || Boolean(task.completedAt)}
        onChange={() => startTransition(() => completeTask(task.id))}
      />
      <span className={task.completedAt ? 'text-gray-400 line-through' : 'text-gray-800'}>{task.title}</span>
      {task.dueAt && <span className="ml-auto text-xs text-gray-400">{new Date(task.dueAt).toLocaleDateString()}</span>}
    </li>
  )
}
