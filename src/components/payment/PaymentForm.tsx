'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Smartphone, Globe } from 'lucide-react'
import { PAYMENT_METHODS, formatThaiCurrency, type PaymentMethodId } from '@/lib/stripe-client'

interface PaymentFormProps {
  appointmentId: string
  amount: number
  description: string
  therapistName: string
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
}

export function PaymentForm({
  appointmentId,
  amount,
  description,
  therapistName,
  onSuccess,
  onError
}: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingFee, setProcessingFee] = useState(0)
  const [totalAmount, setTotalAmount] = useState(amount)

  const calculateFees = async (paymentMethod: PaymentMethodId) => {
    try {
      const response = await fetch('/api/payments/calculate-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod })
      })
      
      if (response.ok) {
        const data = await response.json()
        setProcessingFee(data.processingFee)
        setTotalAmount(data.totalAmount)
      }
    } catch (error) {
      console.error('Error calculating fees:', error)
    }
  }

  const handlePaymentMethodChange = (method: PaymentMethodId) => {
    setSelectedMethod(method)
    calculateFees(method)
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    
    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          paymentMethod: selectedMethod
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'เกิดข้อผิดพลาด')
      }

      const { clientSecret, paymentId } = await response.json()

      // Load Stripe
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      
      if (!stripe) {
        throw new Error('ไม่สามารถโหลด Stripe ได้')
      }

      // Confirm payment based on method
      let result
      
      if (selectedMethod === 'card') {
        // For cards, we need to use Elements (simplified version here)
        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: {} as any // This would be connected to Stripe Elements in a real implementation
          }
        })
      } else {
        // For other payment methods
        result = await stripe.confirmPayment({
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/payment/success?payment_id=${paymentId}`,
          },
        })
      }

      if (result.error) {
        throw new Error(result.error.message || 'การชำระเงินไม่สำเร็จ')
      }

      // Confirm payment on our backend
      const confirmResponse = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: result.paymentIntent?.id,
          paymentId
        })
      })

      if (confirmResponse.ok) {
        onSuccess(paymentId)
      } else {
        const error = await confirmResponse.json()
        throw new Error(error.error || 'ยืนยันการชำระเงินไม่สำเร็จ')
      }

    } catch (error) {
      console.error('Payment error:', error)
      onError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการชำระเงิน')
    } finally {
      setIsProcessing(false)
    }
  }

  const getPaymentIcon = (methodId: PaymentMethodId) => {
    switch (methodId) {
      case 'card':
        return <CreditCard className="h-5 w-5" />
      case 'promptpay':
        return <Smartphone className="h-5 w-5" />
      default:
        return <Globe className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="thai-font">สรุปการชำระเงิน</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>ค่าบริการ:</span>
            <span>{formatThaiCurrency(amount)}</span>
          </div>
          {processingFee > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>ค่าธรรมเนียม:</span>
              <span>{formatThaiCurrency(processingFee)}</span>
            </div>
          )}
          <div className="border-t pt-3 font-semibold">
            <div className="flex justify-between">
              <span>รวมทั้งหมด:</span>
              <span className="text-lg">{formatThaiCurrency(totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="thai-font">เลือกวิธีชำระเงิน</CardTitle>
          <CardDescription>เลือกวิธีการชำระเงินที่สะดวกสำหรับคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedMethod}
            onValueChange={handlePaymentMethodChange}
            className="space-y-3"
          >
            {PAYMENT_METHODS.map((method) => (
              <div
                key={method.id}
                className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-gray-50"
              >
                <RadioGroupItem value={method.id} id={method.id} />
                <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    {getPaymentIcon(method.id)}
                    <div className="flex-1">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </div>
                    <div className="text-sm text-gray-500">{method.fee}</div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              `ชำระเงิน ${formatThaiCurrency(totalAmount)}`
            )}
          </Button>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>ข้อมูลการชำระเงินของคุณจะได้รับการปกป้องด้วยการเข้ารหัส SSL</p>
            <p>การชำระเงินจะดำเนินการผ่าน Stripe ที่ปลอดภัย</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}