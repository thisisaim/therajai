'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  XCircle,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw
} from 'lucide-react'

interface CancelModalProps {
  appointmentId: string
  appointmentDateTime: string
  paymentStatus?: string
  paymentAmount?: number
  onClose: () => void
  onSuccess: () => void
}

export default function CancelModal({
  appointmentId,
  appointmentDateTime,
  paymentStatus,
  paymentAmount,
  onClose,
  onSuccess
}: CancelModalProps) {
  const [reason, setReason] = useState('')
  const [requestRefund, setRequestRefund] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const calculateRefundInfo = () => {
    const appointmentTime = new Date(appointmentDateTime)
    const now = new Date()
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (!paymentAmount || paymentStatus !== 'COMPLETED') {
      return {
        eligible: false,
        amount: 0,
        fee: 0,
        policy: 'ไม่มีการชำระเงินที่ต้องคืน'
      }
    }

    if (hoursUntilAppointment >= 24) {
      return {
        eligible: true,
        amount: paymentAmount,
        fee: 0,
        policy: 'คืนเงินเต็มจำนวน (ยกเลิก 24 ชั่วโมงขึ้นไป)'
      }
    } else if (hoursUntilAppointment >= 2) {
      return {
        eligible: true,
        amount: paymentAmount * 0.5,
        fee: paymentAmount * 0.5,
        policy: 'คืนเงิน 50% (ยกเลิก 2-24 ชั่วโมง)'
      }
    } else {
      return {
        eligible: false,
        amount: 0,
        fee: paymentAmount,
        policy: 'ไม่คืนเงิน (ยกเลิกน้อยกว่า 2 ชั่วโมง)'
      }
    }
  }

  const refundInfo = calculateRefundInfo()

  const handleCancel = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          refundRequested: requestRefund
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 3000)
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการยกเลิกการนัดหมาย')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      setError('เกิดข้อผิดพลาดในการยกเลิกการนัดหมาย')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="thai-font flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  ยกเลิกการนัดหมาย
                </CardTitle>
                <CardDescription>
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Warning */}
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                คุณกำลังยกเลิกการนัดหมายในวันที่{' '}
                {new Date(appointmentDateTime).toLocaleDateString('th-TH', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </AlertDescription>
            </Alert>

            {/* Cancellation Policy */}
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">นโยบายการยกเลิก:</p>
                  <ul className="text-sm space-y-1">
                    <li>• 24 ชั่วโมงขึ้นไป: คืนเงินเต็มจำนวน</li>
                    <li>• 2-24 ชั่วโมง: คืนเงิน 50%</li>
                    <li>• น้อยกว่า 2 ชั่วโมง: ไม่คืนเงิน</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* Refund Information */}
            {paymentAmount && paymentStatus === 'COMPLETED' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">ข้อมูลการคืนเงิน</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>จำนวนเงินที่ชำระ:</span>
                    <span>฿{paymentAmount.toLocaleString()}</span>
                  </div>
                  
                  {refundInfo.eligible ? (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>จำนวนที่คืน:</span>
                        <span>฿{refundInfo.amount.toLocaleString()}</span>
                      </div>
                      {refundInfo.fee > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>ค่าธรรมเนียม:</span>
                          <span>฿{refundInfo.fee.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between text-red-600">
                      <span>จำนวนที่คืน:</span>
                      <span>฿0</span>
                    </div>
                  )}
                  
                  <p className="text-gray-600 text-xs mt-2">{refundInfo.policy}</p>
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            {!success && (
              <>
                {/* Refund Request Checkbox */}
                {refundInfo.eligible && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="refund"
                      checked={requestRefund}
                      onCheckedChange={(checked) => setRequestRefund(checked as boolean)}
                    />
                    <Label htmlFor="refund" className="text-sm">
                      ขอคืนเงิน ฿{refundInfo.amount.toLocaleString()}
                      {refundInfo.fee > 0 && ` (หักค่าธรรมเนียม ฿${refundInfo.fee.toLocaleString()})`}
                    </Label>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <Label htmlFor="reason" className="text-base font-semibold">เหตุผลในการยกเลิก</Label>
                  <Textarea
                    id="reason"
                    placeholder="ระบุเหตุผลในการยกเลิกการนัดหมาย..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCancel}
                    disabled={saving}
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        กำลังยกเลิก...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        ยืนยันการยกเลิก
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={onClose} disabled={saving}>
                    กลับ
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}