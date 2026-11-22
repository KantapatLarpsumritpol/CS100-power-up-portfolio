const CHALLENGE_CONFIG = {
    challengeName: "โยนบอลแยก syntax",
    groupName: "16",
    role: "Participant",
    description: "โยนลูกบอล 7 ลูกลงถังให้ถูกต้อง โดย 6 ลูกมี syntax ติดไว้ และอีก 1 ลูกผู้เล่นต้องคิด syntax ขึ้นมาเอง ทำให้ครบภายใน 10 นาที",
    skills: ["Syntax Recognition", "Programming Fundamentals", "Time Management"],
    reflection: {
        whatIDid: "เข้าร่วม Challenge โยนบอลแยก syntax และทำสำเร็จภายในเวลาที่กำหนด",
        whatILearned: "ได้ทบทวนการแยกประเภทของ syntax และฝึกคิด syntax ขึ้นมาเอง",
        challenge: "ต้องแยก syntax ให้ถูกภายใต้เวลาจำกัด 10 นาที",
        nextStep: "นำความรู้เรื่อง syntax ไปใช้เขียนโปรแกรมให้แม่นยำขึ้น"
    },
    evidence: ["https://drive.google.com/drive/folders/1GhxjfbB3IDQEpI_NZPf0Em1zM4qylkxv?usp=sharing"]
};

function generateItemId() {
    return "item" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function generatePortfolioItem(challengeResult) {
    const r = challengeResult || {};
    const reflection = r.reflection || {};

    const item = {
        id: generateItemId(),
        title: "Challenge: " + (r.challengeName || "").trim(),
        type: "Challenge",
        date: new Date().toLocaleDateString("sv-SE"),
        role: r.role || "Participant",
        description: (r.description || "").trim() +
            (r.groupName ? " (จัดโดยกลุ่ม " + r.groupName + ")" : ""),
        skills: Array.isArray(r.skills) ? r.skills : [],
        reflection: {
            whatIDid: (reflection.whatIDid || "").trim(),
            whatILearned: (reflection.whatILearned || "").trim(),
            challenge: (reflection.challenge || "").trim(),
            nextStep: (reflection.nextStep || "").trim()
        },
        evidence: Array.isArray(r.evidence) ? r.evidence : []
    };

    const errors = validatePortfolioItem(item);
    if (errors.length > 0) {
        throw new Error("Invalid item: " + errors.join(", "));
    }
    return item;
}

function validatePortfolioItem(item) {
    const errors = [];
    ["id", "title", "type", "date", "role", "description"].forEach(function (k) {
        if (typeof item[k] !== "string" || item[k].trim() === "") errors.push("missing " + k);
    });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) errors.push("date must be YYYY-MM-DD");
    if (!Array.isArray(item.skills) || item.skills.length === 0) errors.push("skills must be a non-empty array");
    ["whatIDid", "whatILearned", "challenge", "nextStep"].forEach(function (k) {
        if (!item.reflection || !item.reflection[k]) errors.push("missing reflection." + k);
    });
    if (!Array.isArray(item.evidence) || item.evidence.length === 0) {
        errors.push("evidence must be a non-empty array");
    } else if (!item.evidence.every(function (u) { return /^https?:\/\//.test(u); })) {
        errors.push("evidence must be http(s) links");
    }
    return errors;
}

function displayPortfolioJson(item) {
    const textarea = document.getElementById("generated-json");
    if (!textarea) {
        console.error("JSON textarea not found");
        return;
    }
    textarea.value = JSON.stringify(item, null, 2);
}

function setCopyStatus(msg) {
    const status = document.getElementById("copy-status");
    if (status) status.textContent = msg;
}

async function copyPortfolioJson() {
    const textarea = document.getElementById("generated-json");

    if (!textarea || !textarea.value) {
        setCopyStatus("ยังไม่มี JSON ให้คัดลอก");
        return;
    }
    try {
        await navigator.clipboard.writeText(textarea.value);
        setCopyStatus("คัดลอก JSON แล้ว!");
    } catch (error) {
        try {
            textarea.select();
            document.execCommand("copy");
            setCopyStatus("คัดลอก JSON แล้ว!");
        } catch (e) {
            setCopyStatus("คัดลอกไม่สำเร็จ กรุณาคัดลอกเอง");
        }
    }
}

function handleGenerateClick() {
    try {
        displayPortfolioJson(generatePortfolioItem(CHALLENGE_CONFIG));
        setCopyStatus("");
    } catch (err) {
        setCopyStatus(err.message);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const generateBtn = document.getElementById("generate-json-btn");
    const copyBtn = document.getElementById("copy-json-btn");

    if (generateBtn) generateBtn.addEventListener("click", handleGenerateClick);
    if (copyBtn) copyBtn.addEventListener("click", copyPortfolioJson);
});