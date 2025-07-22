import { z } from 'zod'
import i18n from './i18n'

const t = (key: string) => i18n.t(key)

export const userRegistrationSchema = z.object({
  name: z.string().min(2, t('validation.nameMinLength')),
  email: z.string().email(t('validation.emailInvalid')),
  password: z.string().min(6, t('validation.passwordMinLength')),
  role: z.enum(['CLIENT', 'THERAPIST'])
})

export const clientProfileSchema = z.object({
  firstName: z.string().min(1, t('validation.firstNameRequired')),
  lastName: z.string().min(1, t('validation.lastNameRequired')),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  mentalHealthHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  preferredLanguage: z.enum(['THAI', 'ENGLISH']).default('ENGLISH')
})

export const therapistProfileSchema = z.object({
  firstName: z.string().min(1, t('validation.firstNameRequired')),
  lastName: z.string().min(1, t('validation.lastNameRequired')),
  title: z.string().min(1, t('validation.titleRequired')),
  licenseNumber: z.string().min(1, t('validation.licenseNumberRequired')),
  specializations: z.array(z.string()).min(1, t('validation.specializationsRequired')),
  experience: z.number().min(0, t('validation.experienceMinimum')),
  education: z.string().min(1, t('validation.educationRequired')),
  languages: z.array(z.string()).min(1, t('validation.languagesRequired')),
  bio: z.string().min(50, t('validation.bioMinLength')),
  hourlyRate: z.number().min(0, t('validation.hourlyRateMinimum')),
  availableOnline: z.boolean().default(true),
  availableInPerson: z.boolean().default(false),
  address: z.string().optional()
})

export const appointmentSchema = z.object({
  therapistId: z.string(),
  dateTime: z.string().datetime(),
  duration: z.number().min(30).max(180).default(60),
  type: z.enum(['ONLINE', 'IN_PERSON']).default('ONLINE'),
  notes: z.string().optional()
})

export const sessionFeedbackSchema = z.object({
  sessionNotes: z.string().optional(),
  clientFeedback: z.string().optional(),
  rating: z.number().min(1).max(5).optional()
})