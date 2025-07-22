import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
})

// Thai Baht configuration
export const STRIPE_CONFIG = {
  currency: 'thb',
  locale: 'th-TH',
  // Minimum amount in Thai Baht (100 satang = 1 THB)
  minimumAmount: 100, // 1 THB
  // Maximum amount in Thai Baht
  maximumAmount: 100000000, // 1,000,000 THB
}

// Thai payment methods supported by Stripe
export const THAI_PAYMENT_METHODS = [
  'card',
  'promptpay',
  'alipay',
  'grab_pay',
] as const

export type ThaiPaymentMethod = typeof THAI_PAYMENT_METHODS[number]

// Thai banks for bank transfers
export const THAI_BANKS = [
  { code: 'bbl', name: 'ธนาคารกรุงเทพ', nameEn: 'Bangkok Bank' },
  { code: 'ktb', name: 'ธนาคารกรุงไทย', nameEn: 'Krung Thai Bank' },
  { code: 'scb', name: 'ธนาคารไทยพาณิชย์', nameEn: 'Siam Commercial Bank' },
  { code: 'bay', name: 'ธนาคารกรุงศรีอยุธยา', nameEn: 'Bank of Ayudhya' },
  { code: 'tmb', name: 'ธนาคารทหารไทยธนชาต', nameEn: 'TMB Thanachart Bank' },
  { code: 'kbank', name: 'ธนาคารกสิกรไทย', nameEn: 'Kasikorn Bank' },
] as const

// Pricing helpers
export function formatThaiCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount)
}

export function convertToStripeAmount(amount: number): number {
  // Convert THB to satang (multiply by 100)
  return Math.round(amount * 100)
}

export function convertFromStripeAmount(amount: number): number {
  // Convert satang to THB (divide by 100)
  return amount / 100
}

// Calculate processing fees (Stripe fees for Thailand)
export function calculateProcessingFee(amount: number, paymentMethod: ThaiPaymentMethod): number {
  const baseAmount = amount
  
  switch (paymentMethod) {
    case 'card':
      // 3.65% + 11 THB for international cards
      // 2.95% + 11 THB for Thai cards (we'll use Thai rate)
      return Math.round(baseAmount * 0.0295 + 11)
    
    case 'promptpay':
      // 0.95% for PromptPay
      return Math.round(baseAmount * 0.0095)
    
    case 'alipay':
    case 'grab_pay':
      // 3.4% for digital wallets
      return Math.round(baseAmount * 0.034)
    
    default:
      return Math.round(baseAmount * 0.0295 + 11)
  }
}

export function calculateNetAmount(amount: number, paymentMethod: ThaiPaymentMethod): number {
  const fee = calculateProcessingFee(amount, paymentMethod)
  return Math.max(0, amount - fee)
}

// Validate Thai payment amounts
export function validatePaymentAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < STRIPE_CONFIG.minimumAmount) {
    return {
      valid: false,
      error: `จำนวนเงินต้องไม่น้อยกว่า ${formatThaiCurrency(STRIPE_CONFIG.minimumAmount)}`
    }
  }
  
  if (amount > STRIPE_CONFIG.maximumAmount) {
    return {
      valid: false,
      error: `จำนวนเงินต้องไม่เกิน ${formatThaiCurrency(STRIPE_CONFIG.maximumAmount)}`
    }
  }
  
  return { valid: true }
}

// Create payment intent for Thai users
export async function createPaymentIntent({
  amount,
  currency = 'thb',
  paymentMethod = 'card',
  metadata = {},
  description,
}: {
  amount: number
  currency?: string
  paymentMethod?: ThaiPaymentMethod
  metadata?: Record<string, string>
  description?: string
}) {
  const validation = validatePaymentAmount(amount)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const stripeAmount = convertToStripeAmount(amount)
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: stripeAmount,
    currency,
    payment_method_types: [paymentMethod],
    metadata: {
      ...metadata,
      originalAmount: amount.toString(),
      paymentMethod,
    },
    description,
    // Enable automatic payment methods for Thailand
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
  })

  return paymentIntent
}

// Create setup intent for saving payment methods
export async function createSetupIntent(customerId: string) {
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session',
  })

  return setupIntent
}

// Create or retrieve Stripe customer
export async function createOrRetrieveCustomer({
  email,
  name,
  userId,
}: {
  email: string
  name: string
  userId: string
}) {
  // Try to find existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  })

  return customer
}