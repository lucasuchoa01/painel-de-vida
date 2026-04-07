import { Task, SkipReason } from '../types'
import TaskItem from './TaskItem'

interface Props {
  tasks: Task[]
  onComplete: (id: string) => void
  onSkip: (id: string, reason: SkipReason) => void
  onDelete: (id: string) => void
  emptyMessage?: string
}

export default function TaskList({ tasks, onComplete, onSkip, onDelete, emptyMessage }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">◻</div>
        <div>{emptyMessage ?? 'Nenhuma tarefa aqui.'}</div>
      </div>
    )
  }

  return (
    <div>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onComplete={onComplete}
          onSkip={onSkip}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
