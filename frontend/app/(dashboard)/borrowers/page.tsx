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
import { Search, Calendar, Banknote, AlertCircle, Loader2 } from "lucide-react"
import { getBorrowers, formatCurrency, calculateAge } from "@/lib/data/api"
import type { Borrower } from "@/lib/types"

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

export default function BorrowersPage() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getBorrowers()
        setBorrowers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load borrowers")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredBorrowers = borrowers.filter((borrower) =>
    (borrower.purpose?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    borrower.customer_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold tracking-tight">Borrowers</h1>
          <p className="text-muted-foreground">
            Manage and view all microfinance borrowers
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredBorrowers.length} Borrowers
        </Badge>
      </div>

      {filteredBorrowers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {searchTerm ? "No borrowers match your search" : "No borrowers found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBorrowers.map((borrower) => (
            <Card key={borrower.customer_number} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{borrower.purpose || "Unknown"}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {borrower.customer_number.substring(0, 12)}...
                    </CardDescription>
                  </div>
                  {borrower.risk_category && (
                    <Badge variant={getRiskBadgeVariant(borrower.risk_category)}>
                      {borrower.risk_category}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span>
                      Age: {borrower.date_of_birth ? calculateAge(borrower.date_of_birth) || "N/A" : "N/A"}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {borrower.marital_status || "N/A"}
                  </div>
                </div>

                {borrower.loan_id && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Banknote className="size-3.5" />
                        Principal
                      </span>
                      <span className="font-medium">
                        {borrower.principal_amount ? formatCurrency(borrower.principal_amount) : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-medium">
                        {borrower.outstanding_amount ? formatCurrency(borrower.outstanding_amount) : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <AlertCircle className="size-3.5" />
                        DPD
                      </span>
                      <span
                        className={`font-medium ${
                          (borrower.dpd || 0) > 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {borrower.dpd ?? 0} days
                      </span>
                    </div>
                  </div>
                )}

                {borrower.final_score !== null && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Credit Score</span>
                      <span className="font-bold text-lg">
                        {borrower.final_score?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs text-center">
                      <div className="bg-muted rounded p-1">
                        <div className="text-muted-foreground">ML</div>
                        <div className="font-medium">{borrower.ml_score?.toFixed(1) || "N/A"}</div>
                      </div>
                      <div className="bg-muted rounded p-1">
                        <div className="text-muted-foreground">Vision</div>
                        <div className="font-medium">{borrower.vision_score?.toFixed(1) || "N/A"}</div>
                      </div>
                      <div className="bg-muted rounded p-1">
                        <div className="text-muted-foreground">NLP</div>
                        <div className="font-medium">{borrower.nlp_score?.toFixed(1) || "N/A"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
