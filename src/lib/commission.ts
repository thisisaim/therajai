import { prisma } from './prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface CommissionCalculation {
  sessionId: string
  therapistId: string
  totalAmount: Decimal
  commissionRate: Decimal
  commissionAmount: Decimal
  platformFee: Decimal
}

export class CommissionService {
  // Default commission rate (70% to therapist, 30% platform fee)
  private static readonly DEFAULT_COMMISSION_RATE = new Decimal(0.7)

  /**
   * Calculate commission for a completed session
   */
  static async calculateCommission(sessionId: string): Promise<CommissionCalculation | null> {
    // Get session with payment information
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        appointment: {
          include: {
            payment: true
          }
        },
        therapist: {
          include: {
            therapistProfile: true
          }
        }
      }
    })

    if (!session || !session.appointment.payment) {
      return null
    }

    const payment = session.appointment.payment
    const totalAmount = payment.netAmount // Use net amount after payment processing fees

    // Calculate commission (70% to therapist)
    const commissionRate = this.DEFAULT_COMMISSION_RATE
    const commissionAmount = totalAmount.mul(commissionRate)
    const platformFee = totalAmount.sub(commissionAmount)

    return {
      sessionId,
      therapistId: session.therapistId,
      totalAmount,
      commissionRate,
      commissionAmount,
      platformFee
    }
  }

  /**
   * Create commission record for a session
   */
  static async createCommission(sessionId: string): Promise<void> {
    const calculation = await this.calculateCommission(sessionId)
    
    if (!calculation) {
      throw new Error('Cannot calculate commission for session')
    }

    // Check if commission already exists
    const existingCommission = await prisma.commission.findUnique({
      where: { sessionId }
    })

    if (existingCommission) {
      return // Commission already created
    }

    // Create commission record
    await prisma.commission.create({
      data: {
        sessionId: calculation.sessionId,
        therapistId: calculation.therapistId,
        amount: calculation.totalAmount,
        commissionRate: calculation.commissionRate,
        commissionAmount: calculation.commissionAmount,
        platformFee: calculation.platformFee,
        status: 'CALCULATED'
      }
    })
  }

  /**
   * Get therapist commission summary
   */
  static async getTherapistCommissionSummary(therapistId: string) {
    const [pendingCommissions, paidCommissions, totalEarnings] = await Promise.all([
      // Pending commissions
      prisma.commission.aggregate({
        where: {
          therapistId,
          status: { in: ['PENDING', 'CALCULATED'] }
        },
        _sum: { commissionAmount: true },
        _count: true
      }),

      // Paid commissions
      prisma.commission.aggregate({
        where: {
          therapistId,
          status: 'PAID'
        },
        _sum: { commissionAmount: true },
        _count: true
      }),

      // Total lifetime earnings
      prisma.commission.aggregate({
        where: { therapistId },
        _sum: { commissionAmount: true },
        _count: true
      })
    ])

    return {
      pendingAmount: pendingCommissions._sum.commissionAmount || new Decimal(0),
      pendingCount: pendingCommissions._count,
      paidAmount: paidCommissions._sum.commissionAmount || new Decimal(0),
      paidCount: paidCommissions._count,
      totalEarnings: totalEarnings._sum.commissionAmount || new Decimal(0),
      totalSessions: totalEarnings._count
    }
  }

  /**
   * Get therapist commission history
   */
  static async getTherapistCommissions(therapistId: string, limit = 20, offset = 0) {
    return await prisma.commission.findMany({
      where: { therapistId },
      include: {
        session: {
          include: {
            appointment: {
              include: {
                client: {
                  include: {
                    clientProfile: true
                  }
                }
              }
            }
          }
        },
        payout: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })
  }

  /**
   * Create payout for therapist
   */
  static async createPayout(therapistId: string, commissionIds: string[]) {
    // Get commissions to be paid
    const commissions = await prisma.commission.findMany({
      where: {
        id: { in: commissionIds },
        therapistId,
        status: { in: ['PENDING', 'CALCULATED'] }
      }
    })

    if (commissions.length === 0) {
      throw new Error('No eligible commissions found')
    }

    const totalAmount = commissions.reduce(
      (sum, commission) => sum.add(commission.commissionAmount),
      new Decimal(0)
    )

    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        therapistId,
        totalAmount,
        commissionCount: commissions.length,
        status: 'PENDING'
      }
    })

    // Update commissions to reference this payout
    await prisma.commission.updateMany({
      where: {
        id: { in: commissionIds }
      },
      data: {
        payoutId: payout.id,
        status: 'PAID'
      }
    })

    return payout
  }

  /**
   * Get all pending payouts for admin
   */
  static async getPendingPayouts() {
    return await prisma.payout.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      include: {
        therapist: {
          include: {
            therapistProfile: true
          }
        },
        commissions: {
          include: {
            session: {
              include: {
                appointment: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
  }

  /**
   * Process payout (mark as completed)
   */
  static async processPayout(payoutId: string, stripeTransferId?: string) {
    return await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        stripeTransferId
      }
    })
  }
}