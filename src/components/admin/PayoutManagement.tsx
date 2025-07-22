'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, Clock, DollarSign, Users, CreditCard } from 'lucide-react'

interface Payout {
  id: string
  therapistId: string
  totalAmount: number
  commissionCount: number
  status: string
  paymentMethod?: string
  bankAccount?: string
  processedAt?: string
  stripeTransferId?: string
  notes?: string
  createdAt: string
  therapist: {
    name: string
    email: string
    therapistProfile: {
      firstName: string
      lastName: string
    }
  }
  commissions: Array<{
    id: string
    commissionAmount: number
    session: {
      appointment: {
        dateTime: string
      }
    }
  }>
}

export default function PayoutManagement() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [processingPayout, setProcessingPayout] = useState<string | null>(null)
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [stripeTransferId, setStripeTransferId] = useState('')
  const [notes, setNotes] = useState('')
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const { toast } = useToast()

  const loadPayouts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payouts')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payouts')
      }

      setPayouts(data.payouts || [])
    } catch (error) {
      console.error('Failed to load payouts:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลการจ่ายเงินได้',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const createPayoutForTherapist = async (therapistId: string, commissionIds: string[]) => {
    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          commissionIds
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payout')
      }

      toast({
        title: 'สำเร็จ',
        description: 'สร้างการจ่ายเงินสำเร็จ',
      })

      loadPayouts()
    } catch (error) {
      console.error('Failed to create payout:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถสร้างการจ่ายเงินได้',
        variant: 'destructive'
      })
    }
  }

  const processPayout = async () => {
    if (!selectedPayout) return

    try {
      setProcessingPayout(selectedPayout.id)
      
      const response = await fetch(`/api/payouts/${selectedPayout.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stripeTransferId: stripeTransferId || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payout')
      }

      toast({
        title: 'สำเร็จ',
        description: 'ประมวลผลการจ่ายเงินสำเร็จ',
      })

      setShowProcessDialog(false)
      setSelectedPayout(null)
      setStripeTransferId('')
      setNotes('')
      loadPayouts()
    } catch (error) {
      console.error('Failed to process payout:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถประมวลผลการจ่ายเงินได้',
        variant: 'destructive'
      })
    } finally {
      setProcessingPayout(null)
    }
  }

  useEffect(() => {
    loadPayouts()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { label: 'รอดำเนินการ', variant: 'secondary' as const, icon: Clock },
      PROCESSING: { label: 'กำลังประมวลผล', variant: 'outline' as const, icon: Clock },
      COMPLETED: { label: 'เสร็จสิ้น', variant: 'default' as const, icon: CheckCircle },
      FAILED: { label: 'ล้มเหลว', variant: 'destructive' as const, icon: XCircle },
      CANCELLED: { label: 'ยกเลิก', variant: 'destructive' as const, icon: XCircle }
    }
    
    const config = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: 'secondary' as const, 
      icon: Clock 
    }
    
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const pendingPayouts = payouts.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
  const completedPayouts = payouts.filter(p => p.status === 'COMPLETED')
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.totalAmount, 0)
  const totalCompleted = completedPayouts.reduce((sum, p) => sum + p.totalAmount, 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>รอจ่าย</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalPending)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pendingPayouts.length} รายการ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>จ่ายแล้ว (เดือนนี้)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalCompleted)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {completedPayouts.length} รายการ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>นักจิตวิทยา</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(payouts.map(p => p.therapistId)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  ที่มีการจ่ายเงิน
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>เซสชันรวม</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {payouts.reduce((sum, p) => sum + p.commissionCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  เซสชันที่จ่ายคอมมิชชั่น
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Management */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">รอดำเนินการ ({pendingPayouts.length})</TabsTrigger>
          <TabsTrigger value="completed">เสร็จสิ้น ({completedPayouts.length})</TabsTrigger>
          <TabsTrigger value="all">ทั้งหมด ({payouts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>การจ่ายเงินที่รอดำเนินการ</CardTitle>
              <CardDescription>
                รายการการจ่ายเงินที่รอการอนุมัติและประมวลผล
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มีการจ่ายเงินที่รอดำเนินการ
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPayouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {payout.therapist.therapistProfile.firstName} {' '}
                          {payout.therapist.therapistProfile.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payout.therapist.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payout.commissionCount} เซสชัน • สร้างเมื่อ {formatDate(payout.createdAt)}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="font-bold text-lg">
                          {formatCurrency(payout.totalAmount)}
                        </div>
                        {getStatusBadge(payout.status)}
                        <div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayout(payout)
                              setShowProcessDialog(true)
                            }}
                            disabled={processingPayout === payout.id}
                          >
                            {processingPayout === payout.id ? 'กำลังประมวลผล...' : 'ประมวลผล'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>การจ่ายเงินที่เสร็จสิ้น</CardTitle>
              <CardDescription>
                รายการการจ่ายเงินที่ประมวลผลเสร็จแล้ว
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedPayouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ยังไม่มีการจ่ายเงินที่เสร็จสิ้น
                </div>
              ) : (
                <div className="space-y-4">
                  {completedPayouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {payout.therapist.therapistProfile.firstName} {' '}
                          {payout.therapist.therapistProfile.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payout.therapist.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payout.commissionCount} เซสชัน • จ่ายเมื่อ {payout.processedAt ? formatDate(payout.processedAt) : '-'}
                        </div>
                        {payout.stripeTransferId && (
                          <div className="text-xs text-muted-foreground">
                            Stripe Transfer ID: {payout.stripeTransferId}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="font-bold text-lg">
                          {formatCurrency(payout.totalAmount)}
                        </div>
                        {getStatusBadge(payout.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>การจ่ายเงินทั้งหมด</CardTitle>
              <CardDescription>
                รายการการจ่ายเงินทั้งหมดในระบบ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ยังไม่มีการจ่ายเงินในระบบ
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {payout.therapist.therapistProfile.firstName} {' '}
                          {payout.therapist.therapistProfile.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payout.therapist.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payout.commissionCount} เซสชัน • สร้างเมื่อ {formatDate(payout.createdAt)}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="font-bold text-lg">
                          {formatCurrency(payout.totalAmount)}
                        </div>
                        {getStatusBadge(payout.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Payout Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ประมวลผลการจ่ายเงิน</DialogTitle>
            <DialogDescription>
              ยืนยันการจ่ายเงินให้กับ {selectedPayout?.therapist.therapistProfile.firstName} {selectedPayout?.therapist.therapistProfile.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>จำนวนเงิน:</strong> {formatCurrency(selectedPayout?.totalAmount || 0)}
              </div>
              <div>
                <strong>จำนวนเซสชัน:</strong> {selectedPayout?.commissionCount || 0}
              </div>
            </div>
            
            <div>
              <Label htmlFor="stripeTransferId">Stripe Transfer ID (ถ้ามี)</Label>
              <Input
                id="stripeTransferId"
                value={stripeTransferId}
                onChange={(e) => setStripeTransferId(e.target.value)}
                placeholder="tr_..."
              />
            </div>
            
            <div>
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="หมายเหตุเพิ่มเติม..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={processPayout} disabled={processingPayout === selectedPayout?.id}>
              {processingPayout === selectedPayout?.id ? 'กำลังประมวลผล...' : 'ยืนยันการจ่ายเงิน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}