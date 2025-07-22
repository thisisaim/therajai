import { prisma } from './prisma'
import { emailService } from './email'

export class NotificationScheduler {
  
  /**
   * Send 24-hour appointment reminders
   * Called daily to check for appointments tomorrow
   */
  static async send24HourReminders(): Promise<void> {
    try {
      console.log('Starting 24-hour appointment reminder process...')

      // Get appointments for tomorrow (24 hours from now, with some buffer)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const dayAfterTomorrow = new Date(tomorrow)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

      const appointments = await prisma.appointment.findMany({
        where: {
          dateTime: {
            gte: tomorrow,
            lt: dayAfterTomorrow
          },
          status: 'SCHEDULED',
          payment: {
            status: 'COMPLETED'
          }
        },
        include: {
          client: {
            include: {
              clientProfile: true
            }
          },
          therapist: {
            include: {
              therapistProfile: true
            }
          },
          payment: true
        }
      })

      console.log(`Found ${appointments.length} appointments for 24-hour reminders`)

      let emailsSent = 0
      let emailsFailed = 0

      for (const appointment of appointments) {
        try {
          const clientName = appointment.client.clientProfile?.firstName || appointment.client.name
          const therapistName = `${appointment.therapist.therapistProfile?.title || ''} ${appointment.therapist.therapistProfile?.firstName} ${appointment.therapist.therapistProfile?.lastName}`.trim()
          
          // Generate meeting link if online appointment
          const meetingLink = appointment.type === 'ONLINE' 
            ? `https://therajai.com/video/${appointment.id}`
            : undefined

          const success = await emailService.sendAppointmentReminder(
            appointment.client.email,
            clientName,
            therapistName,
            appointment.dateTime,
            meetingLink,
            '24h'
          )

          if (success) {
            emailsSent++
            console.log(`24h reminder sent to ${appointment.client.email} for appointment ${appointment.id}`)
          } else {
            emailsFailed++
            console.error(`Failed to send 24h reminder to ${appointment.client.email} for appointment ${appointment.id}`)
          }

        } catch (error) {
          emailsFailed++
          console.error(`Error sending 24h reminder for appointment ${appointment.id}:`, error)
        }
      }

      console.log(`24-hour reminders completed: ${emailsSent} sent, ${emailsFailed} failed`)

    } catch (error) {
      console.error('Error in 24-hour reminder process:', error)
      throw error
    }
  }

  /**
   * Send 2-hour appointment reminders
   * Called every 30 minutes to check for appointments in 2 hours
   */
  static async send2HourReminders(): Promise<void> {
    try {
      console.log('Starting 2-hour appointment reminder process...')

      // Get appointments in 2 hours (with 30-minute buffer for scheduling)
      const now = new Date()
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      const twoHours30FromNow = new Date(now.getTime() + 2.5 * 60 * 60 * 1000)

      const appointments = await prisma.appointment.findMany({
        where: {
          dateTime: {
            gte: twoHoursFromNow,
            lt: twoHours30FromNow
          },
          status: 'SCHEDULED',
          payment: {
            status: 'COMPLETED'
          }
        },
        include: {
          client: {
            include: {
              clientProfile: true
            }
          },
          therapist: {
            include: {
              therapistProfile: true
            }
          },
          payment: true
        }
      })

      console.log(`Found ${appointments.length} appointments for 2-hour reminders`)

      let emailsSent = 0
      let emailsFailed = 0

      for (const appointment of appointments) {
        try {
          const clientName = appointment.client.clientProfile?.firstName || appointment.client.name
          const therapistName = `${appointment.therapist.therapistProfile?.title || ''} ${appointment.therapist.therapistProfile?.firstName} ${appointment.therapist.therapistProfile?.lastName}`.trim()
          
          // Generate meeting link if online appointment
          const meetingLink = appointment.type === 'ONLINE' 
            ? `https://therajai.com/video/${appointment.id}`
            : undefined

          const success = await emailService.sendAppointmentReminder(
            appointment.client.email,
            clientName,
            therapistName,
            appointment.dateTime,
            meetingLink,
            '2h'
          )

          if (success) {
            emailsSent++
            console.log(`2h reminder sent to ${appointment.client.email} for appointment ${appointment.id}`)
          } else {
            emailsFailed++
            console.error(`Failed to send 2h reminder to ${appointment.client.email} for appointment ${appointment.id}`)
          }

        } catch (error) {
          emailsFailed++
          console.error(`Error sending 2h reminder for appointment ${appointment.id}:`, error)
        }
      }

      console.log(`2-hour reminders completed: ${emailsSent} sent, ${emailsFailed} failed`)

    } catch (error) {
      console.error('Error in 2-hour reminder process:', error)
      throw error
    }
  }

  /**
   * Send payment confirmation emails
   * Called when a payment is completed
   */
  static async sendPaymentConfirmation(appointmentId: string): Promise<boolean> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: {
            include: {
              clientProfile: true
            }
          },
          therapist: {
            include: {
              therapistProfile: true
            }
          },
          payment: true
        }
      })

      if (!appointment || !appointment.payment) {
        console.error(`Appointment ${appointmentId} not found or has no payment`)
        return false
      }

      const clientName = appointment.client.clientProfile?.firstName || appointment.client.name
      const therapistName = `${appointment.therapist.therapistProfile?.title || ''} ${appointment.therapist.therapistProfile?.firstName} ${appointment.therapist.therapistProfile?.lastName}`.trim()

      const success = await emailService.sendPaymentConfirmation(
        appointment.client.email,
        clientName,
        parseFloat(appointment.payment.amount.toString()),
        appointment.dateTime,
        therapistName,
        appointment.payment.receiptUrl || undefined
      )

      if (success) {
        console.log(`Payment confirmation sent to ${appointment.client.email} for appointment ${appointmentId}`)
      }

      return success

    } catch (error) {
      console.error(`Error sending payment confirmation for appointment ${appointmentId}:`, error)
      return false
    }
  }

  /**
   * Send new appointment notification to therapist
   * Called when a new appointment is booked
   */
  static async sendNewAppointmentNotification(appointmentId: string): Promise<boolean> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: {
            include: {
              clientProfile: true
            }
          },
          therapist: {
            include: {
              therapistProfile: true
            }
          }
        }
      })

      if (!appointment) {
        console.error(`Appointment ${appointmentId} not found`)
        return false
      }

      const clientName = appointment.client.clientProfile?.firstName || appointment.client.name
      const therapistName = `${appointment.therapist.therapistProfile?.title || ''} ${appointment.therapist.therapistProfile?.firstName} ${appointment.therapist.therapistProfile?.lastName}`.trim()

      const success = await emailService.sendNewAppointmentNotification(
        appointment.therapist.email,
        therapistName,
        clientName,
        appointment.dateTime
      )

      if (success) {
        console.log(`New appointment notification sent to ${appointment.therapist.email} for appointment ${appointmentId}`)
      }

      return success

    } catch (error) {
      console.error(`Error sending new appointment notification for appointment ${appointmentId}:`, error)
      return false
    }
  }

  /**
   * Get notification summary for admin dashboard
   */
  static async getNotificationSummary() {
    try {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const dayAfterTomorrow = new Date(tomorrow)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      const twoHours30FromNow = new Date(now.getTime() + 2.5 * 60 * 60 * 1000)

      const [
        pending24HourReminders,
        pending2HourReminders,
        todayAppointments,
        recentPayments
      ] = await Promise.all([
        // Appointments needing 24h reminders
        prisma.appointment.count({
          where: {
            dateTime: {
              gte: tomorrow,
              lt: dayAfterTomorrow
            },
            status: 'SCHEDULED',
            payment: {
              status: 'COMPLETED'
            }
          }
        }),

        // Appointments needing 2h reminders
        prisma.appointment.count({
          where: {
            dateTime: {
              gte: twoHoursFromNow,
              lt: twoHours30FromNow
            },
            status: 'SCHEDULED',
            payment: {
              status: 'COMPLETED'
            }
          }
        }),

        // Today's appointments
        prisma.appointment.count({
          where: {
            dateTime: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            },
            status: 'SCHEDULED'
          }
        }),

        // Recent payments (last 24 hours)
        prisma.payment.count({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
            }
          }
        })
      ])

      return {
        pending24HourReminders,
        pending2HourReminders,
        todayAppointments,
        recentPayments,
        lastChecked: new Date()
      }

    } catch (error) {
      console.error('Error getting notification summary:', error)
      throw error
    }
  }
}