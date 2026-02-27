// =====================================================
// supabase.js - ملف الاتصال المركزي بـ Supabase
// =====================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

// إعدادات الاتصال - قم بتغييرها بمشروعك الخاص
const SUPABASE_URL = 'https://nqothizwtmvbvyrxoguz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xb3RoaXp3dG12YnZ5cnhvZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjc2ODEsImV4cCI6MjA4MjYwMzY4MX0.Hah1FyYJT-dQI0byUO7pNKB3NZqzkyICPh_0D_zdzis';

// إنشاء عميل Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// دوال المصادقة (Authentication)
// =====================================================

/**
 * تسجيل الدخول
 */
export async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // التحقق من صلاحيات الإدارة
        const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
        
        if (adminError || !adminData) {
            await supabase.auth.signOut();
            throw new Error('ليس لديك صلاحية الدخول');
        }
        
        // حفظ بيانات الجلسة
        localStorage.setItem('session', JSON.stringify({
            user: data.user,
            admin: adminData
        }));
        
        return { success: true, data: { user: data.user, admin: adminData } };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * تسجيل الخروج
 */
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        localStorage.removeItem('session');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * الحصول على الجلسة الحالية
 */
export function getSession() {
    const session = localStorage.getItem('session');
    return session ? JSON.parse(session) : null;
}

/**
 * التحقق من المصادقة
 */
export async function requireAuth() {
    const session = getSession();
    if (!session) {
        window.location.href = '/index.html';
        return null;
    }
    
    // التحقق من صحة الجلسة
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || user.id !== session.user.id) {
        localStorage.removeItem('session');
        window.location.href = '/index.html';
        return null;
    }
    
    return session;
}

// =====================================================
// دوال المستخدمين (Users)
// =====================================================

/**
 * الحصول على قائمة المستخدمين
 */
export async function getUsers(options = {}) {
    const {
        type = 'user',
        status = 'all',
        limit = 20,
        offset = 0,
        search = ''
    } = options;
    
    try {
        let query = supabase
            .from('users')
            .select('*')
            .eq('type', type)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (status !== 'all') {
            query = query.eq('status', status);
        }
        
        if (search) {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }
        
        const { data, error, count } = await query;
        if (error) throw error;
        
        return { success: true, data, count };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * الحصول على مستخدم واحد
 */
export async function getUser(userId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * تحديث حالة المستخدم
 */
export async function updateUserStatus(userId, status, reason, adminId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({
                status: status,
                status_reason: reason,
                status_updated_at: new Date(),
                status_updated_by: adminId
            })
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        
        // تسجيل الإجراء
        await logAdminAction({
            admin_id: adminId,
            action: status === 'suspended' ? 'suspend_user' : 'ban_user',
            target_type: 'user',
            target_id: userId,
            details: { reason }
        });
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * إرسال إنذار
 */
export async function sendWarning(userId, reason, details, adminId) {
    try {
        // إضافة إنذار
        const { data: warning, error: warningError } = await supabase
            .from('warnings')
            .insert({
                user_id: userId,
                reason: reason,
                description: details,
                issued_by: adminId,
                warning_number_in_sequence: 1
            })
            .select()
            .single();
        
        if (warningError) throw warningError;
        
        // تحديث عدد الإنذارات
        await supabase
            .from('users')
            .update({ 
                warnings_count: supabase.raw('warnings_count + 1'),
                last_warning: {
                    reason: reason,
                    details: details,
                    date: new Date(),
                    issued_by: adminId
                }
            })
            .eq('id', userId);
        
        // تسجيل الإجراء
        await logAdminAction({
            admin_id: adminId,
            action: 'send_warning',
            target_type: 'user',
            target_id: userId,
            details: { reason, details }
        });
        
        return { success: true, data: warning };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =====================================================
// دوال السائقين (Drivers)
// =====================================================

/**
 * الحصول على قائمة السائقين
 */
export async function getDrivers(options = {}) {
    const {
        status = 'all',
        verification = 'all',
        limit = 20,
        offset = 0,
        search = ''
    } = options;
    
    try {
        let query = supabase
            .from('drivers')
            .select(`
                *,
                users:user_id (
                    name,
                    phone,
                    email,
                    rating,
                    status
                )
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (verification !== 'all') {
            query = query.eq('verification_status', verification);
        }
        
        if (search) {
            query = query.or(`
                users.name.ilike.%${search}%,
                users.phone.ilike.%${search}%,
                national_id.ilike.%${search}%,
                vehicle->>'plateNumber'.ilike.%${search}%
            `);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * الحصول على سائق واحد
 */
export async function getDriver(driverId) {
    try {
        const { data, error } = await supabase
            .from('drivers')
            .select(`
                *,
                users:user_id (
                    name,
                    phone,
                    email,
                    rating,
                    status,
                    created_at,
                    last_login
                )
            `)
            .eq('user_id', driverId)
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * التحقق من مستندات السائق
 */
export async function verifyDriver(driverId, status, notes, adminId) {
    try {
        const { data, error } = await supabase
            .from('drivers')
            .update({
                verification_status: status,
                reviewed_by: adminId,
                reviewed_at: new Date(),
                admin_notes: notes,
                ...(status === 'approved' ? { approved_at: new Date() } : {})
            })
            .eq('user_id', driverId)
            .select()
            .single();
        
        if (error) throw error;
        
        // تحديث حالة المستخدم
        await supabase
            .from('users')
            .update({ 
                status: status === 'approved' ? 'active' : 'pending'
            })
            .eq('id', driverId);
        
        // تسجيل الإجراء
        await logAdminAction({
            admin_id: adminId,
            action: 'verify_driver',
            target_type: 'driver',
            target_id: driverId,
            details: { status, notes }
        });
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =====================================================
// دوال الرحلات (Trips)
// =====================================================

/**
 * الحصول على قائمة الرحلات
 */
export async function getTrips(options = {}) {
    const {
        status = 'all',
        limit = 20,
        offset = 0,
        startDate = null,
        endDate = null
    } = options;
    
    try {
        let query = supabase
            .from('trips')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (status !== 'all') {
            query = query.eq('status', status);
        }
        
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        
        if (endDate) {
            query = query.lte('created_at', endDate);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * الحصول على رحلة واحدة
 */
export async function getTrip(tripId) {
    try {
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .eq('id', tripId)
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =====================================================
// دوال الشكاوى (Complaints)
// =====================================================

/**
 * الحصول على قائمة الشكاوى
 */
export async function getComplaints(options = {}) {
    const {
        status = 'pending',
        priority = 'all',
        limit = 20,
        offset = 0
    } = options;
    
    try {
        let query = supabase
            .from('complaints')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (status !== 'all') {
            query = query.eq('status', status);
        }
        
        if (priority !== 'all') {
            query = query.eq('priority', priority);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * تحديث حالة الشكوى
 */
export async function updateComplaintStatus(complaintId, status, resolution, adminId) {
    try {
        const { data, error } = await supabase
            .from('complaints')
            .update({
                status: status,
                resolution: resolution,
                handled_by: adminId,
                resolved_at: new Date()
            })
            .eq('id', complaintId)
            .select()
            .single();
        
        if (error) throw error;
        
        await logAdminAction({
            admin_id: adminId,
            action: 'resolve_complaint',
            target_type: 'complaint',
            target_id: complaintId,
            details: { status, resolution }
        });
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =====================================================
// دوال الإشعارات (Notifications)
// =====================================================

/**
 * الحصول على الإشعارات
 */
export async function getNotifications(userId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * إرسال إشعار
 */
export async function sendNotification(notification) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * تحديث حالة الإشعار (مقروء)
 */
export async function markNotificationAsRead(notificationId) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date()
            })
            .eq('id', notificationId);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =====================================================
// دوال الإحصائيات (Statistics)
// =====================================================

/**
 * الحصول على إحصائيات لوحة التحكم
 */
export async function getDashboardStats() {
    try {
        // إحصائيات المستخدمين
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        const { count: totalDrivers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('type', 'driver');
        
        const { count: pendingDrivers } = await supabase
            .from('drivers')
            .select('*', { count: 'exact', head: true })
            .eq('verification_status', 'pending');
        
        const { count: bannedUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'banned');
        
        // إحصائيات الرحلات
        const today = new Date().toISOString().split('T')[0];
        const { count: todayTrips } = await supabase
            .from('trips')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);
        
        // إحصائيات الشكاوى
        const { count: pendingComplaints } = await supabase
            .from('complaints')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        // إحصائيات الإنذارات
        const { count: activeWarnings } = await supabase
            .from('warnings')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        
        // السائقين المتصلين
        const { count: onlineDrivers } = await supabase
            .from('drivers')
            .select('*', { count: 'exact', head: true })
            .eq('is_online', true);
        
        return {
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    drivers: totalDrivers,
                    pending: pendingDrivers,
                    banned: bannedUsers
                },
                trips: {
                    today: todayTrips
                },
                complaints: {
                    pending: pendingComplaints
                },
                warnings: {
                    active: activeWarnings
                },
                drivers: {
                    online: onlineDrivers
                }
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =====================================================
// دوال سجل الإجراءات (Admin Logs)
// =====================================================

/**
 * تسجيل إجراء إداري
 */
export async function logAdminAction(log) {
    try {
        const { error } = await supabase
            .from('admin_logs')
            .insert({
                admin_id: log.admin_id,
                action: log.action,
                target_type: log.target_type,
                target_id: log.target_id,
                details: log.details,
                admin_ip: log.admin_ip || null,
                user_agent: log.user_agent || null
            });
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * الحصول على سجل الإجراءات
 */
export async function getAdminLogs(options = {}) {
    const {
        adminId = null,
        action = null,
        limit = 50,
        offset = 0
    } = options;
    
    try {
        let query = supabase
            .from('admin_logs')
            .select(`
                *,
                admins:admin_id (
                    name,
                    email
                )
            `)
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (adminId) {
            query = query.eq('admin_id', adminId);
        }
        
        if (action) {
            query = query.eq('action', action);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =====================================================
// دوال طلبات التسجيل (Registration Requests)
// =====================================================

/**
 * الحصول على طلبات التسجيل
 */
export async function getRegistrationRequests(status = 'pending') {
    try {
        const { data, error } = await supabase
            .from('registration_requests')
            .select(`
                *,
                users:user_id (
                    name,
                    phone,
                    email
                )
            `)
            .eq('status', status)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * الموافقة على طلب تسجيل
 */
export async function approveRegistrationRequest(requestId, adminId) {
    try {
        // الحصول على الطلب
        const { data: request, error: requestError } = await supabase
            .from('registration_requests')
            .select('*')
            .eq('id', requestId)
            .single();
        
        if (requestError) throw requestError;
        
        // إنشاء سجل سائق
        const { error: driverError } = await supabase
            .from('drivers')
            .insert({
                user_id: request.user_id,
                national_id: request.vehicle?.plateNumber, // مؤقت
                documents: request.documents,
                vehicle: request.vehicle,
                verification_status: 'approved',
                reviewed_by: adminId,
                reviewed_at: new Date(),
                approved_at: new Date()
            });
        
        if (driverError) throw driverError;
        
        // تحديث حالة المستخدم
        await supabase
            .from('users')
            .update({ 
                type: 'driver',
                status: 'active'
            })
            .eq('id', request.user_id);
        
        // تحديث حالة الطلب
        await supabase
            .from('registration_requests')
            .update({
                status: 'approved',
                reviewed_by: adminId,
                reviewed_at: new Date()
            })
            .eq('id', requestId);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * رفض طلب تسجيل
 */
export async function rejectRegistrationRequest(requestId, reason, adminId) {
    try {
        const { error } = await supabase
            .from('registration_requests')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                reviewed_by: adminId,
                reviewed_at: new Date()
            })
            .eq('id', requestId);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =====================================================
// دوال الإعدادات (Settings)
// =====================================================

/**
 * الحصول على إعدادات النظام
 */
export async function getSettings() {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('setting_key', 'default')
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * تحديث الإعدادات
 */
export async function updateSettings(settings, adminId) {
    try {
        const { error } = await supabase
            .from('settings')
            .update({
                app_settings: settings.app,
                trip_settings: settings.trips,
                driver_settings: settings.drivers,
                payment_settings: settings.payment,
                notification_settings: settings.notifications,
                security_settings: settings.security,
                updated_by: adminId,
                updated_at: new Date()
            })
            .eq('setting_key', 'default');
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =====================================================
// دوال مساعدة (Utilities)
// =====================================================

/**
 * تنسيق التاريخ
 */
export function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * تنسيق المبلغ
 */
export function formatMoney(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

/**
 * الحصول على نص الحالة
 */
export function getStatusText(status) {
    const map = {
        'active': 'نشط',
        'suspended': 'موقوف',
        'banned': 'محظور',
        'pending': 'قيد المراجعة',
        'approved': 'مقبول',
        'rejected': 'مرفوض',
        'completed': 'مكتملة',
        'cancelled': 'ملغاة',
        'under_review': 'قيد المراجعة',
        'resolved': 'تم الحل',
        'high': 'عالية',
        'medium': 'متوسطة',
        'low': 'منخفضة',
        'critical': 'حرجة'
    };
    return map[status] || status;
}

export default supabase;