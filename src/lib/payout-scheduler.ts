import { CommissionService } from './commission'
import { prisma } from './prisma'
import { Decimal } from '@prisma/client/runtime/library'

export class PayoutScheduler {
  
  /**
   * Create automatic payouts for all therapists with pending commissions
   * Called weekly on Fridays to process weekly payouts
   */
  static async createWeeklyPayouts(): Promise<void> {
    try {
      console.log('Starting weekly payout creation...')

      // Get all therapists with pending commissions
      const therapistsWithPendingCommissions = await prisma.commission.groupBy({
        by: ['therapistId'],
        where: {
          status: { in: ['PENDING', 'CALCULATED'] },
          payoutId: null
        },
        _sum: {
          commissionAmount: true
        },
        _count: true,
        having: {
          commissionAmount: {
            _sum: {
              gt: new Decimal(0)
            }
          }
        }
      })

      console.log(`Found ${therapistsWithPendingCommissions.length} therapists with pending commissions`)

      let totalPayouts = 0
      let totalAmount = new Decimal(0)

      for (const therapistGroup of therapistsWithPendingCommissions) {
        const { therapistId } = therapistGroup
        const pendingAmount = therapistGroup._sum.commissionAmount || new Decimal(0)

        // Only create payout if amount is above minimum threshold (e.g., 1000 THB)
        const minimumPayoutAmount = new Decimal(1000)
        if (pendingAmount.lessThan(minimumPayoutAmount)) {
          console.log(`Skipping payout for therapist ${therapistId} - amount ${pendingAmount} below minimum ${minimumPayoutAmount}`)
          continue
        }

        // Get all pending commission IDs for this therapist
        const pendingCommissions = await prisma.commission.findMany({
          where: {
            therapistId,
            status: { in: ['PENDING', 'CALCULATED'] },
            payoutId: null
          },
          select: { id: true }
        })

        const commissionIds = pendingCommissions.map(c => c.id)

        try {
          // Create payout for this therapist
          const payout = await CommissionService.createPayout(therapistId, commissionIds)
          
          console.log(`Created payout ${payout.id} for therapist ${therapistId}: ${payout.totalAmount} THB (${commissionIds.length} commissions)`)
          
          totalPayouts++
          totalAmount = totalAmount.add(payout.totalAmount)
          
        } catch (error) {
          console.error(`Failed to create payout for therapist ${therapistId}:`, error)
        }
      }

      console.log(`Weekly payout creation completed: ${totalPayouts} payouts created, total amount: ${totalAmount} THB`)

    } catch (error) {
      console.error('Error in weekly payout creation:', error)
      throw error
    }
  }

  /**
   * Create payout for a specific therapist if they have sufficient pending commissions
   */
  static async createPayoutForTherapist(therapistId: string, minimumAmount: Decimal = new Decimal(500)): Promise<boolean> {
    try {
      // Get pending commissions for this therapist
      const pendingCommissions = await prisma.commission.findMany({
        where: {
          therapistId,
          status: { in: ['PENDING', 'CALCULATED'] },
          payoutId: null
        }
      })

      if (pendingCommissions.length === 0) {
        return false
      }

      // Calculate total pending amount
      const totalAmount = pendingCommissions.reduce(
        (sum, commission) => sum.add(commission.commissionAmount),
        new Decimal(0)
      )

      // Check if amount meets minimum threshold
      if (totalAmount.lessThan(minimumAmount)) {
        console.log(`Therapist ${therapistId} has ${totalAmount} THB pending - below minimum ${minimumAmount} THB`)
        return false
      }

      // Create payout
      const commissionIds = pendingCommissions.map(c => c.id)
      const payout = await CommissionService.createPayout(therapistId, commissionIds)
      
      console.log(`Created on-demand payout ${payout.id} for therapist ${therapistId}: ${payout.totalAmount} THB`)
      return true

    } catch (error) {
      console.error(`Error creating payout for therapist ${therapistId}:`, error)
      return false
    }
  }

  /**
   * Get payout schedule summary for admin dashboard
   */
  static async getPayoutScheduleSummary() {
    try {
      const [
        pendingCommissionsStats,
        recentPayouts,
        nextScheduledDate
      ] = await Promise.all([
        // Pending commissions by therapist
        prisma.commission.groupBy({
          by: ['therapistId'],
          where: {
            status: { in: ['PENDING', 'CALCULATED'] },
            payoutId: null
          },
          _sum: {
            commissionAmount: true
          },
          _count: true
        }),

        // Recent payouts (last 30 days)
        prisma.payout.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          include: {
            therapist: {
              include: {
                therapistProfile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),

        // Next Friday (weekly payout day)
        this.getNextPayoutDate()
      ])

      // Calculate totals
      const totalPendingAmount = pendingCommissionsStats.reduce(
        (sum, stats) => sum.add(stats._sum.commissionAmount || new Decimal(0)),
        new Decimal(0)
      )

      const totalPendingCommissions = pendingCommissionsStats.reduce(
        (sum, stats) => sum + stats._count,
        0
      )

      const eligibleTherapists = pendingCommissionsStats.filter(
        stats => (stats._sum.commissionAmount || new Decimal(0)).greaterThanOrEqualTo(new Decimal(1000))
      ).length

      return {
        pendingAmount: totalPendingAmount,
        pendingCommissions: totalPendingCommissions,
        eligibleTherapists,
        totalTherapistsWithPending: pendingCommissionsStats.length,
        recentPayouts,
        nextScheduledDate
      }

    } catch (error) {
      console.error('Error getting payout schedule summary:', error)
      throw error
    }
  }

  /**
   * Get next Friday date (weekly payout schedule)
   */
  private static getNextPayoutDate(): Date {
    const now = new Date()
    const nextFriday = new Date(now)
    const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7
    nextFriday.setDate(now.getDate() + daysUntilFriday)
    nextFriday.setHours(10, 0, 0, 0) // 10 AM on Friday
    return nextFriday
  }

  /**
   * Send notification to therapists about pending payouts
   */
  static async notifyTherapistsAboutPayouts(): Promise<void> {
    try {
      const therapistsWithPending = await prisma.commission.groupBy({
        by: ['therapistId'],
        where: {
          status: { in: ['PENDING', 'CALCULATED'] },
          payoutId: null
        },
        _sum: {
          commissionAmount: true
        },
        _count: true
      })

      for (const therapistGroup of therapistsWithPending) {
        const { therapistId } = therapistGroup
        const pendingAmount = therapistGroup._sum.commissionAmount || new Decimal(0)
        const pendingCount = therapistGroup._count

        // Get therapist email
        const therapist = await prisma.user.findUnique({
          where: { id: therapistId },
          select: {
            email: true,
            name: true,
            therapistProfile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        })

        if (!therapist) continue

        // TODO: Send email notification
        console.log(`Would notify ${therapist.email} about ${pendingAmount} THB pending (${pendingCount} sessions)`)
      }

    } catch (error) {
      console.error('Error notifying therapists about payouts:', error)
    }
  }
}