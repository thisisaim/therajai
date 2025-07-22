# 🧪 **Complete Testing Guide - Therajai Platform**

This guide will walk you through testing all the workflows and features of the Therajai platform.

## 🚀 **Prerequisites**
- Server running: `npm run dev` (http://localhost:3000)
- Database populated with dummy data
- DataGrip connected (optional, for verification)

---

## 📋 **Testing Workflow Overview**

### **Phase 1: Authentication & Registration**
### **Phase 2: Client User Journey**
### **Phase 3: Therapist User Journey**
### **Phase 4: Admin Functions**
### **Phase 5: Database Verification**

---

## 🔐 **Phase 1: Authentication & Registration Testing**

### **Test 1.1: Homepage Navigation**
1. **Open:** http://localhost:3000
2. **Verify:** 
   - Thai text loads correctly: "แพลตฟอร์มสุขภาพจิตสำหรับคนไทย"
   - Three feature cards display
   - Buttons are clickable
3. **Test Navigation:**
   - Click "เริ่มต้นเป็นผู้ใช้บริการ" (Start as Client)
   - Click "สมัครเป็นนักจิตวิทยา" (Register as Therapist)
   - Click "เข้าสู่ระบบ" (Login)

### **Test 1.2: Registration Flow**
1. **Go to:** http://localhost:3000/auth/register
2. **Test Client Registration:**
   - Select "ผู้ใช้บริการ" (Client)
   - Fill in form with test data
   - Submit and verify success message
3. **Test Therapist Registration:**
   - Select "นักจิตวิทยา" (Therapist)
   - Fill in form with test data
   - Submit and verify success message

### **Test 1.3: Login Flow**
1. **Go to:** http://localhost:3000/auth/login
2. **Test with existing accounts:**
   - **Client:** client@therajai.com / client123
   - **Therapist:** therapist@therajai.com / therapist123
   - **Admin:** admin@therajai.com / admin123
3. **Test error handling:**
   - Try wrong password
   - Try non-existent email
   - Verify error messages in Thai

---

## 👤 **Phase 2: Client User Journey**

### **Test 2.1: Client Dashboard**
1. **Login as Client:** client@therajai.com / client123
2. **Navigate to:** http://localhost:3000/dashboard
3. **Verify Dashboard Elements:**
   - Welcome message: "ยินดีต้อนรับ, สมชาย ใจดี"
   - Three main action cards
   - Thai language interface
   - Client-specific features

### **Test 2.2: Client Profile Management**
1. **From Dashboard:** Click "แก้ไขโปรไฟล์" (Edit Profile)
2. **Test Profile Features:**
   - View current profile information
   - Edit personal details
   - Update preferences
   - Save changes

### **Test 2.3: Search and Browse Therapists**
1. **From Dashboard:** Click "เริ่มค้นหา" (Start Search)
2. **Test Search Features:**
   - Browse available therapists
   - Filter by specialization
   - Filter by availability
   - View therapist profiles
   - Check ratings and reviews

### **Test 2.4: Appointment Booking**
1. **Select a Therapist**
2. **Test Booking Flow:**
   - Choose appointment type (Online/In-Person)
   - Select date and time
   - Add notes
   - Confirm booking
   - Verify confirmation

### **Test 2.5: View Appointments**
1. **From Dashboard:** Click "ดูนัดหมาย" (View Appointments)
2. **Test Features:**
   - View upcoming appointments
   - View past appointments
   - Cancel appointments
   - Reschedule appointments

---

## 👨‍⚕️ **Phase 3: Therapist User Journey**

### **Test 3.1: Therapist Dashboard**
1. **Login as Therapist:** therapist@therajai.com / therapist123
2. **Navigate to:** http://localhost:3000/dashboard
3. **Verify Dashboard Elements:**
   - Welcome message: "ยินดีต้อนรับ, ดร.สมศรี ช่วยเหลือ"
   - Therapist-specific features
   - Schedule management options
   - Client management tools

### **Test 3.2: Schedule Management**
1. **From Dashboard:** Click "จัดการตารางเวลา" (Manage Schedule)
2. **Test Schedule Features:**
   - View current availability
   - Set available hours
   - Block time slots
   - Set recurring availability
   - Save schedule changes

### **Test 3.3: Client Management**
1. **From Dashboard:** Click "ดูผู้ใช้บริการ" (View Clients)
2. **Test Client Features:**
   - View client list
   - Access client profiles
   - View appointment history
   - Add session notes

### **Test 3.4: Session Management**
1. **Test Session Features:**
   - Start sessions
   - Add session notes
   - Complete sessions
   - Request feedback

### **Test 3.5: Reports and Analytics**
1. **From Dashboard:** Click "ดูรายงาน" (View Reports)
2. **Test Reporting Features:**
   - View session statistics
   - Check earnings
   - Review client feedback
   - Export reports

---

## 🔧 **Phase 4: Admin Functions**

### **Test 4.1: Admin Dashboard**
1. **Login as Admin:** admin@therajai.com / admin123
2. **Navigate to:** http://localhost:3000/dashboard
3. **Verify Admin Features:**
   - System overview
   - User management
   - Platform statistics

### **Test 4.2: User Management**
1. **Test Admin Functions:**
   - View all users
   - Verify therapist accounts
   - Manage user roles
   - Handle user issues

---

## 📊 **Phase 5: Database Verification**

### **Test 5.1: Real-time Database Updates**
1. **Open DataGrip**
2. **Perform actions on the website**
3. **Verify in database:**
   - New user registrations appear in `users` table
   - Profile updates reflect in `client_profiles` or `therapist_profiles`
   - Appointments appear in `appointments` table
   - Sessions are logged in `sessions` table

### **Test 5.2: Data Integrity**
1. **Run verification queries:**
   ```sql
   -- Check user count
   SELECT role, COUNT(*) FROM users GROUP BY role;
   
   -- Check recent activity
   SELECT * FROM appointments ORDER BY "createdAt" DESC LIMIT 5;
   
   -- Check session data
   SELECT * FROM sessions WHERE rating IS NOT NULL ORDER BY "createdAt" DESC LIMIT 5;
   ```

---

## 🧪 **Comprehensive Testing Scenarios**

### **Scenario 1: Complete Client Journey**
```
1. Register as new client
2. Complete profile setup
3. Search for therapists
4. Book appointment
5. Attend session
6. Leave feedback
7. Book follow-up appointment
```

### **Scenario 2: Complete Therapist Journey**
```
1. Register as therapist
2. Set up professional profile
3. Set availability schedule
4. Receive appointment booking
5. Conduct session
6. Add session notes
7. Review client feedback
```

### **Scenario 3: Multi-user Interaction**
```
1. Login as Client A - book appointment with Therapist B
2. Login as Therapist B - confirm appointment
3. Login as Client A - attend session
4. Login as Therapist B - complete session notes
5. Login as Client A - leave feedback
6. Verify all data in database
```

---

## 🎯 **Key Testing Points**

### **User Experience:**
- [ ] Thai language displays correctly
- [ ] Navigation is intuitive
- [ ] Forms validate properly
- [ ] Error messages are helpful
- [ ] Success messages confirm actions

### **Functionality:**
- [ ] Authentication works for all roles
- [ ] Profile management saves correctly
- [ ] Appointment booking processes
- [ ] Session management functions
- [ ] Data persists between sessions

### **Performance:**
- [ ] Pages load quickly
- [ ] Database queries are efficient
- [ ] No console errors
- [ ] Mobile responsive (test on phone)

### **Security:**
- [ ] Password protection works
- [ ] Role-based access control
- [ ] Session management
- [ ] Data validation

---

## 🔍 **Advanced Testing with Browser Tools**

### **Test with Chrome DevTools:**
1. **Open DevTools** (F12)
2. **Check Console:** No JavaScript errors
3. **Check Network:** API calls successful
4. **Check Application:** Local storage, cookies
5. **Check Security:** HTTPS warnings

### **Test Different Browsers:**
- Chrome
- Firefox
- Safari
- Mobile browsers

### **Test Different Screen Sizes:**
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

---

## 🏆 **Success Criteria**

### **Must Pass:**
- [ ] All authentication flows work
- [ ] Database updates in real-time
- [ ] Thai language displays correctly
- [ ] Role-based access control functions
- [ ] Core workflows complete end-to-end

### **Should Pass:**
- [ ] Error handling is graceful
- [ ] Performance is acceptable
- [ ] Mobile experience is usable
- [ ] Data validation works

### **Nice to Have:**
- [ ] Advanced search filters
- [ ] Real-time notifications
- [ ] File upload functionality
- [ ] Export features

---

## 📱 **Mobile Testing Guide**

### **Test on Mobile Device:**
1. **Open:** http://localhost:3000 on mobile
2. **Or use:** Chrome DevTools mobile simulation
3. **Test all workflows** on smaller screen
4. **Verify:** Touch interactions work properly

---

## 🚨 **Common Issues and Solutions**

### **Issue: Thai text not displaying**
**Solution:** Check font loading, ensure proper encoding

### **Issue: Database not updating**
**Solution:** Check database connection, verify API calls

### **Issue: Authentication not working**
**Solution:** Check environment variables, session configuration

### **Issue: Page not loading**
**Solution:** Check server running, verify port 3000

---

## 📝 **Testing Checklist**

Print this checklist and check off as you test:

### **Authentication**
- [ ] Register new client
- [ ] Register new therapist
- [ ] Login with existing accounts
- [ ] Logout functionality
- [ ] Password reset (if implemented)

### **Client Workflows**
- [ ] View dashboard
- [ ] Edit profile
- [ ] Search therapists
- [ ] Book appointment
- [ ] View appointments
- [ ] Cancel appointment

### **Therapist Workflows**
- [ ] View dashboard
- [ ] Edit profile
- [ ] Manage schedule
- [ ] View clients
- [ ] Manage sessions
- [ ] View reports

### **Database Verification**
- [ ] User data saves correctly
- [ ] Appointments are created
- [ ] Sessions are logged
- [ ] Payments are tracked
- [ ] Real-time updates work

### **Cross-browser Testing**
- [ ] Chrome works
- [ ] Firefox works
- [ ] Safari works
- [ ] Mobile works

---

## 🎉 **Ready to Test!**

Your Therajai platform is ready for comprehensive testing. Work through each phase systematically, and use DataGrip to verify that all actions are properly saved to the database.

**Happy Testing! 🧪✨**