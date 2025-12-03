// قائمة 3 خطوط
function toggleMenu() {
    let menu = document.getElementById("menuBox");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// بيانات الأطباء
const doctors = [
    { name: "د. ماجد قاسم", spec: "باطنية", hospital: "مستشفى شبوة", time: "8am - 4pm" },
    { name: "د. أحمد سالم", spec: "أطفال", hospital: "مستشفى عتق", time: "9am - 3pm" },
    { name: "د. علي ناصر", spec: "عظام", hospital: "مستشفى العاصمة", time: "4pm - 10pm" }
];

// عرض كل البطاقات
function loadCards() {
    let box = document.getElementById("doctorCards");
    box.innerHTML = "";

    doctors.forEach(doc => {
        box.innerHTML += createCard(doc);
    });
}

// إنشاء بطاقة واحدة
function createCard(doc) {
    return `
        <div class="card">
            <h3>${doc.name}</h3>
            <p>التخصص: ${doc.spec}</p>
            <p>المستشفى: ${doc.hospital}</p>
            <p>الدوام: ${doc.time}</p>
        </div>
    `;
}

// البحث
function searchDoctor() {
    let text = document.getElementById("searchInput").value.trim();

    let box = document.getElementById("doctorCards");
    box.innerHTML = "";

    // البحث باستخدام includes مع تجاهل المسافات
    let result = doctors.filter(d =>
        d.name.replace(/\s/g, "").includes(text.replace(/\s/g, ""))
    );

    if (result.length === 0) {
        box.innerHTML = `<h3 style="text-align:center; color:#555;">لا يوجد دكتور بهذا الاسم</h3>`;
        return;
    }

    result.forEach(doc => {
        box.innerHTML += createCard(doc);
    });
}

// تحميل البطاقات عند فتح الصفحة
loadCards();
