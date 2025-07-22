const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCancellationReschedule() {
  console.log('🧪 Testing Cancellation & Rescheduling System...')

  try {
    // Get existing appointments to test with
    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED'
      },
      include: {
        payment: true,
        client: true,
        therapist: {
          include: {
            therapistProfile: true
          }
        }
      }
    })

    if (appointments.length === 0) {
      console.log('❌ No scheduled appointments found. Run create-test-appointments.js first.')
      return
    }

    console.log(`✅ Found ${appointments.length} scheduled appointments to test with`)
    
    appointments.forEach((apt, index) => {
      const timeUntil = (new Date(apt.dateTime) - new Date()) / (1000 * 60 * 60)
      console.log(`${index + 1}. Appointment ${apt.id}:`)
      console.log(`   Time: ${apt.dateTime.toLocaleString()}`)
      console.log(`   Hours until: ${timeUntil.toFixed(1)}`)
      console.log(`   Payment: ${apt.payment?.status || 'None'} - ฿${apt.payment?.amount || 0}`)
      
      // Cancellation policy test
      if (timeUntil >= 24) {
        console.log(`   🟢 Cancellation: Full refund (฿${apt.payment?.amount || 0})`)
      } else if (timeUntil >= 2) {
        console.log(`   🟡 Cancellation: 50% refund (฿${(apt.payment?.amount || 0) * 0.5})`)
      } else {
        console.log(`   🔴 Cancellation: No refund`)
      }
      
      // Rescheduling policy test
      if (timeUntil >= 24) {
        console.log(`   🟢 Rescheduling: Free`)
      } else if (timeUntil >= 2) {
        console.log(`   🟡 Rescheduling: ฿200 fee`)
      } else {
        console.log(`   🔴 Rescheduling: Not allowed`)
      }
      
      console.log('')
    })

    console.log('🔧 API Endpoints Available:')
    console.log('• POST /api/appointments/{id}/cancel')
    console.log('• POST /api/appointments/{id}/reschedule')
    console.log('')
    
    console.log('📱 UI Components Available:')
    console.log('• CancelModal - Cancellation with refund policy')
    console.log('• RescheduleModal - Time slot selection and fee calculation')
    console.log('')
    
    console.log('🎯 Test Scenarios:')
    console.log('1. Cancel appointment > 24h ahead (full refund)')
    console.log('2. Cancel appointment 2-24h ahead (50% refund)')
    console.log('3. Cancel appointment < 2h ahead (no refund)')
    console.log('4. Reschedule appointment > 24h ahead (free)')
    console.log('5. Reschedule appointment 2-24h ahead (200฿ fee)')
    console.log('6. Try to reschedule < 2h ahead (blocked)')
    console.log('')
    
    console.log('🔑 Test with accounts:')
    console.log('👤 Client: client@therajai.com / client123')
    console.log('👩‍⚕️ Therapist: therapist@therajai.com / therapist123')

  } catch (error) {
    console.error('❌ Error testing cancellation/reschedule:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCancellationReschedule()