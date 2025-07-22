'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MapPin, Star, Clock, Filter, User } from 'lucide-react'
import Link from 'next/link'

interface Therapist {
  id: string
  name: string
  therapistProfile: {
    firstName: string
    lastName: string
    title: string
    specializations: string[]
    experience: number
    hourlyRate: number
    bio: string
    verified: boolean
    rating: number
    totalSessions: number
    availableOnline: boolean
    availableInPerson: boolean
  }
}

export default function TherapistsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('all')
  const [selectedSessionType, setSelectedSessionType] = useState('all')
  const [priceRange, setPriceRange] = useState('all')

  // Common specializations in Thai mental health
  const specializations = [
    'จิตบำบัด', 'จิตวิทยาเด็กและวัยรุ่น', 'จิตวิทยาครอบครัว', 'จิตวิทยาคู่รัก',
    'ความเครียดและความวิตกกังวล', 'ภาวะซึมเศร้า', 'การจัดการความโกรธ',
    'ปัญหาการนอน', 'การติดสารเสพติด', 'จิตวิทยาองค์กร', 'จิตวิทยาบุคลิกภาพ'
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchTherapists()
    }
  }, [status])

  useEffect(() => {
    filterTherapists()
  }, [therapists, searchQuery, selectedSpecialization, selectedSessionType, priceRange])

  const fetchTherapists = async () => {
    try {
      const response = await fetch('/api/therapists')
      
      if (response.ok) {
        const data = await response.json()
        setTherapists(data.therapists)
      } else {
        console.error('Failed to fetch therapists')
      }
    } catch (error) {
      console.error('Error fetching therapists:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTherapists = () => {
    let filtered = [...therapists]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(therapist => 
        therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        therapist.therapistProfile.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        therapist.therapistProfile.specializations.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Specialization filter
    if (selectedSpecialization && selectedSpecialization !== 'all') {
      filtered = filtered.filter(therapist =>
        therapist.therapistProfile.specializations.includes(selectedSpecialization)
      )
    }

    // Session type filter
    if (selectedSessionType === 'online') {
      filtered = filtered.filter(therapist => therapist.therapistProfile.availableOnline)
    } else if (selectedSessionType === 'in-person') {
      filtered = filtered.filter(therapist => therapist.therapistProfile.availableInPerson)
    }

    // Price range filter
    if (priceRange && priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number)
      filtered = filtered.filter(therapist => {
        const rate = Number(therapist.therapistProfile.hourlyRate)
        if (max) {
          return rate >= min && rate <= max
        } else {
          return rate >= min
        }
      })
    }

    setFilteredTherapists(filtered)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedSpecialization('all')
    setSelectedSessionType('all')
    setPriceRange('all')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 thai-font mb-2">
            ค้นหานักจิตวิทยา
          </h1>
          <p className="text-gray-600">
            เลือกนักจิตวิทยาที่เหมาะสมกับความต้องการของคุณ
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="thai-font flex items-center gap-2">
              <Filter className="h-5 w-5" />
              ค้นหาและกรองข้อมูล
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาชื่อ, ความเชี่ยวชาญ, หรือคำอธิบาย..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="specialization">ความเชี่ยวชาญ</Label>
                <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกความเชี่ยวชาญ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="session-type">ประเภทการปรึกษา</Label>
                <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="online">ออนไลน์</SelectItem>
                    <SelectItem value="in-person">พบหน้า</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price-range">ช่วงราคา (บาท/ชั่วโมง)</Label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกช่วงราคา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="0-1000">0 - 1,000</SelectItem>
                    <SelectItem value="1000-2000">1,000 - 2,000</SelectItem>
                    <SelectItem value="2000-3000">2,000 - 3,000</SelectItem>
                    <SelectItem value="3000-5000">3,000 - 5,000</SelectItem>
                    <SelectItem value="5000">5,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  ล้างตัวกรอง
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            พบ {filteredTherapists.length} นักจิตวิทยา
          </p>
        </div>

        {/* Therapist Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTherapists.map((therapist) => (
            <Card key={therapist.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <CardTitle className="thai-font">
                        {therapist.therapistProfile.title} {therapist.name}
                      </CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">
                          {Number(therapist.therapistProfile.rating).toFixed(1)} ({therapist.therapistProfile.totalSessions} ครั้ง)
                        </span>
                      </div>
                    </div>
                  </div>
                  {therapist.therapistProfile.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ยืนยันแล้ว
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm line-clamp-3">
                  {therapist.therapistProfile.bio}
                </p>

                {/* Specializations */}
                <div className="flex flex-wrap gap-1">
                  {therapist.therapistProfile.specializations.slice(0, 3).map((spec) => (
                    <Badge key={spec} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                  {therapist.therapistProfile.specializations.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{therapist.therapistProfile.specializations.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Experience and Price */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {therapist.therapistProfile.experience} ปีประสบการณ์
                  </div>
                  <div className="font-semibold text-primary-600">
                    ฿{Number(therapist.therapistProfile.hourlyRate).toLocaleString()}/ชม.
                  </div>
                </div>

                {/* Availability */}
                <div className="flex gap-2">
                  {therapist.therapistProfile.availableOnline && (
                    <Badge variant="outline" className="text-xs">📹 ออนไลน์</Badge>
                  )}
                  {therapist.therapistProfile.availableInPerson && (
                    <Badge variant="outline" className="text-xs">🏢 พบหน้า</Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/therapists/${therapist.id}`}>
                      ดูโปรไฟล์
                    </Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href={`/book/${therapist.id}`}>
                      จองเลย
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredTherapists.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ไม่พบนักจิตวิทยาที่ตรงกับเงื่อนไข
              </h3>
              <p className="text-gray-600 mb-4">
                ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือล้างตัวกรอง
              </p>
              <Button onClick={clearFilters}>ล้างตัวกรองทั้งหมด</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}