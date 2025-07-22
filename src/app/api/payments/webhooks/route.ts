import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import Stripe from 'stripe'
import { NotificationScheduler } from '@/lib/notification-scheduler'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Find payment record by Stripe intent ID
    const payment = await db.payment.findFirst({
      where: { stripeIntentId: paymentIntent.id },
      include: { appointment: true }
    })

    if (!payment) {
      console.error('Payment not found for intent:', paymentIntent.id)
      return
    }

    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        stripePaymentId: paymentIntent.latest_charge as string,
        receiptUrl: (paymentIntent as any).charges?.data?.[0]?.receipt_url,
      }
    })

    // Update appointment status if exists
    if (payment.appointment) {
      await db.appointment.update({
        where: { id: payment.appointment.id },
        data: { status: 'SCHEDULED' }
      })

      // Send payment confirmation email
      try {
        await NotificationScheduler.sendPaymentConfirmation(payment.appointment.id)
      } catch (error) {
        console.error('Failed to send payment confirmation email:', error)
        // Don't fail the webhook if email fails
      }
    }

    console.log('Payment succeeded:', payment.id)
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const payment = await db.payment.findFirst({
      where: { stripeIntentId: paymentIntent.id }
    })

    if (!payment) {
      console.error('Payment not found for intent:', paymentIntent.id)
      return
    }

    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' }
    })

    console.log('Payment failed:', payment.id)
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const payment = await db.payment.findFirst({
      where: { stripeIntentId: paymentIntent.id }
    })

    if (!payment) {
      console.error('Payment not found for intent:', paymentIntent.id)
      return
    }

    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' }
    })

    console.log('Payment canceled:', payment.id)
  } catch (error) {
    console.error('Error handling payment canceled:', error)
  }
}

async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    // Find payment by charge ID
    const payment = await db.payment.findFirst({
      where: { stripePaymentId: dispute.charge as string }
    })

    if (!payment) {
      console.error('Payment not found for charge:', dispute.charge)
      return
    }

    // You might want to create a dispute record or update payment status
    // For now, we'll just log it
    console.log('Dispute created for payment:', payment.id, 'Amount:', dispute.amount)
    
    // Optionally update payment status or create a dispute record
    // await db.payment.update({
    //   where: { id: payment.id },
    //   data: { status: 'DISPUTED' } // You'd need to add this status
    // })

  } catch (error) {
    console.error('Error handling charge dispute:', error)
  }
}