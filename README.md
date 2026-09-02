# Fachhochschulreife-Rechner

Prüft, ob der **schulische Teil der Fachhochschulreife** am **Weiterbildungskolleg** erreicht ist,
und berechnet die Durchschnittsnote — aus den Kursnoten der Semester 3 und 4.

**Live:** https://sebboms.github.io/fhr-rechner/

> **Die Ergebnisse sind nicht verbindlich.** Der Rechner ersetzt keine Beratung durch
> Semesterleitung oder Oberstufenkoordination.

Der schulische Teil allein ist noch nicht die Fachhochschulreife. Dazu kommt der
**berufsbezogene Teil** — abgeschlossene Berufsausbildung oder einjähriges gelenktes Praktikum;
das Zeugnis über die volle Fachhochschulreife stellt die Bezirksregierung aus (VV 61.1.2).

---

## Wichtig für andere Schulen

Die **Fächerbelegung ist fest auf das WBK Münster zugeschnitten** und steht so im Code:

| Bereich | Fächer (je Semester 3 und 4) |
|---|---|
| Leistungskurse | Biologie, Deutsch |
| Grundkurse, immer angerechnet | Mathematik, Englisch |
| Grundkurse, bestes Ergebnis zählt | Kunst, Geschichte |

Wer den Rechner an einer anderen Schule einsetzen will, muss diese Belegung anpassen — die
Rechenregeln darunter folgen der APO-WbK (Stand: Abgleich vom 02.09.2026, § 61 und Anlage 9)
und gelten für den Bildungsgang **Abendgymnasium**. Für den Bildungsgang **Kolleg** gilt
§ 61 Abs. 3.

## Rechenregeln (§ 61 Abs. 2)

Angerechnet werden **acht Semesterergebnisse**, drei aus den Leistungskursfächern **dreifach**,
die übrigen fünf **zweifach** (Abs. 2 Nr. 4):

| | angerechnet | Wertung |
|---|---|---|
| Leistungskurse | Biologie **S3 + S4**, Deutsch: die **bessere** der beiden Noten → 3 Ergebnisse | ×3 |
| Grundkurse | Mathematik **S3 + S4**, Englisch **S3 + S4**, dazu die **beste** Note aus Kunst/Geschichte → 5 Ergebnisse | ×2 |

Damit sind 3 × 3 + 5 × 2 = **19 Wertungen** möglich, also höchstens 285 Punkte.

**Bedingungen:**

| Bedingung | Fundstelle |
|---|---|
| in den drei angerechneten LK-Ergebnissen zusammen mindestens **15 Punkte** einfacher Wertung (= 45 in dreifacher) | Abs. 2 Nr. 1 |
| höchstens **1 Defizit** unter den drei LK-Ergebnissen (zwei von drei ≥ 5 Punkte) | Abs. 2 Nr. 3 |
| höchstens **2 Defizite** unter den fünf GK-Ergebnissen (drei von fünf ≥ 5 Punkte) | Abs. 2 Nr. 3 |
| Gesamtpunktzahl mindestens **95** | Anlage 9 |

**Defizit** = Ergebnis mit 4 Punkten oder weniger.

**Durchschnittsnote** nach **Anlage 9**:

```
Note = 5⅔ − Gesamtpunkte / 57
```

Das Ergebnis wird auf eine Nachkommastelle **abgeschnitten, nicht gerundet** — § 61 Abs. 5 sagt
das ausdrücklich („es wird nicht gerundet"). Daher die Bänder der Tabelle: 285–261 = 1,0,
260–255 = 1,1, …, 95 = 4,0. Bester Wert ist 1,0.

## Zeitpunkt des Antrags

Der Regelfall ist der **Antrag nach dem ersten Jahr der Qualifikationsphase**, also nach S4 —
dafür ist dieser Rechner gebaut. Wird der Antrag erst im fünften oder sechsten Semester
gestellt, müssen die Bedingungen durch Kurse **zweier aufeinanderfolgender Semester** erfüllt
sein (§ 61 Abs. 1); dann sind statt S3/S4 entsprechend S4/S5 einzugeben.

## Funktionen

- Notenstufe direkt unter jedem Feld
- Farbige Markierung: angerechnete Ergebnisse, Defizite, Nullen
- Aufschlüsselung der Punkte nach Fächern
- Hinweis, wie viele Punkte bis zur nächstbesseren Note fehlen
- **Teilen:** erzeugt einen Link, der die eingegebenen Noten enthält
- Druckansicht

## Datenschutz

Es gibt **kein Backend**. Alle Eingaben bleiben im Browser (`localStorage`) und werden nirgends
übertragen. Der Teilen-Link kodiert die Noten im URL-Fragment (`#g=…`) — er wird nicht an den
Server gesendet, sollte aber nicht unbedacht weitergegeben werden, da er die Noten enthält.

## Aufbau & Anpassen

Drei statische Dateien, kein Build-Schritt, keine Abhängigkeiten:

| Datei | Inhalt |
|---|---|
| `index.html` | Fächertabelle — hier stehen die Fächer und Eingabefelder |
| `script.js` | Auswahl der angerechneten Kurse, Bedingungen, Note, Teilen-Link |
| `styles.css` | Design, Hell-/Dunkelmodus, Druckansicht |

Zum Ausprobieren genügt es, `index.html` im Browser zu öffnen.

Beim Anpassen an eine andere Fächerbelegung sind das die Stellen:

| Stelle | Bedeutung |
|---|---|
| `MANDATORY` (`script.js`) | Kurse, die immer angerechnet werden |
| `class="GK"` (`index.html`) | Kandidaten für „bestes Ergebnis zählt" — `pickBestGK()` wählt daraus |
| `pickBetterGerman()` | LK-Fach, von dem nur das bessere Semester zählt |
| `buildBreakdown()` | Gewichtung (×3 / ×2) und die Zeilen der Aufschlüsselung |
| `fhrNote()` | Notenformel nach Anlage 9 — bei anderer Kurszahl ändert sich der Teiler |
| `FIELD_ORDER`, `SUBJECT_LABEL` | Feldreihenfolge (auch für den Teilen-Link) und Beschriftungen |

## Veröffentlichen

Die Seite läuft über GitHub Pages aus dem `main`-Branch (Wurzelverzeichnis). Ein Push nach
`main` ist damit sofort live.

## Lizenz

[MIT](LICENSE) — Nutzung, Anpassung und Weitergabe sind ausdrücklich erwünscht, auch für
andere Schulen. Über eine kurze Rückmeldung freue ich mich: aufdemkamps@wbk.ms.de
