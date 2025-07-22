const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createRichTestData() {
  console.log('🎯 Creating rich test data for dashboard testing...')

  try {
    // Create additional test users
    const client2 = await prisma.user.upsert({
      where: { email: 'client2@therajai.com' },
      update: {},
      create: {
        email: 'client2@therajai.com',
        password: await require('bcryptjs').hash('client123', 12),
        name: 'สมหญิง รักเรียน',
        role: 'CLIENT',
        verified: true,
        clientProfile: {
          create: {
            firstName: 'สมหญิง',
            lastName: 'รักเรียน',
            phone: '082-345-6789',
            preferredLanguage: 'THAI',
            emergencyContact: 'สมชาย รักเรียน',
            emergencyPhone: '082-345-6790',
            dateOfBirth: new Date('1992-05-15'),
            address: 'กรุงเทพมหานคร',
            mentalHealthHistory: 'ประวัติความวิตกกังวลเล็กน้อย',
            currentMedications: 'ไม่มี'
          }
        }
      }
    })

    const therapist2 = await prisma.user.upsert({
      where: { email: 'therapist2@therajai.com' },
      update: {},
      create: {
        email: 'therapist2@therajai.com',
        password: await require('bcryptjs').hash('therapist123', 12),
        name: 'ผศ.ดร.สมพงษ์ ใจดี',
        role: 'THERAPIST',
        verified: true,
        therapistProfile: {
          create: {
            firstName: 'สมพงษ์',
            lastName: 'ใจดี',
            title: 'ผศ.ดร.',
            licenseNumber: 'PSY-2024-002',
            specializations: ['ซึมเศร้า', 'PTSD', 'การบำบัดครอบครัว'],
            experience: 8,
            education: 'ปริญญาเอก จิตวิทยาคลินิก มหาวิทยาลยมหิดล',
            languages: ['ไทย', 'อังกฤษ', 'จีน'],
            bio: 'นักจิตวิทยาคลินิกผู้เชี่ยวชาญด้านการรักษาภาวะซึมเศร้าและ PTSD มีประสบการณ์ 8 ปีในการให้คำปรึกษาแก่ผู้ป่วยและครอบครัว',
            hourlyRate: 2000,
            availableOnline: true,
            availableInPerson: true,
            address: 'กรุงเทพมหานคร',
            verified: true,
            rating: 4.9,
            totalSessions: 320,
          }
        }
      }
    })

    console.log('✅ Created additional test users')

    // Get existing users
    const client1 = await prisma.user.findUnique({
      where: { email: 'client@therajai.com' }
    })
    
    const therapist1 = await prisma.user.findUnique({
      where: { email: 'therapist@therajai.com' }
    })

    // Create availability for therapist2
    const therapist2Profile = await prisma.therapistProfile.findUnique({
      where: { userId: therapist2.id }
    })

    if (therapist2Profile) {
      // Create availability - Monday to Saturday
      for (let day = 1; day <= 6; day++) {
        try {
          await prisma.therapistAvailability.create({
            data: {
              therapistId: therapist2Profile.id,
              dayOfWeek: day,
              startTime: '08:00',
              endTime: '18:00',
              isAvailable: true,
            }
          })
        } catch (error) {
          // Skip if already exists
          if (!error.message.includes('Unique constraint failed')) {
            throw error
          }
        }
      }
      console.log('✅ Created availability for therapist2')
    }

    // Create varied appointment data
    const appointmentData = [
      // Recent completed sessions
      {
        clientId: client1.id,
        therapistId: therapist1.id,
        dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        duration: 60,
        type: 'ONLINE',
        status: 'COMPLETED',
        amount: 1500,
        notes: 'Follow-up session for anxiety management'
      },
      {
        clientId: client2.id,
        therapistId: therapist2.id,
        dateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        duration: 90,
        type: 'IN_PERSON',
        status: 'COMPLETED',
        amount: 3000,
        notes: 'Initial assessment for depression treatment'
      },
      
      // Today's appointments
      {
        clientId: client1.id,
        therapistId: therapist2.id,
        dateTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
        duration: 60,
        type: 'ONLINE',
        status: 'SCHEDULED',
        amount: 2000,
        notes: 'Weekly therapy session - cognitive behavioral therapy'
      },
      
      // Tomorrow's appointments  
      {
        clientId: client2.id,
        therapistId: therapist1.id,
        dateTime: new Date(Date.now() + 28 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 29 * 60 * 60 * 1000),
        duration: 60,
        type: 'IN_PERSON',
        status: 'SCHEDULED',
        amount: 1500,
        notes: 'Couples therapy session with partner'
      },
      
      // Next week appointments
      {
        clientId: client1.id,
        therapistId: therapist1.id,
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        duration: 90,
        type: 'ONLINE',
        status: 'SCHEDULED',
        amount: 2250,
        notes: 'Extended session for trauma processing'
      },
      
      // Cancelled appointment
      {
        clientId: client2.id,
        therapistId: therapist2.id,
        dateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        duration: 60,
        type: 'ONLINE',
        status: 'CANCELLED',
        amount: 2000,
        notes: 'Client cancelled due to work emergency'
      }
    ]

    // Create appointments with payments and sessions
    for (let i = 0; i < appointmentData.length; i++) {
      const aptData = appointmentData[i]
      
      const appointment = await prisma.appointment.create({
        data: aptData
      })

      // Create payment for all except cancelled
      if (aptData.status !== 'CANCELLED') {
        const paymentStatus = aptData.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING'
        
        await prisma.payment.create({
          data: {
            appointmentId: appointment.id,
            clientId: aptData.clientId,
            amount: aptData.amount,
            currency: 'THB',
            status: paymentStatus,
            paymentMethod: 'STRIPE_CARD',
            description: `Payment for therapy session on ${appointment.dateTime.toDateString()}`,
            ...(paymentStatus === 'COMPLETED' && {
              stripePaymentId: `pi_test_${Date.now()}_${i}`,
              receiptUrl: `https://pay.stripe.com/receipts/test_${Date.now()}_${i}`
            })
          }
        })
      }

      // Create session data for completed appointments
      if (aptData.status === 'COMPLETED') {
        const sessionNotes = i % 2 === 0 
          ? 'Patient showed significant improvement in anxiety management. Homework assigned: daily mindfulness practice. Next session will focus on social anxiety triggers.'
          : 'Discussed coping strategies for depression. Patient reports better sleep patterns. Introduced cognitive restructuring techniques. Follow-up on medication compliance needed.'

        await prisma.session.create({
          data: {
            appointmentId: appointment.id,
            clientId: aptData.clientId,
            therapistId: aptData.therapistId,
            startTime: appointment.dateTime,
            endTime: appointment.endTime,
            sessionNotes,
            rating: Math.floor(Math.random() * 2) + 4 // 4 or 5 stars
          }
        })
      }

      console.log(`✅ Created ${aptData.status} appointment for ${appointment.dateTime.toLocaleDateString()}`)
    }

    // Update therapist profiles with updated session counts
    await prisma.therapistProfile.update({
      where: { userId: therapist1.id },
      data: { totalSessions: 155 }
    })

    await prisma.therapistProfile.update({
      where: { userId: therapist2.id },
      data: { totalSessions: 325 }
    })

    console.log('🎉 Rich test data created successfully!')
    console.log('')
    console.log('📊 Dashboard Data Available:')
    console.log('• Multiple clients and therapists')
    console.log('• Appointments in various states (scheduled, completed, cancelled)')
    console.log('• Payment records with different statuses')
    console.log('• Session notes and ratings')
    console.log('• Therapist availability schedules')
    console.log('')
    console.log('🔑 Test Accounts:')
    console.log('👤 Client 1: client@therajai.com / client123')
    console.log('👤 Client 2: client2@therajai.com / client123')
    console.log('👩‍⚕️ Therapist 1: therapist@therajai.com / therapist123')
    console.log('👩‍⚕️ Therapist 2: therapist2@therajai.com / therapist123')
    console.log('👨‍💼 Admin: admin@therajai.com / admin123')
    console.log('')
    console.log('🎯 Dashboard URLs:')
    console.log('• Client Dashboard: http://localhost:3000/dashboard')
    console.log('• Client Appointments: http://localhost:3000/dashboard/appointments')
    console.log('• Therapist Dashboard: http://localhost:3000/dashboard')
    console.log('• Therapist Appointments: http://localhost:3000/dashboard/therapist-appointments')
    console.log('• Therapist Availability: http://localhost:3000/dashboard/availability')

  } catch (error) {
    console.error('❌ Error creating rich test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createRichTestData()