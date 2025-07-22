import { cn, formatDate, formatTime, formatCurrency } from '../utils'

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('p-4', 'text-red-500')).toBe('p-4 text-red-500')
    })

    it('should handle conditional classes', () => {
      expect(cn('p-4', true && 'text-red-500')).toBe('p-4 text-red-500')
      expect(cn('p-4', false && 'text-red-500')).toBe('p-4')
    })

    it('should handle conflicting Tailwind classes', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
      expect(cn(null, undefined)).toBe('')
    })
  })

  describe('formatDate', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toMatch(/15 มกราคม 2024/)
    })

    it('should format date string correctly', () => {
      const result = formatDate('2024-01-15')
      expect(result).toMatch(/15 มกราคม 2024/)
    })

    it('should handle different months', () => {
      const result = formatDate('2024-06-30')
      expect(result).toMatch(/30 มิถุนายน 2024/)
    })

    it('should handle different years', () => {
      const result = formatDate('2023-12-25')
      expect(result).toMatch(/25 ธันวาคม 2023/)
    })
  })

  describe('formatTime', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatTime(date)
      expect(result).toMatch(/14:30/)
    })

    it('should format time string correctly', () => {
      const result = formatTime('2024-01-15T09:15:00')
      expect(result).toMatch(/09:15/)
    })

    it('should handle midnight', () => {
      const result = formatTime('2024-01-15T00:00:00')
      expect(result).toMatch(/00:00/)
    })

    it('should handle noon', () => {
      const result = formatTime('2024-01-15T12:00:00')
      expect(result).toMatch(/12:00/)
    })
  })

  describe('formatCurrency', () => {
    it('should format whole numbers without decimals', () => {
      expect(formatCurrency(1000)).toBe('฿1,000.00')
      expect(formatCurrency(500)).toBe('฿500.00')
    })

    it('should format numbers with decimals', () => {
      expect(formatCurrency(1000.50)).toBe('฿1,000.50')
      expect(formatCurrency(999.99)).toBe('฿999.99')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('฿0.00')
    })

    it('should handle negative numbers', () => {
      expect(formatCurrency(-500)).toBe('-฿500.00')
    })

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('฿1,000,000.00')
    })

    it('should handle decimal places correctly', () => {
      expect(formatCurrency(1000.1)).toBe('฿1,000.10')
      expect(formatCurrency(1000.123)).toBe('฿1,000.12')
    })
  })
})