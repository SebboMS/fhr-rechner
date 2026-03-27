window.onload = function() {
    let inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener("input", function() {
            calculate();
        });
    });
}

function calculate() {
    document.getElementById("resultArea").style.display = 'block';
    if (validateGrades()) {
        highlightMandatoryGrades();
        const LKGrades = collectLKGrades();
        const GKGrades = collectGKGrades();
        const total = calculateTotalPoints(LKGrades, GKGrades);
        displayResults(total, GKGrades, LKGrades);
        highlightDeficits();
    }
}

function resetForm() {
    document.getElementById("resultArea").style.display = 'none';    
    const form = document.getElementById("gradeForm");
    form.reset();
    setBackgroundColor(document.querySelectorAll('input[type="number"]'), 'white');
}

function highlightMandatoryGrades(){
    setBackgroundColor(document.querySelectorAll('input[type="number"]'), 'white');
    setBackgroundColor([
        document.getElementsByName("englishSem3")[0],
        document.getElementsByName("englishSem4")[0],
        document.getElementsByName("mathSem3")[0],
        document.getElementsByName("mathSem4")[0],
        document.getElementsByName("biologySem3")[0],
        document.getElementsByName("biologySem4")[0]
    ], "yellow");
}

function collectLKGrades() {
    return [
        getBetterGermanGrade(), 
        parseInt(document.getElementsByName("biologySem3")[0].value),
        parseInt(document.getElementsByName("biologySem4")[0].value)
    ];
}

function collectGKGrades() {
    return [
        getBestGKGrade(),
        parseInt(document.getElementsByName("mathSem3")[0].value),
        parseInt(document.getElementsByName("mathSem4")[0].value),
        parseInt(document.getElementsByName("englishSem3")[0].value),
        parseInt(document.getElementsByName("englishSem4")[0].value)
    ];
}

function calculateTotalPoints(LKGrades, GKGrades) {
    const LKTotal = LKGrades.reduce((total, current) => total + current * 3, 0);
    const GKTotal = GKGrades.reduce((total, current) => total + current * 2, 0);
    return LKTotal + GKTotal;
}

function displayResults(total, GKGrades, LKGrades) {
    if (!checkDeficits(GKGrades, LKGrades)) {
        updateResultArea('Es liegen zu viele <span class="highlight">Defizite</span> vor.');
    } else if (total < 95) {
        updateResultArea('Die <span class="highlight">Gesamtpunktzahl</span> ist mit <span class="highlight"> ' + total + ' Punkten</span> zu niedrig.');
    } else {
        var schnitt = (323 - total) / 57;
        if (schnitt < 1) { schnitt = 1; }
        updateResultArea(`Die Gesamtpunktzahl beträgt <span class="highlight">${total}</span> Punkte. Der errechnete FHR-Schnitt liegt bei <span class="highlight">${schnitt.toFixed(1)}</span>.`);
    }    
}

function setBackgroundColor(elements, color) {
    elements.forEach(element => {
        element.style.backgroundColor = color;
    });
}

function updateResultArea(html) {
    document.getElementById("resultArea").innerHTML = html;
}

function getBetterGermanGrade() {
    var sem3Grade = parseInt(document.getElementsByName("germanSem3")[0].value);
    var sem4Grade = parseInt(document.getElementsByName("germanSem4")[0].value);

    // Ermittle die bessere Note
    var betterGrade = Math.max(sem3Grade, sem4Grade);

    // Markiere das entsprechende Textfeld
    if (betterGrade === sem3Grade) {
        document.getElementsByName("germanSem3")[0].style.backgroundColor = "yellow";
        document.getElementsByName("germanSem4")[0].style.backgroundColor = ""; // Entferne die Markierung vom anderen Textfeld
    } else {
        document.getElementsByName("germanSem4")[0].style.backgroundColor = "yellow";
        document.getElementsByName("germanSem3")[0].style.backgroundColor = ""; // Entferne die Markierung vom anderen Textfeld
    }

    return betterGrade;        
}

function getBestGKGrade(){
    var GKs = document.querySelectorAll(".GK");
    var max = -Infinity;
    var bestInput = null;
    
    GKs.forEach(function(input) {
        var value = parseInt(input.value);
        if (!isNaN(value) && value > max) {
            max = value;
            bestInput = input;
        }
    })
    bestInput.style.backgroundColor="yellow";
    return max;
}
 
function checkDeficits(GK, LK) {
    var LKdef = 0;
    var GKdef = 0;

    for (var i = 0; i < LK.length; i++) {
        if (LK[i] <= 4) {
            LKdef++;
        }
    }
    for (var j = 0; j < GK.length; j++) {
        if (GK[j] <= 4) {
            GKdef++;
        }
    }

    // Überprüfe, ob die Bedingungen erfüllt sind
    var isEligible = (LKdef <= 1) && (GKdef <= 2);

    // Gib das Ergebnis aus und gebe es zurück
    // alert("Defizite LK: " + LKdef + " / Defizite GK: " + GKdef);
    return isEligible;
}

function checkPoints(GK, LK) {
    var LKsum = 0;

    for (var i = 0; i < LK.length; i++) {
        LKsum += LK[i];
    }
    if (LKsum >= 15) { return true; } else { return false; }
}

function validateGrades() {
    var inputs = document.querySelectorAll('input[type="number"]');
    var hasZero = false;

    for (var i = 0; i < inputs.length; i++) {
        inputs[i].style.backgroundColor = ""; 
        var value = parseInt(inputs[i].value);

        // Überprüfen, ob ein Wert eingegeben wurde
        if (isNaN(value)) {
            updateResultArea('Bitte geben Sie für alle Fächer Noten zwischen <span class="highlight">0</span> und <span class="highlight">15</span> ein.');
            return false;
        }

        // Überprüfen, ob der Wert zwischen 0 und 15 liegt
        if (value < 0 || value > 15) {
            document.getElementById("resultArea").innerHTML = 'Die Noten müssen zwischen <span class="highlight">0</span> und <span class="highlight">15</span> liegen.';
            return false;
        }

        // Überprüfen, ob ein Wert = 0 ist
        if (value == 0) {
            inputs[i].style.backgroundColor = "#ffcccc";
            hasZero = true;
        }
    }

    if (hasZero) {
        updateResultArea('Mindestens ein Kurs wurde mit <span class="highlight">0 Punkten</span> abgeschlossen.');
        return false;
    }
    return true; // Rückgabe, dass alle Werte gültig sind
}

function highlightDeficits() {
    var inputs = document.querySelectorAll('input[type="number"]');

    inputs.forEach(input => {
        var value = parseInt(input.value);
        // Falls die Note zwischen 1 und 4 liegt, wird das Eingabefeld orange eingefärbt
        if (value >= 1 && value <= 4) {
            input.style.backgroundColor = "#ffcc80"; // helles Orange
        }
    })
}