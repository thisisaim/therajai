import { 
  userRegistrationSchema, 
  clientProfileSchema, 
  therapistProfileSchema, 
  appointmentSchema, 
  sessionFeedbackSchema 
} from '../validations'

jest.mock('../i18n', () => ({
  t: (key: string) => key,
}))

describe('Validation Schemas', () => {
  describe('userRegistrationSchema', () => {
    it('should validate valid user registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'CLIENT' as const
      }
      
      const result = userRegistrationSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        role: 'CLIENT' as const
      }
      
      const result = userRegistrationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short name', () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'password123',
        role: 'CLIENT' as const
      }
      
      const result = userRegistrationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
        role: 'CLIENT' as const
      }
      
      const result = userRegistrationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid role', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'INVALID' as any
      }
      
      const result = userRegistrationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('clientProfileSchema', () => {
    it('should validate valid client profile data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        phone: '123-456-7890',
        preferredLanguage: 'ENGLISH' as const
      }
      
      const result = clientProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty firstName', () => {
      const invalidData = {
        firstName: '',
        lastName: 'Doe',
        preferredLanguage: 'ENGLISH' as const
      }
      
      const result = clientProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty lastName', () => {
      const invalidData = {
        firstName: 'John',
        lastName: '',
        preferredLanguage: 'ENGLISH' as const
      }
      
      const result = clientProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should use default preferredLanguage', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe'
      }
      
      const result = clientProfileSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.preferredLanguage).toBe('ENGLISH')
      }
    })
  })

  describe('therapistProfileSchema', () => {
    it('should validate valid therapist profile data', () => {
      const validData = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        title: 'Clinical Psychologist',
        licenseNumber: 'PSY123456',
        specializations: ['Anxiety', 'Depression'],
        experience: 5,
        education: 'PhD in Psychology from University',
        languages: ['English', 'Thai'],
        bio: 'Experienced therapist specializing in anxiety and depression treatment with over 5 years of clinical experience.',
        hourlyRate: 1500,
        availableOnline: true,
        availableInPerson: false
      }
      
      const result = therapistProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty specializations', () => {
      const invalidData = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        title: 'Clinical Psychologist',
        licenseNumber: 'PSY123456',
        specializations: [],
        experience: 5,
        education: 'PhD in Psychology',
        languages: ['English'],
        bio: 'Experienced therapist with over 5 years of clinical experience.',
        hourlyRate: 1500
      }
      
      const result = therapistProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short bio', () => {
      const invalidData = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        title: 'Clinical Psychologist',
        licenseNumber: 'PSY123456',
        specializations: ['Anxiety'],
        experience: 5,
        education: 'PhD in Psychology',
        languages: ['English'],
        bio: 'Short bio',
        hourlyRate: 1500
      }
      
      const result = therapistProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative experience', () => {
      const invalidData = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        title: 'Clinical Psychologist',
        licenseNumber: 'PSY123456',
        specializations: ['Anxiety'],
        experience: -1,
        education: 'PhD in Psychology',
        languages: ['English'],
        bio: 'Experienced therapist with clinical experience in anxiety treatment.',
        hourlyRate: 1500
      }
      
      const result = therapistProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative hourlyRate', () => {
      const invalidData = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        title: 'Clinical Psychologist',
        licenseNumber: 'PSY123456',
        specializations: ['Anxiety'],
        experience: 5,
        education: 'PhD in Psychology',
        languages: ['English'],
        bio: 'Experienced therapist with clinical experience in anxiety treatment.',
        hourlyRate: -100
      }
      
      const result = therapistProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('appointmentSchema', () => {
    it('should validate valid appointment data', () => {
      const validData = {
        therapistId: 'therapist123',
        dateTime: '2024-01-15T14:30:00.000Z',
        duration: 60,
        type: 'ONLINE' as const,
        notes: 'First session'
      }
      
      const result = appointmentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid dateTime', () => {
      const invalidData = {
        therapistId: 'therapist123',
        dateTime: '2024-01-15',
        duration: 60,
        type: 'ONLINE' as const
      }
      
      const result = appointmentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject duration less than 30', () => {
      const invalidData = {
        therapistId: 'therapist123',
        dateTime: '2024-01-15T14:30:00.000Z',
        duration: 15,
        type: 'ONLINE' as const
      }
      
      const result = appointmentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject duration greater than 180', () => {
      const invalidData = {
        therapistId: 'therapist123',
        dateTime: '2024-01-15T14:30:00.000Z',
        duration: 200,
        type: 'ONLINE' as const
      }
      
      const result = appointmentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should use default values', () => {
      const data = {
        therapistId: 'therapist123',
        dateTime: '2024-01-15T14:30:00.000Z'
      }
      
      const result = appointmentSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.duration).toBe(60)
        expect(result.data.type).toBe('ONLINE')
      }
    })
  })

  describe('sessionFeedbackSchema', () => {
    it('should validate valid session feedback data', () => {
      const validData = {
        sessionNotes: 'Good progress made',
        clientFeedback: 'Helpful session',
        rating: 5
      }
      
      const result = sessionFeedbackSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject rating below 1', () => {
      const invalidData = {
        sessionNotes: 'Good progress made',
        clientFeedback: 'Helpful session',
        rating: 0
      }
      
      const result = sessionFeedbackSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject rating above 5', () => {
      const invalidData = {
        sessionNotes: 'Good progress made',
        clientFeedback: 'Helpful session',
        rating: 6
      }
      
      const result = sessionFeedbackSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should allow all optional fields', () => {
      const data = {}
      
      const result = sessionFeedbackSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})