import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔹 إنشاء العميل (بدون auth)
const supabase = createClient(
  "https://gxuumjhtutkipvkljjhj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dXVtamh0dXRraXB2a2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTM2MzEsImV4cCI6MjA4MTEyOTYzMX0.rmsSRTQ57cAJ3VAiQMe0mdxEYcERh6zQDep7DN_frFI"
);

const list = document.getElementById("list");
const reportsCount = document.getElementById("reportsCount");

async function loadReports() {
    list.textContent = "⏳ جاري تحميل البلاغات...";

    const { data, error } = await supabase
        .from("reports")
        .select("id, name, details, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        list.textContent = "❌ فشل تحميل البلاغات";
        return;
    }

    if (!data || data.length === 0) {
        list.textContent = "لا توجد بلاغات";
        reportsCount.textContent = "0 بلاغ";
        return;
    }

    list.innerHTML = "";
    reportsCount.textContent = `${data.length} بلاغ`;

    data.forEach(report => {
        const div = document.createElement("div");
        div.className = "report-item";
        div.innerHTML = `
            <strong>${report.name ?? "بدون اسم"}</strong>
            <p>${report.details ?? ""}</p>
            <small>${new Date(report.created_at).toLocaleString("ar-EG")}</small>
            <hr>
        `;
        list.appendChild(div);
    });
}

loadReports();
