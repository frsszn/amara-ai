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
import { Input } from "@/components/ui/input"
import {
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Brain,
  Eye,
  MessageSquare,
  Loader2,
} from "lucide-react"
import { getAssessments, formatCurrency } from "@/lib/data/api"
import type { CreditAssessment } from "@/lib/types"

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

function getRecommendationDetails(rec: string | null) {
  switch (rec) {
    case "APPROVE":
      return {
        icon: CheckCircle,
        color: "text-green-500",
        bg: "bg-green-50",
        label: "Approved",
      }
    case "REVIEW":
      return {
        icon: Clock,
        color: "text-yellow-500",
        bg: "bg-yellow-50",
        label: "Under Review",
      }
    case "DECLINE":
    case "REJECT":
      return {
        icon: XCircle,
        color: "text-red-500",
        bg: "bg-red-50",
        label: "Declined",
      }
    default:
      return {
        icon: Clock,
        color: "text-gray-500",
        bg: "bg-gray-50",
        label: "Unknown",
      }
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<CreditAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAssessments()
        setAssessments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assessments")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredAssessments = assessments.filter((assessment) =>
    (assessment.purpose?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (assessment.customer_number?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  const approveCount = assessments.filter((a) => a.recommendation === "APPROVE").length
  const reviewCount = assessments.filter((a) => a.recommendation === "REVIEW").length
  const declineCount = assessments.filter((a) => a.recommendation === "REJECT" || a.recommendation === "DECLINE").length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground">
            AI-powered credit risk evaluations history
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground">
          AI-powered credit risk evaluations history
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search assessments..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50">
            {approveCount} Approved
          </Badge>
          <Badge variant="outline" className="bg-yellow-50">
            {reviewCount} Review
          </Badge>
          <Badge variant="outline" className="bg-red-50">
            {declineCount} Declined
          </Badge>
        </div>
      </div>

      {filteredAssessments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {searchTerm ? "No assessments match your search" : "No assessments found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => {
            const recDetails = getRecommendationDetails(assessment.recommendation)
            const RecIcon = recDetails.icon

            return (
              <Card key={assessment.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {assessment.purpose || "Unknown Purpose"}
                        <Badge variant={getRiskBadgeVariant(assessment.risk_category)}>
                          {assessment.risk_category || "N/A"} RISK
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Assessment #{assessment.id.substring(0, 8)} | {formatDate(assessment.assessed_at)}
                      </CardDescription>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${recDetails.bg}`}
                    >
                      <RecIcon className={`size-4 ${recDetails.color}`} />
                      <span className={`text-sm font-medium ${recDetails.color}`}>
                        {recDetails.label}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Score Breakdown</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <Brain className="size-5 mx-auto mb-1 text-purple-500" />
                            <div className="text-xs text-muted-foreground">ML Model</div>
                            <div className="text-lg font-bold">{assessment.ml_score?.toFixed(1) || "N/A"}</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <Eye className="size-5 mx-auto mb-1 text-blue-500" />
                            <div className="text-xs text-muted-foreground">Vision</div>
                            <div className="text-lg font-bold">{assessment.vision_score?.toFixed(1) || "N/A"}</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <MessageSquare className="size-5 mx-auto mb-1 text-green-500" />
                            <div className="text-xs text-muted-foreground">NLP</div>
                            <div className="text-lg font-bold">{assessment.nlp_score?.toFixed(1) || "N/A"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Final Score</span>
                        <span className="text-3xl font-bold">
                          {assessment.final_score?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Loan Details</h4>
                      {assessment.loan_id ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Principal Amount</span>
                            <span className="font-medium">
                              {assessment.principal_amount ? formatCurrency(assessment.principal_amount) : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Outstanding</span>
                            <span className="font-medium">
                              {assessment.outstanding_amount ? formatCurrency(assessment.outstanding_amount) : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Days Past Due</span>
                            <span
                              className={`font-medium ${
                                (assessment.dpd || 0) > 0 ? "text-red-500" : "text-green-500"
                              }`}
                            >
                              {assessment.dpd ?? 0} days
                            </span>
                          </div>
                          {assessment.principal_amount && assessment.outstanding_amount && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Repayment Progress</span>
                              <span className="font-medium">
                                {Math.round(
                                  ((assessment.principal_amount - assessment.outstanding_amount) /
                                    assessment.principal_amount) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Loan details not available
                        </p>
                      )}

                      <div className="pt-2">
                        <h4 className="text-sm font-medium mb-2">Customer Info</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span>{assessment.marital_status || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ID</span>
                            <span className="font-mono text-xs">
                              {assessment.customer_number?.substring(0, 16) || "N/A"}...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
