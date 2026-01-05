import DashboardPageLayout from "@/components/dashboard/layout"
import AtomIcon from "@/components/icons/atom"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function RewardsPage() {
  const rewards = [
    {
      id: 1,
      name: "Extended Cuddle Session",
      loveLanguage: "Physical Touch",
      cost: 75,
      tier: "Weekly",
      description: "One hour of uninterrupted cuddle time with your favorite movie or show.",
      available: true,
    },
    {
      id: 2,
      name: "Detailed Praise Message",
      loveLanguage: "Words of Affirmation",
      cost: 25,
      tier: "Daily",
      description: "Personalized message highlighting specific behaviors and growth noticed.",
      available: true,
    },
    {
      id: 3,
      name: "Breakfast in Bed",
      loveLanguage: "Acts of Service",
      cost: 100,
      tier: "Weekly",
      description: "Your favorite breakfast prepared and served in bed on a weekend morning.",
      available: true,
    },
    {
      id: 4,
      name: "Date Night Planning",
      loveLanguage: "Quality Time",
      cost: 200,
      tier: "Monthly",
      description: "Complete date night planned and executed based on your interests.",
      available: true,
    },
  ]

  const currentPoints = 385

  const getLoveLanguageColor = (language: string) => {
    switch (language) {
      case "Words of Affirmation":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "Quality Time":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "Acts of Service":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "Physical Touch":
        return "bg-pink-500/10 text-pink-500 border-pink-500/20"
      case "Thoughtful Gifts":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Rewards",
        description: "Meaningful recognition for your dedication",
        icon: AtomIcon,
      }}
    >
      <Card className="p-6 mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-4xl font-display text-primary">{currentPoints}</p>
            <p className="text-xs text-muted-foreground mt-1">points available</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
            <p className="text-4xl font-display">7</p>
            <p className="text-xs text-muted-foreground mt-1">days</p>
          </div>
        </div>
      </Card>

      <div className="mb-4">
        <h2 className="text-xl font-display mb-2">Available Rewards</h2>
        <p className="text-sm text-muted-foreground">
          Redeem points for meaningful recognition based on the five love languages
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rewards.map((reward) => (
          <Card key={reward.id} className="p-6 bg-sidebar border-border hover:bg-sidebar-accent/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-display">{reward.name}</h3>
                  <Badge className={getLoveLanguageColor(reward.loveLanguage)} variant="outline">
                    {reward.loveLanguage}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-primary font-medium">{reward.cost} points</span>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="outline" className="text-xs">
                    {reward.tier}
                  </Badge>
                </div>
              </div>
              <Button size="sm" disabled={currentPoints < reward.cost} className="shrink-0 ml-4">
                {currentPoints >= reward.cost ? "Redeem" : "Locked"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💝</div>
          <div>
            <h3 className="text-lg font-display mb-1">About Meaningful Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Points track progress, but meaningful recognition matters most. Your Dominant can provide rewards based on
              your love language at any time, regardless of points. The point system is an additional layer of
              gamification for submissives who enjoy tracking progress.
            </p>
          </div>
        </div>
      </Card>
    </DashboardPageLayout>
  )
}
