const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestAppointments() {
  console.log('🎯 Creating test appointments...')

  try {
    // Get test users
    const client = await prisma.user.findUnique({
      where: { email: 'client@therajai.com' }
    })
    
    const therapist = await prisma.user.findUnique({
      where: { email: 'therapist@therajai.com' },
      include: { therapistProfile: true }
    })

    if (!client || !therapist) {
      console.error('❌ Test users not found. Run npm run db:seed first.')
      return
    }

    // Create test appointments with different statuses and times
    const appointments = [
      // Today's appointment - scheduled
      {
        clientId: client.id,
        therapistId: therapist.id,
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        duration: 60,
        type: 'ONLINE',
        status: 'SCHEDULED',
        amount: 1500,
        notes: 'First session - anxiety and stress management'
      },
      // Tomorrow's appointment - scheduled
      {
        clientId: client.id,
        therapistId: therapist.id,
        dateTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 27 * 60 * 60 * 1000),
        duration: 60,
        type: 'IN_PERSON',
        status: 'SCHEDULED',
        amount: 1500,
        notes: 'Follow-up session - in-person preferred'
      },
      // Past appointment - completed
      {
        clientId: client.id,
        therapistId: therapist.id,
        dateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        duration: 60,
        type: 'ONLINE',
        status: 'COMPLETED',
        amount: 1500,
        notes: 'Initial consultation - depression screening'
      },
      // Cancelled appointment
      {
        clientId: client.id,
        therapistId: therapist.id,
        dateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        duration: 90,
        type: 'ONLINE',
        status: 'CANCELLED',
        amount: 2250,
        notes: 'Extended session - client cancelled due to illness'
      }
    ]

    for (let i = 0; i < appointments.length; i++) {
      const appointment = await prisma.appointment.create({
        data: appointments[i]
      })

      // Create payment for scheduled and completed appointments
      if (appointments[i].status === 'SCHEDULED' || appointments[i].status === 'COMPLETED') {
        await prisma.payment.create({
          data: {
            appointmentId: appointment.id,
            clientId: client.id,
            amount: appointments[i].amount,
            currency: 'THB',
            status: appointments[i].status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
            paymentMethod: 'STRIPE_CARD',
            description: `Payment for therapy session on ${appointment.dateTime.toDateString()}`
          }
        })
      }

      // Create session for completed appointment
      if (appointments[i].status === 'COMPLETED') {
        await prisma.session.create({
          data: {
            appointmentId: appointment.id,
            clientId: client.id,
            therapistId: therapist.id,
            startTime: appointment.dateTime,
            endTime: appointment.endTime,
            sessionNotes: 'Client showed good engagement. Discussed coping strategies for anxiety. Homework: practice breathing exercises daily. Progress: positive response to CBT techniques.',
            rating: 5
          }
        })
      }

      console.log(`✅ Created ${appointments[i].status} appointment for ${appointment.dateTime.toLocaleDateString()}`)
    }

    console.log('🎉 Test appointments created successfully!')
    console.log('')
    console.log('📋 Test Scenarios Available:')
    console.log('1. Today\'s scheduled appointment (can join video call)')
    console.log('2. Tomorrow\'s in-person appointment')
    console.log('3. Completed session with notes and rating')
    console.log('4. Cancelled appointment')
    console.log('')
    console.log('🔑 Test Accounts:')
    console.log('👤 Client: client@therajai.com / client123')
    console.log('👩‍⚕️ Therapist: therapist@therajai.com / therapist123')

  } catch (error) {
    console.error('❌ Error creating test appointments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestAppointments()