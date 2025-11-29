"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Banknote,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react"
import { getDashboardStats, getAssessments, formatCurrency } from "@/lib/data/api"
import type { DashboardStats, CreditAssessment } from "@/lib/types"

function getRiskBadgeVariant(risk: string | null) {
  switch (risk) {
    case "LOW":
      return "default"
    case "MEDIUM":
      return "secondary"
    case "HIGH":
    case "VERY_HIGH":
      return "destructive"
    default:
      return "outline"
  }
}

function getRecommendationIcon(rec: string | null) {
  switch (rec) {
    case "APPROVE":
      return <CheckCircle className="size-4 text-green-500" />
    case "REVIEW":
      return <Clock className="size-4 text-yellow-500" />
    case "DECLINE":
    case "REJECT":
      return <XCircle className="size-4 text-red-500" />
    default:
      return null
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [assessments, setAssessments] = useState<CreditAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, assessmentsData] = await Promise.all([
          getDashboardStats(),
          getAssessments(5, 0),
        ])
        setStats(statsData)
        setAssessments(assessmentsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered credit risk analysis for microfinance lending
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {error || "No data available. Start by creating assessments."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalAssessments = stats.low_risk_count + stats.medium_risk_count + stats.high_risk_count

  const statCards = [
    {
      title: "Total Borrowers",
      value: stats.total_borrowers.toLocaleString(),
      icon: Users,
      description: "Active microfinance clients",
    },
    {
      title: "Total Outstanding",
      value: formatCurrency(stats.total_outstanding),
      icon: Banknote,
      description: "Across all active loans",
    },
    {
      title: "Avg. Credit Score",
      value: stats.avg_credit_score.toFixed(1),
      icon: TrendingUp,
      description: "AI-powered assessment",
    },
    {
      title: "High Risk",
      value: stats.high_risk_count.toString(),
      icon: AlertTriangle,
      description: "Require attention",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          AI-powered credit risk analysis for microfinance lending
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>
              Credit risk categories across all assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-green-500" />
                  <span className="text-sm">Low Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.low_risk_count}</span>
                  <span className="text-sm text-muted-foreground">
                    ({totalAssessments > 0 ? Math.round((stats.low_risk_count / totalAssessments) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${totalAssessments > 0 ? (stats.low_risk_count / totalAssessments) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Medium Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.medium_risk_count}</span>
                  <span className="text-sm text-muted-foreground">
                    ({totalAssessments > 0 ? Math.round((stats.medium_risk_count / totalAssessments) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${totalAssessments > 0 ? (stats.medium_risk_count / totalAssessments) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-red-500" />
                  <span className="text-sm">High Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.high_risk_count}</span>
                  <span className="text-sm text-muted-foreground">
                    ({totalAssessments > 0 ? Math.round((stats.high_risk_count / totalAssessments) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${totalAssessments > 0 ? (stats.high_risk_count / totalAssessments) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>Latest AI credit evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No assessments yet
              </p>
            ) : (
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between space-x-4"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {assessment.purpose || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Score: {assessment.final_score?.toFixed(1) || "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRecommendationIcon(assessment.recommendation)}
                      <Badge variant={getRiskBadgeVariant(assessment.risk_category)}>
                        {assessment.risk_category || "N/A"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-500" />
                  <span className="text-sm">Approve</span>
                </div>
                <span className="font-bold">{stats.approve_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-yellow-500" />
                  <span className="text-sm">Review</span>
                </div>
                <span className="font-bold">{stats.review_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="size-4 text-red-500" />
                  <span className="text-sm">Decline</span>
                </div>
                <span className="font-bold">{stats.decline_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Score Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ML Model</span>
                <span className="font-medium">70%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vision Analysis</span>
                <span className="font-medium">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">NLP Analysis</span>
                <span className="font-medium">15%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Loan Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Loans</span>
                <span className="font-medium">{stats.active_loans}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current (DPD 0)</span>
                <span className="font-medium">{stats.current_loans}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Past Due</span>
                <span className="font-medium">{stats.past_due_loans}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
