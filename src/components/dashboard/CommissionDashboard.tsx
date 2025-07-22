'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface CommissionSummary {
  pendingAmount: number
  pendingCount: number
  paidAmount: number
  paidCount: number
  totalEarnings: number
  totalSessions: number
}

interface Commission {
  id: string
  amount: number
  commissionRate: number
  commissionAmount: number
  platformFee: number
  status: string
  createdAt: string
  session: {
    appointment: {
      client: {
        clientProfile: {
          firstName: string
          lastName: string
        }
      }
      dateTime: string
    }
  }
  payout?: {
    id: string
    status: string
    processedAt?: string
  }
}

interface CommissionDashboardProps {
  therapistId: string
}

export default function CommissionDashboard({ therapistId }: CommissionDashboardProps) {
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()

  const loadData = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset
      setLoadingMore(true)

      const response = await fetch(`/api/commissions?therapistId=${therapistId}&limit=20&offset=${currentOffset}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load commissions')
      }

      if (reset) {
        setCommissions(data.commissions)
        setOffset(20)
      } else {
        setCommissions(prev => [...prev, ...data.commissions])
        setOffset(prev => prev + 20)
      }

      setHasMore(data.commissions.length === 20)
      setSummary(data.summary)

    } catch (error) {
      console.error('Failed to load commissions:', error)
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลคอมมิชชั่นได้',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadData(true)
  }, [therapistId])

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { label: 'รอดำเนินการ', variant: 'secondary' as const },
      CALCULATED: { label: 'คำนวณแล้ว', variant: 'outline' as const },
      PAID: { label: 'จ่ายแล้ว', variant: 'default' as const },
      DISPUTED: { label: 'มีข้อโต้แย้ง', variant: 'destructive' as const }
    }
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const }
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>รายได้ที่รอจ่าย</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary?.pendingAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.pendingCount || 0} เซสชัน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>รายได้ที่จ่ายแล้ว</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.paidAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.paidCount || 0} เซสชัน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>รายได้รวม</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.totalEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.totalSessions || 0} เซสชันทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>อัตราคอมมิชชั่น</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">70%</div>
            <p className="text-xs text-muted-foreground">
              ค่าแพลตฟอร์ม 30%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติคอมมิชชั่น</CardTitle>
          <CardDescription>
            รายการคอมมิชชั่นจากการให้บริการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ยังไม่มีข้อมูลคอมมิชชั่น
              </div>
            ) : (
              <>
                {commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {commission.session.appointment.client.clientProfile.firstName} {' '}
                        {commission.session.appointment.client.clientProfile.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(commission.session.appointment.dateTime)} • {formatCurrency(commission.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        คอมมิชชั่น {(commission.commissionRate * 100).toFixed(0)}% = {formatCurrency(commission.commissionAmount)}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="font-bold text-lg">
                        {formatCurrency(commission.commissionAmount)}
                      </div>
                      {getStatusBadge(commission.status)}
                      {commission.payout && (
                        <div className="text-xs text-muted-foreground">
                          จ่ายแล้ว: {commission.payout.processedAt ? formatDate(commission.payout.processedAt) : 'รอดำเนินการ'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => loadData(false)}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}