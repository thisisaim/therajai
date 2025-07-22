import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    }

    this.transporter = nodemailer.createTransport(config)
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"therajai" <${process.env.SMTP_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('SMTP connection verified successfully')
      return true
    } catch (error) {
      console.error('SMTP connection failed:', error)
      return false
    }
  }

  // Appointment reminder emails
  async sendAppointmentReminder(
    userEmail: string,
    userName: string,
    therapistName: string,
    appointmentDate: Date,
    meetingLink?: string,
    reminderType: '24h' | '2h' = '24h'
  ): Promise<boolean> {
    const isUrgent = reminderType === '2h'
    const timeText = isUrgent ? '2 ชั่วโมง' : '24 ชั่วโมง'
    
    const subject = `${isUrgent ? '[เร่งด่วน] ' : ''}แจ้งเตือนการนัดหมายในอีก ${timeText} - Therajai`
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { max-width: 600px; margin: 0 auto; font-family: 'Sarabun', sans-serif; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f8f9fa; }
        .appointment-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .urgent { border-left: 4px solid #dc3545; }
        .footer { text-align: center; padding: 20px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 therajai</h1>
          <h2>${isUrgent ? 'แจ้งเตือนเร่งด่วน!' : 'แจ้งเตือนการนัดหมาย'}</h2>
        </div>
        
        <div class="content">
          <p>สวัสดี คุณ${userName}</p>
          
          <div class="appointment-card ${isUrgent ? 'urgent' : ''}">
            <h3>${isUrgent ? '🚨 การนัดหมายของคุณจะเริ่มในอีก 2 ชั่วโมง!' : '📅 การนัดหมายของคุณจะเริ่มในวันพรุ่งนี้'}</h3>
            
            <div style="margin: 15px 0;">
              <strong>👨‍⚕️ นักจิตวิทยา:</strong> ${therapistName}<br>
              <strong>📅 วันที่:</strong> ${appointmentDate.toLocaleDateString('th-TH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}<br>
              <strong>⏰ เวลา:</strong> ${appointmentDate.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              })} น.
            </div>
            
            ${meetingLink ? `
              <div style="margin: 20px 0;">
                <a href="${meetingLink}" class="button">เข้าร่วมการนัดหมายออนไลน์</a>
              </div>
            ` : ''}
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <strong>💡 เตรียมตัวสำหรับเซสชัน:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
                <li>เตรียมสถานที่เงียบและเป็นส่วนตัว</li>
                <li>ทดสอบเสียงและวิดีโอ</li>
                <li>เตรียมคำถามหรือประเด็นที่ต้องการหารือ</li>
              </ul>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://therajai.com/dashboard/appointments" class="button">ดูรายละเอียดการนัดหมาย</a>
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">
            หากคุณต้องการยกเลิกหรือเลื่อนการนัดหมาย โปรดติดต่อเรา<strong>อย่างน้อย 24 ชั่วโมงล่วงหน้า</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>🌟 Therajai - แพลตฟอร์มบริการจิตวิทยาออนไลน์คุณภาพสูง</p>
          <p style="font-size: 12px;">
            หากคุณไม่ต้องการรับอีเมลแจ้งเตือน 
            <a href="https://therajai.com/unsubscribe">คลิกที่นี่</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `
    
    const text = `
    แจ้งเตือนการนัดหมาย - therajai
    
    สวัสดี คุณ${userName}
    
    การนัดหมายของคุณจะเริ่มในอีก ${timeText}:
    
    นักจิตวิทยา: ${therapistName}
    วันที่: ${appointmentDate.toLocaleDateString('th-TH')}
    เวลา: ${appointmentDate.toLocaleTimeString('th-TH')}
    
    ${meetingLink ? `ลิงก์เข้าร่วม: ${meetingLink}` : ''}
    
    เตรียมตัวให้พร้อมและเข้าร่วมตรงเวลา
    
    ขอบคุณที่ใช้บริการ therajai
    `

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      text
    })
  }

  // Payment confirmation email
  async sendPaymentConfirmation(
    userEmail: string,
    userName: string,
    amount: number,
    appointmentDate: Date,
    therapistName: string,
    receiptUrl?: string
  ): Promise<boolean> {
    const subject = 'ยืนยันการชำระเงินสำเร็จ - therajai'
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { max-width: 600px; margin: 0 auto; font-family: 'Sarabun', sans-serif; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f8f9fa; }
        .payment-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .amount { font-size: 24px; font-weight: bold; color: #28a745; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ การชำระเงินสำเร็จ</h1>
          <h2>therajai</h2>
        </div>
        
        <div class="content">
          <p>สวัสดี คุณ${userName}</p>
          
          <div class="payment-card">
            <h3>💳 รายละเอียดการชำระเงิน</h3>
            
            <div style="margin: 15px 0;">
              <div class="amount">฿${amount.toLocaleString()}</div>
              <p>ชำระเงินเรียบร้อยแล้ว</p>
            </div>
            
            <div style="margin: 15px 0;">
              <strong>👨‍⚕️ นักจิตวิทยา:</strong> ${therapistName}<br>
              <strong>📅 วันที่นัดหมาย:</strong> ${appointmentDate.toLocaleDateString('th-TH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}<br>
              <strong>⏰ เวลา:</strong> ${appointmentDate.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              })} น.
            </div>
            
            ${receiptUrl ? `
              <div style="margin: 20px 0;">
                <a href="${receiptUrl}" class="button">ดาวน์โหลดใบเสร็จ</a>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://therajai.com/dashboard/appointments" class="button">ดูการนัดหมายของฉัน</a>
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">
            คุณจะได้รับอีเมลแจ้งเตือนก่อนการนัดหมาย 24 ชั่วโมง และ 2 ชั่วโมง
          </p>
        </div>
        
        <div class="footer">
          <p>🌟 therajai - แพลตฟอร์มบริการจิตวิทยาออนไลน์คุณภาพสูง</p>
        </div>
      </div>
    </body>
    </html>
    `

    return await this.sendEmail({
      to: userEmail,
      subject,
      html
    })
  }

  // Therapist notification about new appointment
  async sendNewAppointmentNotification(
    therapistEmail: string,
    therapistName: string,
    clientName: string,
    appointmentDate: Date
  ): Promise<boolean> {
    const subject = 'มีการนัดหมายใหม่ - therajai'
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { max-width: 600px; margin: 0 auto; font-family: 'Sarabun', sans-serif; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f8f9fa; }
        .appointment-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 การนัดหมายใหม่</h1>
          <h2>therajai</h2>
        </div>
        
        <div class="content">
          <p>สวัสดี คุณ${therapistName}</p>
          
          <div class="appointment-card">
            <h3>👤 คุณมีการนัดหมายใหม่</h3>
            
            <div style="margin: 15px 0;">
              <strong>👤 ผู้รับบริการ:</strong> ${clientName}<br>
              <strong>📅 วันที่:</strong> ${appointmentDate.toLocaleDateString('th-TH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}<br>
              <strong>⏰ เวลา:</strong> ${appointmentDate.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
              })} น.
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://therajai.com/dashboard/therapist-appointments" class="button">ดูการนัดหมายทั้งหมด</a>
          </div>
        </div>
        
        <div class="footer">
          <p>🌟 Therajai - แพลตฟอร์มบริการจิตวิทยาออนไลน์คุณภาพสูง</p>
        </div>
      </div>
    </body>
    </html>
    `

    return await this.sendEmail({
      to: therapistEmail,
      subject,
      html
    })
  }
}

export const emailService = new EmailService()
export default EmailService