// إعدادات الاتصال بـ Supabase
const SUPABASE_URL = 'https://nqothizwtmvbvyrxoguz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xb3RoaXp3dG12YnZ5cnhvZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjc2ODEsImV4cCI6MjA4MjYwMzY4MX0.Hah1FyYJT-dQI0byUO7pNKB3NZqzkyICPh_0D_zdzis';

// إنشاء العميل وتصديره ليتم استخدامه في جميع الصفحات
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// دالة مساعدة لتنسيق المبالغ المالية
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount || 0);
};
