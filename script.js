// بحث عن طبيب
function searchDoctor() {
    const input = document.getElementById("searchInput").value.trim();
    const resultBox = document.getElementById("result");

    resultBox.innerHTML = "";

    const found = doctors.filter(doc => doc.name.includes(input));

    if (found.length === 0) {
        resultBox.innerHTML = "<p class='no-result'>❌ لا يوجد طبيب بهذا الاسم</p>";
        return;
    }

    found.forEach(doc => {
        resultBox.innerHTML += `
        <div class="card">
            <h3>${doc.name}</h3>
            <p><strong>التخصص:</strong> ${doc.specialty}</p>
            <p><strong>المستشفى:</strong> ${doc.hospital}</p>
            <p><strong>وقت الدوام:</strong> ${doc.time}</p>
        </div>`;
    });
}

// توليد بطاقات الأطباء تلقائيًا
function loadCards() {
    const container = document.getElementById("cardsContainer");
    if (!container) return;

    doctors.forEach(doc => {
        container.innerHTML += `
        <div class="card">
            <h3>${doc.name}</h3>
            <p><strong>التخصص:</strong> ${doc.specialty}</p>
            <p><strong>المستشفى:</strong> ${doc.hospital}</p>
            <p><strong>وقت الدوام:</strong> ${doc.time}</p>
        </div>`;
    });
}

loadCards();
