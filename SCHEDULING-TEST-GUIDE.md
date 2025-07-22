# 📅 **Therajai Scheduling System Testing Guide**

## **🎯 Overview**
This guide provides comprehensive testing instructions for the Therajai appointment scheduling system, covering all user roles and scenarios.

## **⚙️ System Requirements**
- Development server running on `http://localhost:3000`
- Database with sample data (53 users, 50 appointments)
- Prisma Studio running on `http://localhost:5556`

## **🚀 Quick Start**
```bash
# Start development server
npm run dev

# Start Prisma Studio (in separate terminal)
npm run db:studio

# Run scheduling tests
node scripts/test-scheduling.js
```

---

## **👥 Test User Accounts**

### **Admin User**
- **Email**: `admin@therajai.com`
- **Password**: `admin123`
- **Capabilities**: View all appointments, manage users, access analytics

### **Therapist User**
- **Email**: `therapist@therajai.com`
- **Password**: `therapist123`
- **Profile**: ดร.สมศรี ช่วยเหลือ (1500 THB/hour)
- **Capabilities**: Set availability, view appointments, manage sessions

### **Client User**
- **Email**: `client@therajai.com`
- **Password**: `client123`
- **Profile**: สมชาย ใจดี
- **Capabilities**: Book appointments, view booking history

---

## **🧪 Testing Scenarios**

### **1. Therapist Availability Management**

#### **Test Case 1.1: Set Weekly Availability**
```
1. Login as therapist (therapist@therajai.com)
2. Navigate to availability settings
3. Add time slots for different days:
   - Monday: 09:00 - 17:00
   - Tuesday: 10:00 - 16:00
   - Wednesday: 09:00 - 12:00
4. Save changes
5. Verify in database: SELECT * FROM therapist_availability;
```

#### **Test Case 1.2: Overlap Detection**
```
1. Try adding overlapping time slots:
   - Monday 09:00-17:00 (existing)
   - Monday 15:00-19:00 (overlap)
2. Should show error: "ช่วงเวลานี้มีการตั้งค่าไว้แล้ว"
```

#### **Test Case 1.3: Invalid Time Format**
```
1. Try entering invalid times:
   - Start time: "25:00" (invalid)
   - End time: "09:60" (invalid)
2. Should show error: "รูปแบบเวลาไม่ถูกต้อง (HH:MM)"
```

### **2. Client Booking Workflow**

#### **Test Case 2.1: Happy Path Booking**
```
1. Login as client (client@therajai.com)
2. Navigate to /therapists
3. Select a therapist (e.g., ดร.สมศรี ช่วยเหลือ)
4. Click "จองเวลา" button
5. Complete booking form:
   - Session type: Online
   - Duration: 60 minutes
   - Date: Tomorrow
   - Time: Available slot
   - Notes: "First session"
6. Click "ยืนยันการจองและไปหน้าชำระเงิน"
7. Should redirect to payment page
```

#### **Test Case 2.2: Dynamic Slot Loading**
```
1. In booking form, select different dates
2. Verify time slots update dynamically
3. Check that past dates don't show available slots
4. Verify slots respect therapist availability
```

#### **Test Case 2.3: Booking Validation**
```
Test each validation rule:
- Empty therapist ID → "ไม่พบนักจิตวิทยาที่ระบุ"
- Past date → "ไม่สามารถจองย้อนหลังได้"
- Invalid duration → "ระยะเวลาไม่ถูกต้อง"
- Missing fields → "กรุณากรอกข้อมูลให้ครบถ้วน"
```

### **3. Conflict Detection Testing**

#### **Test Case 3.1: Double Booking Prevention**
```
1. Book appointment for specific time slot
2. Try booking same time slot again
3. Should show error: "ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกเวลาอื่น"
```

#### **Test Case 3.2: Overlapping Appointments**
```
1. Book 2-hour appointment: 10:00-12:00
2. Try booking 1-hour appointment: 11:00-12:00
3. Should be blocked due to overlap
```

### **4. API Endpoint Testing**

#### **Test Case 4.1: Availability Slots API**
```bash
# Test slot generation
curl -X GET "http://localhost:3000/api/availability/slots?therapistId=USER_ID&date=2025-01-20"
```

#### **Test Case 4.2: Appointment Creation API**
```bash
# Test appointment booking
curl -X POST "http://localhost:3000/api/appointments" \
  -H "Content-Type: application/json" \
  -d '{
    "therapistId": "USER_ID",
    "dateTime": "2025-01-20T10:00:00",
    "duration": 60,
    "type": "ONLINE",
    "notes": "Test appointment"
  }'
```

#### **Test Case 4.3: Appointment Listing API**
```bash
# Test appointment retrieval
curl -X GET "http://localhost:3000/api/appointments"
```

---

## **📊 Database Verification**

### **Check Appointment Creation**
```sql
-- View recent appointments
SELECT 
  a.id,
  a."dateTime",
  a.duration,
  a.type,
  a.status,
  c.name as client_name,
  t.name as therapist_name
FROM appointments a
JOIN users c ON a."clientId" = c.id
JOIN users t ON a."therapistId" = t.id
ORDER BY a."createdAt" DESC
LIMIT 10;
```

### **Check Availability Slots**
```sql
-- View therapist availability
SELECT 
  ta.*,
  tp."firstName",
  tp."lastName"
FROM therapist_availability ta
JOIN therapist_profiles tp ON ta."therapistId" = tp.id
WHERE ta."isAvailable" = true
ORDER BY ta."dayOfWeek", ta."startTime";
```

### **Check for Conflicts**
```sql
-- Find overlapping appointments (should be empty)
SELECT 
  a1.id as appointment1,
  a2.id as appointment2,
  a1."dateTime" as start1,
  a1."endTime" as end1,
  a2."dateTime" as start2,
  a2."endTime" as end2
FROM appointments a1, appointments a2
WHERE a1.id != a2.id 
  AND a1."therapistId" = a2."therapistId"
  AND a1.status = 'SCHEDULED' 
  AND a2.status = 'SCHEDULED'
  AND a1."dateTime" < a2."endTime" 
  AND a2."dateTime" < a1."endTime";
```

---

## **🔧 Error Handling Testing**

### **Expected Error Messages (Thai)**
- `"ไม่พบการเข้าสู่ระบบ"` - Not authenticated
- `"เฉพาะลูกค้าเท่านั้นที่สามารถจองการปรึกษาได้"` - Only clients can book
- `"ไม่พบนักจิตวิทยาที่ระบุ"` - Therapist not found
- `"ช่วงเวลานี้มีการจองแล้ว"` - Time slot already booked
- `"ไม่สามารถจองย้อนหลังได้"` - Cannot book past dates
- `"ระยะเวลาไม่ถูกต้อง"` - Invalid duration
- `"รูปแบบเวลาไม่ถูกต้อง"` - Invalid time format

### **Test Error Scenarios**
1. **Authentication Errors**
   - Access booking page without login
   - Try to book as therapist/admin role

2. **Validation Errors**
   - Submit booking form with missing fields
   - Enter invalid date/time formats
   - Select unavailable time slots

3. **Business Logic Errors**
   - Double booking attempts
   - Booking outside therapist availability
   - Invalid appointment durations

---

## **📱 Frontend Testing**

### **User Interface Testing**
1. **Responsive Design**
   - Test on mobile devices
   - Check tablet layout
   - Verify desktop experience

2. **Form Validation**
   - Test real-time validation
   - Check error message display
   - Verify form submission

3. **Loading States**
   - Check loading spinners
   - Verify slot loading indicators
   - Test async operations

### **Cross-Browser Testing**
- Chrome (recommended)
- Firefox
- Safari
- Edge

---

## **⚡ Performance Testing**

### **Load Testing Scenarios**
1. **Concurrent Bookings**
   - Multiple users booking simultaneously
   - Verify race condition handling
   - Check database locking

2. **Large Dataset Performance**
   - Test with many availability slots
   - Verify slot generation speed
   - Check query optimization

---

## **✅ Success Criteria**

### **Functionality**
- [ ] Therapist can set weekly availability
- [ ] Client can view available time slots
- [ ] Booking creates appointment in database
- [ ] System prevents double booking
- [ ] Payment calculation is accurate
- [ ] All error messages display in Thai

### **Performance**
- [ ] Slot generation < 1 second
- [ ] Form submission < 2 seconds
- [ ] Database queries optimized
- [ ] No memory leaks during testing

### **User Experience**
- [ ] Intuitive booking flow
- [ ] Clear error messages
- [ ] Responsive design works
- [ ] Loading states are clear

---

## **🎯 Common Issues & Solutions**

### **Issue: No time slots available**
**Solution**: Check therapist availability settings and ensure future dates are selected

### **Issue: Booking fails with 401 error**
**Solution**: Verify user is logged in and has CLIENT role

### **Issue: Time slots don't update**
**Solution**: Check date selection and therapist availability data

### **Issue: Database connection fails**
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct

---

## **📝 Test Results Template**

```
SCHEDULING SYSTEM TEST RESULTS
==============================

Test Date: [DATE]
Tester: [NAME]
Environment: Development

THERAPIST AVAILABILITY:
[ ] Can set weekly availability
[ ] Overlap detection works
[ ] Time validation works
[ ] Data saves to database

CLIENT BOOKING:
[ ] Can browse therapists
[ ] Can select date/time
[ ] Form validation works
[ ] Booking creates appointment

CONFLICT DETECTION:
[ ] Prevents double booking
[ ] Validates past dates
[ ] Checks duration limits
[ ] Shows proper errors

API ENDPOINTS:
[ ] /api/availability works
[ ] /api/availability/slots works
[ ] /api/appointments POST works
[ ] /api/appointments GET works

DATABASE INTEGRITY:
[ ] Appointments created correctly
[ ] No conflicting bookings
[ ] Availability slots accurate
[ ] Foreign keys maintained

ISSUES FOUND:
[List any issues discovered]

OVERALL RESULT: [PASS/FAIL]
```

---

## **🚀 Next Steps**

After testing, you can:
1. **Deploy to staging** for further testing
2. **Add automated tests** for critical paths
3. **Set up monitoring** for production
4. **Create user documentation**
5. **Plan feature enhancements**

**Happy Testing! 🧪✨**