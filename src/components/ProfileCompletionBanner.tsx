'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function ProfileCompletionBanner() {
  const { data: session } = useSession()
  const [profileData, setProfileData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role === 'THERAPIST') {
      fetchProfileData()
    } else {
      setIsLoading(false)
    }
  }, [session])

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/therapist/profile')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCompletionPercentage = () => {
    if (!profileData) return 0

    const requiredFields = [
      'firstName',
      'lastName', 
      'licenseNumber',
      'experience',
      'education',
      'specializations',
      'bio',
      'hourlyRate'
    ]

    const serviceTypeComplete = profileData.availableOnline || profileData.availableInPerson
    const specializationsComplete = profileData.specializations?.length > 0

    let completedFields = 0
    requiredFields.forEach(field => {
      if (field === 'specializations') {
        if (specializationsComplete) completedFields++
      } else if (profileData[field]) {
        completedFields++
      }
    })

    if (serviceTypeComplete) completedFields++

    return Math.round((completedFields / (requiredFields.length + 1)) * 100)
  }

  const getIncompleteItems = () => {
    if (!profileData) {
      return [
        'ข้อมูลส่วนตัว',
        'ข้อมูลวิชาชีพ', 
        'ความเชี่ยวชาญ',
        'ข้อมูลบริการ'
      ]
    }

    const items = []
    
    if (!profileData.firstName || !profileData.lastName) {
      items.push('ข้อมูลส่วนตัว')
    }
    
    if (!profileData.licenseNumber || !profileData.experience || !profileData.education) {
      items.push('ข้อมูลวิชาชีพ')
    }
    
    if (!profileData.specializations?.length || !profileData.bio || !profileData.hourlyRate) {
      items.push('ความเชี่ยวชาญและข้อมูลบริการ')
    }
    
    if (!profileData.availableOnline && !profileData.availableInPerson) {
      items.push('รูปแบบการให้บริการ')
    }

    return items
  }

  // Don't show for non-therapists or when loading
  if (isLoading || session?.user?.role !== 'THERAPIST') {
    return null
  }

  const completionPercentage = calculateCompletionPercentage()
  const incompleteItems = getIncompleteItems()
  const isComplete = completionPercentage === 100

  // Don't show if profile is complete and verified
  if (isComplete && profileData?.verified) {
    return null
  }

  return (
    <Card className={`mb-6 ${isComplete ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="h-5 w-5 text-yellow-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <CardTitle className="text-lg thai-font">
            {isComplete ? 'รอการตรวจสอบโปรไฟล์' : 'โปรไฟล์ยังไม่สมบูรณ์'}
          </CardTitle>
        </div>
        <CardDescription>
          {isComplete 
            ? 'โปรไฟล์ของคุณครบถ้วนแล้ว กำลังรอการตรวจสอบจากผู้ดูแลระบบ'
            : `กรุณากรอกข้อมูลให้ครบถ้วนเพื่อให้ผู้ใช้บริการสามารถค้นหาและเลือกใช้บริการของคุณได้`
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">ความคืบหน้า</span>
            <span className="text-sm font-medium text-primary-600">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {!isComplete && incompleteItems.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">ข้อมูลที่ยังขาด:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {incompleteItems.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isComplete && !profileData?.verified && (
          <div className="bg-yellow-100 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>โปรไฟล์ของคุณกำลังรอการตรวจสอบ</strong><br />
              ระบบจะแจ้งให้ทราบเมื่อการตรวจสอบเสร็จสิ้น โปรไฟล์ที่ผ่านการตรวจสอบแล้วจะปรากฏในผลการค้นหาของผู้ใช้บริการ
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button asChild>
            <Link href="/onboarding/therapist">
              {profileData ? 'แก้ไขโปรไฟล์' : 'เริ่มต้นสร้างโปรไฟล์'}
            </Link>
          </Button>
          
          {isComplete && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/therapist-appointments">
                ไปยังแดชบอร์ด
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}