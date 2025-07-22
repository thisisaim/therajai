import { CommissionService } from '../commission'
import { prisma } from '../prisma'
import { Decimal } from '@prisma/client/runtime/library'

jest.mock('../prisma', () => ({
  prisma: {
    session: {
      findUnique: jest.fn(),
    },
    commission: {
      findUnique: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    payout: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('CommissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateCommission', () => {
    it('should calculate commission correctly', async () => {
      const mockSession = {
        id: 'session123',
        therapistId: 'therapist123',
        appointment: {
          payment: {
            netAmount: new Decimal(1000),
          },
        },
      }

      mockPrisma.session.findUnique.mockResolvedValue(mockSession as any)

      const result = await CommissionService.calculateCommission('session123')

      expect(result).toEqual({
        sessionId: 'session123',
        therapistId: 'therapist123',
        totalAmount: new Decimal(1000),
        commissionRate: new Decimal(0.7),
        commissionAmount: new Decimal(700),
        platformFee: new Decimal(300),
      })
    })

    it('should return null if session not found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null)

      const result = await CommissionService.calculateCommission('nonexistent')

      expect(result).toBeNull()
    })

    it('should return null if session has no payment', async () => {
      const mockSession = {
        id: 'session123',
        therapistId: 'therapist123',
        appointment: {
          payment: null,
        },
      }

      mockPrisma.session.findUnique.mockResolvedValue(mockSession as any)

      const result = await CommissionService.calculateCommission('session123')

      expect(result).toBeNull()
    })
  })

  describe('createCommission', () => {
    it('should create commission record', async () => {
      const mockSession = {
        id: 'session123',
        therapistId: 'therapist123',
        appointment: {
          payment: {
            netAmount: new Decimal(1000),
          },
        },
      }

      mockPrisma.session.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.commission.findUnique.mockResolvedValue(null)
      mockPrisma.commission.create.mockResolvedValue({} as any)

      await CommissionService.createCommission('session123')

      expect(mockPrisma.commission.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session123',
          therapistId: 'therapist123',
          amount: new Decimal(1000),
          commissionRate: new Decimal(0.7),
          commissionAmount: new Decimal(700),
          platformFee: new Decimal(300),
          status: 'CALCULATED',
        },
      })
    })

    it('should not create commission if it already exists', async () => {
      const mockSession = {
        id: 'session123',
        therapistId: 'therapist123',
        appointment: {
          payment: {
            netAmount: new Decimal(1000),
          },
        },
      }

      const existingCommission = {
        id: 'commission123',
        sessionId: 'session123',
      }

      mockPrisma.session.findUnique.mockResolvedValue(mockSession as any)
      mockPrisma.commission.findUnique.mockResolvedValue(existingCommission as any)

      await CommissionService.createCommission('session123')

      expect(mockPrisma.commission.create).not.toHaveBeenCalled()
    })

    it('should throw error if cannot calculate commission', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null)

      await expect(CommissionService.createCommission('session123')).rejects.toThrow(
        'Cannot calculate commission for session'
      )
    })
  })

  describe('getTherapistCommissionSummary', () => {
    it('should return therapist commission summary', async () => {
      const mockPendingCommissions = {
        _sum: { commissionAmount: new Decimal(500) },
        _count: 2,
      }

      const mockPaidCommissions = {
        _sum: { commissionAmount: new Decimal(1000) },
        _count: 3,
      }

      const mockTotalEarnings = {
        _sum: { commissionAmount: new Decimal(1500) },
        _count: 5,
      }

      mockPrisma.commission.aggregate
        .mockResolvedValueOnce(mockPendingCommissions as any)
        .mockResolvedValueOnce(mockPaidCommissions as any)
        .mockResolvedValueOnce(mockTotalEarnings as any)

      const result = await CommissionService.getTherapistCommissionSummary('therapist123')

      expect(result).toEqual({
        pendingAmount: new Decimal(500),
        pendingCount: 2,
        paidAmount: new Decimal(1000),
        paidCount: 3,
        totalEarnings: new Decimal(1500),
        totalSessions: 5,
      })
    })

    it('should handle null values in aggregates', async () => {
      const mockPendingCommissions = {
        _sum: { commissionAmount: null },
        _count: 0,
      }

      const mockPaidCommissions = {
        _sum: { commissionAmount: null },
        _count: 0,
      }

      const mockTotalEarnings = {
        _sum: { commissionAmount: null },
        _count: 0,
      }

      mockPrisma.commission.aggregate
        .mockResolvedValueOnce(mockPendingCommissions as any)
        .mockResolvedValueOnce(mockPaidCommissions as any)
        .mockResolvedValueOnce(mockTotalEarnings as any)

      const result = await CommissionService.getTherapistCommissionSummary('therapist123')

      expect(result).toEqual({
        pendingAmount: new Decimal(0),
        pendingCount: 0,
        paidAmount: new Decimal(0),
        paidCount: 0,
        totalEarnings: new Decimal(0),
        totalSessions: 0,
      })
    })
  })

  describe('getTherapistCommissions', () => {
    it('should return therapist commissions with pagination', async () => {
      const mockCommissions = [
        {
          id: 'commission1',
          sessionId: 'session1',
          therapistId: 'therapist123',
          commissionAmount: new Decimal(700),
        },
        {
          id: 'commission2',
          sessionId: 'session2',
          therapistId: 'therapist123',
          commissionAmount: new Decimal(500),
        },
      ]

      mockPrisma.commission.findMany.mockResolvedValue(mockCommissions as any)

      const result = await CommissionService.getTherapistCommissions('therapist123', 10, 0)

      expect(result).toEqual(mockCommissions)
      expect(mockPrisma.commission.findMany).toHaveBeenCalledWith({
        where: { therapistId: 'therapist123' },
        include: {
          session: {
            include: {
              appointment: {
                include: {
                  client: {
                    include: {
                      clientProfile: true,
                    },
                  },
                },
              },
            },
          },
          payout: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      })
    })

    it('should use default pagination values', async () => {
      mockPrisma.commission.findMany.mockResolvedValue([])

      await CommissionService.getTherapistCommissions('therapist123')

      expect(mockPrisma.commission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        })
      )
    })
  })

  describe('createPayout', () => {
    it('should create payout successfully', async () => {
      const mockCommissions = [
        {
          id: 'commission1',
          commissionAmount: new Decimal(700),
          therapistId: 'therapist123',
        },
        {
          id: 'commission2',
          commissionAmount: new Decimal(500),
          therapistId: 'therapist123',
        },
      ]

      const mockPayout = {
        id: 'payout123',
        therapistId: 'therapist123',
        totalAmount: new Decimal(1200),
        commissionCount: 2,
        status: 'PENDING',
      }

      mockPrisma.commission.findMany.mockResolvedValue(mockCommissions as any)
      mockPrisma.payout.create.mockResolvedValue(mockPayout as any)
      mockPrisma.commission.updateMany.mockResolvedValue({} as any)

      const result = await CommissionService.createPayout('therapist123', ['commission1', 'commission2'])

      expect(result).toEqual(mockPayout)
      expect(mockPrisma.payout.create).toHaveBeenCalledWith({
        data: {
          therapistId: 'therapist123',
          totalAmount: new Decimal(1200),
          commissionCount: 2,
          status: 'PENDING',
        },
      })
      expect(mockPrisma.commission.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['commission1', 'commission2'] },
        },
        data: {
          payoutId: 'payout123',
          status: 'PAID',
        },
      })
    })

    it('should throw error if no eligible commissions found', async () => {
      mockPrisma.commission.findMany.mockResolvedValue([])

      await expect(
        CommissionService.createPayout('therapist123', ['commission1'])
      ).rejects.toThrow('No eligible commissions found')
    })
  })

  describe('getPendingPayouts', () => {
    it('should return pending payouts', async () => {
      const mockPayouts = [
        {
          id: 'payout1',
          therapistId: 'therapist123',
          status: 'PENDING',
        },
        {
          id: 'payout2',
          therapistId: 'therapist456',
          status: 'PROCESSING',
        },
      ]

      mockPrisma.payout.findMany.mockResolvedValue(mockPayouts as any)

      const result = await CommissionService.getPendingPayouts()

      expect(result).toEqual(mockPayouts)
      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] },
        },
        include: {
          therapist: {
            include: {
              therapistProfile: true,
            },
          },
          commissions: {
            include: {
              session: {
                include: {
                  appointment: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      })
    })
  })

  describe('processPayout', () => {
    it('should process payout successfully', async () => {
      const mockUpdatedPayout = {
        id: 'payout123',
        status: 'COMPLETED',
        processedAt: new Date(),
        stripeTransferId: 'transfer123',
      }

      mockPrisma.payout.update.mockResolvedValue(mockUpdatedPayout as any)

      const result = await CommissionService.processPayout('payout123', 'transfer123')

      expect(result).toEqual(mockUpdatedPayout)
      expect(mockPrisma.payout.update).toHaveBeenCalledWith({
        where: { id: 'payout123' },
        data: {
          status: 'COMPLETED',
          processedAt: expect.any(Date),
          stripeTransferId: 'transfer123',
        },
      })
    })

    it('should process payout without stripe transfer ID', async () => {
      const mockUpdatedPayout = {
        id: 'payout123',
        status: 'COMPLETED',
        processedAt: new Date(),
      }

      mockPrisma.payout.update.mockResolvedValue(mockUpdatedPayout as any)

      const result = await CommissionService.processPayout('payout123')

      expect(result).toEqual(mockUpdatedPayout)
      expect(mockPrisma.payout.update).toHaveBeenCalledWith({
        where: { id: 'payout123' },
        data: {
          status: 'COMPLETED',
          processedAt: expect.any(Date),
          stripeTransferId: undefined,
        },
      })
    })
  })
})