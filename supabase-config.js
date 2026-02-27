/**
 * إعدادات اتصال قاعدة بيانات مسجد الفاروق
 * تم التعديل لتجنب أخطاء SyntaxError و Redeclaration
 */

(() => {
    const SUPABASE_URL = 'https://nqothizwtmvbvyrxoguz.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xb3RoaXp3dG12YnZ5cnhvZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjc2ODEsImV4cCI6MjA4MjYwMzY4MX0.Hah1FyYJT-dQI0byUO7pNKB3NZqzkyICPh_0D_zdzis';

    // استخدام اسم فريد لتجنب التصادم مع المكتبة الأصلية
    if (!window.farouqAppClient) {
        window.farouqAppClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    const client = window.farouqAppClient;

    // تعريف كائن قاعدة البيانات
    const Database = {
        // 1. جلب جميع الحلقات
        async getHalaqat() {
            const { data, error } = await client
                .from('halaqat')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Error fetching halaqat:", error.message);
                return [];
            }
            return data;
        },

        // 2. جلب الطلاب لحلقة معينة
        async getStudents(halqaId = null) {
            let query = client
                .from('students')
                .select(`
                    *,
                    halaqat (title, teacher)
                `);
            
            if (halqaId) {
                query = query.eq('halqa_id', halqaId);
            }
            
            const { data, error } = await query.order('name', { ascending: true });
            
            if (error) {
                console.error("Error fetching students:", error.message);
                return [];
            }
            
            return data.map(student => ({
                ...student,
                halqa_name: student.halaqat?.title || 'غير معروف'
            }));
        },

        // 3. جلب بيانات طالب محدد بالتفصيل
        async getStudentDetails(studentId) {
            const { data, error } = await client
                .from('students')
                .select(`
                    *,
                    attendance (*),
                    progress (*),
                    daily_listening (*)
                `)
                .eq('id', studentId)
                .single();

            if (error) {
                console.error("Error fetching student details:", error.message);
                return null;
            }
            return data;
        },

        // 4. جلب السماع اليومي
        async getTodayListening(studentId) {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await client
                .from('daily_listening')
                .select('verses_count')
                .eq('student_id', studentId)
                .eq('date', today)
                .maybeSingle();
            
            return data?.verses_count || 0;
        }
    };

    // تصدير الكائن للنافذة العالمية
    window.Database = Database;
    console.log("✅ Database module loaded successfully.");
})();
