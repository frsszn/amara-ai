// Amara AI - Credit Assessment Types

export interface Customer {
  customer_number: string
  date_of_birth: string
  marital_status: "MARRIED" | "SINGLE" | "DIVORCED" | "WIDOWED"
  religion: number
  purpose: string
}

export interface LoanSnapshot {
  loan_id: string
  customer_number: string
  principal_amount: number
  outstanding_amount: number
  dpd: number // Days Past Due
}

export interface CreditAssessment {
  id: number
  customer_number: string
  loan_id: string
  final_score: number
  ml_score: number
  vision_score: number
  nlp_score: number
  risk_category: "LOW" | "MEDIUM" | "HIGH"
  recommendation: "APPROVE" | "REVIEW" | "DECLINE"
  assessed_at: string
}

export interface BorrowerWithLoan extends Customer {
  loan?: LoanSnapshot
  assessment?: CreditAssessment
}

// Dashboard Statistics
export interface DashboardStats {
  totalBorrowers: number
  totalLoans: number
  totalOutstanding: number
  averageScore: number
  riskDistribution: {
    low: number
    medium: number
    high: number
  }
  recommendationDistribution: {
    approve: number
    review: number
    decline: number
  }
}
