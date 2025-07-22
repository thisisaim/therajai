export interface User {
  id: string
  email: string
  name: string
  role: 'CLIENT' | 'THERAPIST' | 'ADMIN'
  createdAt: Date
  updatedAt: Date
  profile?: ClientProfile | TherapistProfile
}

export interface ClientProfile {
  id: string
  userId: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  phone: string
  address: string
  emergencyContact: string
  emergencyPhone: string
  insuranceProvider?: string
  insuranceNumber?: string
  mentalHealthHistory?: string
  currentMedications?: string
  preferredLanguage: 'THAI' | 'ENGLISH'
  createdAt: Date
  updatedAt: Date
}

export interface TherapistProfile {
  id: string
  userId: string
  firstName: string
  lastName: string
  title: string
  licenseNumber: string
  specializations: string[]
  experience: number
  education: string
  languages: string[]
  bio: string
  hourlyRate: number
  availableOnline: boolean
  availableInPerson: boolean
  address?: string
  verified: boolean
  rating: number
  totalSessions: number
  createdAt: Date
  updatedAt: Date
}

export interface Appointment {
  id: string
  clientId: string
  therapistId: string
  dateTime: Date
  duration: number
  type: 'ONLINE' | 'IN_PERSON'
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  sessionLink?: string
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  appointmentId: string
  clientId: string
  therapistId: string
  startTime: Date
  endTime?: Date
  sessionNotes?: string
  clientFeedback?: string
  rating?: number
  createdAt: Date
  updatedAt: Date
}

export interface Payment {
  id: string
  appointmentId: string
  clientId: string
  amount: number
  currency: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  stripePaymentId?: string
  createdAt: Date
  updatedAt: Date
}