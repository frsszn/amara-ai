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
} from "lucide-react"
import {
  creditAssessments,
  customers,
  loanSnapshots,
  formatCurrency,
} from "@/lib/data/mock-data"

function getRiskBadgeVariant(risk: string) {
  switch (risk) {
    case "LOW":
      return "default"
    case "MEDIUM":
      return "secondary"
    case "HIGH":
      return "destructive"
    default:
      return "outline"
  }
}

function getRecommendationDetails(rec: string) {
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AssessmentsPage() {
  // Sort assessments by date (newest first)
  const sortedAssessments = [...creditAssessments].sort(
    (a, b) => new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime()
  )

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
          <Input placeholder="Search assessments..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50">
            {creditAssessments.filter((a) => a.recommendation === "APPROVE").length} Approved
          </Badge>
          <Badge variant="outline" className="bg-yellow-50">
            {creditAssessments.filter((a) => a.recommendation === "REVIEW").length} Review
          </Badge>
          <Badge variant="outline" className="bg-red-50">
            {creditAssessments.filter((a) => a.recommendation === "DECLINE").length} Declined
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {sortedAssessments.map((assessment) => {
          const customer = customers.find(
            (c) => c.customer_number === assessment.customer_number
          )
          const loan = loanSnapshots.find((l) => l.loan_id === assessment.loan_id)
          const recDetails = getRecommendationDetails(assessment.recommendation)
          const RecIcon = recDetails.icon

          return (
            <Card key={assessment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {customer?.purpose || "Unknown Purpose"}
                      <Badge variant={getRiskBadgeVariant(assessment.risk_category)}>
                        {assessment.risk_category} RISK
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Assessment #{assessment.id} | {formatDate(assessment.assessed_at)}
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
                          <div className="text-lg font-bold">{assessment.ml_score}</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <Eye className="size-5 mx-auto mb-1 text-blue-500" />
                          <div className="text-xs text-muted-foreground">Vision</div>
                          <div className="text-lg font-bold">{assessment.vision_score}</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <MessageSquare className="size-5 mx-auto mb-1 text-green-500" />
                          <div className="text-xs text-muted-foreground">NLP</div>
                          <div className="text-lg font-bold">{assessment.nlp_score}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Final Score</span>
                      <span className="text-3xl font-bold">
                        {assessment.final_score.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Loan Details</h4>
                    {loan ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Principal Amount</span>
                          <span className="font-medium">
                            {formatCurrency(loan.principal_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Outstanding</span>
                          <span className="font-medium">
                            {formatCurrency(loan.outstanding_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Days Past Due</span>
                          <span
                            className={`font-medium ${
                              loan.dpd > 0 ? "text-red-500" : "text-green-500"
                            }`}
                          >
                            {loan.dpd} days
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Repayment Progress</span>
                          <span className="font-medium">
                            {Math.round(
                              ((loan.principal_amount - loan.outstanding_amount) /
                                loan.principal_amount) *
                                100
                            )}
                            %
                          </span>
                        </div>
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
                          <span>{customer?.marital_status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ID</span>
                          <span className="font-mono text-xs">
                            {assessment.customer_number.substring(0, 16)}...
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
    </div>
  )
}
