import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Thai names and data
const thaiFirstNames = [
  'สมชาย', 'สมหญิง', 'วิชัย', 'วิภา', 'ประสิทธิ์', 'ประภา', 'อนุชา', 'อนุชิต', 
  'สุริยา', 'สุภา', 'ธนพล', 'ธนัญญา', 'ปวีณา', 'ปฐมพร', 'กมล', 'กัญญา',
  'ณัฐ', 'ณิชา', 'ศักดิ์', 'ศิริ', 'รัฐ', 'รุ่ง', 'ชัย', 'ชนิดา', 'ไพบูลย์'
]

const thaiLastNames = [
  'ใจดี', 'ช่วยเหลือ', 'รักษา', 'ดูแล', 'สุขใจ', 'มั่นคง', 'เจริญ', 'พัฒนา',
  'สร้างสรรค์', 'ก้าวหน้า', 'ยิ่งใหญ่', 'สุขสันต์', 'อำนวย', 'บำรุง', 'เสริม',
  'พูนสุข', 'ธรรมดา', 'สงบ', 'ปลอดภัย', 'มั่นใจ', 'แน่วแน่', 'ยืนยง', 'ถาวร'
]

const specializations = [
  'ความเครียด', 'ความวิตกกังวล', 'ภาวะซึมเศร้า', 'ปัญหาความสัมพันธ์',
  'ปัญหาครอบครัว', 'ปัญหาการทำงาน', 'ความมั่นใจในตนเอง', 'การจัดการอารมณ์',
  'ปัญหาการนอน', 'ปัญหาการเรียน', 'ปัญหาวัยรุ่น', 'ปัญหาผู้สูงอายุ',
  'ปัญหาการติดเกม', 'ปัญหาการใช้สื่อสังคม', 'ปัญหาการเงิน', 'ปัญหาสุขภาพ'
]

const universities = [
  'จุฬาลงกรณ์มหาวิทยาลัย', 'มหาวิทยาลัยมหิดล', 'มหาวิทยาลัยธรรมศาสตร์',
  'มหาวิทยาลัยเชียงใหม่', 'มหาวิทยาลัยขอนแก่น', 'มหาวิทยาลัยสงขลานครินทร์',
  'มหาวิทยาลัยเกษตรศาสตร์', 'มหาวิทยาลัยศิลปกรรมศาสตร์', 'มหาวิทยาลัยรามคำแหง'
]

const provinces = [
  'กรุงเทพมหานคร', 'เชียงใหม่', 'ขอนแก่น', 'สงขลา', 'นครราชสีมา',
  'ระยอง', 'ชลบุรี', 'ภูเก็ต', 'เชียงราย', 'อุดรธานี', 'สุราษฎร์ธานี'
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generatePhoneNumber(): string {
  const prefixes = ['08', '09', '06']
  const prefix = getRandomElement(prefixes)
  const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
  return `${prefix}${number.substring(0, 1)}-${number.substring(1, 4)}-${number.substring(4, 8)}`
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com']
  const englishName = firstName.toLowerCase().replace(/[^\w]/g, '') + '.' + lastName.toLowerCase().replace(/[^\w]/g, '')
  return `${englishName}${index}${Math.floor(Math.random() * 1000)}@${getRandomElement(domains)}`
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function getRandomFutureDate(daysAhead: number): Date {
  const today = new Date()
  const futureDate = new Date(today)
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * daysAhead))
  return futureDate
}

async function generateDummyData() {
  console.log('🚀 Generating comprehensive dummy data...')

  // Generate 25 clients
  console.log('👥 Creating clients...')
  const clients = []
  for (let i = 0; i < 25; i++) {
    const firstName = getRandomElement(thaiFirstNames)
    const lastName = getRandomElement(thaiLastNames)
    const email = generateEmail(firstName, lastName, i)
    const password = await bcrypt.hash('password123', 12)
    
    const client = await prisma.user.create({
      data: {
        email,
        password,
        name: `${firstName} ${lastName}`,
        role: 'CLIENT',
        verified: Math.random() > 0.2, // 80% verified
        clientProfile: {
          create: {
            firstName,
            lastName,
            dateOfBirth: getRandomDate(new Date('1970-01-01'), new Date('2000-01-01')),
            phone: generatePhoneNumber(),
            address: `${Math.floor(Math.random() * 999) + 1} ถนนสุขุมวิท ${getRandomElement(provinces)}`,
            emergencyContact: `${getRandomElement(thaiFirstNames)} ${getRandomElement(thaiLastNames)}`,
            emergencyPhone: generatePhoneNumber(),
            insuranceProvider: Math.random() > 0.5 ? getRandomElement(['ประกันสังคม', 'ประกันชีวิต AIA', 'ประกันสุขภาพ Bangkok Insurance']) : null,
            insuranceNumber: Math.random() > 0.5 ? `INS${Math.floor(Math.random() * 1000000)}` : null,
            mentalHealthHistory: Math.random() > 0.7 ? 'เคยมีประวัติความเครียดจากการทำงาน' : null,
            currentMedications: Math.random() > 0.8 ? 'ยาลดความดัน, วิตามิน' : null,
            preferredLanguage: Math.random() > 0.8 ? 'ENGLISH' : 'THAI'
          }
        }
      }
    })
    clients.push(client)
  }

  // Generate 15 therapists
  console.log('👨‍⚕️ Creating therapists...')
  const therapists = []
  for (let i = 0; i < 15; i++) {
    const firstName = getRandomElement(thaiFirstNames)
    const lastName = getRandomElement(thaiLastNames)
    const email = generateEmail(firstName, lastName, i)
    const password = await bcrypt.hash('password123', 12)
    const title = getRandomElement(['ดร.', 'อ.', 'ผศ.', 'รศ.'])
    const experience = Math.floor(Math.random() * 20) + 1
    const hourlyRate = (Math.floor(Math.random() * 10) + 10) * 100 // 1000-2000 THB
    const rating = Math.random() * 2 + 3 // 3.0-5.0
    const totalSessions = Math.floor(Math.random() * 500) + 10
    
    const therapist = await prisma.user.create({
      data: {
        email,
        password,
        name: `${title}${firstName} ${lastName}`,
        role: 'THERAPIST',
        verified: Math.random() > 0.1, // 90% verified
        therapistProfile: {
          create: {
            firstName,
            lastName,
            title,
            licenseNumber: `PSY-${new Date().getFullYear()}-${(i + 2).toString().padStart(3, '0')}`,
            specializations: getRandomElements(specializations, Math.floor(Math.random() * 4) + 2),
            experience,
            education: `ปริญญา${getRandomElement(['โท', 'เอก'])} จิตวิทยาคลินิก ${getRandomElement(universities)}`,
            languages: Math.random() > 0.3 ? ['ไทย', 'อังกฤษ'] : ['ไทย'],
            bio: `นักจิตวิทยาคลินิกที่มีประสบการณ์ ${experience} ปี เชี่ยวชาญด้าน${getRandomElements(specializations, 2).join('และ')} มุ่งเน้นการให้คำปรึกษาที่เหมาะสมกับวัฒนธรรมไทย ใช้วิธีการบำบัดแบบองค์รวมที่ผสมผสานระหว่างจิตวิทยาสมัยใหม่และภูมิปัญญาไทย`,
            hourlyRate,
            availableOnline: Math.random() > 0.1, // 90% available online
            availableInPerson: Math.random() > 0.4, // 60% available in person
            address: Math.random() > 0.4 ? getRandomElement(provinces) : null,
            verified: Math.random() > 0.2, // 80% verified
            rating,
            totalSessions
          }
        }
      }
    })
    therapists.push(therapist)
  }

  // Generate therapist availability
  console.log('📅 Creating therapist availability...')
  for (const therapist of therapists) {
    const therapistProfile = await prisma.therapistProfile.findUnique({
      where: { userId: therapist.id }
    })
    
    if (therapistProfile) {
      // Random availability pattern
      const availableDays = getRandomElements([1, 2, 3, 4, 5, 6, 0], Math.floor(Math.random() * 4) + 3)
      
      for (const day of availableDays) {
        const startHour = Math.floor(Math.random() * 4) + 8 // 8-11 AM
        const endHour = startHour + Math.floor(Math.random() * 6) + 4 // 4-9 hours later
        
        await prisma.therapistAvailability.create({
          data: {
            therapistId: therapistProfile.id,
            dayOfWeek: day,
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${Math.min(endHour, 20).toString().padStart(2, '0')}:00`,
            isAvailable: Math.random() > 0.1 // 90% available
          }
        })
      }
    }
  }

  // Generate appointments
  console.log('📝 Creating appointments...')
  const appointments = []
  for (let i = 0; i < 50; i++) {
    const client = getRandomElement(clients)
    const therapist = getRandomElement(therapists)
    const appointmentDate = getRandomFutureDate(60) // Next 60 days
    const hour = Math.floor(Math.random() * 10) + 9 // 9 AM - 6 PM
    appointmentDate.setHours(hour, 0, 0, 0)
    
    const statuses = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
    const status = getRandomElement(statuses)
    
    const appointment = await prisma.appointment.create({
      data: {
        clientId: client.id,
        therapistId: therapist.id,
        dateTime: appointmentDate,
        duration: getRandomElement([60, 90, 120]),
        type: getRandomElement(['ONLINE', 'IN_PERSON']),
        status: status as any,
        notes: Math.random() > 0.5 ? 'ผู้ใช้บริการต้องการปรึกษาเรื่องความเครียดจากการทำงาน' : null,
        sessionLink: status === 'SCHEDULED' && Math.random() > 0.5 ? 'https://meet.therajai.com/session-' + Math.random().toString(36).substring(7) : null
      }
    })
    appointments.push(appointment)
  }

  // Generate sessions for completed appointments
  console.log('🎯 Creating sessions...')
  const completedAppointments = appointments.filter(apt => 
    Math.random() > 0.3 // Some completed appointments have sessions
  )
  
  for (const appointment of completedAppointments.slice(0, 25)) {
    const startTime = new Date(appointment.dateTime)
    const endTime = new Date(startTime)
    endTime.setMinutes(startTime.getMinutes() + appointment.duration)
    
    await prisma.session.create({
      data: {
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        therapistId: appointment.therapistId,
        startTime,
        endTime,
        sessionNotes: `การปรึกษาเป็นไปด้วยดี ผู้ใช้บริการมีความก้าวหน้าในการจัดการกับ${getRandomElement(specializations)} แนะนำให้ฝึกเทคนิคการผ่อนคลายและมีการนัดหมายครั้งถัดไป`,
        clientFeedback: Math.random() > 0.3 ? `ได้รับคำแนะนำที่ดีมาก รู้สึกดีขึ้นหลังจากการปรึกษา ขอบคุณ${getRandomElement(['ดร.', 'อ.', 'คุณ'])}${getRandomElement(thaiFirstNames)}มากค่ะ` : null,
        rating: Math.random() > 0.2 ? Math.floor(Math.random() * 2) + 4 : null // 4-5 stars mostly
      }
    })
  }

  // Generate payments
  console.log('💳 Creating payments...')
  const paidAppointments = appointments.filter(apt => 
    Math.random() > 0.2 // 80% have payments
  )
  
  for (const appointment of paidAppointments.slice(0, 35)) {
    const therapistProfile = await prisma.therapistProfile.findUnique({
      where: { userId: appointment.therapistId }
    })
    
    if (therapistProfile) {
      const amount = (therapistProfile.hourlyRate.toNumber() * appointment.duration) / 60
      const statuses = ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED']
      const status = getRandomElement(statuses)
      
      await prisma.payment.create({
        data: {
          appointmentId: appointment.id,
          clientId: appointment.clientId,
          amount,
          currency: 'THB',
          status: status as any,
          stripePaymentId: status === 'COMPLETED' ? 'pi_' + Math.random().toString(36).substring(7) : null,
          stripeIntentId: 'pi_' + Math.random().toString(36).substring(7)
        }
      })
    }
  }

  console.log('✅ Dummy data generation completed!')
  
  // Print summary
  const userCount = await prisma.user.count()
  const clientCount = await prisma.clientProfile.count()
  const therapistCount = await prisma.therapistProfile.count()
  const appointmentCount = await prisma.appointment.count()
  const sessionCount = await prisma.session.count()
  const paymentCount = await prisma.payment.count()
  const availabilityCount = await prisma.therapistAvailability.count()
  
  console.log('\n📊 Database Summary:')
  console.log(`👥 Users: ${userCount}`)
  console.log(`🙋 Clients: ${clientCount}`)
  console.log(`👨‍⚕️ Therapists: ${therapistCount}`)
  console.log(`📅 Appointments: ${appointmentCount}`)
  console.log(`🎯 Sessions: ${sessionCount}`)
  console.log(`💳 Payments: ${paymentCount}`)
  console.log(`⏰ Availability Slots: ${availabilityCount}`)
  
  console.log('\n🔐 Login Credentials:')
  console.log('All users have password: password123')
  console.log('Original test users still available with their original passwords')
}

async function main() {
  try {
    await generateDummyData()
  } catch (error) {
    console.error('❌ Error generating dummy data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()