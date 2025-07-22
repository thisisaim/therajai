-- 🔍 DATAGRIP EXPLORATION QUERIES FOR THERAJAI DATABASE
-- Copy and paste these queries into DataGrip to explore the data

-- 1. 👥 View All Users with Their Roles
SELECT 
    id,
    name,
    email,
    role,
    verified,
    "createdAt"
FROM users
ORDER BY role, name;

-- 2. 👨‍⚕️ Therapist Overview with Profiles
SELECT 
    u.name as therapist_name,
    u.email,
    tp.title,
    tp."firstName" || ' ' || tp."lastName" as full_name,
    tp."licenseNumber",
    tp.specializations,
    tp."hourlyRate",
    tp.rating,
    tp."totalSessions",
    tp.verified,
    tp.experience
FROM users u
JOIN therapist_profiles tp ON u.id = tp."userId"
WHERE u.role = 'THERAPIST'
ORDER BY tp.rating DESC;

-- 3. 🙋 Client Information
SELECT 
    u.name as client_name,
    u.email,
    cp."firstName" || ' ' || cp."lastName" as full_name,
    cp.phone,
    cp."preferredLanguage",
    cp."insuranceProvider",
    cp."emergencyContact",
    EXTRACT(YEAR FROM AGE(cp."dateOfBirth")) as age
FROM users u
JOIN client_profiles cp ON u.id = cp."userId"
WHERE u.role = 'CLIENT'
ORDER BY cp."firstName";

-- 4. 📅 Upcoming Appointments
SELECT 
    a."dateTime",
    a.status,
    a.type,
    a.duration,
    c.name as client_name,
    t.name as therapist_name,
    tp."hourlyRate"
FROM appointments a
JOIN users c ON a."clientId" = c.id
JOIN users t ON a."therapistId" = t.id
JOIN therapist_profiles tp ON t.id = tp."userId"
WHERE a."dateTime" > NOW()
ORDER BY a."dateTime";

-- 5. 🎯 Session Ratings and Feedback
SELECT 
    s."startTime",
    s.rating,
    s."clientFeedback",
    s."sessionNotes",
    c.name as client_name,
    t.name as therapist_name
FROM sessions s
JOIN users c ON s."clientId" = c.id
JOIN users t ON s."therapistId" = t.id
WHERE s.rating IS NOT NULL
ORDER BY s.rating DESC, s."startTime" DESC;

-- 6. 💰 Payment Summary by Status
SELECT 
    status,
    COUNT(*) as payment_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount
FROM payments
GROUP BY status
ORDER BY total_amount DESC;

-- 7. ⏰ Therapist Availability This Week
SELECT 
    tp.title || tp."firstName" || ' ' || tp."lastName" as therapist_name,
    CASE ta."dayOfWeek"
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_of_week,
    ta."startTime",
    ta."endTime",
    ta."isAvailable",
    tp."hourlyRate"
FROM therapist_availability ta
JOIN therapist_profiles tp ON ta."therapistId" = tp.id
WHERE ta."isAvailable" = true
ORDER BY tp."firstName", ta."dayOfWeek", ta."startTime";

-- 8. 🔥 Popular Specializations
SELECT 
    UNNEST(specializations) as specialization,
    COUNT(*) as therapist_count,
    AVG(rating) as avg_rating,
    AVG("hourlyRate") as avg_rate
FROM therapist_profiles
WHERE verified = true
GROUP BY specialization
ORDER BY therapist_count DESC;

-- 9. 📊 Revenue Analysis by Therapist
SELECT 
    t.name as therapist_name,
    tp."hourlyRate",
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT s.id) as completed_sessions,
    SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END) as total_revenue,
    AVG(s.rating) as average_rating
FROM therapist_profiles tp
JOIN users t ON tp."userId" = t.id
LEFT JOIN appointments a ON t.id = a."therapistId"
LEFT JOIN sessions s ON a.id = s."appointmentId"
LEFT JOIN payments p ON a.id = p."appointmentId"
GROUP BY t.name, tp."hourlyRate"
HAVING COUNT(DISTINCT a.id) > 0
ORDER BY total_revenue DESC;

-- 10. 🏆 Top Rated Therapists with Client Feedback
SELECT 
    t.name as therapist_name,
    tp.specializations,
    tp.rating,
    tp."totalSessions",
    COUNT(s.id) as feedback_count,
    AVG(s.rating) as avg_session_rating,
    STRING_AGG(s."clientFeedback", ' | ') as recent_feedback
FROM therapist_profiles tp
JOIN users t ON tp."userId" = t.id
LEFT JOIN sessions s ON t.id = s."therapistId" AND s.rating IS NOT NULL
WHERE tp.verified = true
GROUP BY t.name, tp.specializations, tp.rating, tp."totalSessions"
ORDER BY tp.rating DESC
LIMIT 5;

-- 11. 📈 Daily Appointment Patterns
SELECT 
    EXTRACT(HOUR FROM "dateTime") as hour_of_day,
    COUNT(*) as appointment_count,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_count,
    COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END) as no_show_count
FROM appointments
GROUP BY hour_of_day
ORDER BY hour_of_day;

-- 12. 🔍 Search Clients by Insurance
SELECT 
    c.name as client_name,
    cp."insuranceProvider",
    cp."insuranceNumber",
    cp."preferredLanguage",
    COUNT(a.id) as total_appointments
FROM client_profiles cp
JOIN users c ON cp."userId" = c.id
LEFT JOIN appointments a ON c.id = a."clientId"
WHERE cp."insuranceProvider" IS NOT NULL
GROUP BY c.name, cp."insuranceProvider", cp."insuranceNumber", cp."preferredLanguage"
ORDER BY cp."insuranceProvider", total_appointments DESC;

-- 13. 💎 Premium Analysis - High Value Clients
SELECT 
    c.name as client_name,
    cp."insuranceProvider",
    COUNT(a.id) as total_appointments,
    SUM(p.amount) as total_spent,
    AVG(s.rating) as avg_rating_given,
    MAX(a."dateTime") as last_appointment
FROM client_profiles cp
JOIN users c ON cp."userId" = c.id
LEFT JOIN appointments a ON c.id = a."clientId"
LEFT JOIN payments p ON a.id = p."appointmentId" AND p.status = 'COMPLETED'
LEFT JOIN sessions s ON a.id = s."appointmentId"
GROUP BY c.name, cp."insuranceProvider"
HAVING SUM(p.amount) > 3000
ORDER BY total_spent DESC;

-- 14. 🗓️ Therapist Workload Analysis
SELECT 
    t.name as therapist_name,
    COUNT(DISTINCT ta.id) as availability_slots,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN a.id END) as completed_appointments,
    ROUND(
        (COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN a.id END) * 100.0 / 
         NULLIF(COUNT(DISTINCT a.id), 0)), 2
    ) as completion_rate
FROM therapist_profiles tp
JOIN users t ON tp."userId" = t.id
LEFT JOIN therapist_availability ta ON tp.id = ta."therapistId"
LEFT JOIN appointments a ON t.id = a."therapistId"
GROUP BY t.name
ORDER BY completion_rate DESC;

-- 15. 📋 Full Database Summary
SELECT 
    'Users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 'Client Profiles', COUNT(*) FROM client_profiles
UNION ALL
SELECT 'Therapist Profiles', COUNT(*) FROM therapist_profiles
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'Sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments
UNION ALL
SELECT 'Availability Slots', COUNT(*) FROM therapist_availability
ORDER BY record_count DESC;