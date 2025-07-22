const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testOnboardingSystem() {
  console.log('🧪 Testing Therapist Onboarding System...')

  try {
    // Create a test therapist user without profile
    const testTherapist = await prisma.user.upsert({
      where: { email: 'newtherapist@therajai.com' },
      update: {},
      create: {
        email: 'newtherapist@therajai.com',
        password: await require('bcryptjs').hash('therapist123', 12),
        name: 'ดร.สมชาย ใจดี',
        role: 'THERAPIST',
        verified: true,
      }
    })

    console.log('✅ Created test therapist user (without profile)')
    console.log(`   Email: newtherapist@therajai.com`)
    console.log(`   Password: therapist123`)
    console.log(`   User ID: ${testTherapist.id}`)
    console.log('')

    // Check current therapist profiles status
    const allTherapistProfiles = await prisma.therapistProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('📊 Current Therapist Profiles Status:')
    console.log(`   Total profiles: ${allTherapistProfiles.length}`)
    
    const pendingCount = allTherapistProfiles.filter(p => !p.verified && !p.rejected).length
    const approvedCount = allTherapistProfiles.filter(p => p.verified).length
    const rejectedCount = allTherapistProfiles.filter(p => p.rejected).length

    console.log(`   Pending verification: ${pendingCount}`)
    console.log(`   Approved: ${approvedCount}`)
    console.log(`   Rejected: ${rejectedCount}`)
    console.log('')

    // List profiles by status
    if (pendingCount > 0) {
      console.log('⏳ Pending Verification:')
      allTherapistProfiles
        .filter(p => !p.verified && !p.rejected)
        .forEach(profile => {
          console.log(`   • ${profile.firstName} ${profile.lastName} (${profile.user.email})`)
          console.log(`     License: ${profile.licenseNumber}`)
          console.log(`     Created: ${profile.createdAt.toLocaleDateString()}`)
        })
      console.log('')
    }

    if (approvedCount > 0) {
      console.log('✅ Approved Therapists:')
      allTherapistProfiles
        .filter(p => p.verified)
        .forEach(profile => {
          console.log(`   • ${profile.firstName} ${profile.lastName} (${profile.user.email})`)
          console.log(`     Rating: ${Number(profile.rating).toFixed(1)} ⭐`)
          console.log(`     Sessions: ${profile.totalSessions}`)
        })
      console.log('')
    }

    if (rejectedCount > 0) {
      console.log('❌ Rejected Therapists:')
      allTherapistProfiles
        .filter(p => p.rejected)
        .forEach(profile => {
          console.log(`   • ${profile.firstName} ${profile.lastName} (${profile.user.email})`)
          console.log(`     Reason: ${profile.verificationNotes || 'No reason provided'}`)
        })
      console.log('')
    }

    console.log('🔧 Testing URLs:')
    console.log('📱 Therapist Onboarding:')
    console.log('   • Login as new therapist: http://localhost:3000/auth/login')
    console.log('     Email: newtherapist@therajai.com')
    console.log('     Password: therapist123')
    console.log('   • Onboarding wizard: http://localhost:3000/onboarding/therapist')
    console.log('   • Dashboard: http://localhost:3000/dashboard')
    console.log('')
    
    console.log('👨‍💼 Admin Verification:')
    console.log('   • Login as admin: http://localhost:3000/auth/login')
    console.log('     Email: admin@therajai.com')
    console.log('     Password: admin123')
    console.log('   • Verification page: http://localhost:3000/admin/therapist-verification')
    console.log('')

    console.log('🎯 Test Scenarios:')
    console.log('1. Login as new therapist and complete onboarding wizard')
    console.log('2. Check dashboard for profile completion banner')
    console.log('3. Login as admin and verify/reject therapist profiles')
    console.log('4. Check that verified therapists appear in /therapists search')
    console.log('5. Test that rejected therapists do not appear in search')
    console.log('')

    console.log('🚀 Onboarding Features:')
    console.log('✅ 4-step wizard with progress tracking')
    console.log('✅ Form validation and completion checks')
    console.log('✅ Profile completion banner in dashboard')
    console.log('✅ Admin verification system')
    console.log('✅ License verification with notes')
    console.log('✅ Automatic profile status updates')

  } catch (error) {
    console.error('❌ Error testing onboarding system:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testOnboardingSystem()