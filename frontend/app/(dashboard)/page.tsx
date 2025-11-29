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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  getDashboardStats,
  getAssessments,
  formatCurrency,
  getRiskDistribution,
  getAgeDistribution,
  getLoanStatus,
  getRecommendations,
  type ChartDataPoint,
} from "@/lib/data/api"
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

const RISK_COLORS: Record<string, string> = {
  LOW: "hsl(142, 76%, 36%)",
  MEDIUM: "hsl(45, 93%, 47%)",
  HIGH: "hsl(0, 84%, 60%)",
  VERY_HIGH: "hsl(0, 72%, 51%)",
}

const AGE_COLORS: Record<string, string> = {
  young: "hsl(210, 100%, 50%)",
  adult: "hsl(142, 76%, 36%)",
  mature: "hsl(45, 93%, 47%)",
  senior: "hsl(280, 65%, 60%)",
}

const LOAN_STATUS_COLORS: Record<string, string> = {
  CURRENT: "hsl(142, 76%, 36%)",
  PAST_DUE: "hsl(0, 84%, 60%)",
  CLOSED: "hsl(215, 20%, 65%)",
}

const RECOMMENDATION_COLORS: Record<string, string> = {
  APPROVE: "hsl(142, 76%, 36%)",
  REVIEW: "hsl(45, 93%, 47%)",
  REJECT: "hsl(0, 84%, 60%)",
}

const riskChartConfig = {
  LOW: { label: "Low Risk", color: RISK_COLORS.LOW },
  MEDIUM: { label: "Medium Risk", color: RISK_COLORS.MEDIUM },
  HIGH: { label: "High Risk", color: RISK_COLORS.HIGH },
  VERY_HIGH: { label: "Very High Risk", color: RISK_COLORS.VERY_HIGH },
}

const ageChartConfig = {
  young: { label: "Young (18-25)", color: AGE_COLORS.young },
  adult: { label: "Adult (26-35)", color: AGE_COLORS.adult },
  mature: { label: "Mature (36-50)", color: AGE_COLORS.mature },
  senior: { label: "Senior (51+)", color: AGE_COLORS.senior },
}

const loanStatusChartConfig = {
  CURRENT: { label: "Current", color: LOAN_STATUS_COLORS.CURRENT },
  PAST_DUE: { label: "Past Due", color: LOAN_STATUS_COLORS.PAST_DUE },
  CLOSED: { label: "Closed", color: LOAN_STATUS_COLORS.CLOSED },
}

const recommendationChartConfig = {
  APPROVE: { label: "Approve", color: RECOMMENDATION_COLORS.APPROVE },
  REVIEW: { label: "Review", color: RECOMMENDATION_COLORS.REVIEW },
  REJECT: { label: "Reject", color: RECOMMENDATION_COLORS.REJECT },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [assessments, setAssessments] = useState<CreditAssessment[]>([])
  const [riskData, setRiskData] = useState<ChartDataPoint[]>([])
  const [ageData, setAgeData] = useState<ChartDataPoint[]>([])
  const [loanStatusData, setLoanStatusData] = useState<ChartDataPoint[]>([])
  const [recommendationData, setRecommendationData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, assessmentsData, riskDistribution, ageDistribution, loanStatus, recommendations] = await Promise.all([
          getDashboardStats(),
          getAssessments(5, 0),
          getRiskDistribution().catch(() => []),
          getAgeDistribution().catch(() => []),
          getLoanStatus().catch(() => []),
          getRecommendations().catch(() => []),
        ])
        setStats(statsData)
        setAssessments(assessmentsData)
        setRiskData(riskDistribution)
        setAgeData(ageDistribution)
        setLoanStatusData(loanStatus)
        setRecommendationData(recommendations)
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

      {/* Stat Cards */}
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

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Risk Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>
              Credit risk categories across all assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {riskData.length > 0 ? (
              <ChartContainer config={riskChartConfig} className="h-[300px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={riskData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {riskData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={RISK_COLORS[entry.name] || "hsl(215, 20%, 65%)"}
                      />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Age Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
            <CardDescription>
              Borrowers by age group
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ageData.length > 0 ? (
              <ChartContainer config={ageChartConfig} className="h-[300px]">
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(value) => {
                      const labels: Record<string, string> = {
                        young: "18-25",
                        adult: "26-35",
                        mature: "36-50",
                        senior: "51+",
                      }
                      return labels[value] || value
                    }}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {ageData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={AGE_COLORS[entry.name] || "hsl(215, 20%, 65%)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Loan Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Status</CardTitle>
            <CardDescription>
              Distribution of loan statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loanStatusData.length > 0 ? (
              <ChartContainer config={loanStatusChartConfig} className="h-[300px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={loanStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {loanStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={LOAN_STATUS_COLORS[entry.name] || "hsl(215, 20%, 65%)"}
                      />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Recommendations</CardTitle>
            <CardDescription>
              AI-powered loan decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendationData.length > 0 ? (
              <ChartContainer config={recommendationChartConfig} className="h-[300px]">
                <BarChart data={recommendationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {recommendationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={RECOMMENDATION_COLORS[entry.name] || "hsl(215, 20%, 65%)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Assessments and Portfolio Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
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

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
            <CardDescription>Loan portfolio overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
              <hr className="border-muted" />
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
