import DashboardPageLayout from "@/components/dashboard/layout"
import ProcessorIcon from "@/components/icons/proccesor"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function TasksPage() {
  // This would fetch from Notion in a real implementation
  const tasks = [
    {
      id: 1,
      name: "Morning Check-in",
      category: "Daily Routine",
      priority: "Medium",
      points: 5,
      dueDate: "Today",
      status: "Not Started",
    },
    {
      id: 2,
      name: "Evening Report",
      category: "Protocol",
      priority: "High",
      points: 10,
      dueDate: "Today",
      status: "Not Started",
    },
    {
      id: 3,
      name: "Self-care Hour",
      category: "Personal Development",
      priority: "Medium",
      points: 15,
      dueDate: "Today",
      status: "In Progress",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500"
      case "High":
        return "bg-orange-500"
      case "Medium":
        return "bg-yellow-500"
      case "Low":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Tasks",
        description: "Your assigned tasks and protocols",
        icon: ProcessorIcon,
      }}
    >
      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className="p-6 bg-sidebar border-border hover:bg-sidebar-accent/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                  <h3 className="text-xl font-display">{task.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {task.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Due: {task.dueDate}</span>
                  <span>•</span>
                  <span>{task.points} points</span>
                  <span>•</span>
                  <span>{task.status}</span>
                </div>
              </div>
              <Button size="sm" className="shrink-0">
                Complete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💡</div>
          <div>
            <h3 className="text-lg font-display mb-1">Connected to Notion</h3>
            <p className="text-sm text-muted-foreground">
              Tasks are synced with your KINK IT Notion workspace. Add, edit, or complete tasks in Notion to see updates
              here in real-time.
            </p>
          </div>
        </div>
      </Card>
    </DashboardPageLayout>
  )
}
