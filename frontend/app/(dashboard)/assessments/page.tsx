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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Brain,
  Eye,
  MessageSquare,
  Loader2,
  Plus,
  Camera,
  Home,
  X,
} from "lucide-react"
import { getAssessments, formatCurrency, createAssessment, type CreateAssessmentRequest, type AssessmentResult } from "@/lib/data/api"
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

const initialFormData: CreateAssessmentRequest = {
  loan_id: "",
  customer_number: "",
  principal_amount: 0,
  outstanding_amount: 0,
  dpd: 0,
  marital_status: "single",
  date_of_birth: "1990-01-01",
  field_agent_notes: "",
  business_image_base64: undefined,
  home_image_base64: undefined,
}

interface ImageState {
  business: { base64: string; preview: string } | null;
  home: { base64: string; preview: string } | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<CreditAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<CreateAssessmentRequest>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [images, setImages] = useState<ImageState>({ business: null, home: null })

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

  useEffect(() => {
    fetchData()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      const assessmentResult = await createAssessment(formData)
      setResult(assessmentResult)
      // Refresh the list after successful creation
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assessment")
    } finally {
      setSubmitting(false)
    }
  }

  function handleInputChange(field: keyof CreateAssessmentRequest, value: string | number) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleImageUpload(type: 'business' | 'home', file: File | null) {
    if (!file) {
      setImages(prev => ({ ...prev, [type]: null }));
      setFormData(prev => ({
        ...prev,
        [type === 'business' ? 'business_image_base64' : 'home_image_base64']: undefined,
      }));
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const preview = URL.createObjectURL(file);
      setImages(prev => ({ ...prev, [type]: { base64, preview } }));
      setFormData(prev => ({
        ...prev,
        [type === 'business' ? 'business_image_base64' : 'home_image_base64']: base64,
      }));
    } catch (err) {
      console.error('Failed to process image:', err);
    }
  }

  function removeImage(type: 'business' | 'home') {
    if (images[type]?.preview) {
      URL.revokeObjectURL(images[type]!.preview);
    }
    setImages(prev => ({ ...prev, [type]: null }));
    setFormData(prev => ({
      ...prev,
      [type === 'business' ? 'business_image_base64' : 'home_image_base64']: undefined,
    }));
  }

  function resetForm() {
    // Clean up image preview URLs
    if (images.business?.preview) URL.revokeObjectURL(images.business.preview);
    if (images.home?.preview) URL.revokeObjectURL(images.home.preview);
    setFormData(initialFormData)
    setImages({ business: null, home: null })
    setResult(null)
  }

  const filteredAssessments = assessments.filter((assessment) =>
    (assessment.purpose?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (assessment.customer_number?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  // Count by risk category
  const lowRiskCount = assessments.filter((a) => a.risk_category === "LOW").length
  const mediumRiskCount = assessments.filter((a) => a.risk_category === "MEDIUM").length
  const highRiskCount = assessments.filter((a) => a.risk_category === "HIGH" || a.risk_category === "VERY_HIGH").length

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
            {lowRiskCount} Low Risk
          </Badge>
          <Badge variant="outline" className="bg-yellow-50">
            {mediumRiskCount} Medium Risk
          </Badge>
          <Badge variant="outline" className="bg-red-50">
            {highRiskCount} High Risk
          </Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Credit Assessment</DialogTitle>
              <DialogDescription>
                Enter loan and customer details to run AI-powered credit risk assessment
              </DialogDescription>
            </DialogHeader>

            {result ? (
              <div className="space-y-4">
                <Card className={result.risk_category === "LOW" ? "border-green-500" : result.risk_category === "MEDIUM" ? "border-yellow-500" : "border-red-500"}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      Assessment Result
                      <Badge variant={getRiskBadgeVariant(result.risk_category)}>
                        {result.risk_category} RISK
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-muted rounded-lg">
                        <Brain className="size-4 mx-auto mb-1 text-purple-500" />
                        <div className="text-xs text-muted-foreground">ML Score</div>
                        <div className="text-xl font-bold">{(result.ml_score.probability_of_default * 100).toFixed(1)}%</div>
                      </div>
                      {result.vision_score && (
                        <div className="p-3 bg-muted rounded-lg">
                          <Eye className="size-4 mx-auto mb-1 text-blue-500" />
                          <div className="text-xs text-muted-foreground">Vision Score</div>
                          <div className="text-xl font-bold">{(result.vision_score.combined_score * 100).toFixed(1)}%</div>
                          {(result.vision_score.business_score || result.vision_score.home_score) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {result.vision_score.business_score && `Biz: ${(result.vision_score.business_score * 100).toFixed(0)}%`}
                              {result.vision_score.business_score && result.vision_score.home_score && ' | '}
                              {result.vision_score.home_score && `Home: ${(result.vision_score.home_score * 100).toFixed(0)}%`}
                            </div>
                          )}
                        </div>
                      )}
                      {result.nlp_score && (
                        <div className="p-3 bg-muted rounded-lg">
                          <MessageSquare className="size-4 mx-auto mb-1 text-green-500" />
                          <div className="text-xs text-muted-foreground">NLP Score</div>
                          <div className="text-xl font-bold">{(result.nlp_score.sentiment_score * 100).toFixed(1)}%</div>
                        </div>
                      )}
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground">Final Risk</div>
                        <div className="text-xl font-bold">{(result.final_risk_score * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium mb-1">Explanation</div>
                      <p className="text-sm text-muted-foreground">{result.explanation}</p>
                    </div>
                  </CardContent>
                </Card>
                <DialogFooter>
                  <Button variant="outline" onClick={resetForm}>Create Another</Button>
                  <Button onClick={() => setDialogOpen(false)}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loan_id">Loan ID *</Label>
                    <Input
                      id="loan_id"
                      placeholder="LN123456"
                      value={formData.loan_id}
                      onChange={(e) => handleInputChange("loan_id", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_number">Customer Number *</Label>
                    <Input
                      id="customer_number"
                      placeholder="CUST001"
                      value={formData.customer_number}
                      onChange={(e) => handleInputChange("customer_number", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal_amount">Principal Amount (IDR) *</Label>
                    <Input
                      id="principal_amount"
                      type="number"
                      placeholder="5000000"
                      value={formData.principal_amount || ""}
                      onChange={(e) => handleInputChange("principal_amount", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outstanding_amount">Outstanding Amount (IDR) *</Label>
                    <Input
                      id="outstanding_amount"
                      type="number"
                      placeholder="3000000"
                      value={formData.outstanding_amount || ""}
                      onChange={(e) => handleInputChange("outstanding_amount", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dpd">Days Past Due *</Label>
                    <Input
                      id="dpd"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.dpd}
                      onChange={(e) => handleInputChange("dpd", parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marital_status">Marital Status *</Label>
                    <Select
                      value={formData.marital_status}
                      onValueChange={(value) => handleInputChange("marital_status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field_agent_notes">Field Agent Notes (Optional)</Label>
                  <Textarea
                    id="field_agent_notes"
                    placeholder="Enter any observations from field visit..."
                    value={formData.field_agent_notes || ""}
                    onChange={(e) => handleInputChange("field_agent_notes", e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Notes will be analyzed by NLP module for sentiment and risk indicators</p>
                </div>

                <div className="space-y-2">
                  <Label>Photo Evidence (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload photos for Gemini Vision AI analysis of business and home conditions
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Business Photo */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Camera className="size-4" />
                        Business Photo
                      </div>
                      {images.business ? (
                        <div className="relative">
                          <img
                            src={images.business.preview}
                            alt="Business preview"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('business')}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                          <Camera className="size-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground">Click to upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload('business', e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>

                    {/* Home Photo */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Home className="size-4" />
                        Home Photo
                      </div>
                      {images.home ? (
                        <div className="relative">
                          <img
                            src={images.home.preview}
                            alt="Home preview"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('home')}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                          <Home className="size-8 text-muted-foreground mb-2" />
                          <span className="text-xs text-muted-foreground">Click to upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload('home', e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="size-4 mr-2" />
                        Run Assessment
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
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
          {filteredAssessments.map((assessment) => (
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
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {assessment.final_score ? (assessment.final_score * 100).toFixed(0) : "N/A"}%
                      </div>
                      <div className="text-xs text-muted-foreground">Risk Score</div>
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
