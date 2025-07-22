'use client'

import { loadStripe } from '@stripe/stripe-js'

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
}

// Initialize Stripe with Thai localization
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  {
    locale: 'th',
  }
)

export const PAYMENT_METHODS = [
  {
    id: 'card',
    name: 'บัตรเครดิต/เดบิต',
    nameEn: 'Credit/Debit Card',
    icon: '💳',
    fee: '2.95% + ฿11',
    description: 'รองรับบัตรวีซ่า มาสเตอร์การ์ด และบัตรไทย'
  },
  {
    id: 'promptpay',
    name: 'พร้อมเพย์',
    nameEn: 'PromptPay',
    icon: '📱',
    fee: '0.95%',
    description: 'ชำระผ่าน QR Code พร้อมเพย์'
  },
  {
    id: 'alipay',
    name: 'Alipay',
    nameEn: 'Alipay',
    icon: '💙',
    fee: '3.4%',
    description: 'ชำระผ่าน Alipay'
  },
  {
    id: 'grab_pay',
    name: 'GrabPay',
    nameEn: 'GrabPay',
    icon: '🟢',
    fee: '3.4%',
    description: 'ชำระผ่าน GrabPay'
  }
] as const

export type PaymentMethodId = typeof PAYMENT_METHODS[number]['id']

export function formatThaiCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getPaymentMethodInfo(id: PaymentMethodId) {
  return PAYMENT_METHODS.find(method => method.id === id)
}