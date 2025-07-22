'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Clock, DollarSign, Users, Play, Zap } from 'lucide-react'

interface PayoutScheduleSummary {
  pendingAmount: number
  pendingCommissions: number
  eligibleTherapists: number
  totalTherapistsWithPending: number
  nextScheduledDate: string
  recentPayouts: Array<{
    id: string
    totalAmount: number
    commissionCount: number
    status: string
    createdAt: string
    therapist: {
      name: string
      therapistProfile: {
        firstName: string
        lastName: string
      }
    }
  }>
}

export default function PayoutScheduler() {
  const [summary, setSummary] = useState<PayoutScheduleSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [actionType, setActionType] = useState<'weekly' | 'individual'>('weekly')
  const { toast } = useToast()

  const loadSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/payouts/schedule')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payout schedule summary')
      }

      setSummary(data.summary)
    } catch (error) {
      console.error('Failed to load payout schedule summary:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลสรุปการจ่ายเงินได้',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const executeScheduledPayouts = async (type: 'weekly' | 'individual') => {
    try {
      setProcessing(type)
      
      const response = await fetch('/api/admin/payouts/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payouts')
      }

      toast({
        title: 'สำเร็จ',
        description: data.message,
      })

      setShowConfirmDialog(false)
      loadSummary()
    } catch (error) {
      console.error('Failed to create payouts:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถสร้างการจ่ายเงินได้',
        variant: 'destructive'
      })
    } finally {
      setProcessing(null)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { label: 'รอดำเนินการ', variant: 'secondary' as const },
      PROCESSING: { label: 'กำลังประมวลผล', variant: 'outline' as const },
      COMPLETED: { label: 'เสร็จสิ้น', variant: 'default' as const },
      FAILED: { label: 'ล้มเหลว', variant: 'destructive' as const }
    }
    
    const config = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: 'secondary' as const 
    }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

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

  if (!summary) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">ไม่สามารถโหลดข้อมูลได้</p>
      </div>
    )
  }

  const nextPayoutDate = new Date(summary.nextScheduledDate)
  const isPayoutDay = new Date().toDateString() === nextPayoutDate.toDateString()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ยอดรอจ่าย</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.pendingAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.pendingCommissions} คอมมิชชั่น
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>นักจิตวิทยาที่มีสิทธิ์</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.eligibleTherapists}
                </div>
                <p className="text-xs text-muted-foreground">
                  จาก {summary.totalTherapistsWithPending} คนที่มีรายได้รอ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>การจ่ายเงินครั้งถัดไป</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {formatDate(summary.nextScheduledDate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPayoutDay ? 'วันนี้!' : 'ทุกวันศุกร์'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>การจ่ายเงินล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {summary.recentPayouts.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  ใน 30 วันที่ผ่านมา
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              การจ่ายเงินรายสัปดาห์
            </CardTitle>
            <CardDescription>
              สร้างการจ่ายเงินสำหรับนักจิตวิทยาทั้งหมดที่มีสิทธิ์รับ (ขั้นต่ำ 1,000 บาท)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                จะสร้างการจ่ายเงินให้กับ {summary.eligibleTherapists} นักจิตวิทยา 
                เป็นจำนวน {formatCurrency(summary.pendingAmount)}
              </div>
              <Button 
                className="w-full"
                onClick={() => {
                  setActionType('weekly')
                  setShowConfirmDialog(true)
                }}
                disabled={processing === 'weekly' || summary.eligibleTherapists === 0}
              >
                {processing === 'weekly' ? 'กำลังประมวลผล...' : 'สร้างการจ่ายเงินรายสัปดาห์'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-green-600" />
              รีเฟรชข้อมูล
            </CardTitle>
            <CardDescription>
              อัปเดตข้อมูลสรุปการจ่ายเงินล่าสุด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                ข้อมูลล่าสุด: {new Date().toLocaleString('th-TH')}
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={loadSummary}
                disabled={loading}
              >
                {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>การจ่ายเงินล่าสุด (30 วัน)</CardTitle>
          <CardDescription>
            รายการการจ่ายเงินที่สร้างในช่วง 30 วันที่ผ่านมา
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.recentPayouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ยังไม่มีการจ่ายเงินในช่วง 30 วันที่ผ่านมา
            </div>
          ) : (
            <div className="space-y-4">
              {summary.recentPayouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {payout.therapist.therapistProfile.firstName} {' '}
                      {payout.therapist.therapistProfile.lastName}
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการสร้างการจ่ายเงิน</DialogTitle>
            <DialogDescription>
              {actionType === 'weekly' 
                ? `คุณต้องการสร้างการจ่ายเงินให้กับนักจิตวิทยา ${summary.eligibleTherapists} คน เป็นจำนวนเงินรวม ${formatCurrency(summary.pendingAmount)} หรือไม่?`
                : 'คุณต้องการสร้างการจ่ายเงินสำหรับนักจิตวิทยารายนี้หรือไม่?'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="text-sm text-muted-foreground">
              การดำเนินการนี้จะสร้างรายการการจ่ายเงินที่รออนุมัติจากแอดมิน 
              และจะต้องประมวลผลการจ่ายเงินแยกต่างหาก
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={() => executeScheduledPayouts(actionType)}
              disabled={processing === actionType}
            >
              {processing === actionType ? 'กำลังประมวลผล...' : 'ยืนยันการสร้าง'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}