'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VideoIcon, UserPlusIcon, PhoneIcon } from 'lucide-react'

export default function VideoDemoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [roomId, setRoomId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/login')
    return null
  }

  const createNewRoom = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/video-calls/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/video-call/${data.roomId}`)
      } else {
        alert('เกิดข้อผิดพลาดในการสร้างห้อง: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating room:', error)
      alert('เกิดข้อผิดพลาดในการสร้างห้อง')
    } finally {
      setIsCreating(false)
    }
  }

  const joinRoom = () => {
    if (!roomId.trim()) {
      alert('กรุณาใส่รหัสห้อง')
      return
    }

    setIsJoining(true)
    router.push(`/video-call/${roomId.trim()}`)
  }

  const generateRandomRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 15)
    setRoomId(randomId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 thai-font mb-2">
              ห้องปรึกษาออนไลน์
            </h1>
            <p className="text-gray-600">
              เริ่มการปรึกษาทางวิดีโอหรือเข้าร่วมห้องที่มีอยู่
            </p>
          </div>

          <div className="grid gap-6">
            {/* Create New Room */}
            <Card>
              <CardHeader>
                <CardTitle className="thai-font flex items-center gap-2">
                  <VideoIcon className="h-5 w-5" />
                  สร้างห้องใหม่
                </CardTitle>
                <CardDescription>
                  สร้างห้องปรึกษาใหม่และเชิญผู้เข้าร่วม
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={createNewRoom}
                  disabled={isCreating}
                  className="w-full"
                  size="lg"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังสร้างห้อง...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      สร้างห้องปรึกษาใหม่
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Join Existing Room */}
            <Card>
              <CardHeader>
                <CardTitle className="thai-font flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5" />
                  เข้าร่วมห้องที่มีอยู่
                </CardTitle>
                <CardDescription>
                  ใส่รหัสห้องเพื่อเข้าร่วมการปรึกษา
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomId">รหัสห้อง</Label>
                  <div className="flex gap-2">
                    <Input
                      id="roomId"
                      placeholder="ใส่รหัสห้อง..."
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                    />
                    <Button
                      variant="outline"
                      onClick={generateRandomRoomId}
                      type="button"
                    >
                      สุ่ม
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={joinRoom}
                  disabled={isJoining || !roomId.trim()}
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      กำลังเข้าร่วม...
                    </>
                  ) : (
                    'เข้าร่วมห้อง'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="thai-font text-blue-900">
                  วิธีการใช้งาน
                </CardTitle>
              </CardHeader>
              <CardContent className="text-blue-800 space-y-2">
                <p>• <strong>สร้างห้องใหม่:</strong> คลิกปุ่มสร้างห้องและแชร์รหัสห้องกับผู้ที่ต้องการเข้าร่วม</p>
                <p>• <strong>เข้าร่วมห้อง:</strong> ใส่รหัสห้องที่ได้รับจากผู้อื่นแล้วคลิกเข้าร่วม</p>
                <p>• <strong>ทดสอบ:</strong> คุณสามารถเปิดหลายแท็บเพื่อทดสอบการโทรระหว่างกันได้</p>
                <p>• <strong>หมายเหตุ:</strong> อนุญาตการเข้าถึงกล้องและไมโครโฟนเมื่อเบราว์เซอร์ขอสิทธิ์</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard')}
            >
              ← กลับไปแดชบอร์ด
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}