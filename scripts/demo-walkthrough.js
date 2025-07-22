const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function demoWalkthrough() {
  console.log('🎬 THERAJAI PLATFORM DEMO WALKTHROUGH\n');
  console.log('=' * 50);
  
  console.log('👥 USERS IN THE SYSTEM:');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      verified: true
    },
    take: 10
  });
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.role}: ${user.name} (${user.email})`);
  });
  
  console.log('\n👨‍⚕️ FEATURED THERAPISTS:');
  const therapists = await prisma.therapistProfile.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    where: { verified: true },
    take: 5
  });
  
  therapists.forEach((therapist, index) => {
    console.log(`${index + 1}. ${therapist.title}${therapist.firstName} ${therapist.lastName}`);
    console.log(`   Email: ${therapist.user.email}`);
    console.log(`   Specializations: ${therapist.specializations.join(', ')}`);
    console.log(`   Rate: ${therapist.hourlyRate} THB/hour`);
    console.log(`   Rating: ${therapist.rating}/5 (${therapist.totalSessions} sessions)`);
    console.log('');
  });
  
  console.log('📅 UPCOMING APPOINTMENTS:');
  const appointments = await prisma.appointment.findMany({
    include: {
      client: { select: { name: true } },
      therapist: { select: { name: true } }
    },
    where: {
      dateTime: {
        gte: new Date()
      }
    },
    orderBy: { dateTime: 'asc' },
    take: 5
  });
  
  appointments.forEach((apt, index) => {
    console.log(`${index + 1}. ${apt.dateTime.toLocaleString()}`);
    console.log(`   Client: ${apt.client.name}`);
    console.log(`   Therapist: ${apt.therapist.name}`);
    console.log(`   Type: ${apt.type} (${apt.duration} min)`);
    console.log(`   Status: ${apt.status}`);
    console.log('');
  });
  
  console.log('🎯 RECENT SESSIONS WITH FEEDBACK:');
  const sessions = await prisma.session.findMany({
    include: {
      client: { select: { name: true } },
      therapist: { select: { name: true } }
    },
    where: {
      rating: { not: null }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  sessions.forEach((session, index) => {
    console.log(`${index + 1}. ${session.startTime.toLocaleDateString()}`);
    console.log(`   Client: ${session.client.name}`);
    console.log(`   Therapist: ${session.therapist.name}`);
    console.log(`   Rating: ${session.rating}/5`);
    if (session.clientFeedback) {
      console.log(`   Feedback: ${session.clientFeedback.substring(0, 100)}...`);
    }
    console.log('');
  });
  
  console.log('💰 PAYMENT SUMMARY:');
  const paymentStats = await prisma.payment.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { amount: true }
  });
  
  paymentStats.forEach(stat => {
    console.log(`${stat.status}: ${stat._count.id} payments, ${stat._sum.amount?.toFixed(2)} THB`);
  });
  
  console.log('\n🚀 READY TO TEST!');
  console.log('='.repeat(50));
  console.log('1. 🌐 Open: http://localhost:3000');
  console.log('2. 🔐 Login Options:');
  console.log('   📋 Client: client@therajai.com / client123');
  console.log('   👨‍⚕️ Therapist: therapist@therajai.com / therapist123');
  console.log('   👑 Admin: admin@therajai.com / admin123');
  console.log('3. 🧪 Follow testing guide: docs/testing-workflows.md');
  console.log('4. 🗃️ View data in DataGrip with connection info above');
  
  console.log('\n💡 TESTING TIPS:');
  console.log('- Try registering a new user and see it appear in database');
  console.log('- Login as different roles to see different dashboards');
  console.log('- Check DataGrip to verify all actions save to database');
  console.log('- Test on mobile/tablet for responsive design');
  console.log('- Use browser DevTools to check for errors');
  
  console.log('\n🎉 YOUR THERAJAI PLATFORM IS READY!');
}

demoWalkthrough()
  .catch(console.error)
  .finally(() => prisma.$disconnect());