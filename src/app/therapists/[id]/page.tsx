'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  Video, 
  GraduationCap,
  Award,
  Calendar,
  MessageCircle,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import TherapistReviews from '@/components/therapist/TherapistReviews'

interface TherapistProfile {
  id: string
  name: string
  email: string
  therapistProfile: {
    firstName: string
    lastName: string
    title: string
    licenseNumber: string
    specializations: string[]
    experience: number
    education: string
    languages: string[]
    bio: string
    hourlyRate: number
    verified: boolean
    rating: number
    totalSessions: number
    availableOnline: boolean
    availableInPerson: boolean
    address?: string
  }
}

export default function TherapistProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const therapistId = params?.id as string

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated' && therapistId) {
      fetchTherapist()
    }
  }, [status, therapistId])

  const fetchTherapist = async () => {
    try {
      const response = await fetch(`/api/therapists/${therapistId}`)
      
      if (response.ok) {
        const data = await response.json()
        setTherapist(data.therapist)
      } else {
        setError('ไม่พบข้อมูลนักจิตวิทยา')
      }
    } catch (error) {
      console.error('Error fetching therapist:', error)
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !therapist) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="thai-font text-red-600">เกิดข้อผิดพลาด</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p>{error}</p>
                <Button asChild>
                  <Link href="/therapists">กลับไปหน้าค้นหา</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const profile = therapist.therapistProfile

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/therapists">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับไปหน้าค้นหา
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src="" alt={therapist.name} />
                  <AvatarFallback className="text-lg">
                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="thai-font">
                  {profile.title} {therapist.name}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-2">
                  {profile.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Shield className="h-3 w-3 mr-1" />
                      ยืนยันแล้ว
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rating */}
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Number(profile.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {Number(profile.rating).toFixed(1)} ({profile.totalSessions} ครั้ง)
                  </span>
                </div>

                {/* Price */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    ฿{Number(profile.hourlyRate).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">ต่อชั่วโมง</div>
                </div>

                {/* Experience */}
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{profile.experience} ปีประสบการณ์</span>
                </div>

                {/* Session Types */}
                <div className="flex gap-2 justify-center">
                  {profile.availableOnline && (
                    <Badge variant="outline" className="text-xs">
                      <Video className="h-3 w-3 mr-1" />
                      ออนไลน์
                    </Badge>
                  )}
                  {profile.availableInPerson && (
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      พบหน้า
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4">
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/book/${therapist.id}`}>
                      <Calendar className="h-4 w-4 mr-2" />
                      จองการปรึกษา
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/chat/${therapist.id}`}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      ส่งข้อความ
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="thai-font text-sm">ข้อมูลเบื้องต้น</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-gray-400" />
                  <span>ใบอนุญาต: {profile.licenseNumber}</span>
                </div>
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>{profile.education}</span>
                </div>
                {profile.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span>{profile.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                  <span>ภาษา: {profile.languages.join(', ')}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="about">เกี่ยวกับ</TabsTrigger>
                <TabsTrigger value="specializations">ความเชี่ยวชาญ</TabsTrigger>
                <TabsTrigger value="reviews">รีวิว</TabsTrigger>
              </TabsList>

              <TabsContent value="about">
                <Card>
                  <CardHeader>
                    <CardTitle className="thai-font">เกี่ยวกับ {profile.firstName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-gray max-w-none">
                      <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                        {profile.bio}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specializations">
                <Card>
                  <CardHeader>
                    <CardTitle className="thai-font">ความเชี่ยวชาญและบริการ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">สาขาความเชี่ยวชาญ</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.specializations.map((spec) => (
                            <Badge key={spec} variant="secondary">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">การศึกษา</h4>
                        <p className="text-gray-700">{profile.education}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">ประสบการณ์</h4>
                        <p className="text-gray-700">
                          มีประสบการณ์ในการให้คำปรึกษาทางจิตวิทยามาเป็นเวลา {profile.experience} ปี 
                          และได้ให้บริการผู้เข้ารับการปรึกษาไปแล้วกว่า {profile.totalSessions} ครั้ง
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <TherapistReviews 
                  therapistId={therapist.id}
                  averageRating={Number(profile.rating)}
                  totalSessions={profile.totalSessions}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}