const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function showSampleData() {
  console.log('📊 Sample Data for DataGrip Exploration\n')
  
  // Show sample users
  console.log('👥 Sample Users:')
  const users = await prisma.user.findMany({
    take: 5,
    include: {
      clientProfile: true,
      therapistProfile: {
        select: {
          firstName: true,
          lastName: true,
          title: true,
          specializations: true,
          hourlyRate: true,
          rating: true
        }
      }
    }
  })
  
  users.forEach(user => {
    console.log(`   ${user.role}: ${user.email} - ${user.name}`)
    if (user.clientProfile) {
      console.log(`      Phone: ${user.clientProfile.phone}`)
    }
    if (user.therapistProfile) {
      console.log(`      Rate: ${user.therapistProfile.hourlyRate} THB/hour`)
      console.log(`      Specializations: ${user.therapistProfile.specializations.join(', ')}`)
    }
  })
  
  // Show sample appointments
  console.log('\n📅 Sample Appointments:')
  const appointments = await prisma.appointment.findMany({
    take: 5,
    include: {
      client: { select: { name: true } },
      therapist: { select: { name: true } }
    }
  })
  
  appointments.forEach(apt => {
    console.log(`   ${apt.dateTime.toLocaleDateString()} ${apt.dateTime.toLocaleTimeString()} - ${apt.status}`)
    console.log(`      Client: ${apt.client.name}`)
    console.log(`      Therapist: ${apt.therapist.name}`)
    console.log(`      Type: ${apt.type} (${apt.duration} min)`)
  })
  
  // Show sample sessions with ratings
  console.log('\n🎯 Sample Sessions with Ratings:')
  const sessions = await prisma.session.findMany({
    take: 3,
    where: { rating: { not: null } },
    include: {
      client: { select: { name: true } },
      therapist: { select: { name: true } }
    }
  })
  
  sessions.forEach(session => {
    console.log(`   ${session.startTime.toLocaleDateString()} - Rating: ${session.rating}/5`)
    console.log(`      Client: ${session.client.name}`)
    console.log(`      Therapist: ${session.therapist.name}`)
    console.log(`      Feedback: ${session.clientFeedback ? session.clientFeedback.substring(0, 50) + '...' : 'None'}`)
  })
  
  // Show payment summary
  console.log('\n💳 Payment Summary:')
  const paymentStats = await prisma.payment.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { amount: true }
  })
  
  paymentStats.forEach(stat => {
    console.log(`   ${stat.status}: ${stat._count.id} payments, ${stat._sum.amount?.toFixed(2)} THB total`)
  })
  
  // Show therapist availability
  console.log('\n⏰ Therapist Availability Sample:')
  const availability = await prisma.therapistAvailability.findMany({
    take: 5,
    include: {
      therapist: {
        select: {
          firstName: true,
          lastName: true,
          title: true
        }
      }
    }
  })
  
  availability.forEach(avail => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    console.log(`   ${avail.therapist.title}${avail.therapist.firstName} ${avail.therapist.lastName}`)
    console.log(`      ${days[avail.dayOfWeek]}: ${avail.startTime} - ${avail.endTime}`)
  })
}

async function main() {
  try {
    await showSampleData()
    console.log('\n🔧 DataGrip Connection Information:')
    console.log('   Host: localhost')
    console.log('   Port: 5432')
    console.log('   Database: therajai')
    console.log('   Username: therajai_user')
    console.log('   Password: therajai_password')
    console.log('   SSL Mode: Disable (for local development)')
    console.log('\n📝 Interesting Queries to Try:')
    console.log('   SELECT * FROM users WHERE role = \'THERAPIST\';')
    console.log('   SELECT tp.*, u.name FROM therapist_profiles tp JOIN users u ON tp."userId" = u.id;')
    console.log('   SELECT a.*, c.name as client_name, t.name as therapist_name FROM appointments a')
    console.log('   JOIN users c ON a."clientId" = c.id JOIN users t ON a."therapistId" = t.id;')
    console.log('   SELECT s.rating, s."clientFeedback", u.name FROM sessions s')
    console.log('   JOIN users u ON s."therapistId" = u.id WHERE s.rating IS NOT NULL;')
    console.log('\n🎉 Database ready for exploration!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()