import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@therajai.com' },
    update: {},
    create: {
      email: 'admin@therajai.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      verified: true,
    },
  })

  // Create sample client
  const clientPassword = await bcrypt.hash('client123', 12)
  const client = await prisma.user.upsert({
    where: { email: 'client@therajai.com' },
    update: {},
    create: {
      email: 'client@therajai.com',
      password: clientPassword,
      name: 'สมชาย ใจดี',
      role: 'CLIENT',
      verified: true,
      clientProfile: {
        create: {
          firstName: 'สมชาย',
          lastName: 'ใจดี',
          phone: '081-234-5678',
          preferredLanguage: 'THAI',
          emergencyContact: 'สมหญิง ใจดี',
          emergencyPhone: '081-234-5679',
        },
      },
    },
  })

  // Create sample therapist
  const therapistPassword = await bcrypt.hash('therapist123', 12)
  const therapist = await prisma.user.upsert({
    where: { email: 'therapist@therajai.com' },
    update: {},
    create: {
      email: 'therapist@therajai.com',
      password: therapistPassword,
      name: 'ดร.สมศรี ช่วยเหลือ',
      role: 'THERAPIST',
      verified: true,
      therapistProfile: {
        create: {
          firstName: 'สมศรี',
          lastName: 'ช่วยเหลือ',
          title: 'ดร.',
          licenseNumber: 'PSY-2024-001',
          specializations: ['ความเครียด', 'ความวิตกกังวล', 'ปัญหาความสัมพันธ์'],
          experience: 5,
          education: 'ปริญญาเอก จิตวิทยาคลินิก จุฬาลงกรณ์มหาวิทยาลัย',
          languages: ['ไทย', 'อังกฤษ'],
          bio: 'นักจิตวิทยาคลินิกที่มีประสบการณ์ 5 ปีในการให้คำปรึกษาด้านสุขภาพจิต เชี่ยวชาญในการรักษาความเครียด ความวิตกกังวล และปัญหาความสัมพันธ์ มุ่งเน้นการบำบัดแบบองค์รวมที่เหมาะสมกับบริบทวัฒนธรรมไทย',
          hourlyRate: 1500,
          availableOnline: true,
          availableInPerson: true,
          address: 'กรุงเทพมหานคร',
          verified: true,
          rating: 4.8,
          totalSessions: 150,
        },
      },
    },
  })

  // Create therapist availability
  const therapistProfile = await prisma.therapistProfile.findUnique({
    where: { userId: therapist.id },
  })

  if (therapistProfile) {
    // Monday to Friday, 9 AM to 5 PM
    for (let day = 1; day <= 5; day++) {
      await prisma.therapistAvailability.create({
        data: {
          therapistId: therapistProfile.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true,
        },
      })
    }
  }

  console.log('✅ Database seeding completed successfully!')
  console.log('👤 Admin user: admin@therajai.com / admin123')
  console.log('👤 Client user: client@therajai.com / client123')
  console.log('👤 Therapist user: therapist@therajai.com / therapist123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })