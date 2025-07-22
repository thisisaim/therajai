'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Search, CheckCircle, XCircle, Clock, Eye, User } from 'lucide-react'

interface TherapistData {
  id: string
  firstName: string
  lastName: string
  title?: string
  phone?: string
  licenseNumber: string
  experience: number
  education: string
  specializations: string[]
  languages: string[]
  bio: string
  hourlyRate: number
  availableOnline: boolean
  availableInPerson: boolean
  address?: string
  verified: boolean
  rejected: boolean
  verificationNotes?: string
  createdAt: string
  user: {
    email: string
    name: string
  }
}

export default function TherapistVerificationPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [therapists, setTherapists] = useState<TherapistData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistData | null>(null)
  const [verificationNotes, setVerificationNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      redirect('/dashboard')
    }
    fetchTherapists()
  }, [session])

  const fetchTherapists = async () => {
    try {
      const response = await fetch('/api/admin/therapists')
      if (response.ok) {
        const data = await response.json()
        setTherapists(data)
      }
    } catch (error) {
      console.error('Error fetching therapists:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลนักจิตวิทยาได้",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationAction = async (therapistId: string, action: string) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/therapists/${therapistId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action, // 'approve' or 'reject'
          notes: verificationNotes
        })
      })

      if (response.ok) {
        toast({
          title: action === 'approve' ? "อนุมัติสำเร็จ" : "ปฏิเสธสำเร็จ",
          description: `โปรไฟล์นักจิตวิทยาได้รับการ${action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}แล้ว`
        })
        
        // Refresh data
        fetchTherapists()
        setSelectedTherapist(null)
        setVerificationNotes('')
      } else {
        throw new Error('Failed to process verification')
      }
    } catch (error) {
      console.error('Error processing verification:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredTherapists = therapists.filter(therapist =>
    therapist.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    therapist.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    therapist.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (verified: boolean, rejected: boolean) => {
    if (rejected) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        ปฏิเสธ
      </Badge>
    } else if (verified) {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle className="w-3 h-3" />
        อนุมัติแล้ว
      </Badge>
    } else {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        รอการตรวจสอบ
      </Badge>
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
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 thai-font">
            ตรวจสอบนักจิตวิทยา
          </h1>
          <p className="text-gray-600 mt-2">
            ตรวจสอบและอนุมัติโปรไฟล์นักจิตวิทยาที่สมัครเข้าใช้ระบบ
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Therapist List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="thai-font">รายชื่อนักจิตวิทยา</CardTitle>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="ค้นหาด้วยชื่อหรือเลขใบอนุญาต"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : filteredTherapists.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    ไม่พบข้อมูลนักจิตวิทยา
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTherapists.map((therapist) => (
                      <div
                        key={therapist.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors
                          ${selectedTherapist?.id === therapist.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setSelectedTherapist(therapist)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {therapist.title && `${therapist.title} `}
                                {therapist.firstName} {therapist.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ใบอนุญาต: {therapist.licenseNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                ประสบการณ์: {therapist.experience} ปี
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(therapist.verified, therapist.rejected)}
                            <div className="text-xs text-gray-500 mt-1">
                              สมัครเมื่อ: {new Date(therapist.createdAt).toLocaleDateString('th-TH')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Therapist Details */}
          <div className="space-y-4">
            {selectedTherapist ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="thai-font flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      รายละเอียดนักจิตวิทยา
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">ข้อมูลส่วนตัว</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <div><strong>ชื่อ:</strong> {selectedTherapist.title && `${selectedTherapist.title} `}{selectedTherapist.firstName} {selectedTherapist.lastName}</div>
                        <div><strong>โทรศัพท์:</strong> {selectedTherapist.phone}</div>
                        <div><strong>อีเมล:</strong> {selectedTherapist.user.email}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">ข้อมูลวิชาชีพ</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <div><strong>เลขใบอนุญาต:</strong> {selectedTherapist.licenseNumber}</div>
                        <div><strong>ประสบการณ์:</strong> {selectedTherapist.experience} ปี</div>
                        <div><strong>การศึกษา:</strong> {selectedTherapist.education}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">ความเชี่ยวชาญ</h4>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedTherapist.specializations.map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{spec}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">ภาษา</h4>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedTherapist.languages.map((lang, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{lang}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">ประวัติและแนวทางการบำบัด</h4>
                      <p className="mt-2 text-sm text-gray-600">{selectedTherapist.bio}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900">การให้บริการ</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <div><strong>ค่าบริการ:</strong> ฿{selectedTherapist.hourlyRate}/ชั่วโมง</div>
                        <div><strong>ออนไลน์:</strong> {selectedTherapist.availableOnline ? 'ได้' : 'ไม่ได้'}</div>
                        <div><strong>ที่คลินิก:</strong> {selectedTherapist.availableInPerson ? 'ได้' : 'ไม่ได้'}</div>
                        {selectedTherapist.address && (
                          <div><strong>ที่อยู่:</strong> {selectedTherapist.address}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {!selectedTherapist.verified && !selectedTherapist.rejected && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="thai-font">การตรวจสอบ</CardTitle>
                      <CardDescription>
                        ตรวจสอบข้อมูลและตัดสินใจอนุมัติหรือปฏิเสธ
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">หมายเหตุการตรวจสอบ</label>
                        <Textarea
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="เพิ่มหมายเหตุเกี่ยวกับการตรวจสอบ (ไม่บังคับ)"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVerificationAction(selectedTherapist.id, 'approve')}
                          disabled={actionLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          อนุมัติ
                        </Button>
                        <Button
                          onClick={() => handleVerificationAction(selectedTherapist.id, 'reject')}
                          disabled={actionLoading}
                          variant="outline"
                          className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          ปฏิเสธ
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">เลือกนักจิตวิทยาเพื่อดูรายละเอียด</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}