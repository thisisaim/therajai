'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, Circle, Upload, X } from 'lucide-react'

const specializations = [
  'วิตกกังวล',
  'ซึมเศร้า', 
  'ความเครียด',
  'ปัญหาความสัมพันธ์',
  'การบำบัดครอบครัว',
  'การบำบัดเด็กและวัยรุ่น',
  'PTSD',
  'OCD',
  'ปัญหาการนอน',
  'การบำบัดกลุ่ม',
  'การควบคุมอารมณ์',
  'ปัญหาการติดสารเสพติด'
]

export default function TherapistOnboardingPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    title: '',
    phone: '',
    dateOfBirth: '',
    
    // Professional Information
    licenseNumber: '',
    experience: '',
    education: '',
    specializations: [] as string[],
    languages: [] as string[],
    
    // Service Details
    bio: '',
    hourlyRate: '',
    availableOnline: false,
    availableInPerson: false,
    address: '',
    
    // Documents
    licenseDocument: null,
    diploma: null,
    profilePhoto: null
  })

  const [existingProfile, setExistingProfile] = useState(null)

  useEffect(() => {
    if (session?.user?.role !== 'THERAPIST') {
      redirect('/dashboard')
    }
    fetchExistingProfile()
  }, [session])

  const fetchExistingProfile = async () => {
    try {
      const response = await fetch('/api/therapist/profile')
      if (response.ok) {
        const profile = await response.json()
        if (profile) {
          setExistingProfile(profile)
          // Pre-populate form with existing data
          setFormData({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            title: profile.title || '',
            phone: profile.phone || '',
            dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
            licenseNumber: profile.licenseNumber || '',
            experience: profile.experience?.toString() || '',
            education: profile.education || '',
            specializations: profile.specializations || [],
            languages: profile.languages || [],
            bio: profile.bio || '',
            hourlyRate: profile.hourlyRate?.toString() || '',
            availableOnline: profile.availableOnline || false,
            availableInPerson: profile.availableInPerson || false,
            address: profile.address || '',
            licenseDocument: null,
            diploma: null,
            profilePhoto: null
          })
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSpecializationToggle = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }))
  }

  const handleLanguageAdd = (language: string) => {
    if (language && !formData.languages.includes(language)) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, language]
      }))
    }
  }

  const handleLanguageRemove = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }))
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.phone
      case 2:
        return formData.licenseNumber && formData.experience && formData.education
      case 3:
        return formData.specializations.length > 0 && formData.bio && formData.hourlyRate
      case 4:
        return (formData.availableOnline || formData.availableInPerson)
      default:
        return true
    }
  }

  const getCompletionPercentage = () => {
    const totalSteps = 4
    const completedSteps = [1, 2, 3, 4].filter(step => validateStep(step)).length
    return Math.round((completedSteps / totalSteps) * 100)
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    } else {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "โปรดตรวจสอบและกรอกข้อมูลที่จำเป็นทั้งหมด",
        variant: "destructive"
      })
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "โปรดตรวจสอบและกรอกข้อมูลที่จำเป็นทั้งหมด",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const submitData = {
        ...formData,
        experience: parseInt(formData.experience),
        hourlyRate: parseFloat(formData.hourlyRate),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null
      }

      const response = await fetch('/api/therapist/profile', {
        method: existingProfile ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        toast({
          title: "บันทึกข้อมูลสำเร็จ",
          description: "ข้อมูลโปรไฟล์ของคุณได้รับการบันทึกเรียบร้อยแล้ว"
        })
        redirect('/dashboard')
      } else {
        throw new Error('Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 thai-font mb-2">
            ตั้งค่าโปรไฟล์นักจิตวิทยา
          </h1>
          <p className="text-gray-600">
            กรุณากรอกข้อมูลให้ครบถ้วนเพื่อให้ผู้ใช้บริการสามารถค้นหาและเลือกใช้บริการของคุณได้
          </p>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">ความคืบหน้าการกรอกข้อมูล</span>
              <span className="text-sm font-medium text-primary-600">{getCompletionPercentage()}%</span>
            </div>
            <Progress value={getCompletionPercentage()} className="h-2" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="thai-font">
                ขั้นตอนที่ {currentStep} จาก 4
              </CardTitle>
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${step < currentStep ? 'bg-green-500 text-white' :
                        step === currentStep ? 'bg-primary-500 text-white' :
                        'bg-gray-200 text-gray-600'}`}
                  >
                    {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold thai-font">ข้อมูลส่วนตัว</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">คำนำหน้า</Label>
                    <Select value={formData.title} onValueChange={(value) => handleInputChange('title', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกคำนำหน้า" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="นาย">นาย</SelectItem>
                        <SelectItem value="นาง">นาง</SelectItem>
                        <SelectItem value="นางสาว">นางสาว</SelectItem>
                        <SelectItem value="ดร.">ดร.</SelectItem>
                        <SelectItem value="ผศ.ดร.">ผศ.ดร.</SelectItem>
                        <SelectItem value="รศ.ดร.">รศ.ดร.</SelectItem>
                        <SelectItem value="ศ.ดร.">ศ.ดร.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div></div>

                  <div>
                    <Label htmlFor="firstName">ชื่อ *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="ชื่อจริง"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">นามสกุล *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="นามสกุล"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">วันเกิด</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold thai-font">ข้อมูลวิชาชีพ</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="licenseNumber">เลขที่ใบอนุญาต *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      placeholder="PSY-XXXX-XXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience">ประสบการณ์ (ปี) *</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      placeholder="จำนวนปี"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="education">วุติการศึกษา *</Label>
                  <Textarea
                    id="education"
                    value={formData.education}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                    placeholder="เช่น ปริญญาโท จิตวิทยาคลินิก จุฬาลงกรณ์มหาวิทยาลัย"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>ภาษาที่ใช้ในการบำบัด</Label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-2">
                    {formData.languages.map((lang) => (
                      <Badge key={lang} variant="secondary" className="flex items-center gap-1">
                        {lang}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => handleLanguageRemove(lang)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={handleLanguageAdd}>
                    <SelectTrigger>
                      <SelectValue placeholder="เพิ่มภาษา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ไทย">ไทย</SelectItem>
                      <SelectItem value="อังกฤษ">อังกฤษ</SelectItem>
                      <SelectItem value="จีน">จีน</SelectItem>
                      <SelectItem value="ญี่ปุ่น">ญี่ปุ่น</SelectItem>
                      <SelectItem value="เกาหลี">เกาหลี</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Specializations & Bio */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold thai-font">ความเชี่ยวชาญและข้อมูลบริการ</h3>
                
                <div>
                  <Label>ความเชี่ยวชาญ *</Label>
                  <p className="text-sm text-gray-600 mb-3">เลือกอย่างน้อย 1 ความเชี่ยวชาญ</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {specializations.map((spec) => (
                      <div key={spec} className="flex items-center space-x-2">
                        <Checkbox
                          id={spec}
                          checked={formData.specializations.includes(spec)}
                          onCheckedChange={() => handleSpecializationToggle(spec)}
                        />
                        <Label htmlFor={spec} className="text-sm">{spec}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">ประวัติและแนวทางการบำบัด *</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="แนะนำตัวคุณและบอกเล่าเกี่ยวกับแนวทางการบำบัดของคุณ..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="hourlyRate">ค่าบริการต่อชั่วโมง (บาท) *</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                    placeholder="1500"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Service Options */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold thai-font">รูปแบบการให้บริการ</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="availableOnline"
                      checked={formData.availableOnline}
                      onCheckedChange={(checked) => handleInputChange('availableOnline', checked)}
                    />
                    <Label htmlFor="availableOnline">ให้บริการออนไลน์ (วิดีโอคอล)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="availableInPerson"
                      checked={formData.availableInPerson}
                      onCheckedChange={(checked) => handleInputChange('availableInPerson', checked)}
                    />
                    <Label htmlFor="availableInPerson">ให้บริการที่คลินิก</Label>
                  </div>

                  {formData.availableInPerson && (
                    <div>
                      <Label htmlFor="address">ที่อยู่คลินิก</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="ที่อยู่คลินิกหรือสถานที่ให้บริการ"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                ย้อนกลับ
              </Button>

              {currentStep < 4 ? (
                <Button onClick={nextStep}>
                  ถัดไป
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'กำลังบันทึก...' : existingProfile ? 'อัปเดตโปรไฟล์' : 'บันทึกโปรไฟล์'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}