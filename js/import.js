// ลำดับ: วาง JSON → กด Import (ตรวจ) → เลือก Portfolio + ตรวจ/แก้ Reflection → Save ลง Server
// ต้องโหลดหลัง script.js และ item.js (ใช้ portfolios, API_BASE_URL, current, openPortfolio)

const IMPORT_MAX_CHARS = 100000;   // JSON ยาวเกินนี้ไม่รับ
const IMPORT_MAX_TEXT = 2000;      // ข้อความแต่ละช่องยาวได้ไม่เกินนี้
const IMPORT_CATEGORIES = ["discover", "mix", "levelup"];
const IMPORT_REFLECTION_KEYS = ["whatIDid", "whatILearned", "challenge", "nextStep"];

let importPendingItem = null;      // Item ที่ผ่านการตรวจแล้ว รอเลือก Portfolio และกด Save

// ---------- ส่วนที่ 1: ตรวจ JSON (ไม่ยุ่งกับหน้าเว็บ) ----------

function importIsText(value) {
    return typeof value === "string" && value.trim() !== "";
}

function importIsRealDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + "T00:00:00Z");
    return !isNaN(d) && d.toISOString().slice(0, 10) === value;
}

function importIsHttpUrl(value) {
    if (typeof value !== "string") return false;
    try {
        const url = new URL(value.trim());
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
        return false;
    }
}

// แปลงข้อความเป็น Item สำหรับเก็บในระบบของเรา
// รับได้ 2 แบบ: (1) ตาม Contract ของโจทย์ reflection เป็น object + evidence เป็น array
//               (2) แบบ flat ที่ระบบเราเก็บอยู่ (whatIDid... อยู่ระดับบน + evidence เป็น string)
// คืนค่า { ok: true, item, notes } หรือ { ok: false, errors }
function parseImportedItem(text) {
    if (!importIsText(text)) return { ok: false, errors: ["ยังไม่ได้วาง JSON"] };
    if (text.length > IMPORT_MAX_CHARS) return { ok: false, errors: ["JSON ยาวเกินไป"] };

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        return { ok: false, errors: ["JSON ผิดรูปแบบ: " + e.message] };
    }

    if (Array.isArray(data) || (data && typeof data === "object" && "items" in data)) {
        return { ok: false, errors: ["นี่ดูเหมือน Portfolio ทั้งชุด ให้วางเฉพาะ Portfolio Item เดียวจากบูธ"] };
    }
    if (data === null || typeof data !== "object") {
        return { ok: false, errors: ["JSON ต้องเป็น object ของ Portfolio Item"] };
    }

    const errors = [];
    const notes = [];

    // ข้อความหลัก
    [["id", 64], ["title", 100], ["type", 50], ["role", 50], ["description", IMPORT_MAX_TEXT]].forEach(function (pair) {
        const key = pair[0];
        if (!importIsText(data[key])) errors.push('field "' + key + '" ต้องเป็นข้อความและไม่ว่าง');
        else if (data[key].trim().length > pair[1]) errors.push('field "' + key + '" ยาวเกิน ' + pair[1] + " ตัวอักษร");
    });
    if (importIsText(data.id) && !/^[A-Za-z0-9_-]{1,64}$/.test(data.id.trim())) {
        errors.push('field "id" ใช้ได้เฉพาะ A-Z a-z 0-9 _ -');
    }
    if (!importIsRealDate(data.date)) errors.push('field "date" ต้องเป็นวันที่รูปแบบ YYYY-MM-DD ที่มีอยู่จริง');

    // skills
    if (!Array.isArray(data.skills) || data.skills.length < 1 || data.skills.length > 10 ||
        !data.skills.every(function (s) { return importIsText(s) && s.trim().length <= 50; })) {
        errors.push('field "skills" ต้องเป็น array ของข้อความ 1-10 รายการ (แต่ละอันไม่เกิน 50 ตัวอักษร)');
    }

    // reflection: อยู่ใน data.reflection (Contract) หรืออยู่ระดับบน (flat)
    let reflection = data;
    if ("reflection" in data) {
        if (data.reflection === null || typeof data.reflection !== "object" || Array.isArray(data.reflection)) {
            errors.push('field "reflection" ต้องเป็น object');
            reflection = {};
        } else {
            reflection = data.reflection;
        }
    }
    IMPORT_REFLECTION_KEYS.forEach(function (key) {
        if (typeof reflection[key] !== "string") errors.push("reflection." + key + " ต้องเป็นข้อความ");
        else if (reflection[key].length > IMPORT_MAX_TEXT) errors.push("reflection." + key + " ยาวเกิน " + IMPORT_MAX_TEXT + " ตัวอักษร");
    });

    // evidence: array ของ URL (Contract) หรือ URL เดียวเป็น string (flat)
    let urls = data.evidence;
    if (typeof urls === "string") urls = [urls];
    if (!Array.isArray(urls) || urls.length < 1 || !urls.every(importIsHttpUrl) ||
        urls.some(function (u) { return u.trim().length > 500; })) {
        errors.push('field "evidence" ต้องเป็น URL (http/https) อย่างน้อย 1 ลิงก์');
    }

    // ฟิลด์เสริมของ Challenge (ไม่บังคับ แต่ถ้ามีต้องถูกชนิด)
    ["challengeId", "hostGroup"].forEach(function (key) {
        if (key in data && (typeof data[key] !== "string" || data[key].length > 100)) {
            errors.push('field "' + key + '" ต้องเป็นข้อความไม่เกิน 100 ตัวอักษร');
        }
    });
    if ("category" in data && IMPORT_CATEGORIES.indexOf(data.category) === -1) {
        errors.push('field "category" ต้องเป็น discover | mix | levelup');
    }
    if ("schemaVersion" in data && data.schemaVersion !== "1.0") {
        errors.push('field "schemaVersion" ต้องเป็น "1.0"');
    }

    if (errors.length > 0) return { ok: false, errors: errors };

    // ระบบเก็บ evidence ได้ 1 ลิงก์ → ใช้ลิงก์แรก
    if (urls.length > 1) notes.push("JSON นี้มี evidence " + urls.length + " ลิงก์ ระบบเก็บได้ 1 ลิงก์ จึงใช้ลิงก์แรก");

    // สร้าง Item ใหม่จากฟิลด์ที่รู้จักเท่านั้น (ทิ้งฟิลด์แปลกปลอมที่แนบมา)
    const item = {
        id: data.id.trim(),
        title: data.title.trim(),
        type: data.type.trim(),
        date: data.date,
        role: data.role.trim(),
        description: data.description.trim(),
        skills: data.skills.map(function (s) { return s.trim(); }),
        whatIDid: reflection.whatIDid.trim(),
        whatILearned: reflection.whatILearned.trim(),
        challenge: reflection.challenge.trim(),
        nextStep: reflection.nextStep.trim(),
        evidence: urls[0].trim()
    };
    ["challengeId", "hostGroup", "category"].forEach(function (key) {
        if (key in data) item[key] = data[key];
    });
    return { ok: true, item: item, notes: notes };
}

// ---------- ส่วนที่ 2: หน้าเว็บ ----------

function importFindDuplicate(portfolio, id) {
    return (portfolio.items || []).some(function (it) { return it.id === id; });
}

function setImportErrors(messages) {
    const box = document.querySelector("#import-error");
    box.replaceChildren();
    messages.forEach(function (msg) {
        const line = document.createElement("div");
        line.textContent = msg;       // textContent เท่านั้น ข้อมูลมาจากกลุ่มอื่น
        box.appendChild(line);
    });
}

function setImportStatus(msg) {
    document.querySelector("#import-status").textContent = msg;
}

function clearImportReview() {
    importPendingItem = null;
    document.querySelector("#import-review").hidden = true;
}

// เลือก Portfolio แล้วต้องไม่ซ้ำ id เดิม
function checkImportDuplicate() {
    const select = document.querySelector("#import-portfolio");
    const saveBtn = document.querySelector("#import-save-btn");
    const target = portfolios.find(function (p) { return p.id === select.value; });

    if (target && importPendingItem && importFindDuplicate(target, importPendingItem.id)) {
        setImportErrors(['Item นี้ (id "' + importPendingItem.id + '") ถูก Import เข้า "' +
            target.displayName + '" แล้ว เลือก Portfolio อื่น หรือกด Cancel']);
        saveBtn.disabled = true;
    } else {
        setImportErrors([]);
        saveBtn.disabled = false;
    }
}

function fillImportReview(item, notes) {
    document.querySelector("#review-title").textContent = item.title;
    document.querySelector("#review-meta").textContent = item.type + " • " + item.date + " • " + item.role;
    document.querySelector("#review-description").textContent = item.description;

    const skillBox = document.querySelector("#review-skills");
    skillBox.replaceChildren();
    item.skills.forEach(function (skill) {
        const badge = document.createElement("span");
        badge.className = "badge bg-secondary me-1";
        badge.textContent = skill;
        skillBox.appendChild(badge);
    });

    const link = document.querySelector("#review-evidence");
    link.href = item.evidence;
    link.textContent = item.evidence;

    IMPORT_REFLECTION_KEYS.forEach(function (key) {
        document.querySelector("#import-" + key).value = item[key];
    });

    // รายการ Portfolio ปลายทาง (เลือกอันที่เปิดอยู่ให้ก่อน)
    const select = document.querySelector("#import-portfolio");
    select.replaceChildren();
    portfolios.forEach(function (p) {
        if (!p.id) return;            // Portfolio ที่ยังไม่มี id Server เพิ่ม Item ให้ไม่ได้
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.displayName;
        select.appendChild(option);
    });
    if (typeof current !== "undefined" && current && current.id) select.value = current.id;

    setImportStatus(notes.join(" "));
    document.querySelector("#import-review").hidden = false;
    checkImportDuplicate();
}

function handleImportClick() {
    clearImportReview();
    setImportErrors([]);
    setImportStatus("");

    const result = parseImportedItem(document.querySelector("#import-json-text").value);
    if (!result.ok) {
        setImportErrors(result.errors);
        return;
    }
    if (!portfolios.some(function (p) { return p.id; })) {
        setImportErrors(["ยังไม่มี Portfolio ให้เลือก กรุณาสร้าง Portfolio ก่อน แล้วค่อย Import"]);
        return;
    }
    importPendingItem = result.item;
    fillImportReview(result.item, result.notes);
}

async function handleImportSave() {
    if (!importPendingItem) return;

    const target = portfolios.find(function (p) { return p.id === document.querySelector("#import-portfolio").value; });
    if (!target) {
        setImportErrors(["กรุณาเลือก Portfolio ปลายทาง"]);
        return;
    }

    // อ่าน Reflection ที่ผู้ใช้ตรวจ/แก้ ต้องไม่ว่าง
    const item = Object.assign({}, importPendingItem);
    const errors = [];
    IMPORT_REFLECTION_KEYS.forEach(function (key) {
        item[key] = document.querySelector("#import-" + key).value.trim();
        if (item[key] === "") errors.push("กรุณากรอก Reflection: " + key);
        else if (item[key].length > IMPORT_MAX_TEXT) errors.push("Reflection: " + key + " ยาวเกิน " + IMPORT_MAX_TEXT + " ตัวอักษร");
    });
    if (importFindDuplicate(target, item.id)) errors.push("Item นี้ถูก Import เข้า Portfolio นี้แล้ว");
    if (errors.length > 0) {
        setImportErrors(errors);
        return;
    }
    setImportErrors([]);

    const formData = new FormData();
    formData.append("portfolioId", target.id);
    ["id", "title", "type", "date", "role", "description", "evidence",
     "whatIDid", "whatILearned", "challenge", "nextStep",
     "challengeId", "hostGroup", "category"].forEach(function (key) {
        if (key in item) formData.append(key, item[key]);
    });
    // Server แยก skills ด้วยจุลภาค จึงตัดจุลภาคในชื่อทักษะออก
    formData.append("skills", item.skills.map(function (s) { return s.replace(/,/g, " "); }).join(", "));

    const saveBtn = document.querySelector("#import-save-btn");
    saveBtn.disabled = true;           // กันกดซ้ำระหว่างรอ Server
    try {
        const response = await fetch(API_BASE_URL + "/items.php", { method: "POST", body: formData });
        const raw = await response.text();     // อ่านเป็นข้อความก่อน เผื่อ Server ไม่ได้ตอบเป็น JSON
        let result = null;
        try { result = JSON.parse(raw); } catch (e) { result = null; }

        if (!response.ok) {
            throw new Error((result && result.error) || "Server ตอบ HTTP " + response.status + ": " + raw.slice(0, 200));
        }
        // Server ต้องตอบกลับเป็น Item ที่บันทึกแล้ว ถ้าไม่ใช่ แปลว่าคำขอไม่ได้ถึง items.php ที่ถูกต้อง
        // (เช่น PHP ไม่ทำงาน หรือ Server ใช้ items.php คนละเวอร์ชัน) ห้ามถือว่าสำเร็จ
        if (!result || typeof result !== "object" || Array.isArray(result) ||
            typeof result.id !== "string" || !Array.isArray(result.skills)) {
            throw new Error("Server ตอบกลับไม่ใช่ Item ที่บันทึกแล้ว (HTTP " + response.status + "): " + raw.slice(0, 200));
        }

        if (!Array.isArray(target.items)) target.items = [];
        target.items.push(result);
        document.querySelector("#import-json-text").value = "";
        clearImportReview();
        let message = 'Import สำเร็จ: บันทึก "' + result.title + '" ลงใน ' + target.displayName + " แล้ว";
        if (result.id !== item.id) {
            message += " (คำเตือน: Server ไม่ได้ใช้ id เดิมของ Item นี้ items.php น่าจะยังเป็นเวอร์ชันเก่า ทำให้กัน Import ซ้ำไม่ได้)";
        }
        setImportStatus(message);
        openPortfolio(target);         // เปิดดูผลทันที
        document.querySelector("#detail-view").scrollIntoView({ behavior: "smooth" });
    } catch (e) {
        setImportErrors([e.message]);
        saveBtn.disabled = false;
    }
}

// เลือกไฟล์ .json แล้วใส่ข้อความลงช่อง (ยังต้องกด Import เหมือนเดิม)
function handleImportFile(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    if (file.size > IMPORT_MAX_CHARS) {
        setImportErrors(["ไฟล์ใหญ่เกินไป"]);
        input.value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = function () {
        document.querySelector("#import-json-text").value = reader.result;
        input.value = "";
    };
    reader.readAsText(file);
}

if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () {
        document.querySelector("#import-btn").addEventListener("click", handleImportClick);
        document.querySelector("#import-save-btn").addEventListener("click", handleImportSave);
        document.querySelector("#import-cancel-btn").addEventListener("click", function () {
            clearImportReview();
            setImportErrors([]);
            setImportStatus("");
        });
        document.querySelector("#import-portfolio").addEventListener("change", checkImportDuplicate);
        document.querySelector("#import-json-file").addEventListener("change", handleImportFile);
    });
}

if (typeof module !== "undefined") module.exports = { parseImportedItem };
