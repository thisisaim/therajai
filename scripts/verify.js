const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function verify() {
  try {
    console.log('🔍 Verifying database setup...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test user count
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)
    
    // Test authentication
    const testUser = await prisma.user.findUnique({
      where: { email: 'client@therajai.com' },
      include: { clientProfile: true }
    })
    
    if (testUser) {
      const isPasswordValid = await bcrypt.compare('client123', testUser.password)
      console.log(`✅ Test user found: ${testUser.name} (${testUser.role})`)
      console.log(`✅ Password verification: ${isPasswordValid ? 'PASS' : 'FAIL'}`)
      
      if (testUser.clientProfile) {
        console.log(`✅ Client profile found: ${testUser.clientProfile.firstName} ${testUser.clientProfile.lastName}`)
      }
    }
    
    // Test therapist
    const therapist = await prisma.user.findUnique({
      where: { email: 'therapist@therajai.com' },
      include: { 
        therapistProfile: {
          include: { availability: true }
        }
      }
    })
    
    if (therapist && therapist.therapistProfile) {
      console.log(`✅ Therapist found: ${therapist.therapistProfile.firstName} ${therapist.therapistProfile.lastName}`)
      console.log(`✅ Therapist availability slots: ${therapist.therapistProfile.availability.length}`)
    }
    
    console.log('\n🎉 Database verification completed successfully!')
    console.log('\n📋 Test credentials:')
    console.log('   Admin: admin@therajai.com / admin123')
    console.log('   Client: client@therajai.com / client123') 
    console.log('   Therapist: therapist@therajai.com / therapist123')
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verify()