// ====== قائمة النقاط ======
function toggleMenu() {
    const menu = document.getElementById("menuBox");
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

// ====== بيانات الأطباء ======
const doctors = [
    { name: "د. أحمد", hospital: "مستشفى شبوة", specialty: "باطنية", today: "صباحي", tomorrow: "مسائي" },
    { name: "د. خالد", hospital: "مستشفى عتق", specialty: "جراحة", today: "مسائي", tomorrow: "صباحي" },
    { name: "د. رامي", hospital: "مستوصف الأمل", specialty: "أسنان", today: "صباحي", tomorrow: "مسائي" }
];


// ====== دالة البحث ======
function searchDoctor() {
    const input = document.getElementById("searchInput").value.trim();
    const resultBox = document.getElementById("result");

    if (input === "") {
        resultBox.innerHTML = `<p>الرجاء كتابة اسم الطبيب</p>`;
        return;
    }

    const result = doctors.filter(doc => doc.name.includes(input));

    if (result.length === 0) {
        resultBox.innerHTML = `<p style="color:red;">لا يوجد طبيب بهذا الاسم</p>`;
    } else {
        resultBox.innerHTML = result.map(doc => `
            <div class="doctor-card">
                <h3>${doc.name}</h3>
                <p>المستشفى: ${doc.hospital}</p>
                <p>التخصص: ${doc.specialty}</p>
                <p>دوام اليوم: ${doc.today}</p>
                <p>دوام غداً: ${doc.tomorrow}</p>
            </div>
        `).join('');
    }
}
// ===========================
// قاعدة بيانات الأطباء
// ===========================
const doctors = [
    { name: "د. أحمد ناصر", specialty: "باطنية", hospital: "مستشفى شبوة العام", today: "صباحي", tomorrow: "مسائي" },
    { name: "د. سالم الحارثي", specialty: "عيون", hospital: "مستشفى عتق", today: "مسائي", tomorrow: "صباحي" },
    { name: "د. محمد هادي", specialty: "جلدية", hospital: "مستوصف الأمل", today: "صباحي", tomorrow: "صباحي" },
    { name: "د. عبدالله صالح", specialty: "عظام", hospital: "مستشفى عتق الجديد", today: "مسائي", tomorrow: "مسائي" },
    { name: "د. ياسر مبروك", specialty: "أسنان", hospital: "عيادة نور", today: "صباحي", tomorrow: "مسائي" }
];

// ===========================
// عرض جميع الأطباء كبطاقات
// ===========================
function displayAllDoctors() {
    const container = document.getElementById("doctors-list");
    container.innerHTML = "";

    doctors.forEach(doc => {
        container.innerHTML += `
            <div class="doctor-card">
                <h3>${doc.name}</h3>
                <p>التخصص: ${doc.specialty}</p>
                <p>المستشفى: ${doc.hospital}</p>
                <p>دوام اليوم: ${doc.today}</p>
                <p>دوام غداً: ${doc.tomorrow}</p>
            </div>
        `;
    });
}

// ===========================
// دالة البحث عن طبيب بالاسم
// ===========================
function searchDoctor() {
    const query = document.getElementById("searchInput").value.trim();
    const resultBox = document.getElementById("result");

    resultBox.innerHTML = "";

    if (query === "") {
        resultBox.innerHTML = "<p>❗ أدخل اسم الطبيب للبحث</p>";
        return;
    }

    const results = doctors.filter(doc => doc.name.includes(query));

    if (results.length === 0) {
        resultBox.innerHTML = "<p>❌ لا يوجد طبيب بهذا الاسم</p>";
        return;
    }

    results.forEach(doc => {
        resultBox.innerHTML += `
            <div class="doctor-card">
                <h3>${doc.name}</h3>
                <p>التخصص: ${doc.specialty}</p>
                <p>المستشفى: ${doc.hospital}</p>
                <p>دوام اليوم: ${doc.today}</p>
                <p>دوام غداً: ${doc.tomorrow}</p>
            </div>
        `;
    });
}

// تحميل جميع الأطباء عند فتح الصفحة
window.onload = () => {
    displayAllDoctors();
};
       
