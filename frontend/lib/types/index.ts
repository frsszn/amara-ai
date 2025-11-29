// Amara AI - Credit Assessment Types

export interface Customer {
  customer_number: string
  date_of_birth: string | null
  marital_status: string | null
  religion?: number
  purpose: string | null
}

export interface LoanSnapshot {
  loan_id: string
  customer_number: string
  principal_amount: number
  outstanding_amount: number
  dpd: number // Days Past Due
}

export interface CreditAssessment {
  id: string
  customer_number: string | null
  loan_id: string | null
  final_score: number | null
  ml_score: number | null
  vision_score: number | null
  nlp_score: number | null
  risk_category: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" | null
  assessed_at: string | null
  purpose?: string | null
  principal_amount?: number | null
  outstanding_amount?: number | null
  dpd?: number | null
  marital_status?: string | null
}

export interface Borrower {
  customer_number: string
  date_of_birth: string | null
  marital_status: string | null
  purpose: string | null
  loan_id: string | null
  principal_amount: number | null
  outstanding_amount: number | null
  dpd: number | null
  final_score: number | null
  ml_score: number | null
  vision_score: number | null
  nlp_score: number | null
  risk_category: string | null
}

export interface BorrowerWithLoan extends Customer {
  loan?: LoanSnapshot
  assessment?: CreditAssessment
}

// Dashboard Statistics from Backend
export interface DashboardStats {
  total_borrowers: number
  total_outstanding: number
  avg_credit_score: number
  high_risk_count: number
  low_risk_count: number
  medium_risk_count: number
  active_loans: number
  current_loans: number
  past_due_loans: number
}
