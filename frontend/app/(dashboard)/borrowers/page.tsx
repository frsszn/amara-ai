import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Banknote, AlertCircle } from "lucide-react"
import {
  customers,
  loanSnapshots,
  creditAssessments,
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

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export default function BorrowersPage() {
  // Combine customer data with loan and assessment info
  const borrowersWithDetails = customers.map((customer) => {
    const loan = loanSnapshots.find(
      (l) => l.customer_number === customer.customer_number
    )
    const assessment = loan
      ? creditAssessments.find((a) => a.loan_id === loan.loan_id)
      : undefined

    return {
      ...customer,
      loan,
      assessment,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Borrowers</h1>
        <p className="text-muted-foreground">
          Manage and view all microfinance borrowers
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by purpose or ID..."
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="text-sm">
          {customers.length} Borrowers
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {borrowersWithDetails.map((borrower) => (
          <Card key={borrower.customer_number} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{borrower.purpose}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {borrower.customer_number.substring(0, 12)}...
                  </CardDescription>
                </div>
                {borrower.assessment && (
                  <Badge variant={getRiskBadgeVariant(borrower.assessment.risk_category)}>
                    {borrower.assessment.risk_category}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-3.5" />
                  <span>Age: {calculateAge(borrower.date_of_birth)}</span>
                </div>
                <div className="text-muted-foreground">
                  {borrower.marital_status}
                </div>
              </div>

              {borrower.loan && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Banknote className="size-3.5" />
                      Principal
                    </span>
                    <span className="font-medium">
                      {formatCurrency(borrower.loan.principal_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Outstanding</span>
                    <span className="font-medium">
                      {formatCurrency(borrower.loan.outstanding_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <AlertCircle className="size-3.5" />
                      DPD
                    </span>
                    <span
                      className={`font-medium ${
                        borrower.loan.dpd > 0 ? "text-red-500" : "text-green-500"
                      }`}
                    >
                      {borrower.loan.dpd} days
                    </span>
                  </div>
                </div>
              )}

              {borrower.assessment && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Credit Score</span>
                    <span className="font-bold text-lg">
                      {borrower.assessment.final_score.toFixed(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-xs text-center">
                    <div className="bg-muted rounded p-1">
                      <div className="text-muted-foreground">ML</div>
                      <div className="font-medium">{borrower.assessment.ml_score}</div>
                    </div>
                    <div className="bg-muted rounded p-1">
                      <div className="text-muted-foreground">Vision</div>
                      <div className="font-medium">{borrower.assessment.vision_score}</div>
                    </div>
                    <div className="bg-muted rounded p-1">
                      <div className="text-muted-foreground">NLP</div>
                      <div className="font-medium">{borrower.assessment.nlp_score}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
