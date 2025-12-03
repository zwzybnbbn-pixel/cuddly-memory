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

// عرض البطاقات
function loadCards() {
    let box = document.getElementById("doctorCards");
    box.innerHTML = "";
    doctors.forEach(doc => {
        box.innerHTML += `
            <div class="card">
                <h3>${doc.name}</h3>
                <p>التخصص: ${doc.spec}</p>
                <p>المستشفى: ${doc.hospital}</p>
                <p>الدوام: ${doc.time}</p>
            </div>
        `;
    });
}
loadCards();

// البحث
function searchDoctor() {
    let text = document.getElementById("searchInput").value;

    let result = doctors.filter(d =>
        d.name.includes(text)
    );

    let box = document.getElementById("doctorCards");
    box.innerHTML = "";

    if (result.length === 0) {
        box.innerHTML = `<h3 style="text-align:center;">لا يوجد دكتور بهذا الاسم</h3>`;
        return;
    }

    result.forEach(doc => {
        box.innerHTML += `
            <div class="card">
                <h3>${doc.name}</h3>
                <p>التخصص: ${doc.spec}</p>
                <p>المستشفى: ${doc.hospital}</p>
                <p>الدوام: ${doc.time}</p>
            </div>
        `;
    });
}
