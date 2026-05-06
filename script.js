const ICONS = {
    success: '<svg class="result__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/></svg>',
    warning: '<svg class="result__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    error:   '<svg class="result__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>'
};

const MANDATORY = ["englishSem3", "englishSem4", "mathSem3", "mathSem4", "biologySem3", "biologySem4"];

const FIELD_ORDER = [
    "biologySem3", "biologySem4",
    "germanSem3", "germanSem4",
    "mathSem3", "mathSem4",
    "englishSem3", "englishSem4",
    "artSem3", "artSem4",
    "historySem3", "historySem4"
];

const SUBJECT_LABEL = {
    biologySem3: "Biologie", biologySem4: "Biologie",
    germanSem3: "Deutsch", germanSem4: "Deutsch",
    mathSem3: "Mathematik", mathSem4: "Mathematik",
    englishSem3: "Englisch", englishSem4: "Englisch",
    artSem3: "Kunst", artSem4: "Kunst",
    historySem3: "Geschichte", historySem4: "Geschichte"
};

const SEMESTER_OF = name => name.endsWith("Sem3") ? "Sem 3" : "Sem 4";

const GRADE_ABBREV = ["6","5−","5","5+","4−","4","4+","3−","3","3+","2−","2","2+","1−","1","1+"];

const GRADE_NAMES = {
    0:  "0 Punkte — ungenügend (6)",
    1:  "1 Punkt — mangelhaft minus (5−)",
    2:  "2 Punkte — mangelhaft (5)",
    3:  "3 Punkte — mangelhaft plus (5+)",
    4:  "4 Punkte — ausreichend minus (4−)",
    5:  "5 Punkte — ausreichend (4)",
    6:  "6 Punkte — ausreichend plus (4+)",
    7:  "7 Punkte — befriedigend minus (3−)",
    8:  "8 Punkte — befriedigend (3)",
    9:  "9 Punkte — befriedigend plus (3+)",
    10: "10 Punkte — gut minus (2−)",
    11: "11 Punkte — gut (2)",
    12: "12 Punkte — gut plus (2+)",
    13: "13 Punkte — sehr gut minus (1−)",
    14: "14 Punkte — sehr gut (1)",
    15: "15 Punkte — sehr gut plus (1+)"
};

const STORAGE_KEY = "fhr-rechner-grades-v1";

document.addEventListener("DOMContentLoaded", () => {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener("input", onInput);
        input.addEventListener("keydown", onKeyDown);
    });
    document.getElementById("resetButton").addEventListener("click", resetForm);
    document.getElementById("printButton").addEventListener("click", () => window.print());
    document.getElementById("shareButton").addEventListener("click", shareLink);

    const fromHash = decodeHashGrades();
    if (fromHash) {
        applyState(fromHash);
        history.replaceState(null, "", location.pathname + location.search);
    } else {
        loadStoredState();
    }
    updateAllTooltips();
    if (anyInputFilled()) calculate();
});

function onInput(e) {
    updateTooltip(e.target);
    calculate();
    saveState();
    if (e.target.value.length >= 2) focusNext(e.target);
}

function onKeyDown(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        focusNext(e.target);
    }
}

function focusNext(current) {
    const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
    const idx = inputs.indexOf(current);
    if (idx >= 0 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
    } else if (idx === inputs.length - 1) {
        current.blur(); // close mobile keyboard after last field
    }
}

function calculate() {
    const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
    clearStates(inputs);

    const validation = validateGrades(inputs);
    if (!validation.ok) {
        if (validation.zeroInputs) validation.zeroInputs.forEach(el => markInput(el, "is-zero"));
        showResult({ tone: validation.tone, message: validation.message });
        return;
    }

    MANDATORY.forEach(name => markInput(document.getElementsByName(name)[0], "is-included"));
    const german = pickBetterGerman();
    const bestGK = pickBestGK();

    const LKGrades = [german.value, byName("biologySem3"), byName("biologySem4")];
    const GKGrades = [bestGK.value, byName("mathSem3"), byName("mathSem4"), byName("englishSem3"), byName("englishSem4")];

    markDeficits(inputs);

    if (!withinDeficitLimits(GKGrades, LKGrades)) {
        showResult({ tone: "error", message: buildDeficitMessage(GKGrades, LKGrades) });
        return;
    }

    const breakdown = buildBreakdown(german, bestGK);
    const total = breakdown.total;

    if (total < 95) {
        const need = 95 - total;
        const verb = need === 1 ? "fehlt" : "fehlen";
        showResult({
            tone: "warning",
            message: `Aktuell <span class="highlight">${total} Punkte</span> &mdash; mindestens <span class="highlight">95</span> sind n&ouml;tig (es ${verb} noch <span class="highlight">${need}</span>).`,
            breakdown
        });
        return;
    }

    const schnitt = Math.max(1, (323 - total) / 57);
    const hint = buildTargetHint(total);
    showResult({
        tone: "success",
        message: `Gesamtpunktzahl: <span class="highlight">${total}</span> &middot; FHR-Schnitt: <span class="highlight">${schnitt.toFixed(1).replace(".", ",")}</span>`,
        breakdown,
        hint
    });
}

function markInput(input, cls) {
    input.classList.add(cls);
    const label = input.parentElement.querySelector(".grade-label");
    if (label) label.classList.add(cls);
}

function clearStates(inputs) {
    inputs.forEach(input => {
        input.classList.remove("is-included", "is-deficit", "is-zero");
        const label = input.parentElement.querySelector(".grade-label");
        if (label) label.className = "grade-label";
    });
}

function markDeficits(inputs) {
    inputs.forEach(input => {
        const v = parseInt(input.value, 10);
        if (v >= 1 && v <= 4) {
            input.classList.add("is-deficit");
            const label = input.parentElement.querySelector(".grade-label");
            if (label) label.classList.add("is-deficit");
        }
    });
}

function pickBetterGerman() {
    const sem3 = document.getElementsByName("germanSem3")[0];
    const sem4 = document.getElementsByName("germanSem4")[0];
    const better = parseInt(sem4.value, 10) > parseInt(sem3.value, 10) ? sem4 : sem3;
    markInput(better, "is-included");
    return { value: parseInt(better.value, 10), input: better, name: better.name };
}

function pickBestGK() {
    let bestInput = null;
    let max = -Infinity;
    document.querySelectorAll(".GK").forEach(input => {
        const v = parseInt(input.value, 10);
        if (!isNaN(v) && v > max) { max = v; bestInput = input; }
    });
    if (bestInput) markInput(bestInput, "is-included");
    return { value: max, input: bestInput, name: bestInput ? bestInput.name : null };
}

function byName(name) {
    return parseInt(document.getElementsByName(name)[0].value, 10);
}

function validateGrades(inputs) {
    const zeroInputs = [];
    for (const input of inputs) {
        const value = parseInt(input.value, 10);
        if (isNaN(value)) {
            return { ok: false, tone: "neutral", message: 'Bitte gib f&uuml;r alle F&auml;cher Noten zwischen <span class="highlight">0</span> und <span class="highlight">15</span> ein.' };
        }
        if (value < 0 || value > 15) {
            return { ok: false, tone: "error", message: 'Die Noten m&uuml;ssen zwischen <span class="highlight">0</span> und <span class="highlight">15</span> liegen.' };
        }
        if (value === 0) zeroInputs.push(input);
    }
    if (zeroInputs.length > 0) {
        return { ok: false, tone: "error", message: 'Mindestens ein Kurs wurde mit <span class="highlight">0 Punkten</span> abgeschlossen.', zeroInputs };
    }
    return { ok: true };
}

function withinDeficitLimits(GK, LK) {
    const LKdef = LK.filter(g => g <= 4).length;
    const GKdef = GK.filter(g => g <= 4).length;
    return LKdef <= 1 && GKdef <= 2;
}

function buildDeficitMessage(GK, LK) {
    const LKdef = LK.filter(g => g <= 4).length;
    const GKdef = GK.filter(g => g <= 4).length;
    const parts = [];
    if (LKdef > 1) parts.push(`<span class="highlight">${LKdef} LK-Defizite</span> (max. 1 erlaubt)`);
    if (GKdef > 2) parts.push(`<span class="highlight">${GKdef} GK-Defizite</span> (max. 2 erlaubt)`);
    return `Zu viele Defizite: ${parts.join(" &middot; ")}.`;
}

function buildBreakdown(german, bestGK) {
    const bio3 = byName("biologySem3");
    const bio4 = byName("biologySem4");
    const math3 = byName("mathSem3");
    const math4 = byName("mathSem4");
    const eng3 = byName("englishSem3");
    const eng4 = byName("englishSem4");

    const rows = [
        { label: "Biologie (LK)",   formula: `${bio3} + ${bio4} = ${bio3 + bio4} &times; 3`, points: (bio3 + bio4) * 3 },
        { label: `Deutsch (LK, ${SEMESTER_OF(german.name)})`, formula: `${german.value} &times; 3`, points: german.value * 3 },
        { label: "Mathematik (GK)", formula: `${math3} + ${math4} = ${math3 + math4} &times; 2`, points: (math3 + math4) * 2 },
        { label: "Englisch (GK)",   formula: `${eng3} + ${eng4} = ${eng3 + eng4} &times; 2`, points: (eng3 + eng4) * 2 },
        { label: `${SUBJECT_LABEL[bestGK.name]} (GK, ${SEMESTER_OF(bestGK.name)})`, formula: `${bestGK.value} &times; 2`, points: bestGK.value * 2 }
    ];
    const total = rows.reduce((s, r) => s + r.points, 0);
    return { rows, total };
}

function buildTargetHint(total) {
    const currentSchnitt = parseFloat(((323 - total) / 57).toFixed(1));
    if (currentSchnitt <= 1.0) return null;
    const target = parseFloat((currentSchnitt - 0.1).toFixed(1));
    if (target < 1.0) return null;
    for (let t = total + 1; t <= 285; t++) {
        const s = parseFloat(((323 - t) / 57).toFixed(1));
        if (s <= target) {
            const diff = t - total;
            const noun = diff === 1 ? "Punkt" : "Punkten";
            return `Mit <span class="highlight">${diff}</span> ${noun} mehr erreichst du Schnitt <span class="highlight">${target.toFixed(1).replace(".", ",")}</span>.`;
        }
    }
    return null;
}

function showResult({ tone, message, breakdown, hint }) {
    const area = document.getElementById("resultArea");
    area.classList.remove("result--success", "result--warning", "result--error");
    if (tone === "success") area.classList.add("result--success");
    else if (tone === "warning") area.classList.add("result--warning");
    else if (tone === "error") area.classList.add("result--error");

    let html = (ICONS[tone] || "") + message;
    if (breakdown) {
        let rowsHtml = breakdown.rows.map(r =>
            `<tr><td>${r.label}</td><td>${r.formula}</td><td>${r.points}</td></tr>`
        ).join("");
        html += `<table class="breakdown"><tbody>${rowsHtml}</tbody><tfoot><tr><td>Gesamt</td><td></td><td>${breakdown.total}</td></tr></tfoot></table>`;
    }
    if (hint) {
        html += `<div class="result__hint">${hint}</div>`;
    }
    area.innerHTML = html;
    area.style.display = "block";

    // On mobile scroll result into view so it's not hidden behind keyboard
    if (window.innerWidth <= 600) {
        setTimeout(() => area.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
    }
}

function resetForm() {
    const area = document.getElementById("resultArea");
    area.style.display = "none";
    area.classList.remove("result--success", "result--warning", "result--error");
    area.innerHTML = "";
    document.getElementById("gradeForm").reset();
    clearStates(document.querySelectorAll('input[type="number"]'));
    document.querySelectorAll('input[type="number"]').forEach(i => i.removeAttribute("title"));
    document.querySelectorAll('.input-wrap').forEach(w => w.classList.remove("has-label"));
    document.querySelectorAll('.grade-label').forEach(l => { l.textContent = ""; });
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

function saveState() {
    const state = {};
    document.querySelectorAll('input[type="number"]').forEach(i => {
        if (i.value !== "") state[i.name] = i.value;
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function loadStoredState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        applyState(JSON.parse(raw));
    } catch {}
}

function applyState(state) {
    Object.entries(state).forEach(([k, v]) => {
        const el = document.getElementsByName(k)[0];
        if (el) el.value = v;
    });
}

function anyInputFilled() {
    return Array.from(document.querySelectorAll('input[type="number"]')).some(i => i.value !== "");
}

function encodeHashGrades() {
    return FIELD_ORDER.map(name => {
        const v = document.getElementsByName(name)[0].value;
        if (v === "") return "x";
        const n = parseInt(v, 10);
        if (isNaN(n) || n < 0 || n > 15) return "x";
        return n.toString(16);
    }).join("");
}

function decodeHashGrades() {
    const m = location.hash.match(/g=([0-9a-fx]{12})/i);
    if (!m) return null;
    const code = m[1].toLowerCase();
    const result = {};
    for (let i = 0; i < 12; i++) {
        const c = code[i];
        if (c === "x") continue;
        const n = parseInt(c, 16);
        if (!isNaN(n) && n >= 0 && n <= 15) result[FIELD_ORDER[i]] = String(n);
    }
    return Object.keys(result).length ? result : null;
}

function shareLink() {
    const url = `${location.origin}${location.pathname}#g=${encodeHashGrades()}`;
    const fallback = () => {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); showToast("Link kopiert"); } catch { showToast("Konnte Link nicht kopieren"); }
        document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => showToast("Link kopiert"), fallback);
    } else {
        fallback();
    }
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("toast--visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("toast--visible"), 2200);
}

function updateTooltip(input) {
    const v = parseInt(input.value, 10);
    const wrap = input.parentElement;
    const label = wrap.querySelector(".grade-label");
    if (!isNaN(v) && v >= 0 && v <= 15) {
        input.title = GRADE_NAMES[v];
        if (label) label.textContent = "Note " + GRADE_ABBREV[v];
        wrap.classList.add("has-label");
    } else {
        input.removeAttribute("title");
        if (label) label.textContent = "";
        wrap.classList.remove("has-label");
    }
}

function updateAllTooltips() {
    document.querySelectorAll('input[type="number"]').forEach(updateTooltip);
}
