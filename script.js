const pages = [...document.querySelectorAll(".page")];
const navLinks = [...document.querySelectorAll(".nav-link")];
const journeySteps = [...document.querySelectorAll(".journey-step")];
const journeyProgress = document.querySelector(".journey-progress");
const journeyFill = document.querySelector("#journey-fill");
const menuToggle = document.querySelector("#menu-toggle");
const mainNav = document.querySelector("#main-nav");
const navActiveShape = document.querySelector("#nav-active-shape");
const musicToggle = document.querySelector("#music-toggle");
const musicVolume = document.querySelector("#music-volume");
const volumeControl = document.querySelector("#volume-control");
const volumeToggle = document.querySelector("#volume-toggle");
const volumePopover = document.querySelector("#volume-popover");
const musicVolumeValue = document.querySelector("#music-volume-value");
const backgroundMusic = document.querySelector("#background-music");
const owlAnimation = document.querySelector("#brand-owl-animation");
const accessibilityToggle = document.querySelector("#accessibility-toggle");
const accessibilityPanel = document.querySelector("#accessibility-panel");
const accessibilityClose = document.querySelector("#accessibility-close");
const accessibilityStatus = document.querySelector("#audio-status");
const audioContentChoice = document.querySelector("#audio-content-choice");
const audioPlaybackToggle = document.querySelector("[data-access-action='toggle-audio']");
const audioStopButton = document.querySelector("[data-access-action='stop-audio']");
const audioReplayButton = document.querySelector("[data-access-action='replay-audio']");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const calmStorageKey = "hobi-jadi-prestasi-calm-mode";
const musicStorageKey = "hobi-jadi-prestasi-music-enabled";
const volumeStorageKey = "hobi-jadi-prestasi-music-volume";
const textScaleStorageKey = "hobi-jadi-prestasi-text-scale";
const contrastStorageKey = "hobi-jadi-prestasi-contrast-mode";
const visitedStorageKey = "hobi-jadi-prestasi-visited-pages";
const achievementStorageKey = "hobi-jadi-prestasi-achievements";
const studentAnswersStorageKey = "hobi-jadi-prestasi-student-answers";
const blankWorkbookPdfPath = "Asets/File/LKPD_CETAK_HOBI_DAN_KATA_SAMBUNG.pdf";
const connectorVideoUrl = "https://www.youtube.com/results?search_query=kata+sambung+dan+tetapi+kelas+2";
const hobbyVideoUrl = "https://youtu.be/neH_6Qs9V_U?si=BX_Jux3OGu_DZ9om";
const cursorGarden = document.querySelector("#cursor-garden");
const smoothInputStates = [];
const answerStorageStatus = document.querySelector("#answer-storage-status");
let workbookAnswers = readWorkbookAnswers();

const accessibilityTextScales = { small: 0.9, normal: 1, large: 1.12 };
const accessibilityThemes = ["standard", "high", "minimal"];
let activeSpeechUtterance = null;
let lastSpeechRequest = null;

function showAnswerStorageStatus(message) {
  if (answerStorageStatus) answerStorageStatus.textContent = message;
}

function readLocalStorageValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    showAnswerStorageStatus("Penyimpanan browser tidak tersedia. Jawaban hanya bertahan selama halaman ini terbuka.");
    return null;
  }
}

function readWorkbookAnswers() {
  const storedAnswers = readLocalStorageValue(studentAnswersStorageKey);
  if (storedAnswers === null) return {};
  try {
    const parsedAnswers = JSON.parse(storedAnswers);
    if (parsedAnswers && typeof parsedAnswers === "object" && !Array.isArray(parsedAnswers)) {
      showAnswerStorageStatus("Jawaban tersimpan di browser ini saja. Tidak dikirim ke guru atau perangkat lain.");
      return parsedAnswers;
    }
  } catch {
    showAnswerStorageStatus("Data jawaban tersimpan tidak dapat dibaca. Jawaban baru tetap dapat dikerjakan.");
    return {};
  }
  showAnswerStorageStatus("Data jawaban tersimpan tidak sesuai format. Jawaban baru tetap dapat dikerjakan.");
  return {};
}

function saveWorkbookAnswers() {
  try {
    localStorage.setItem(studentAnswersStorageKey, JSON.stringify(workbookAnswers));
    showAnswerStorageStatus("Jawaban tersimpan di browser ini saja. Tidak dikirim ke guru atau perangkat lain.");
  } catch {
    showAnswerStorageStatus("Jawaban belum tersimpan. Penyimpanan browser tidak tersedia; jawaban tetap ada selama halaman ini terbuka.");
  }
}

function getValidStoredPreference(key, fallback, validValues) {
  const storedValue = readLocalStorageValue(key);
  if (storedValue === null) return fallback;
  return validValues.includes(storedValue) ? storedValue : fallback;
}

function applyTextScale(scaleName) {
  const normalizedScale = accessibilityTextScales[scaleName] ? scaleName : "normal";
  document.body.setAttribute("data-text-scale", normalizedScale);
  try {
    localStorage.setItem(textScaleStorageKey, normalizedScale);
  } catch {
    // Ukuran teks tetap berlaku selama halaman terbuka.
  }
}

function applyContrastTheme(themeName) {
  const normalizedTheme = accessibilityThemes.includes(themeName) ? themeName : "standard";
  document.body.setAttribute("data-contrast", normalizedTheme);
  document.querySelectorAll("[data-access-action]").forEach((button) => {
    const action = button.dataset.accessAction;
    const isThemeButton = action === "theme-standard" || action === "theme-high";
    if (!isThemeButton) return;
    const matches = action === `theme-${normalizedTheme}`;
    button.classList.toggle("is-selected", matches);
    button.setAttribute("aria-pressed", matches ? "true" : "false");
  });
  try { localStorage.setItem(contrastStorageKey, normalizedTheme); } catch {}
}

function setAccessibilityPanelOpen(isOpen) {
  if (!accessibilityPanel) return;
  accessibilityPanel.hidden = !isOpen;
  if (accessibilityToggle) accessibilityToggle.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) accessibilityClose?.focus();
  else accessibilityToggle?.focus();
}

function updateAudioStatus(message) {
  if (accessibilityStatus) accessibilityStatus.textContent = message;
}

function readCurrentPageInstruction() {
  const visiblePage = document.querySelector(".page.is-visible");
  const heading = visiblePage?.querySelector("h1, h2, h3")?.textContent?.trim();
  const summary = visiblePage?.querySelector(".section-heading p, .hero-subtitle, .hero-description")?.textContent?.trim();
  return [heading, summary].filter(Boolean).join(". ");
}

function collectVisibleText(selectors, root = document) {
  const result = [];
  selectors.forEach((selector) => {
    root.querySelectorAll(selector).forEach((element) => {
      const text = element.textContent?.replace(/\s+/g, " ").trim();
      if (text && text.length > 2) result.push(text);
    });
  });
  return result.filter((text, index, array) => array.indexOf(text) === index).join(". ").slice(0, 900);
}

function normalizeAnswerBlanks(text) {
  return text
    .replace(/_{3,}/g, ", titik-titik, ")
    .replace(/\s*,\s*,\s*/g, ", ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/,\s*([.!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function getVisiblePracticeStep() {
  const visibleSteps = [...practicePage.querySelectorAll(".activity-step")].filter((step) => {
    const bounds = step.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight;
  });
  if (visibleSteps.length === 0) return practicePage.querySelector(".activity-step[data-activity-step='1']");
  const targetY = window.innerHeight * 0.42;
  return visibleSteps.reduce((closest, step) => {
    const distance = Math.abs(step.getBoundingClientRect().top + step.getBoundingClientRect().height / 2 - targetY);
    return distance < closest.distance ? { step, distance } : closest;
  }, { step: visibleSteps[0], distance: Infinity }).step;
}

function getVisiblePracticeQuestion(step) {
  const rows = [...step.querySelectorAll(".mini-activity-row")].filter((row) => {
    const bounds = row.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight;
  });
  if (rows.length === 0) return step.querySelector(".mini-activity-row");
  const targetY = window.innerHeight * 0.42;
  return rows.reduce((closest, row) => {
    const bounds = row.getBoundingClientRect();
    const distance = Math.abs(bounds.top + bounds.height / 2 - targetY);
    return distance < closest.distance ? { row, distance } : closest;
  }, { row: rows[0], distance: Infinity }).row;
}

function getPracticeStepTitle(step) {
  const label = step?.querySelector(".step-label")?.cloneNode(true);
  label?.querySelectorAll("b").forEach((counter) => counter.remove());
  const rawTitle = label?.innerText?.replace(/\s+/g, " ").trim();
  if (!rawTitle) return "";
  const title = rawTitle
    .replace(/\s*[·•]\s*/g, ". ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("id")
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, character) => `${prefix}${character.toLocaleUpperCase("id")}`);
  return /[.!?]$/.test(title) ? title : `${title}.`;
}

function getPracticeQuestionCount(stepNumber) {
  if (stepNumber === 2) return activityTwoQuestions.length;
  if (stepNumber === 3) return connectorItems.length;
  if (stepNumber === 4) return sentenceBuildExercises.length;
  return 1;
}

function formatSpokenText(element) {
  return normalizeAnswerBlanks(element?.innerText?.replace(/\s+/g, " ").trim() || element?.textContent?.replace(/\s+/g, " ").trim() || "");
}

function joinSpeechParts(parts) {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .map((part) => /[.!?]$/.test(part) ? part : `${part}.`)
    .join(" ");
}

function speakPracticeInstructions(step) {
  const stepNumber = Number(step.dataset.activityStep);
  const parts = [getPracticeStepTitle(step)];
  const addText = (element) => {
    const text = formatSpokenText(element);
    if (text) parts.push(text);
  };
  if (stepNumber === 1) {
    addText(step.querySelector(".observation-instruction"));
    parts.push("Dengarkan cerita Hobi Menggambar Bima. Tekan tombol Dengarkan Cerita. Kamu dapat menjeda atau mengulang suara melalui panel Aksesibilitas. Setelah itu, jawab dua pertanyaan cerita.");
  } else if (stepNumber === 2) {
    addText(step.querySelector(".connector-instructions"));
    parts.push(`Aktivitas ini terdiri dari ${getPracticeQuestionCount(stepNumber)} kalimat.`);
  } else if (stepNumber === 3) {
    parts.push(`Lengkapi setiap kalimat dengan kata penghubung yang sesuai. Aktivitas ini terdiri dari ${getPracticeQuestionCount(stepNumber)} soal.`);
  } else if (stepNumber === 4) {
    addText(step.querySelector(".sentence-builder-instructions"));
    parts.push(`Aktivitas ini terdiri dari ${getPracticeQuestionCount(stepNumber)} soal.`);
  } else {
    step.querySelectorAll(".sentence-writing-part > h3, .sentence-writing-part > p:not(.feedback), .self-check legend, .speaking-activity > p, .speaking-activity > .assessment-note").forEach(addText);
    parts.push("Periksa kembali tulisanmu. Bacalah setiap pernyataan pada checklist, lalu centang kolom yang sesuai dengan hasil pemeriksaanmu. Bagian ini adalah pemeriksaan mandiri, bukan penilaian otomatis.");
  }
  speakAudioText("Instruksi", joinSpeechParts(parts));
}

function speakPracticeQuestion(step) {
  const stepNumber = Number(step.dataset.activityStep);
  const parts = [getPracticeStepTitle(step)];
  if (stepNumber === 1) {
    const image = step.querySelector(".observation-art img");
    if (image?.dataset.audioDescription) parts.push(image.dataset.audioDescription);
    parts.push(formatSpokenText(step.querySelector(".observation-instruction")));
    parts.push(formatSpokenText(step.querySelector(".observation-instruction")?.nextElementSibling));
    step.querySelectorAll("[data-observation-answer]").forEach((choice, index) => {
      parts.push(`Pilihan ${String.fromCharCode(65 + index)}. ${formatSpokenText(choice)}.`);
    });
    const feedback = formatSpokenText(step.querySelector("#observation-feedback"));
    if (feedback) parts.push(feedback);
    const listeningQuestions = [...step.querySelectorAll(".listening-question")];
    const listeningQuestion = listeningQuestions.find((question) => {
      const bounds = question.getBoundingClientRect();
      return bounds.bottom > 0 && bounds.top < window.innerHeight;
    });
    if (listeningQuestion) {
      const questionIndex = Number(listeningQuestion.dataset.listeningQuestion);
      parts.push(`Pertanyaan cerita ${questionIndex + 1}. ${formatSpokenText(listeningQuestion.querySelector("p"))}`);
      listeningQuestion.querySelectorAll("[data-listening-answer]").forEach((choice, index) => {
        parts.push(`Pilihan ${String.fromCharCode(65 + index)}. ${formatSpokenText(choice)}.`);
      });
      const listeningFeedback = formatSpokenText(listeningQuestion.querySelector(".listening-feedback"));
      if (listeningFeedback) parts.push(listeningFeedback);
    }
  } else if (stepNumber === 2) {
    parts.push(`Kalimat ${activeActivityTwoIndex + 1} dari ${activityTwoQuestions.length}.`);
    parts.push(formatSpokenText(activityTwoSentence));
    activityTwoChoices.forEach((choice, index) => {
      parts.push(`Pilihan ${String.fromCharCode(65 + index)}. ${formatSpokenText(choice)}.`);
    });
    const feedback = formatSpokenText(activityTwoFeedback);
    if (feedback) parts.push(feedback);
  } else if (stepNumber === 3) {
    const row = getVisiblePracticeQuestion(step);
    const index = [...step.querySelectorAll(".mini-activity-row")].indexOf(row);
    if (index >= 0) parts.push(`Soal ${index + 1} dari ${connectorItems.length}.`);
    parts.push(formatSpokenText(row?.querySelector("p")));
    row?.querySelectorAll(".choice-button").forEach((choice, choiceIndex) => {
      parts.push(`Pilihan ${String.fromCharCode(65 + choiceIndex)}. ${formatSpokenText(choice)}.`);
    });
    const feedback = formatSpokenText(row?.querySelector(".feedback"));
    if (feedback) parts.push(feedback);
  } else if (stepNumber === 4) {
    const row = getVisiblePracticeQuestion(step);
    const index = [...step.querySelectorAll(".mini-activity-row")].indexOf(row);
    if (index >= 0) parts.push(`Soal ${index + 1} dari ${sentenceBuildExercises.length}.`);
    parts.push(formatSpokenText(row?.querySelector(".sentence-build-heading")));
    parts.push(`Kata-kata. ${[...row.querySelectorAll(".sentence-word-bank button")].map(formatSpokenText).join(". ")}.`);
    const feedback = formatSpokenText(row?.querySelector(".sentence-build-feedback"));
    if (feedback) parts.push(feedback);
  } else {
    step.querySelectorAll(".sentence-writing-part h3, .sentence-writing-part p:not(.feedback), .self-check legend, .self-check label").forEach((element) => {
      parts.push(formatSpokenText(element));
    });
  }
  speakAudioText("Soal", joinSpeechParts(parts));
}

function speakAudioText(label, content, fallbackMessage = "Belajar dengan membaca teks di layar.") {
  if (!("speechSynthesis" in window)) {
    updateAudioStatus("Browser ini tidak mendukung suara otomatis. Silakan baca teks di layar.");
    return;
  }

  const speech = window.speechSynthesis;
  activeSpeechUtterance = null;
  if (speech.speaking || speech.pending || speech.paused) speech.cancel();
  lastSpeechRequest = null;
  audioPlaybackToggle.disabled = true;
  audioStopButton.disabled = true;
  audioPlaybackToggle.textContent = "Jeda";
  audioReplayButton.disabled = true;

  const text = (content || fallbackMessage).replace(/\s+/g, " ").trim();
  if (!text) {
    updateAudioStatus(fallbackMessage);
    return;
  }

  const voices = speech.getVoices();
  const indonesianVoice = voices.find((voice) => /^id(?:-|$)/i.test(voice.lang));
  if (voices.length > 0 && !indonesianVoice) {
    updateAudioStatus("Suara bahasa Indonesia tidak tersedia di browser ini. Silakan baca teks di layar.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.rate = 1;
  utterance.pitch = 1;
  if (indonesianVoice) utterance.voice = indonesianVoice;

  activeSpeechUtterance = utterance;
  lastSpeechRequest = { label, text };
  audioPlaybackToggle.disabled = false;
  audioStopButton.disabled = false;
  audioReplayButton.disabled = false;
  utterance.onstart = () => {
    if (activeSpeechUtterance !== utterance) return;
    audioPlaybackToggle.textContent = "Jeda";
    updateAudioStatus(`${label} sedang dibacakan.`);
  };
  utterance.onend = () => {
    if (activeSpeechUtterance !== utterance) return;
    activeSpeechUtterance = null;
    audioPlaybackToggle.disabled = true;
    audioStopButton.disabled = true;
    audioPlaybackToggle.textContent = "Jeda";
    updateAudioStatus(`${label} selesai dibacakan.`);
  };
  utterance.onerror = () => {
    if (activeSpeechUtterance !== utterance) return;
    activeSpeechUtterance = null;
    audioPlaybackToggle.disabled = true;
    audioStopButton.disabled = true;
    audioPlaybackToggle.textContent = "Jeda";
    updateAudioStatus("Audio gagal diputar. Silakan baca teks di layar.");
  };

  try {
    updateAudioStatus(`Menyiapkan bacaan ${label.toLowerCase()}.`);
    speech.speak(utterance);
  } catch {
    activeSpeechUtterance = null;
    lastSpeechRequest = null;
    audioPlaybackToggle.disabled = true;
    audioStopButton.disabled = true;
    audioReplayButton.disabled = true;
    updateAudioStatus("Audio gagal diputar. Silakan baca teks di layar.");
  }
}

function speakInstruction() {
  const page = document.querySelector(".page.is-visible");
  if (page?.id === "latihan") {
    speakPracticeInstructions(getVisiblePracticeStep());
    return;
  }
  if (page?.id === "kuis") {
    const title = page.querySelector(".section-heading h2");
    const instruction = page.querySelector(".section-heading p");
    speakAudioText("Instruksi kuis", joinSpeechParts([formatSpokenText(title), formatSpokenText(instruction), `Kuis ini terdiri dari ${questions.length} soal.`]));
    return;
  }
  const promptText = collectVisibleText([
    ".page.is-visible .hero-description",
    ".page.is-visible .section-heading p",
    ".page.is-visible .activity-step p",
    ".page.is-visible .sentence-builder-instructions",
    ".page.is-visible .assessment-note",
    ".page.is-visible .feedback"
  ], page || document);
  speakAudioText("Instruksi", promptText || readCurrentPageInstruction() || "Belajar Bahasa Indonesia kelas dua.");
}

function speakMaterial() {
  const page = document.querySelector(".page.is-visible");
  if (page?.id === "beranda") {
    const title = page.querySelector(".hero-title-accessible")?.innerText?.replace(/\s+/g, " ").trim();
    const description = page.querySelector(".hero-subtitle")?.innerText?.replace(/\s+/g, " ").trim();
    if (title && description) {
      speakAudioText("Materi", `${title}. ${description}`);
      return;
    }
  }
  const materialText = collectVisibleText([
    ".page.is-visible .lesson-card",
    ".page.is-visible .definition-card",
    ".page.is-visible .lesson-tip",
    ".page.is-visible .connector-compare"
  ], page || document);
  speakAudioText("Materi", materialText || readCurrentPageInstruction() || "Materi hobi dan kata sambung.");
}

function speakQuestions() {
  const page = document.querySelector(".page.is-visible");
  if (page?.id === "latihan") {
    speakPracticeQuestion(getVisiblePracticeStep());
    return;
  }
  if (page?.id === "kuis") {
    const question = questions[currentQuestion];
    const parts = [`Soal ${currentQuestion + 1} dari ${questions.length}.`, normalizeAnswerBlanks(question.prompt)];
    question.choices.forEach((choice, index) => {
      parts.push(`Pilihan ${String.fromCharCode(65 + index)}. ${normalizeAnswerBlanks(choice)}.`);
    });
    if (answered && quizFeedback.textContent.trim()) parts.push(formatSpokenText(quizFeedback));
    speakAudioText("Soal kuis", parts.join(" "));
    return;
  }
  const questionText = collectVisibleText([
    ".page.is-visible .quiz-question",
    ".page.is-visible .answer-option",
    ".page.is-visible .practice-box",
    ".page.is-visible .sentence-writing-pattern",
    ".page.is-visible .mini-activity-row"
  ], page || document);
  speakAudioText("Soal", questionText || "Soal belum tersedia pada halaman ini.");
}

function speakGuidance() {
  const page = document.querySelector(".page.is-visible");
  if (page?.id === "latihan") {
    const step = getVisiblePracticeStep();
    if (Number(step.dataset.activityStep) === 5) {
      const checklist = step.querySelector(".self-check");
      const statements = [...checklist.querySelectorAll("label")].map(formatSpokenText);
      speakAudioText("Petunjuk checklist", [
        "Periksa kembali tulisanmu. Bacalah setiap pernyataan pada checklist, lalu centang kolom yang sesuai dengan hasil pemeriksaanmu.",
        "Bagian ini adalah pemeriksaan mandiri, bukan penilaian otomatis.",
        ...statements
      ].join(" "));
      return;
    }
  }
  const guidanceText = collectVisibleText([
    ".page.is-visible .sentence-builder-instructions",
    ".page.is-visible .workbook-print-hint",
    ".page.is-visible .assessment-note",
    ".page.is-visible .hobby-swipe-hint"
  ]);
  speakAudioText("Petunjuk", guidanceText || "Petunjuk belajar akan muncul di sini.");
}

function toggleInstructionAudio() {
  if (!("speechSynthesis" in window) || !activeSpeechUtterance) return;
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    audioPlaybackToggle.textContent = "Jeda";
    updateAudioStatus("Audio pembelajaran dilanjutkan.");
  } else if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    audioPlaybackToggle.textContent = "Lanjutkan";
    updateAudioStatus("Audio pembelajaran dijeda.");
  }
}

function replayInstructionAudio() {
  if (!lastSpeechRequest) return;
  speakAudioText(lastSpeechRequest.label, lastSpeechRequest.text);
}

function stopInstructionAudio(message = "Audio pembelajaran dihentikan.") {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  activeSpeechUtterance = null;
  lastSpeechRequest = null;
  audioPlaybackToggle.disabled = true;
  audioStopButton.disabled = true;
  audioReplayButton.disabled = true;
  audioPlaybackToggle.textContent = "Jeda";
  updateAudioStatus(message);
}

function resetAccessibilitySettings() {
  applyTextScale("normal");
  applyContrastTheme("standard");
  updateAudioStatus("Pengaturan aksesibilitas dikembalikan ke nilai awal.");
}

const practicePage = document.querySelector("#latihan");
workbookAnswers.fields = workbookAnswers.fields && typeof workbookAnswers.fields === "object" ? workbookAnswers.fields : {};
practicePage.querySelectorAll("input[id], textarea[id], select[id]").forEach((field) => {
  const savedValue = workbookAnswers.fields[field.id];
  if (field.type === "checkbox") field.checked = savedValue === true;
  else if (typeof savedValue === "string") field.value = savedValue;
});
["input", "change"].forEach((eventName) => {
  practicePage.addEventListener(eventName, (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) || !field.id) return;
    workbookAnswers.fields[field.id] = field.type === "checkbox" ? field.checked : field.value;
    saveWorkbookAnswers();
    syncWorkbookPrintValues();
  });
});

function syncOwlAnimationMotion() {
  if (!owlAnimation) return;

  if (reducedMotion.matches) {
    owlAnimation.pause();
    try { owlAnimation.currentTime = 0; } catch { /* Video metadata may not be loaded yet. */ }
    return;
  }

  const playback = owlAnimation.play();
  if (playback) playback.catch(() => {});
}

syncOwlAnimationMotion();
if (typeof reducedMotion.addEventListener === "function") reducedMotion.addEventListener("change", syncOwlAnimationMotion);
else reducedMotion.addListener(syncOwlAnimationMotion);

function wrapLetterHoverText(element) {
  if (!element || element.dataset.letterWrapped === "true") return;

  const text = element.textContent;
  const fragment = document.createDocumentFragment();

  text.split(/(\s+)/).forEach((word) => {
    if (/^\s+$/.test(word)) {
      fragment.appendChild(document.createTextNode(word));
      return;
    }

    const wordSpan = document.createElement("span");
    wordSpan.className = "letter-word";
    [...word].forEach((character) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = character;
      wordSpan.appendChild(span);
    });
    fragment.appendChild(wordSpan);
  });

  element.textContent = "";
  element.appendChild(fragment);
  element.setAttribute("aria-label", text);
  element.dataset.letterWrapped = "true";
}

function initializeLetterHover() {
  document.querySelectorAll(".letter-hover").forEach((element) => wrapLetterHoverText(element));
}

initializeLetterHover();

function wrapTopDownLetters(element) {
  if (!element || element.dataset.topDownWrapped === "true") return;

  const textNodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  let characterIndex = 0;
  textNodes.forEach((textNode) => {
    const text = textNode.textContent;
    if (!text.trim()) return;

    const textWrapper = document.createElement("span");
    textWrapper.className = "top-down-text";
    text.split(/(\s+)/).forEach((part) => {
      if (/^\s+$/.test(part)) {
        textWrapper.appendChild(document.createTextNode(part));
        return;
      }

      const word = document.createElement("span");
      word.className = "top-down-word";
      [...part].forEach((character) => {
        const letter = document.createElement("span");
        letter.className = "top-down-char";
        letter.style.setProperty("--letter-index", characterIndex++);
        letter.textContent = character;
        word.appendChild(letter);
      });
      textWrapper.appendChild(word);
    });
    textNode.replaceWith(textWrapper);
  });

  element.setAttribute("aria-label", element.textContent.trim());
  element.dataset.topDownWrapped = "true";
}

function initializeTopDownLetters() {
  const topDownTargets = [...document.querySelectorAll(".top-down-letters")];
  const pointLedTargets = [...document.querySelectorAll(".point-led-label")];
  const targets = [...topDownTargets, ...pointLedTargets];
  topDownTargets.forEach(wrapTopDownLetters);

  const markVisible = (target) => {
    target.classList.add(target.matches(".point-led-label") ? "is-point-led-visible" : "is-top-down-visible");
  };

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    targets.forEach(markVisible);
    return;
  }

  const updatePointTravel = (text) => {
    const label = text.closest(".point-led-label");
    const point = label.querySelector(".eyebrow-dot");
    const gap = Number.parseFloat(getComputedStyle(label).columnGap) || 0;
    const travel = point.offsetWidth + text.offsetWidth + gap * 2;
    label.style.setProperty("--point-start-x", `${Math.max(0, travel)}px`);
  };

  pointLedTargets.forEach((target) => {
    const text = target.querySelector(".point-led-text");
    target.setAttribute("aria-label", text.textContent.trim());
    target.classList.add("is-point-led-ready");
    updatePointTravel(text);
  });

  const pointResizeObserver = "ResizeObserver" in window
    ? new ResizeObserver((entries) => entries.forEach((entry) => updatePointTravel(entry.target)))
    : null;
  pointLedTargets.forEach((target) => pointResizeObserver?.observe(target.querySelector(".point-led-text")));

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (entry.target.matches(".point-led-label")) {
        updatePointTravel(entry.target.querySelector(".point-led-text"));
      }
      markVisible(entry.target);
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  targets.forEach((target) => observer.observe(target));
}

initializeTopDownLetters();

function initializeSmoothInput(input) {
  if (input.closest(".smooth-input-shell")) return;
  const parent = input.parentNode;
  if (!parent) return;

  const shell = document.createElement("span");
  shell.className = "smooth-input-shell";
  const mirror = document.createElement("span");
  mirror.className = "smooth-input-mirror";
  mirror.setAttribute("aria-hidden", "true");
  const caret = document.createElement("span");
  caret.className = "smooth-input-caret";
  caret.setAttribute("aria-hidden", "true");

  try {
    parent.insertBefore(shell, input);
    shell.append(input, mirror, caret);
    const state = { input, shell, mirror, caret, x: 0, y: 0, placed: false, frame: 0, updateFrame: 0, typingTimer: 0 };
    smoothInputStates.push(state);

    function positionCaret(animate = true) {
      try {
        const value = input.value;
        const selectionStart = input.selectionStart;
        const selectionEnd = input.selectionEnd;
        const style = window.getComputedStyle(input);
        const number = (property) => Number.parseFloat(style[property]) || 0;
        const isTextarea = input.tagName === "TEXTAREA";
        const borderLeft = number("borderLeftWidth");
        const borderTop = number("borderTopWidth");
        const paddingLeft = number("paddingLeft");
        const paddingRight = number("paddingRight");
        const paddingTop = number("paddingTop");
        const fontSize = number("fontSize") || 16;
        const lineHeight = style.lineHeight === "normal" ? fontSize * 1.2 : number("lineHeight");

        Object.assign(mirror.style, {
          font: style.font,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontStyle: style.fontStyle,
          fontWeight: style.fontWeight,
          letterSpacing: style.letterSpacing,
          lineHeight: style.lineHeight,
          textAlign: style.textAlign,
          textIndent: style.textIndent,
          textTransform: style.textTransform,
          direction: style.direction,
          whiteSpace: isTextarea ? "pre-wrap" : "pre",
          overflowWrap: isTextarea ? "break-word" : "normal",
          wordBreak: style.wordBreak,
          tabSize: style.tabSize,
          left: `${borderLeft + paddingLeft - input.scrollLeft}px`,
          top: `${borderTop + paddingTop - input.scrollTop}px`,
          width: isTextarea ? `${Math.max(0, input.clientWidth - paddingLeft - paddingRight)}px` : "max-content",
        });

        const marker = document.createElement("span");
        marker.className = "smooth-input-marker";
        marker.style.height = `${lineHeight || fontSize * 1.2}px`;
        const selected = selectionStart !== selectionEnd;
        mirror.replaceChildren(
          document.createTextNode(value.slice(0, selectionStart)),
          marker,
          document.createTextNode(value.slice(selectionEnd) || " "),
        );

        const shellRect = shell.getBoundingClientRect();
        const markerRect = marker.getBoundingClientRect();
        if (!shellRect.width || !markerRect.height || !Number.isFinite(markerRect.left) || !Number.isFinite(markerRect.top)) {
          input.classList.remove("smooth-caret-ready");
          shell.classList.remove("has-smooth-caret");
          return;
        }

        input.classList.add("smooth-caret-ready");
        shell.classList.add("has-smooth-caret");
        shell.classList.toggle("has-selection", selected);
        caret.style.height = `${lineHeight || fontSize * 1.2}px`;
        const nextX = markerRect.left - shellRect.left;
        const nextY = markerRect.top - shellRect.top;
        const shouldAnimate = animate && state.placed && !quietMode && !reducedMotion.matches;

        if (state.frame) cancelAnimationFrame(state.frame);
        if (!shouldAnimate) {
          state.x = nextX;
          state.y = nextY;
          caret.style.left = `${nextX}px`;
          caret.style.top = `${nextY}px`;
        } else {
          const fromX = state.x;
          const fromY = state.y;
          const startedAt = performance.now();
          const duration = 135;
          const animateFrame = (now) => {
            if (quietMode || reducedMotion.matches) {
              state.x = nextX;
              state.y = nextY;
              caret.style.left = `${nextX}px`;
              caret.style.top = `${nextY}px`;
              state.frame = 0;
              return;
            }
            const progress = Math.min((now - startedAt) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            state.x = fromX + (nextX - fromX) * eased;
            state.y = fromY + (nextY - fromY) * eased;
            caret.style.left = `${state.x}px`;
            caret.style.top = `${state.y}px`;
            if (progress < 1) state.frame = requestAnimationFrame(animateFrame);
            else state.frame = 0;
          };
          state.frame = requestAnimationFrame(animateFrame);
        }
        state.placed = true;
      } catch {
        input.classList.remove("smooth-caret-ready");
        shell.classList.remove("has-smooth-caret");
      }
    }

    function schedulePosition(animate = true) {
      if (state.updateFrame) cancelAnimationFrame(state.updateFrame);
      state.updateFrame = requestAnimationFrame(() => {
        state.updateFrame = 0;
        positionCaret(animate);
      });
    }
    state.schedulePosition = schedulePosition;

    input.addEventListener("focus", () => {
      shell.classList.add("is-focused");
      positionCaret(false);
    });
    input.addEventListener("blur", () => {
      shell.classList.remove("is-focused", "has-selection", "is-typing");
      if (state.frame) cancelAnimationFrame(state.frame);
      if (state.updateFrame) cancelAnimationFrame(state.updateFrame);
      state.frame = 0;
      state.updateFrame = 0;
      clearTimeout(state.typingTimer);
    });
    input.addEventListener("input", () => {
      shell.classList.add("is-typing");
      clearTimeout(state.typingTimer);
      state.typingTimer = window.setTimeout(() => shell.classList.remove("is-typing"), 190);
      schedulePosition(true);
    });
    ["click", "keyup", "select", "scroll", "pointerup", "compositionend"].forEach((eventName) => {
      input.addEventListener(eventName, () => schedulePosition(true));
    });
  } catch {
    input.classList.remove("smooth-caret-ready");
    if (shell.parentNode) {
      shell.parentNode.insertBefore(input, shell);
      shell.remove();
    }
  }
}

document.querySelectorAll(".smooth-input").forEach(initializeSmoothInput);
document.addEventListener("selectionchange", () => {
  smoothInputStates.forEach(({ input, shell, schedulePosition }) => {
    if (document.activeElement !== input) return;
    shell.classList.toggle("has-selection", input.selectionStart !== input.selectionEnd);
    schedulePosition(true);
  });
});

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    showAnswerStorageStatus("Penyimpanan browser tidak tersedia. Jawaban hanya bertahan selama halaman ini terbuka.");
    return [];
  }
}

function readAchievements() {
  try {
    return JSON.parse(localStorage.getItem(achievementStorageKey) || "{}") || {};
  } catch {
    showAnswerStorageStatus("Penyimpanan browser tidak tersedia. Jawaban hanya bertahan selama halaman ini terbuka.");
    return {};
  }
}

const journeyPageIds = ["hobi", "materi", "latihan", "kuis"];
let visitedPages = readStoredArray(visitedStorageKey).filter((page) => journeyPageIds.includes(page));
let achievements = readAchievements();
let quietMode = readLocalStorageValue(calmStorageKey) === "true";
let resumeMusicAfterQuiet = false;
let musicEnabledPreference = readLocalStorageValue(musicStorageKey) === "true";
const storedMusicVolume = readLocalStorageValue(volumeStorageKey);
const savedMusicVolume = storedMusicVolume === null ? 0.3 : Number(storedMusicVolume);
backgroundMusic.loop = true;
backgroundMusic.volume = Number.isFinite(savedMusicVolume) && savedMusicVolume >= 0 && savedMusicVolume <= 1 ? savedMusicVolume : 0.3;
musicVolume.value = String(backgroundMusic.volume);
function updateVolumeDisplay() {
  const volumePercent = Math.round(backgroundMusic.volume * 100);
  musicVolume.value = String(backgroundMusic.volume);
  musicVolume.style.setProperty("--volume-progress", `${volumePercent}%`);
  musicVolumeValue.value = `${volumePercent}%`;
  musicVolumeValue.textContent = `${volumePercent}%`;
}
updateVolumeDisplay();
if (musicEnabledPreference) musicToggle.title = "Musik terakhir dipilih ON. Tekan untuk memulai; musik tidak diputar otomatis.";
document.body.classList.toggle("calm-mode", quietMode);
document.querySelectorAll("[data-access-action='toggle-quiet-mode']").forEach((button) => {
  button.classList.toggle("is-selected", quietMode);
  button.setAttribute("aria-pressed", String(quietMode));
});
if (musicToggle) musicToggle.disabled = quietMode;

function updateJourney(pageId, recordVisit = true) {
  if (recordVisit && journeyPageIds.includes(pageId) && !visitedPages.includes(pageId)) {
    visitedPages.push(pageId);
    try {
      localStorage.setItem(visitedStorageKey, JSON.stringify(visitedPages));
    } catch {
      showAnswerStorageStatus("Kunjungan tahap tidak tersimpan. Progres kegiatan tetap dapat diperbarui selama halaman ini terbuka.");
    }
  }
  const completed = {
    hobby: Boolean(achievements.hobby),
    material: workbookAnswers.materialCheckCompleted === true,
    practice: [1, 2, 3, 4, 5].every((stepNumber) => completedActivities.has(stepNumber)),
    quiz: workbookAnswers.quizCompleted === true,
  };
  completed.finish = Object.values(completed).every(Boolean);
  const startedPages = {
    hobby: ["hobi"].some((page) => visitedPages.includes(page)),
    material: ["materi"].some((page) => visitedPages.includes(page)),
    practice: ["latihan"].some((page) => visitedPages.includes(page)),
    quiz: ["kuis"].some((page) => visitedPages.includes(page)),
  };
  journeySteps.forEach((step) => {
    const stepName = step.dataset.journeyStep;
    const isComplete = completed[stepName];
    const active = step.dataset.page === pageId && !isComplete;
    const inProgress = !isComplete && (stepName === "finish" ? false : startedPages[stepName]);
    const status = isComplete ? "Selesai" : inProgress ? "Sedang dipelajari" : "Belum dimulai";
    const statusLabel = step.querySelector(".journey-status");
    step.classList.toggle("is-current", active);
    step.classList.toggle("is-in-progress", inProgress);
    step.classList.toggle("is-complete", isComplete);
    if (statusLabel) statusLabel.textContent = stepName === "finish" && isComplete ? "Perjalanan selesai!" : status;
    if (step.dataset.page) {
      if (active) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
      step.setAttribute("aria-label", `${step.querySelector("b").textContent}, ${status.toLocaleLowerCase("id")}`);
    }
  });
  const completeCount = Object.values(completed).filter(Boolean).length;
  const percent = completeCount * 20;
  journeyProgress.setAttribute("aria-valuenow", String(percent));
  journeyProgress.setAttribute("aria-valuetext", `${percent}% selesai`);
  journeyFill.style.width = `${percent}%`;
  document.querySelector("#journey-progress-label").textContent = `${percent}% selesai`;
  const journeySummary = document.querySelector("#journey-summary");
  journeySummary.hidden = !completed.finish;
  journeySummary.textContent = completed.finish
    ? "Kamu sudah menjelajahi hobi, memahami kata sambung, menyelesaikan 5 aktivitas latihan, dan menuntaskan kuis. Lihat lencana yang kamu dapatkan!"
    : "";
}

function updateAchievements() {
  document.querySelectorAll("[data-achievement]").forEach((badge) => {
    const unlocked = Boolean(achievements[badge.dataset.achievement]);
    const labels = { hobby: "Penjelajah Hobi", practice: "Jago Kata Sambung", quiz: "Bintang Bahasa" };
    badge.classList.toggle("is-earned", unlocked);
    badge.textContent = labels[badge.dataset.achievement];
    badge.setAttribute("aria-label", `${labels[badge.dataset.achievement]}, ${unlocked ? "sudah didapatkan" : "belum didapatkan"}`);
  });
}

function earnAchievement(name) {
  if (achievements[name]) return;
  achievements[name] = true;
  try {
    localStorage.setItem(achievementStorageKey, JSON.stringify(achievements));
  } catch {
    showAnswerStorageStatus("Lencana berlaku selama halaman ini terbuka, tetapi tidak dapat disimpan di browser.");
  }
  updateAchievements();
  updateJourney(document.querySelector(".page.is-visible")?.id || "beranda");
}

let navIndicatorIndex = -1;
let navIndicatorResetTimer = 0;

function syncNavIndicator() {
  const activeLink = navLinks.find((link) => link.classList.contains("is-active"));
  if (!activeLink || getComputedStyle(mainNav).display === "none") return;

  const navRect = mainNav.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();
  const nextIndex = navLinks.indexOf(activeLink);
  const direction = navIndicatorIndex < 0 ? 0 : Math.sign(nextIndex - navIndicatorIndex);
  navActiveShape.style.setProperty("--nav-shape-x", `${linkRect.left - navRect.left + mainNav.scrollLeft}px`);
  navActiveShape.style.setProperty("--nav-shape-y", `${linkRect.top - navRect.top}px`);
  navActiveShape.style.width = `${linkRect.width}px`;
  navActiveShape.style.height = `${linkRect.height}px`;

  clearTimeout(navIndicatorResetTimer);
  navActiveShape.style.setProperty("--nav-shape-stretch", direction ? "1.07" : "1");
  requestAnimationFrame(() => navActiveShape.style.setProperty("--nav-shape-stretch", "1"));
  navIndicatorIndex = nextIndex;
  navActiveShape.classList.add("is-ready");
  navIndicatorResetTimer = window.setTimeout(() => navActiveShape.style.setProperty("--nav-shape-stretch", "1"), 220);
}

function showPage(pageId) {
  if (activeSpeechUtterance) stopInstructionAudio("Bacaan dihentikan karena halaman berubah.");
  if (pageId !== "hobi" && (hobbyRewardTimer || hobbyCameraAnimation)) finishHobbyReward();
  pages.forEach((page) => {
    const isCurrent = page.id === pageId;
    page.hidden = !isCurrent;
    page.classList.toggle("is-visible", isCurrent);
  });
  navLinks.forEach((link) => {
    const isCurrent = link.dataset.page === pageId;
    link.classList.toggle("is-active", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  syncNavIndicator();
  updateJourney(pageId);
  mainNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: quietMode || reducedMotion.matches ? "auto" : "smooth" });
}

navLinks.forEach((link) => link.addEventListener("click", () => showPage(link.dataset.page)));
window.addEventListener("resize", syncNavIndicator);
mainNav.addEventListener("scroll", syncNavIndicator, { passive: true });
requestAnimationFrame(syncNavIndicator);
document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => showPage(button.dataset.go)));
document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  showPage("beranda");
});

const materialCheckItems = [
  { answer: "dan" },
  { answer: "tetapi" },
];
const materialCheckAnswers = materialCheckItems.map((item, index) => {
  const answer = workbookAnswers.materialCheckAnswers?.[index];
  return answer === "dan" || answer === "tetapi" ? answer : null;
});
const materialCheckSummary = document.querySelector("#material-check-summary");
let materialCheckComplete = materialCheckItems.every((item, index) => materialCheckAnswers[index] === item.answer);
if (materialCheckComplete) workbookAnswers.materialCheckCompleted = true;
else delete workbookAnswers.materialCheckCompleted;

function updateMaterialCheckSummary() {
  const correctCount = materialCheckItems.filter((item, index) => materialCheckAnswers[index] === item.answer).length;
  materialCheckSummary.textContent = materialCheckComplete
    ? "Hebat! Kedua jawabanmu tepat. Tahap materi selesai."
    : `${correctCount} dari ${materialCheckItems.length} soal sudah tepat. Coba lagi sampai keduanya benar.`;
}

document.querySelectorAll(".material-check-question").forEach((question, index) => {
  const feedback = question.querySelector(".material-check-feedback");
  const buttons = [...question.querySelectorAll("[data-material-answer]")];
  const savedAnswer = materialCheckAnswers[index];
  if (savedAnswer) {
    const isCorrect = savedAnswer === materialCheckItems[index].answer;
    feedback.textContent = isCorrect ? "Benar! Kamu memilih kata sambung yang tepat." : "Belum tepat. Coba pikirkan apakah kedua bagian kalimat cocok atau berbeda.";
    feedback.className = `feedback material-check-feedback ${isCorrect ? "good" : "try-again"}`;
  }
  buttons.forEach((button) => {
    const isSelected = button.dataset.materialAnswer === savedAnswer;
    button.classList.toggle("is-correct", isSelected && savedAnswer === materialCheckItems[index].answer);
    button.classList.toggle("is-wrong", isSelected && savedAnswer !== materialCheckItems[index].answer);
    button.setAttribute("aria-pressed", String(isSelected));
    button.disabled = materialCheckComplete && savedAnswer === materialCheckItems[index].answer;
    button.addEventListener("click", () => {
      const answer = button.dataset.materialAnswer;
      materialCheckAnswers[index] = answer;
      workbookAnswers.materialCheckAnswers = [...materialCheckAnswers];
      buttons.forEach((choice) => {
        const selected = choice === button;
        choice.setAttribute("aria-pressed", String(selected));
        choice.classList.toggle("is-correct", selected && answer === materialCheckItems[index].answer);
        choice.classList.toggle("is-wrong", selected && answer !== materialCheckItems[index].answer);
      });
      const isCorrect = answer === materialCheckItems[index].answer;
      feedback.textContent = isCorrect ? "Benar! Kamu memilih kata sambung yang tepat." : "Belum tepat. Coba pikirkan apakah kedua bagian kalimat cocok atau berbeda.";
      feedback.className = `feedback material-check-feedback ${isCorrect ? "good" : "try-again"}`;
      materialCheckComplete = materialCheckItems.every((item, answerIndex) => materialCheckAnswers[answerIndex] === item.answer);
      if (materialCheckComplete) {
        workbookAnswers.materialCheckCompleted = true;
        document.querySelectorAll(".material-check-question [data-material-answer]").forEach((choice) => { choice.disabled = true; });
      }
      updateMaterialCheckSummary();
      saveWorkbookAnswers();
      updateJourney(document.querySelector(".page.is-visible")?.id || "beranda");
    });
  });
});
updateMaterialCheckSummary();

function resetMaterialCheck() {
  materialCheckAnswers.fill(null);
  materialCheckComplete = false;
  document.querySelectorAll(".material-check-question").forEach((question) => {
    question.querySelectorAll("[data-material-answer]").forEach((button) => {
      button.disabled = false;
      button.setAttribute("aria-pressed", "false");
      button.classList.remove("is-correct", "is-wrong");
    });
    const feedback = question.querySelector(".material-check-feedback");
    feedback.textContent = "";
    feedback.className = "feedback material-check-feedback";
  });
  materialCheckSummary.textContent = "Jawab kedua soal dengan tepat untuk menyelesaikan tahap materi.";
}

if (accessibilityToggle) {
  accessibilityToggle.addEventListener("click", () => {
    const isOpen = accessibilityPanel && accessibilityPanel.hidden;
    setAccessibilityPanelOpen(isOpen);
  });
}
if (accessibilityClose) {
  accessibilityClose.addEventListener("click", () => setAccessibilityPanelOpen(false));
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && accessibilityPanel && !accessibilityPanel.hidden) {
    setAccessibilityPanelOpen(false);
  }
});

document.querySelectorAll("[data-access-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.accessAction;
    if (action === "text-small") applyTextScale("small");
    if (action === "text-large") applyTextScale("large");
    if (action === "text-normal") applyTextScale("normal");
    if (action === "theme-standard") applyContrastTheme("standard");
    if (action === "theme-high") applyContrastTheme("high");
    if (action === "toggle-quiet-mode") {
      const nextMode = !quietMode;
      setQuietMode(nextMode, true);
      button.setAttribute("aria-pressed", String(nextMode));
      button.classList.toggle("is-selected", nextMode);
    }
    if (action === "read-selected") {
      const readers = {
        instructions: speakInstruction,
        material: speakMaterial,
        questions: speakQuestions,
        guidance: speakGuidance
      };
      readers[audioContentChoice.value]?.();
    }
    if (action === "toggle-audio") toggleInstructionAudio();
    if (action === "stop-audio") stopInstructionAudio();
    if (action === "replay-audio") replayInstructionAudio();
    if (action === "reset-settings") resetAccessibilitySettings();
  });
});

const savedTextScale = getValidStoredPreference(textScaleStorageKey, "normal", Object.keys(accessibilityTextScales));
const savedContrastTheme = getValidStoredPreference(contrastStorageKey, "standard", accessibilityThemes);
applyTextScale(savedTextScale);
applyContrastTheme(savedContrastTheme);

function updateMusicControl(isPlaying, unavailable = false) {
  musicEnabledPreference = isPlaying;
  musicToggle.classList.toggle("is-playing", isPlaying && !quietMode);
  musicToggle.classList.toggle("is-unavailable", unavailable);
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.setAttribute("aria-label", unavailable ? "Musik tidak tersedia" : isPlaying ? "Matikan musik" : "Nyalakan musik");
  musicToggle.title = unavailable ? "Backsound tidak tersedia." : isPlaying ? "Matikan backsound" : "Nyalakan backsound";
}

async function playBackgroundMusic() {
  if (quietMode) return;
  if (!backgroundMusic.paused) {
    updateMusicControl(true);
    return;
  }
  try {
    await backgroundMusic.play();
    updateMusicControl(true);
    try { localStorage.setItem(musicStorageKey, "true"); } catch { /* Musik tetap berjalan tanpa menyimpan preferensi. */ }
  } catch {
    updateMusicControl(false, true);
    try { localStorage.setItem(musicStorageKey, "false"); } catch { /* Status fallback tetap ditampilkan. */ }
  }
}

function pauseBackgroundMusic(savePreference = true) {
  backgroundMusic.pause();
  updateMusicControl(false);
  if (savePreference) {
    try { localStorage.setItem(musicStorageKey, "false"); } catch { /* Audio tetap berhenti tanpa penyimpanan. */ }
  }
}

musicToggle.addEventListener("click", () => {
  if (quietMode) return;
  if (backgroundMusic.paused) void playBackgroundMusic();
  else pauseBackgroundMusic();
});
function setVolumePopoverOpen(isOpen) {
  volumeControl.classList.toggle("is-open", isOpen);
  volumeToggle.setAttribute("aria-expanded", String(isOpen));
  volumePopover.setAttribute("aria-hidden", String(!isOpen));
  volumePopover.inert = !isOpen;
}

volumeToggle.addEventListener("click", () => {
  setVolumePopoverOpen(volumeToggle.getAttribute("aria-expanded") !== "true");
});
document.addEventListener("pointerdown", (event) => {
  if (!volumeControl.contains(event.target)) setVolumePopoverOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || volumeToggle.getAttribute("aria-expanded") !== "true") return;
  setVolumePopoverOpen(false);
  volumeToggle.focus();
});
document.querySelector("#start-learning").addEventListener("click", () => { void playBackgroundMusic(); });
musicVolume.addEventListener("input", () => {
  backgroundMusic.volume = Number(musicVolume.value);
  updateVolumeDisplay();
  try { localStorage.setItem(volumeStorageKey, musicVolume.value); } catch { /* Volume tetap berlaku sampai halaman ditutup. */ }
});
backgroundMusic.addEventListener("error", () => updateMusicControl(false, true));

function setQuietMode(nextQuietMode, fromPanel = false) {
  quietMode = Boolean(nextQuietMode);
  document.body.classList.toggle("calm-mode", quietMode);
  document.querySelectorAll("[data-access-action='toggle-quiet-mode']").forEach((button) => {
    button.classList.toggle("is-selected", quietMode);
    button.setAttribute("aria-pressed", String(quietMode));
  });
  try { localStorage.setItem(calmStorageKey, String(quietMode)); } catch { /* Mode tetap berjalan selama halaman terbuka. */ }
  if (quietMode) {
    if (hobbyRewardTimer || hobbyCameraAnimation) {
      finishHobbyReward();
      hobbyCards[activeHobbyIndex]?.querySelector(".hobby-card-appearance")?.classList.add("is-static-reward");
      hobbyRewardTimer = window.setTimeout(finishHobbyReward, 500);
    }
    resumeMusicAfterQuiet = !backgroundMusic.paused;
    if (resumeMusicAfterQuiet) pauseBackgroundMusic(false);
    if (musicToggle) musicToggle.disabled = true;
    if (cursorGarden) cursorGarden.replaceChildren();
    if (fromPanel) {
      updateAudioStatus("Mode Tenang aktif. Musik dihentikan; audio pembelajaran tetap dapat diputar.");
    }
  } else {
    if (musicToggle) musicToggle.disabled = false;
    if (resumeMusicAfterQuiet) void playBackgroundMusic();
    resumeMusicAfterQuiet = false;
    if (fromPanel) updateAudioStatus("Mode Tenang nonaktif. Musik dan audio pembelajaran dapat digunakan.");
  }
}

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) requestAnimationFrame(syncNavIndicator);
});

let lastCursorEffect = 0;
const cursorSymbols = ["✿", "✦", "★", "🦋"];
document.addEventListener("pointermove", (event) => {
  if (quietMode || reducedMotion.matches || window.matchMedia("(max-width: 700px)").matches || event.pointerType !== "mouse") return;
  const now = Date.now();
  if (now - lastCursorEffect < 420 || Math.random() > 0.24) return;
  lastCursorEffect = now;
  while (cursorGarden.childElementCount >= 10) cursorGarden.firstElementChild.remove();
  const spark = document.createElement("span");
  spark.className = "cursor-spark";
  spark.textContent = cursorSymbols[Math.floor(Math.random() * cursorSymbols.length)];
  spark.style.left = `${event.clientX}px`;
  spark.style.top = `${event.clientY}px`;
  cursorGarden.append(spark);
  window.setTimeout(() => spark.remove(), 850);
});

function getYouTubeId(url) {
  try {
    const parsed = new URL(url);
    if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(parsed.hostname) && parsed.hostname !== "youtu.be") return "";
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1).match(/^[\w-]{11}$/)?.[0] || "";
    if (parsed.pathname === "/watch") return parsed.searchParams.get("v")?.match(/^[\w-]{11}$/)?.[0] || "";
    return parsed.pathname.match(/^\/embed\/([\w-]{11})$/)?.[1] || "";
  } catch {
    return "";
  }
}

function showVideo(frame, videoId, title) {
  if (!videoId || !frame) return;
  const iframe = document.createElement("iframe");
  iframe.title = title;
  iframe.loading = "lazy";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allow = "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframe.allowFullscreen = true;
  iframe.setAttribute("aria-label", title);
  frame.append(iframe);

  const activateVideo = () => {
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    frame.classList.add("is-video-active");
  };

  frame.addEventListener("click", activateVideo, { once: true });
}

const hobbyVideoId = getYouTubeId(hobbyVideoUrl);
showVideo(document.querySelector("#hobby-video-frame"), hobbyVideoId, "Mural");
const connectorVideoId = getYouTubeId(connectorVideoUrl);
showVideo(document.querySelector("#connector-video-frame"), connectorVideoId, "Video kata sambung dan tetapi");
document.querySelector("#connector-video-link").href = connectorVideoUrl;

const hobbyList = [
  { id: "membaca", name: "Membaca", description: "Membaca membuat kita mengenal banyak cerita.", sentence: "Aku suka membaca dan menulis.", illustration: "Asets/Gambar/Kartu Hobi_Membaca.jpeg", illustrationAlt: "Ilustrasi anak sedang membaca" },
  { id: "menggambar", name: "Menggambar", description: "Kita dapat membuat gambar berwarna.", sentence: "Aku suka menggambar dan mewarnai.", illustration: "Asets/Gambar/Kartu Hobi_Menggambar.jpeg", illustrationAlt: "Ilustrasi anak sedang menggambar" },
  { id: "menulis", name: "Menulis", description: "Menulis membantu kita bercerita.", sentence: "Raka suka menulis dan membaca cerita.", illustration: "Asets/Gambar/Kartu Hobi_Menulis.jpeg", illustrationAlt: "Ilustrasi anak sedang menulis" },
  { id: "menyanyi", name: "Menyanyi", description: "Kita bernyanyi mengikuti irama.", sentence: "Rani suka menyanyi, tetapi malu tampil.", illustration: "Asets/Gambar/Kartu Hobi_Brernyanyi.jpeg", illustrationAlt: "Ilustrasi anak sedang menyanyi" },
  { id: "menari", name: "Menari", description: "Menari membuat tubuh bergerak.", sentence: "Lala suka menari dan bermain musik.", illustration: "Asets/Gambar/Kartu Hobi_Menari.jpeg", illustrationAlt: "Ilustrasi anak sedang menari" },
  { id: "sepak-bola", name: "Bermain Bola", description: "Bermain bola bisa dilakukan bersama teman.", sentence: "Aku ingin bermain bola, tetapi hujan.", illustration: "Asets/Gambar/Kartu Hobi_Bermain Bola.jpeg", illustrationAlt: "Ilustrasi anak sedang bermain bola" },
  { id: "bersepeda", name: "Bersepeda", description: "Bersepeda membuat kita bergerak.", sentence: "Tono suka bersepeda, tetapi hari ini hujan.", illustration: "Asets/Gambar/Kartu Hobi_Bermain Sepeda.jpeg", illustrationAlt: "Ilustrasi anak sedang bersepeda" },
  { id: "memasak", name: "Memasak", description: "Memasak dapat dilakukan bersama keluarga.", sentence: "Nia memasak dan membantu Ibu.", illustration: "Asets/Gambar/Kartu Hobi_Memasak.png", illustrationAlt: "Ilustrasi anak sedang memasak" },
  { id: "musik", name: "Bermain Musik", description: "Kita dapat bermain alat musik.", sentence: "Dito bermain musik, tetapi masih belajar.", illustration: "Asets/Gambar/Kartu Hobi_Bermain Musik.jpeg", illustrationAlt: "Ilustrasi anak sedang bermain musik" },
  { id: "berkebun", name: "Berkebun", description: "Berkebun membuat tanaman tumbuh subur.", sentence: "Sasa berkebun dan menyiram bunga.", illustration: "Asets/Gambar/Kartu Hobi_Bertanam.jpeg", illustrationAlt: "Ilustrasi anak sedang berkebun" },
  { id: "hewan", name: "Memelihara Hewan", description: "Kita belajar merawat hewan.", sentence: "Ari merawat kucing dan bermain dengannya.", illustration: "Asets/Gambar/Kartu Hobi_Memelihara Hewan.jpeg", illustrationAlt: "Ilustrasi anak sedang memelihara hewan" },
  { id: "puzzle", name: "Bermain Puzzle", description: "Puzzle melatih kita mencari pasangan gambar.", sentence: "Mira bermain puzzle, tetapi perlu waktu.", illustration: "Asets/Gambar/Kartu Hobi_Bermain Puzzle.jpeg", illustrationAlt: "Ilustrasi anak sedang bermain puzzle" },
];
const hobbyGrid = document.querySelector("#hobby-grid");
const hobbyViewport = document.querySelector("#hobby-carousel-viewport");
const hobbyPagination = document.querySelector("#hobby-pagination");
const hobbyCardCount = document.querySelector("#hobby-card-count");
const hobbyPrevious = document.querySelector("#hobby-previous");
const hobbyNext = document.querySelector("#hobby-next");
const hobbyCarouselStage = document.querySelector(".hobby-carousel-stage");
const hobbyPage = document.querySelector("#hobi");
const hobbyFormFeedback = document.querySelector("#hobby-form-feedback");
const customHobbiesKey = "hobi-jadi-prestasi-custom-hobbies";
const hobbyIllustration = "Asets/Gambar/Hobi_Anak.png";
const hobbyRewardOverlay = document.createElement("div");
hobbyRewardOverlay.className = "hobby-reward-overlay";
hobbyRewardOverlay.setAttribute("aria-hidden", "true");
document.body.append(hobbyRewardOverlay);
let customHobbies = [];
let hobbyItems = [];
let hobbyCards = [];
let activeHobbyIndex = 0;
let activeHobbyId = "";
let dragStartX = 0;
let dragCurrentX = 0;
let dragPointerId = null;
let draggingCard = null;
let hobbyAnimationTimer = 0;
let hobbyRewardTimer = 0;
let hobbyCameraAnimation = null;
const supportsCardTilt = window.matchMedia("(hover: hover) and (pointer: fine)");
try {
  const storedHobbies = JSON.parse(readLocalStorageValue(customHobbiesKey) || "[]");
  if (Array.isArray(storedHobbies)) {
    customHobbies = storedHobbies.filter((hobby) => typeof hobby === "string" || (hobby && typeof hobby.name === "string"))
      .map((hobby) => typeof hobby === "string" ? { name: hobby, description: "Hobi yang saya sukai." } : hobby);
  }
} catch {
  customHobbies = [];
  showAnswerStorageStatus("Data kartu hobi tersimpan tidak dapat dibaca. Kartu hobi baru tetap dapat dibuat.");
}

function hobbyTextWithoutEmoji(value) {
  return String(value || "").replace(/\p{Extended_Pictographic}/gu, "").replace(/[\uFE0E\uFE0F\u200D\u20E3]/g, "").trim();
}

function updateHobbyCarousel() {
  const itemCount = hobbyItems.length;
  hobbyCards.forEach((card, index) => {
    const stackPosition = (index - activeHobbyIndex + itemCount) % itemCount;
    const isActive = stackPosition === 0;
    card.dataset.stackPosition = String(Math.min(stackPosition, 3));
    card.setAttribute("aria-hidden", String(!isActive));
    card.setAttribute("aria-label", `${hobbyItems[index].name}, kartu ${index + 1} dari ${itemCount}`);
    card.inert = !isActive;
  });
  hobbyPagination.querySelectorAll("button").forEach((dot, index) => {
    const isActive = index === activeHobbyIndex;
    dot.setAttribute("aria-current", String(isActive));
    dot.classList.toggle("is-active", isActive);
  });
  hobbyCardCount.textContent = `${activeHobbyIndex + 1} dari ${itemCount} kartu`;
}

function setHobbyCardFlipped(card, isFlipped) {
  if (!card) return;
  card.classList.toggle("is-flipped", isFlipped);
  card.querySelector(".hobby-card-flipper").setAttribute("aria-pressed", String(isFlipped));
  card.querySelector(".hobby-card-front").setAttribute("aria-hidden", String(isFlipped));
  card.querySelector(".hobby-card-back").setAttribute("aria-hidden", String(!isFlipped));
}

function flipHobbyCard(card) {
  if (card !== hobbyCards[activeHobbyIndex]) return;
  setHobbyCardFlipped(card, !card.classList.contains("is-flipped"));
  earnAchievement("hobby");
}

function finishHobbyReward(restoreCamera = true) {
  clearTimeout(hobbyRewardTimer);
  if (hobbyCameraAnimation) {
    cancelAnimationFrame(hobbyCameraAnimation.frameId);
    if (restoreCamera) window.scrollTo(0, hobbyCameraAnimation.startScrollY);
    hobbyCameraAnimation = null;
  }
  document.documentElement.classList.remove("hobby-camera-active");
  hobbyRewardOverlay.classList.remove("is-visible");
  hobbyRewardOverlay.classList.remove("is-static-visible");
  hobbyCarouselStage.classList.remove("is-reward-front");
  hobbyPage.classList.remove("is-reward-front", "is-static-reward", "is-reward-returning");
  hobbyGrid.querySelectorAll(".hobby-card-appearance").forEach((appearance) => {
    appearance.classList.remove("is-pop-in", "is-static-reward", "is-reward-returning");
    ["--reward-x", "--reward-y", "--reward-scale"].forEach((property) => appearance.style.removeProperty(property));
    appearance.querySelectorAll(".hobby-card-sparkle").forEach((sparkle) => sparkle.remove());
  });
  hobbyRewardTimer = 0;
}

function startHobbyCameraRise(targetScrollY, appearance) {
  const camera = {
    startScrollY: window.scrollY,
    targetScrollY,
    startedAt: 0,
    frameId: 0,
    returning: false,
  };
  hobbyCameraAnimation = camera;
  document.documentElement.classList.add("hobby-camera-active");

  const animateCamera = (timestamp) => {
    if (hobbyCameraAnimation !== camera) return;
    if (!camera.startedAt) camera.startedAt = timestamp;
    const elapsed = timestamp - camera.startedAt;
    const riseDuration = 420;
    const focusDuration = 950;
    const returnDuration = 420;
    if (elapsed < riseDuration) {
      const progress = elapsed / riseDuration;
      const eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, camera.startScrollY + (camera.targetScrollY - camera.startScrollY) * eased);
    } else if (elapsed < riseDuration + focusDuration) {
      window.scrollTo(0, camera.targetScrollY);
    } else if (elapsed < riseDuration + focusDuration + returnDuration) {
      if (!camera.returning) {
        camera.returning = true;
        appearance.classList.add("is-reward-returning");
        hobbyPage.classList.add("is-reward-returning");
        hobbyRewardOverlay.classList.remove("is-visible");
      }
      const progress = (elapsed - riseDuration - focusDuration) / returnDuration;
      const eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, camera.targetScrollY + (camera.startScrollY - camera.targetScrollY) * eased);
    } else {
      window.scrollTo(0, camera.startScrollY);
      hobbyCameraAnimation = null;
      finishHobbyReward();
      return;
    }
    camera.frameId = requestAnimationFrame(animateCamera);
  };

  camera.frameId = requestAnimationFrame(animateCamera);
}

function cancelHobbyCameraForUserInput() {
  if (hobbyCameraAnimation) finishHobbyReward(false);
}

window.addEventListener("wheel", cancelHobbyCameraForUserInput, { passive: true });
window.addEventListener("touchstart", cancelHobbyCameraForUserInput, { passive: true });
window.addEventListener("keydown", cancelHobbyCameraForUserInput);

function showHobbyCard(index, recordVisit = true, movementDirection = 0) {
  if (!hobbyItems.length) return;
  const previousIndex = activeHobbyIndex;
  const nextIndex = (index + hobbyItems.length) % hobbyItems.length;
  if (nextIndex === previousIndex) return;
  const forwardDistance = (nextIndex - previousIndex + hobbyItems.length) % hobbyItems.length;
  const direction = movementDirection || (forwardDistance <= hobbyItems.length - forwardDistance ? 1 : -1);
  const outgoingCard = hobbyCards[previousIndex];
  finishHobbyReward();
  setHobbyCardFlipped(outgoingCard, false);
  setHobbyCardFlipped(hobbyCards[nextIndex], false);
  clearTimeout(hobbyAnimationTimer);
  hobbyCards.forEach((card) => card.classList.remove("is-leaving-next", "is-leaving-previous", "is-resetting"));
  if (!quietMode && !reducedMotion.matches && outgoingCard) {
    outgoingCard.classList.add(direction > 0 ? "is-leaving-next" : "is-leaving-previous");
  }
  activeHobbyIndex = nextIndex;
  activeHobbyId = hobbyItems[activeHobbyIndex].id;
  updateHobbyCarousel();
  if (outgoingCard?.classList.contains("is-leaving-next") || outgoingCard?.classList.contains("is-leaving-previous")) {
    hobbyAnimationTimer = window.setTimeout(() => {
      outgoingCard.classList.remove("is-leaving-next", "is-leaving-previous");
      outgoingCard.classList.add("is-resetting");
      requestAnimationFrame(() => requestAnimationFrame(() => outgoingCard.classList.remove("is-resetting")));
      hobbyAnimationTimer = 0;
    }, 380);
  }
  if (recordVisit) earnAchievement("hobby");
}

function renderHobbies(selectedId = activeHobbyId, animatedId = null, animationOrigin = null) {
  finishHobbyReward();
  hobbyGrid.replaceChildren();
  hobbyPagination.replaceChildren();
  hobbyItems = [
    ...hobbyList,
    ...customHobbies.map((hobby, index) => ({
      id: `custom-${index}`,
      name: hobby.name,
      description: hobby.description || "Hobi yang saya sukai.",
      sentence: `Aku suka ${hobby.name} dan terus berlatih.`,
      isCustom: true,
    })),
  ];

  hobbyCards = hobbyItems.map((hobby, index) => {
    const card = document.createElement("article");
    card.className = "hobby-card";
    card.dataset.hobby = hobby.id;
    card.setAttribute("role", "listitem");
    const appearance = document.createElement("div");
    appearance.className = "hobby-card-appearance";

    const flipper = document.createElement("div");
    flipper.className = "hobby-card-flipper";
    flipper.setAttribute("role", "button");
    flipper.setAttribute("tabindex", "0");
    flipper.setAttribute("aria-pressed", "false");
    flipper.setAttribute("aria-keyshortcuts", "Enter Space");
    const inner = document.createElement("div");
    inner.className = "hobby-card-inner";

    const front = document.createElement("div");
    front.className = "hobby-card-face hobby-card-front";
    front.setAttribute("aria-hidden", "false");

    const art = document.createElement("div");
    art.className = "hobby-card-art";
    const image = document.createElement("img");
    image.src = hobby.illustration || hobbyIllustration;
    image.alt = hobby.illustrationAlt || "Ilustrasi anak-anak melakukan beragam hobi";
    image.loading = index < 3 ? "eager" : "lazy";
    image.draggable = false;
    art.append(image);

    const frontContent = document.createElement("div");
    frontContent.className = "hobby-card-content";
    const title = document.createElement("h3");
    title.className = "hobby-name";
    title.textContent = hobbyTextWithoutEmoji(hobby.name) || "Hobi";
    frontContent.append(title);
    front.append(art, frontContent);

    const back = document.createElement("div");
    back.className = "hobby-card-face hobby-card-back";
    back.setAttribute("aria-hidden", "true");
    const tag = document.createElement("span");
    tag.className = "hobby-card-tag";
    tag.textContent = hobby.isCustom ? "HOBIKU SENDIRI" : "INFORMASI HOBI";
    const backTitle = document.createElement("h3");
    backTitle.className = "hobby-name";
    backTitle.textContent = hobbyTextWithoutEmoji(hobby.name) || "Hobi";
    const description = document.createElement("p");
    description.className = "hobby-description";
    description.textContent = hobbyTextWithoutEmoji(hobby.description);
    const sentence = document.createElement("p");
    sentence.className = "hobby-sentence";
    sentence.textContent = hobbyTextWithoutEmoji(hobby.sentence);
    back.append(tag, backTitle, description, sentence);
    inner.append(front, back);
    flipper.append(inner);

    flipper.addEventListener("click", () => flipHobbyCard(card));
    flipper.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      flipHobbyCard(card);
    });
    flipper.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || !supportsCardTilt.matches || reducedMotion.matches || quietMode || dragPointerId !== null || card !== hobbyCards[activeHobbyIndex] || card.classList.contains("is-dragging")) return;
      const bounds = card.getBoundingClientRect();
      const horizontal = Math.max(-1, Math.min(1, (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2)));
      const vertical = Math.max(-1, Math.min(1, (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2)));
      inner.style.setProperty("--hobby-tilt-x", `${-vertical * 5}deg`);
      inner.style.setProperty("--hobby-tilt-y", `${horizontal * 6}deg`);
      inner.style.setProperty("--hobby-glare-x", `${(horizontal + 1) * 50}%`);
      inner.style.setProperty("--hobby-glare-y", `${(vertical + 1) * 50}%`);
      card.classList.add("is-tilting");
    });
    flipper.addEventListener("pointerleave", () => {
      inner.style.setProperty("--hobby-tilt-x", "0deg");
      inner.style.setProperty("--hobby-tilt-y", "0deg");
      card.classList.remove("is-tilting");
    });
    appearance.append(flipper);

    if (hobby.isCustom) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-hobby hobby-card-remove";
      remove.textContent = "Hapus kartu";
      remove.setAttribute("aria-label", `Hapus kartu hobi ${hobbyTextWithoutEmoji(hobby.name) || "Hobi"}`);
      remove.addEventListener("click", () => {
        const customIndex = index - hobbyList.length;
        customHobbies.splice(customIndex, 1);
        try { localStorage.setItem(customHobbiesKey, JSON.stringify(customHobbies)); } catch { /* Kartu dihapus dari tampilan meski penyimpanan tidak tersedia. */ }
        const nextCustomIndex = Math.min(customIndex, customHobbies.length - 1);
        const nextId = nextCustomIndex >= 0 ? `custom-${nextCustomIndex}` : hobbyList[0].id;
        renderHobbies(nextId);
        document.querySelector("#custom-hobby").focus();
      });
      appearance.append(remove);
    }
    card.append(appearance);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hobby-pagination-dot";
    dot.setAttribute("aria-label", `Tampilkan kartu ${hobbyTextWithoutEmoji(hobby.name) || "Hobi"}`);
    dot.addEventListener("click", () => showHobbyCard(index));
    hobbyPagination.append(dot);
    hobbyGrid.append(card);
    return card;
  });

  const requestedIndex = hobbyItems.findIndex((hobby) => hobby.id === selectedId);
  activeHobbyIndex = requestedIndex >= 0 ? requestedIndex : 0;
  activeHobbyId = hobbyItems[activeHobbyIndex].id;
  updateHobbyCarousel();
  if (animatedId && requestedIndex >= 0) {
    const newCard = hobbyCards[activeHobbyIndex];
    const newAppearance = newCard?.querySelector(".hobby-card-appearance");
    let cameraTargetScrollY = null;
    if (!newAppearance) {
      hobbyRewardTimer = window.setTimeout(finishHobbyReward, 620);
    } else if (quietMode || reducedMotion.matches) {
      hobbyCarouselStage.classList.add("is-reward-front");
      hobbyPage.classList.add("is-reward-front", "is-static-reward");
      hobbyRewardOverlay.classList.add("is-static-visible");
      newAppearance.classList.add("is-static-reward");
      hobbyRewardTimer = window.setTimeout(finishHobbyReward, 500);
    } else {
      hobbyCarouselStage.classList.add("is-reward-front");
      hobbyPage.classList.add("is-reward-front");
      hobbyRewardOverlay.classList.add("is-visible");
      if (animationOrigin) {
        const cardBounds = newCard.getBoundingClientRect();
        const originCenterX = animationOrigin.left + animationOrigin.width / 2;
        const originCenterY = animationOrigin.top + animationOrigin.height / 2;
        const cardCenterX = cardBounds.left + cardBounds.width / 2;
        const cardCenterY = cardBounds.top + cardBounds.height / 2;
        if (animationOrigin.width > 0 && animationOrigin.height > 0 && cardBounds.width > 0 && cardBounds.height > 0) {
          newAppearance.style.setProperty("--reward-x", `${originCenterX - cardCenterX}px`);
          newAppearance.style.setProperty("--reward-y", `${originCenterY - cardCenterY}px`);
          newAppearance.style.setProperty("--reward-scale", String(Math.min(animationOrigin.width / cardBounds.width, animationOrigin.height / cardBounds.height, 0.5)));
          const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
          cameraTargetScrollY = Math.max(0, Math.min(maxScrollY, window.scrollY + cardCenterY - window.innerHeight * 0.46));
        }
      }
      newAppearance.classList.add("is-pop-in");
      ["one", "two", "three"].forEach((position) => {
        const sparkle = document.createElement("span");
        sparkle.className = `hobby-card-sparkle hobby-card-sparkle--${position}`;
        sparkle.setAttribute("aria-hidden", "true");
        newAppearance.append(sparkle);
      });
      if (cameraTargetScrollY !== null) startHobbyCameraRise(cameraTargetScrollY, newAppearance);
      else hobbyRewardTimer = window.setTimeout(finishHobbyReward, 620);
    }
  }
}

renderHobbies();
updateAchievements();
hobbyPrevious.addEventListener("click", () => showHobbyCard(activeHobbyIndex - 1));
hobbyNext.addEventListener("click", () => showHobbyCard(activeHobbyIndex + 1));
hobbyViewport.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showHobbyCard(activeHobbyIndex - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    showHobbyCard(activeHobbyIndex + 1);
  }
});
hobbyViewport.addEventListener("pointerdown", (event) => {
  const card = hobbyCards[activeHobbyIndex];
  if (!card || !card.contains(event.target) || !event.target.closest(".hobby-card-flipper") || event.target.closest(".hobby-card-remove") || (event.pointerType === "mouse" && event.button !== 0)) return;
  dragPointerId = event.pointerId;
  dragStartX = event.clientX;
  dragCurrentX = dragStartX;
  draggingCard = card;
  const inner = card.querySelector(".hobby-card-inner");
  inner.style.setProperty("--hobby-tilt-x", "0deg");
  inner.style.setProperty("--hobby-tilt-y", "0deg");
  card.classList.remove("is-tilting");
});
hobbyViewport.addEventListener("pointermove", (event) => {
  if (event.pointerId !== dragPointerId || !draggingCard) return;
  dragCurrentX = event.clientX;
  const offset = Math.max(-180, Math.min(180, dragCurrentX - dragStartX));
  if (Math.abs(offset) < 6 && !draggingCard.classList.contains("is-dragging")) return;
  if (!draggingCard.classList.contains("is-dragging")) {
    draggingCard.classList.add("is-dragging");
    hobbyViewport.classList.add("is-dragging");
    hobbyViewport.setPointerCapture(event.pointerId);
  }
  const threshold = Math.max(58, hobbyViewport.clientWidth * 0.18);
  const progress = Math.min(Math.abs(offset) / threshold, 1);
  const peekIndex = (activeHobbyIndex + (offset < 0 ? 1 : -1) + hobbyItems.length) % hobbyItems.length;
  const peekCard = hobbyCards[peekIndex];
  draggingCard.style.setProperty("--drag-x", `${offset}px`);
  draggingCard.style.setProperty("--drag-rotate", `${Math.max(-7, Math.min(7, offset / 17))}deg`);
  hobbyGrid.classList.add("is-dragging");
  if (peekCard) {
    hobbyCards.forEach((card) => card.classList.toggle("is-drag-peek", card === peekCard));
    peekCard.style.setProperty("--peek-opacity", String(.94 + progress * .06));
    peekCard.style.setProperty("--peek-scale", String(.95 + progress * .025));
    peekCard.style.setProperty("--peek-shift", `${progress * 9}px`);
    peekCard.style.setProperty("--peek-lift", `${progress * 7}px`);
  }
});
function finishHobbyDrag(event, allowSwipe = true) {
  if (event.pointerId !== dragPointerId || !draggingCard) return;
  const distance = dragCurrentX - dragStartX;
  const threshold = Math.max(58, hobbyViewport.clientWidth * 0.18);
  const direction = allowSwipe && Math.abs(distance) >= threshold ? (distance < 0 ? 1 : -1) : 0;
  draggingCard.classList.remove("is-dragging");
  draggingCard.style.removeProperty("--drag-x");
  draggingCard.style.removeProperty("--drag-rotate");
  const inner = draggingCard.querySelector(".hobby-card-inner");
  inner.style.setProperty("--hobby-tilt-x", "0deg");
  inner.style.setProperty("--hobby-tilt-y", "0deg");
  draggingCard.classList.remove("is-tilting");
  hobbyViewport.classList.remove("is-dragging");
  hobbyGrid.classList.remove("is-dragging");
  hobbyCards.forEach((card) => {
    card.classList.remove("is-drag-peek");
    ["--peek-opacity", "--peek-scale", "--peek-shift", "--peek-lift"].forEach((property) => card.style.removeProperty(property));
  });
  if (hobbyViewport.hasPointerCapture(event.pointerId)) hobbyViewport.releasePointerCapture(event.pointerId);
  dragPointerId = null;
  draggingCard = null;
  if (direction) showHobbyCard(activeHobbyIndex + direction, true, direction);
}
window.addEventListener("pointerup", (event) => finishHobbyDrag(event));
window.addEventListener("pointercancel", (event) => finishHobbyDrag(event, false));

document.querySelector("#add-hobby-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#custom-hobby");
  const descriptionInput = document.querySelector("#custom-hobby-description");
  const name = input.value.trim();
  if (name.length < 2) {
    hobbyFormFeedback.textContent = "Tulis nama hobi dengan sedikit lebih lengkap, ya.";
    hobbyFormFeedback.className = "feedback try-again";
    return;
  }
  if ([...hobbyList.map((hobby) => hobby.name), ...customHobbies.map((hobby) => hobby.name)].some((hobby) => hobby.toLocaleLowerCase("id") === name.toLocaleLowerCase("id"))) {
    hobbyFormFeedback.textContent = "Hobi itu sudah ada di kartu. Pilih kartunya, ya!";
    hobbyFormFeedback.className = "feedback try-again";
    return;
  }
  const submitButton = event.submitter instanceof HTMLElement ? event.submitter : event.currentTarget.querySelector('button[type="submit"]');
  const submitBounds = submitButton?.getBoundingClientRect();
  const animationOrigin = submitBounds ? {
    left: submitBounds.left,
    top: submitBounds.top,
    width: submitBounds.width,
    height: submitBounds.height,
  } : null;
  customHobbies.push({ name, description: descriptionInput.value.trim() || "Hobi yang saya sukai." });
  try { localStorage.setItem(customHobbiesKey, JSON.stringify(customHobbies)); } catch { /* Kartu tetap ditampilkan meski penyimpanan tidak tersedia. */ }
  const newHobbyId = `custom-${customHobbies.length - 1}`;
  renderHobbies(newHobbyId, newHobbyId, animationOrigin);
  input.value = "";
  descriptionInput.value = "";
  hobbyFormFeedback.textContent = `Kartu hobi ${name} berhasil dibuat!`;
  hobbyFormFeedback.className = "feedback good";
});

const completedActivities = new Set(
  Array.isArray(workbookAnswers.completedActivities)
    ? workbookAnswers.completedActivities.filter((step) => Number.isInteger(step) && step >= 1 && step <= 5)
    : [],
);
const activityProgressLabel = document.querySelector("#activity-progress-label");
const activityProgressFill = document.querySelector("#activity-progress-fill");
const activityProgress = document.querySelector(".activity-progress");
const listeningItems = [
  { answer: "menggambar dan mewarnai" },
  { answer: "juara dua" },
];
const listeningAnswers = listeningItems.map((item, index) => {
  const answer = workbookAnswers.listeningAnswers?.[index];
  const answerIsAvailable = [...document.querySelectorAll(`.listening-question[data-listening-question="${index}"] [data-listening-answer]`)]
    .some((button) => button.dataset.listeningAnswer === answer);
  return answerIsAvailable ? answer : null;
});
workbookAnswers.listeningAnswers = [...listeningAnswers];
const listeningSummary = document.querySelector("#listening-summary");
const hobbyStoryTitle = document.querySelector("#hobby-story-title").textContent.trim();
const hobbyStory = [...document.querySelectorAll("#hobby-story-text > p")]
  .map((paragraph) => paragraph.textContent.trim())
  .join("\n\n");

document.querySelector("#play-hobby-story").addEventListener("click", () => {
  speakAudioText(hobbyStoryTitle, hobbyStory);
});

function updateListeningActivity() {
  document.querySelectorAll(".listening-question").forEach((question, index) => {
    const answer = listeningAnswers[index];
    const isCorrect = answer === listeningItems[index].answer;
    const feedback = question.querySelector(".listening-feedback");
    const buttons = [...question.querySelectorAll("[data-listening-answer]")];
    buttons.forEach((button) => {
      const selected = button.dataset.listeningAnswer === answer;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("is-correct", selected && isCorrect);
      button.classList.toggle("is-wrong", selected && !isCorrect);
      button.disabled = listeningItems.every((item, answerIndex) => listeningAnswers[answerIndex] === item.answer);
    });
    feedback.textContent = answer
      ? isCorrect
        ? index === 0 ? "Benar! Bima suka menggambar dan mewarnai gambarnya." : "Benar! Bima mendapat juara dua dalam lomba menggambar."
        : "Belum tepat. Dengarkan cerita sekali lagi, lalu coba pilih jawaban yang sesuai."
      : "";
    feedback.className = `feedback listening-feedback${answer ? (isCorrect ? " good" : " try-again") : ""}`;
  });
  const correctCount = listeningItems.filter((item, index) => listeningAnswers[index] === item.answer).length;
  const allCorrect = correctCount === listeningItems.length;
  listeningSummary.textContent = allCorrect
    ? "Kedua jawaban cerita tepat. Sekarang pastikan jawaban gambarmu juga tepat."
    : `${correctCount} dari ${listeningItems.length} pertanyaan cerita sudah tepat. Kamu boleh mendengarkan ulang dan mencoba lagi.`;
  if (allCorrect && observationAnswer === "correct") completeActivityStep(1);
  else revokeActivityStep(1);
}

document.querySelectorAll(".listening-question").forEach((question, index) => {
  question.querySelectorAll("[data-listening-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      listeningAnswers[index] = button.dataset.listeningAnswer;
      workbookAnswers.listeningAnswers = [...listeningAnswers];
      updateListeningActivity();
      saveWorkbookAnswers();
    });
  });
});

function completeActivityStep(stepNumber) {
  if (completedActivities.has(stepNumber)) return;
  completedActivities.add(stepNumber);
  workbookAnswers.completedActivities = [...completedActivities];
  const step = document.querySelector(`[data-activity-step="${stepNumber}"]`);
  step.classList.add("is-complete");
  const label = step.querySelector(".step-label b");
  if (label) label.textContent = `${stepNumber} / 5 ✓`;
  step.classList.add("correct-pop");
  activityProgressLabel.textContent = `${completedActivities.size} / 5 tahap selesai`;
  activityProgress.setAttribute("aria-valuenow", String(completedActivities.size));
  activityProgressFill.style.width = `${completedActivities.size * 20}%`;
  if (completedActivities.size === 5) earnAchievement("practice");
  saveWorkbookAnswers();
  updateJourney(document.querySelector(".page.is-visible")?.id || "beranda");
}

function revokeActivityStep(stepNumber) {
  if (!completedActivities.delete(stepNumber)) return;
  workbookAnswers.completedActivities = [...completedActivities];
  const step = document.querySelector(`[data-activity-step="${stepNumber}"]`);
  step.classList.remove("is-complete", "correct-pop");
  const label = step.querySelector(".step-label b");
  if (label) label.textContent = `${stepNumber} / 5`;
  activityProgressLabel.textContent = `${completedActivities.size} / 5 tahap selesai`;
  activityProgress.setAttribute("aria-valuenow", String(completedActivities.size));
  activityProgressFill.style.width = `${completedActivities.size * 20}%`;
  saveWorkbookAnswers();
  updateJourney(document.querySelector(".page.is-visible")?.id || "beranda");
}

let observationAnswer = ["correct", "wrong"].includes(workbookAnswers.observationAnswer) ? workbookAnswers.observationAnswer : null;
const observationFeedback = document.querySelector("#observation-feedback");

function renderObservationAnswer() {
  document.querySelectorAll("[data-observation-answer]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.observationAnswer === observationAnswer);
  });
  if (!observationAnswer) return;
  const isCorrect = observationAnswer === "correct";
  observationFeedback.textContent = isCorrect ? "Benar! Anak pada gambar sedang menggambar." : "Belum tepat. Coba amati kembali gambar. Apa kegiatan yang sedang dilakukan anak?";
  observationFeedback.className = `feedback ${isCorrect ? "good" : "try-again"}`;
  updateListeningActivity();
}

document.querySelectorAll("[data-observation-answer]").forEach((button) => {
  button.addEventListener("click", () => {
    if (activeSpeechUtterance) stopInstructionAudio("Bacaan dihentikan karena jawaban berubah.");
    observationAnswer = button.dataset.observationAnswer;
    workbookAnswers.observationAnswer = observationAnswer;
    saveWorkbookAnswers();
    renderObservationAnswer();
    updateListeningActivity();
  });
});
renderObservationAnswer();
updateListeningActivity();

const activityTwoQuestions = [
  { sentence: "Aku suka membaca _____ menggambar.", answer: "dan" },
  { sentence: "Sita ingin bermain di luar, _____ hujan turun.", answer: "tetapi" },
  { sentence: "Rani suka menyanyi _____ menari.", answer: "dan" },
  { sentence: "Aku suka bermain bola, _____ aku tidak suka berlari.", answer: "tetapi" },
  { sentence: "Budi ingin bermain bola, _____ hari ini ia harus belajar.", answer: "tetapi" },
  { sentence: "Bima menggambar bunga _____ kupu-kupu.", answer: "dan" },
];
const activityTwoSentence = document.querySelector("#activity-two-sentence");
const activityTwoCount = document.querySelector("#connector-card-count");
const activityTwoStatus = document.querySelector("#activity-two-status");
const activityTwoFeedback = document.querySelector("#activity-two-feedback");
const activityTwoNext = document.querySelector("#activity-two-next");
const activityTwoSummary = document.querySelector("#activity-two-summary");
const activityTwoChoices = [...document.querySelectorAll("[data-connector-choice]")];
const activityTwoGroups = {
  dan: { sentences: [], list: document.querySelector("#activity-two-dan-list"), count: document.querySelector("#activity-two-dan-count") },
  tetapi: { sentences: [], list: document.querySelector("#activity-two-tetapi-list"), count: document.querySelector("#activity-two-tetapi-count") },
};
const activityTwoAnswers = activityTwoQuestions.map((question, index) => {
  const savedAnswer = workbookAnswers.activityTwoAnswers?.[index];
  return savedAnswer === "dan" || savedAnswer === "tetapi" ? savedAnswer : null;
});
let activeActivityTwoIndex = activityTwoAnswers.findIndex((answer, index) => answer !== activityTwoQuestions[index].answer);
if (activeActivityTwoIndex < 0) activeActivityTwoIndex = activityTwoQuestions.length - 1;

function addActivityTwoGroupedSentence(index) {
  const answer = activityTwoAnswers[index];
  if (!answer || answer !== activityTwoQuestions[index].answer) return;
  const group = activityTwoGroups[answer];
  const completedSentence = activityTwoQuestions[index].sentence.replace("_____", answer);
  group.list.querySelector(".connector-group-empty")?.remove();
  const groupedSentence = document.createElement("li");
  groupedSentence.textContent = completedSentence;
  group.list.append(groupedSentence);
  group.sentences.push(completedSentence);
  group.count.textContent = `${group.sentences.length} kalimat`;
}

function renderActivityTwoQuestion() {
  const question = activityTwoQuestions[activeActivityTwoIndex];
  activityTwoSentence.textContent = question.sentence;
  activityTwoCount.textContent = `KALIMAT ${activeActivityTwoIndex + 1}-${activityTwoQuestions.length}`;
  activityTwoStatus.textContent = "Belum dijawab";
  activityTwoStatus.className = "connector-card-status";
  activityTwoFeedback.textContent = "";
  activityTwoFeedback.className = "feedback connector-feedback";
  activityTwoNext.hidden = true;
  activityTwoChoices.forEach((choice) => {
    choice.disabled = false;
    choice.setAttribute("aria-pressed", "false");
    choice.classList.remove("is-correct", "is-wrong");
  });
  const previousAnswer = activityTwoAnswers[activeActivityTwoIndex];
  if (previousAnswer) {
    const selectedChoice = activityTwoChoices.find((choice) => choice.dataset.connectorChoice === previousAnswer);
    selectedChoice.setAttribute("aria-pressed", "true");
    selectedChoice.classList.add(previousAnswer === question.answer ? "is-correct" : "is-wrong");
    if (previousAnswer === question.answer) {
      activityTwoChoices.forEach((choice) => { choice.disabled = true; });
      activityTwoStatus.textContent = "Benar, kalimat sudah dikelompokkan.";
      activityTwoStatus.className = "connector-card-status is-correct";
      activityTwoFeedback.textContent = `Kalimat yang tepat adalah: “${question.sentence.replace("_____", previousAnswer)}”`;
      activityTwoFeedback.className = "feedback good connector-feedback";
      activityTwoNext.hidden = activeActivityTwoIndex === activityTwoQuestions.length - 1;
      if (activityTwoNext.hidden) completeActivityStep(2);
    } else {
      activityTwoStatus.textContent = "Perlu diperbaiki. Kamu bisa mencoba lagi.";
      activityTwoStatus.className = "connector-card-status is-needs-revision";
      activityTwoFeedback.textContent = "Coba lagi. Perhatikan apakah kedua bagian kalimat menunjukkan hal yang sama atau berbeda.";
      activityTwoFeedback.className = "feedback try-again connector-feedback";
    }
  }
}

activityTwoAnswers.forEach((answer, index) => {
  if (answer === activityTwoQuestions[index].answer) addActivityTwoGroupedSentence(index);
});
const initialGroupedCount = activityTwoGroups.dan.sentences.length + activityTwoGroups.tetapi.sentences.length;
activityTwoSummary.textContent = initialGroupedCount
  ? `${initialGroupedCount} dari ${activityTwoQuestions.length} kalimat sudah dikelompokkan dengan tepat.`
  : "Pilih DAN atau TETAPI untuk mulai mengelompokkan.";

activityTwoChoices.forEach((button) => {
  button.addEventListener("click", () => {
    if (activeSpeechUtterance) stopInstructionAudio("Bacaan dihentikan karena jawaban berubah.");
    const question = activityTwoQuestions[activeActivityTwoIndex];
    const selectedGroup = button.dataset.connectorChoice;
    const isCorrect = selectedGroup === question.answer;
    activityTwoAnswers[activeActivityTwoIndex] = selectedGroup;
    workbookAnswers.activityTwoAnswers = activityTwoAnswers;
    workbookAnswers.activityTwoIndex = activeActivityTwoIndex;
    saveWorkbookAnswers();
    activityTwoChoices.forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice === button));
      choice.classList.remove("is-correct", "is-wrong");
    });

    if (!isCorrect) {
      button.classList.add("is-wrong");
      activityTwoStatus.textContent = "Perlu diperbaiki. Kamu bisa mencoba lagi.";
      activityTwoStatus.className = "connector-card-status is-needs-revision";
      activityTwoFeedback.textContent = "Coba lagi. Perhatikan apakah kedua bagian kalimat menunjukkan hal yang sama atau berbeda.";
      activityTwoFeedback.className = "feedback try-again connector-feedback";
      return;
    }

    button.classList.add("is-correct");
    activityTwoChoices.forEach((choice) => { choice.disabled = true; });
    activityTwoStatus.textContent = "Benar, kalimat sudah dikelompokkan.";
    activityTwoStatus.className = "connector-card-status is-correct";
    const completedSentence = question.sentence.replace("_____", selectedGroup);
    activityTwoFeedback.textContent = selectedGroup === "dan"
      ? `Hebat! Kalimat yang tepat adalah: “${completedSentence}” Kata “dan” digunakan karena kedua kegiatan tidak bertentangan.`
      : `Hebat! Kalimat yang tepat adalah: “${completedSentence}” Kata “tetapi” digunakan karena kedua bagian kalimat menunjukkan perbedaan.`;
    activityTwoFeedback.className = "feedback good connector-feedback";

    addActivityTwoGroupedSentence(activeActivityTwoIndex);

    const groupedCount = activityTwoGroups.dan.sentences.length + activityTwoGroups.tetapi.sentences.length;
    activityTwoSummary.textContent = `${groupedCount} dari ${activityTwoQuestions.length} kalimat sudah dikelompokkan dengan tepat.`;
    if (activeActivityTwoIndex === activityTwoQuestions.length - 1) {
      activityTwoSummary.textContent = `Selesai! Kamu berhasil mengelompokkan ${groupedCount} dari ${activityTwoQuestions.length} kalimat dengan tepat.`;
      completeActivityStep(2);
    } else {
      activityTwoNext.textContent = "Kalimat berikutnya";
      activityTwoNext.hidden = false;
    }
  });
});

activityTwoNext.addEventListener("click", () => {
  if (activeSpeechUtterance) stopInstructionAudio("Bacaan dihentikan karena kalimat berubah.");
  activeActivityTwoIndex += 1;
  workbookAnswers.activityTwoIndex = activeActivityTwoIndex;
  saveWorkbookAnswers();
  renderActivityTwoQuestion();
  activityTwoChoices[0].focus();
});

renderActivityTwoQuestion();

const connectorItems = [
  {
    id: "singing-stage",
    sentence: "Aku suka menyanyi, _____ aku malu tampil di depan kelas.",
    answer: "tetapi",
    explanation: "Kata “tetapi” digunakan karena bagian pertama dan kedua menunjukkan keadaan yang berbeda.",
  },
  {
    id: "reading-drawing",
    sentence: "Rani suka membaca _____ menggambar.",
    answer: "dan",
    explanation: "Kata “dan” digunakan karena Rani melakukan dua kegiatan yang sama-sama disukai.",
  },
  {
    id: "playing-rain",
    sentence: "Budi ingin bermain bola, _____ hujan turun.",
    answer: "tetapi",
    explanation: "Kata “tetapi” digunakan karena keinginan Budi berbeda dengan keadaan yang terjadi.",
  },
];
const connectorActivity = document.querySelector("#connector-activity");
const connectorSummary = document.querySelector("#connector-summary");
const connectorCorrect = new Set();
const connectorAnswers = new Map(Object.entries(workbookAnswers.connectorAnswers || {}).filter(([id, word]) =>
  connectorItems.some((item) => item.id === id) && (word === "dan" || word === "tetapi")));
connectorItems.forEach((item) => {
  const row = document.createElement("div");
  row.className = "mini-activity-row";
  const text = document.createElement("p");
  text.textContent = item.sentence;
  const buttons = document.createElement("div");
  buttons.className = "choice-row";
  const feedback = document.createElement("p");
  feedback.className = "feedback";
  feedback.setAttribute("aria-live", "polite");
  ["dan", "tetapi"].forEach((word) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button small-choice";
    button.textContent = word.toLocaleUpperCase("id");
    button.addEventListener("click", () => {
      if (activeSpeechUtterance) stopInstructionAudio("Bacaan dihentikan karena jawaban berubah.");
      const isCorrect = word === item.answer;
      connectorAnswers.set(item.id, word);
      workbookAnswers.connectorAnswers = Object.fromEntries(connectorAnswers);
      saveWorkbookAnswers();
      buttons.querySelectorAll(".choice-button").forEach((choice) => choice.classList.remove("is-correct", "is-wrong"));
      button.classList.add(isCorrect ? "is-correct" : "is-wrong");
      if (isCorrect) {
        const completedSentence = item.sentence.replace("_____", word);
        feedback.textContent = `Hebat! ${item.explanation} Kalimat lengkap: “${completedSentence}”`;
        feedback.className = "feedback good";
        buttons.querySelectorAll(".choice-button").forEach((choice) => { choice.disabled = true; });
        connectorCorrect.add(item.id);
        if (connectorCorrect.size === connectorItems.length) {
          connectorSummary.textContent = "Latihan selesai! Kamu sudah mencoba melengkapi 3 kalimat.";
          connectorSummary.hidden = false;
          completeActivityStep(3);
        }
      } else {
        feedback.textContent = "Belum tepat. Coba perhatikan apakah kedua bagian kalimat menunjukkan kegiatan yang cocok atau ada perbedaan.";
        feedback.className = "feedback try-again";
      }
    });
    buttons.append(button);
  });
  row.append(text, buttons, feedback);
  connectorActivity.append(row);
  const savedChoice = connectorAnswers.get(item.id);
  if (savedChoice) {
    const selectedButton = [...buttons.querySelectorAll(".choice-button")].find((choice) => choice.textContent.toLocaleLowerCase("id") === savedChoice);
    const isCorrect = savedChoice === item.answer;
    selectedButton.classList.add(isCorrect ? "is-correct" : "is-wrong");
    feedback.textContent = isCorrect
      ? `Hebat! ${item.explanation} Kalimat lengkap: “${item.sentence.replace("_____", savedChoice)}”`
      : "Belum tepat. Coba perhatikan apakah kedua bagian kalimat menunjukkan kegiatan yang cocok atau ada perbedaan.";
    feedback.className = `feedback ${isCorrect ? "good" : "try-again"}`;
    if (isCorrect) {
      buttons.querySelectorAll(".choice-button").forEach((choice) => { choice.disabled = true; });
      connectorCorrect.add(item.id);
    }
  }
});
if (connectorCorrect.size) {
  connectorSummary.hidden = false;
  connectorSummary.textContent = `${connectorCorrect.size} dari ${connectorItems.length} kalimat sudah dilengkapi dengan tepat.`;
}
if (connectorCorrect.size === connectorItems.length) completeActivityStep(3);

const sentenceBuildExercises = [
  { expectedWords: ["Lala", "suka", "menulis", "dan", "mewarnai"], acceptableOrders: [["Lala", "suka", "mewarnai", "dan", "menulis"]] },
  { expectedWords: ["Fajar", "suka", "bersepeda", "tetapi", "takut", "jatuh"], acceptableOrders: [["Fajar", "takut", "jatuh", "tetapi", "suka", "bersepeda"]] },
  { expectedWords: ["Nisa", "suka", "bermain", "musik", "dan", "bernyanyi"], acceptableOrders: [["Nisa", "suka", "bernyanyi", "dan", "bermain", "musik"]] },
];

function isSentenceBuildOrderCorrect(exercise, order) {
  const actualWords = order.map((wordIndex) => exercise.expectedWords[wordIndex]);
  return [exercise.expectedWords, ...exercise.acceptableOrders].some((acceptableOrder) =>
    actualWords.length === acceptableOrder.length && actualWords.every((word, index) => word === acceptableOrder[index]));
}

const sentenceBuildStates = sentenceBuildExercises.map((exercise, index) => {
  const savedState = workbookAnswers.sentenceBuildStates?.[index];
  const validOrder = Array.isArray(savedState?.order)
    && savedState.order.every((wordIndex) => Number.isInteger(wordIndex) && wordIndex >= 0 && wordIndex < exercise.expectedWords.length)
    && new Set(savedState.order).size === savedState.order.length;
  return {
    order: validOrder ? savedState.order : [],
    attempts: Number.isInteger(savedState?.attempts) && savedState.attempts >= 0 ? savedState.attempts : 0,
    solved: savedState?.solved === true && validOrder && isSentenceBuildOrderCorrect(exercise, savedState.order),
  };
});
const sentenceActivity = document.querySelector("#sentence-activity");

function saveSentenceBuildStates() {
  workbookAnswers.sentenceBuildStates = sentenceBuildStates.map(({ order, attempts, solved }) => ({ order, attempts, solved }));
  saveWorkbookAnswers();
}

function shuffledWordIndexes(length) {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }
  if (indexes.every((value, index) => value === index)) [indexes[0], indexes[1]] = [indexes[1], indexes[0]];
  return indexes;
}

const sentenceBuildResetters = [];
sentenceBuildExercises.forEach((exercise, exerciseIndex) => {
  const state = sentenceBuildStates[exerciseIndex];
  const card = document.createElement("article");
  card.className = "mini-activity-row sentence-build-card";
  const heading = document.createElement("h3");
  heading.className = "sentence-build-heading";
  heading.textContent = `Latihan ${exerciseIndex + 1} dari ${sentenceBuildExercises.length}`;
  const bankLabel = document.createElement("p");
  bankLabel.textContent = "Kata-kata";
  const wordBank = document.createElement("div");
  wordBank.className = "sentence-word-bank";
  wordBank.setAttribute("role", "group");
  wordBank.setAttribute("aria-label", `Kata-kata latihan ${exerciseIndex + 1}`);
  const answerLabel = document.createElement("p");
  answerLabel.textContent = "Susun kalimatmu";
  const answerArea = document.createElement("div");
  answerArea.className = "sentence-word-answer";
  answerArea.setAttribute("role", "list");
  answerArea.setAttribute("aria-label", `Susunan kalimat latihan ${exerciseIndex + 1} masih kosong`);
  answerArea.setAttribute("aria-live", "polite");
  const answerPlaceholder = document.createElement("span");
  answerPlaceholder.className = "sentence-word-placeholder";
  answerPlaceholder.setAttribute("role", "listitem");
  answerPlaceholder.textContent = "Kata yang dipilih akan muncul di sini.";
  const controls = document.createElement("div");
  controls.className = "sentence-build-controls";
  const removeLast = document.createElement("button");
  removeLast.type = "button";
  removeLast.className = "button button-soft";
  removeLast.textContent = "Hapus terakhir";
  removeLast.disabled = true;
  const tryAgain = document.createElement("button");
  tryAgain.type = "button";
  tryAgain.className = "button button-soft";
  tryAgain.textContent = "Coba lagi";
  tryAgain.disabled = true;
  const checkAnswer = document.createElement("button");
  checkAnswer.type = "button";
  checkAnswer.className = "button button-primary";
  checkAnswer.textContent = "Periksa jawaban";
  const feedback = document.createElement("p");
  feedback.className = "feedback sentence-build-feedback";
  feedback.setAttribute("aria-live", "polite");
  feedback.tabIndex = -1;
  const wordButtons = new Map();

  shuffledWordIndexes(exercise.expectedWords.length).forEach((wordIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button sentence-word-button";
    button.textContent = exercise.expectedWords[wordIndex];
    button.addEventListener("click", () => {
      if (state.solved || state.order.includes(wordIndex)) return;
      if (activeSpeechUtterance) stopInstructionAudio("Bacaan dihentikan karena susunan kata berubah.");
      const preserveKeyboardFocus = button.matches(":focus-visible");
      state.order.push(wordIndex);
      button.disabled = true;
      feedback.textContent = "";
      feedback.className = "feedback sentence-build-feedback";
      renderSentenceBuildAnswer();
      saveSentenceBuildStates();
      if (preserveKeyboardFocus) {
        const nextWordButton = [...wordButtons.values()].find((wordButton) => !wordButton.disabled);
        (nextWordButton || checkAnswer).focus();
      }
    });
    wordBank.append(button);
    wordButtons.set(wordIndex, button);
  });

  function renderSentenceBuildAnswer() {
    const answerItems = state.order.map((wordIndex) => {
      const chip = document.createElement("span");
      chip.className = "sentence-word-chip";
      chip.setAttribute("role", "listitem");
      chip.textContent = exercise.expectedWords[wordIndex];
      return chip;
    });
    if (answerItems.length === 0) answerItems.push(answerPlaceholder);
    answerArea.replaceChildren(...answerItems);
    answerArea.setAttribute("aria-label", state.order.length
      ? `Susunan saat ini: ${state.order.map((wordIndex) => exercise.expectedWords[wordIndex]).join(" ")}`
      : `Susunan kalimat latihan ${exerciseIndex + 1} masih kosong`);
    removeLast.disabled = state.order.length === 0 || state.solved;
    tryAgain.disabled = state.order.length === 0 || state.solved;
  }

  sentenceBuildResetters.push(() => {
    state.order = [];
    state.attempts = 0;
    state.solved = false;
    wordButtons.forEach((button) => { button.disabled = false; });
    feedback.textContent = "";
    feedback.className = "feedback sentence-build-feedback";
    checkAnswer.disabled = false;
    renderSentenceBuildAnswer();
  });

  removeLast.addEventListener("click", () => {
    const removedIndex = state.order.pop();
    if (removedIndex === undefined) return;
    wordButtons.get(removedIndex).disabled = false;
    feedback.textContent = "";
    feedback.className = "feedback sentence-build-feedback";
    renderSentenceBuildAnswer();
    saveSentenceBuildStates();
    wordButtons.get(removedIndex).focus();
  });

  tryAgain.addEventListener("click", () => {
    state.order.forEach((wordIndex) => { wordButtons.get(wordIndex).disabled = false; });
    state.order = [];
    feedback.textContent = "";
    feedback.className = "feedback sentence-build-feedback";
    renderSentenceBuildAnswer();
    saveSentenceBuildStates();
    wordBank.querySelector("button:not(:disabled)")?.focus();
  });

  checkAnswer.addEventListener("click", () => {
    if (activeSpeechUtterance) stopInstructionAudio("Bacaan dihentikan karena hasil latihan berubah.");
    state.attempts += 1;
    const isComplete = state.order.length === exercise.expectedWords.length;
    const isCorrect = isComplete && isSentenceBuildOrderCorrect(exercise, state.order);
    if (isCorrect) {
      const preserveKeyboardFocus = checkAnswer.matches(":focus-visible");
      state.solved = true;
      feedback.textContent = `Hebat! Susunan kalimatmu sudah tepat. ${state.order.map((wordIndex) => exercise.expectedWords[wordIndex]).join(" ")}.`;
      feedback.className = "feedback good sentence-build-feedback";
      wordButtons.forEach((button) => { button.disabled = true; });
      removeLast.disabled = true;
      tryAgain.disabled = true;
      checkAnswer.disabled = true;
      saveSentenceBuildStates();
      if (preserveKeyboardFocus) feedback.focus();
      if (sentenceBuildStates.every((item) => item.solved)) completeActivityStep(4);
      return;
    }

    feedback.textContent = isComplete
      ? "Belum tepat. Coba perhatikan siapa yang melakukan kegiatan dan urutan kegiatannya."
      : "Pilih semua kata sebelum memeriksa susunan kalimatmu.";
    feedback.className = "feedback try-again sentence-build-feedback";
    saveSentenceBuildStates();
  });

  controls.append(removeLast, tryAgain, checkAnswer);
  card.append(heading, bankLabel, wordBank, answerLabel, answerArea, controls, feedback);
  sentenceActivity.append(card);
  state.order.forEach((wordIndex) => { wordButtons.get(wordIndex).disabled = true; });
  if (state.solved) {
    wordButtons.forEach((button) => { button.disabled = true; });
    removeLast.disabled = true;
    tryAgain.disabled = true;
    checkAnswer.disabled = true;
    feedback.textContent = `Hebat! Susunan kalimatmu sudah tepat. ${state.order.map((wordIndex) => exercise.expectedWords[wordIndex]).join(" ")}.`;
    feedback.className = "feedback good sentence-build-feedback";
  }
  renderSentenceBuildAnswer();
  if (state.solved) {
    removeLast.disabled = true;
    tryAgain.disabled = true;
  }
  if (state.order.length || state.attempts || state.solved) saveSentenceBuildStates();
});
if (sentenceBuildStates.every((state) => state.solved)) completeActivityStep(4);

const studentSentenceDrafts = { dan: "", tetapi: "" };
const studentSentenceInputs = {
  dan: document.querySelector("#student-sentence-and"),
  tetapi: document.querySelector("#student-sentence-tetapi"),
};
const studentSentenceFeedback = {
  dan: document.querySelector("#sentence-and-feedback"),
  tetapi: document.querySelector("#sentence-tetapi-feedback"),
};
Object.entries(studentSentenceInputs).forEach(([connector, input]) => {
  input.addEventListener("input", () => {
    studentSentenceDrafts[connector] = input.value;
    workbookAnswers.sentenceWritingChecked = false;
    revokeActivityStep(5);
    studentSentenceFeedback[connector].textContent = "";
    studentSentenceFeedback[connector].className = "feedback sentence-writing-feedback";
    saveWorkbookAnswers();
  });
});

function checkStudentSentencePattern(value, connector) {
  const connectorRegex = new RegExp(`\\b${connector}\\b`, "gi");
  const matches = [...value.matchAll(connectorRegex)];
  if (!value.trim()) return { valid: false, message: `Kalimat bagian ${connector.toLocaleUpperCase("id")} belum diisi.` };
  if (matches.length !== 1) return { valid: false, message: `Kalimatmu belum lengkap. Coba gunakan kata “${connector}” satu kali.` };
  const parts = value.split(connectorRegex).map((part) => part.replace(/^[\s,.;!?]+|[\s,.;!?]+$/g, "").trim());
  if (parts.length !== 2 || parts.some((part) => !part)) return { valid: false, message: "Coba isi kedua bagian kalimat." };
  return { valid: true };
}

function checkStudentSentences() {
  const results = {};
  Object.entries(studentSentenceInputs).forEach(([connector, input]) => {
    studentSentenceDrafts[connector] = input.value;
    results[connector] = checkStudentSentencePattern(input.value, connector);
    const feedback = studentSentenceFeedback[connector];
    feedback.textContent = results[connector].valid
      ? connector === "dan"
        ? "Pola kalimat sudah memuat dua bagian dan kata “dan”. Pemeriksaan otomatis tidak menilai makna gagasanmu."
        : "Pola kalimat sudah memuat dua bagian dan kata “tetapi”. Pemeriksaan otomatis tidak menilai makna gagasanmu."
      : results[connector].message;
    feedback.className = `feedback sentence-writing-feedback ${results[connector].valid ? "good" : "try-again"}`;
  });
  if (results.dan.valid && results.tetapi.valid) completeActivityStep(5);
}

document.querySelector("#sentence-form").addEventListener("submit", (event) => {
  event.preventDefault();
  workbookAnswers.sentenceWritingChecked = true;
  saveWorkbookAnswers();
  checkStudentSentences();
});
if (workbookAnswers.sentenceWritingChecked) checkStudentSentences();
else if (Object.values(workbookAnswers.fields).some((value) => typeof value === "string" && value.length > 0)) {
  workbookAnswers.sentenceWritingChecked = false;
}

const questions = [
  { prompt: "Apa kegunaan kata “dan”?", choices: ["Menggabungkan dua hal yang cocok", "Menunjukkan dua hal berbeda", "Mengakhiri kalimat"], answer: 0, explain: "Dan menggabungkan dua hal yang tidak bertentangan." },
  { prompt: "Siti suka membaca. Ia juga suka menulis. Kata apa yang tepat?", choices: ["tetapi", "dan", "karena"], answer: 1, explain: "Membaca dan menulis bisa dilakukan bersama." },
  { prompt: "Kapan kita menggunakan kata “tetapi”?", choices: ["Saat menambah hobi", "Saat menunjukkan hal berbeda", "Saat menyebut nama"], answer: 1, explain: "Tetapi menunjukkan dua hal yang berbeda atau bertentangan." },
  { prompt: "Rani suka menyanyi, ___ malu tampil di kelas.", choices: ["dan", "tetapi", "lalu"], answer: 1, explain: "Rani suka menyanyi, tetapi ia malu tampil." },
  { prompt: "Bima suka menggambar ___ mewarnai. Kedua hobi itu ia sukai.", choices: ["dan", "tetapi", "atau"], answer: 0, explain: "Bima menyukai kedua hobi, jadi gunakan dan." },
  { prompt: "Budi suka bermain bola, ___ hari ini kakinya lelah.", choices: ["dan", "tetapi", "dengan"], answer: 1, explain: "Keadaan hari ini berbeda, jadi gunakan tetapi." },
  {
    prompt: "Bima menggambar bunga ___ kupu-kupu. Kata sambung apa yang tepat?",
    choices: [
      "DAN",
      "TETAPI",
      "ATAU",
    ],
    answer: 0,
    explain: "Kata “dan” tepat untuk menyebut dua gambar yang dibuat Bima, yaitu bunga dan kupu-kupu.",
    feedback: [
      "Kata “dan” tepat untuk menyebut dua gambar yang dibuat Bima, yaitu bunga dan kupu-kupu.",
      "Kata “tetapi” tidak tepat karena bunga dan kupu-kupu bukan hal yang berlawanan.",
      "Kata “atau” tidak tepat karena kalimat menyebut dua gambar yang dibuat Bima, bukan pilihan.",
    ],
  },
  {
    prompt: "Bima ingin bermain bola, tetapi sedang turun hujan. Pilihan mana yang tepat?",
    choices: [
      "Bima ingin bermain bola dan sedang turun hujan.",
      "Bima ingin bermain bola tetapi sedang turun hujan.",
      "Bima tidak ingin bermain bola dan sedang turun hujan.",
    ],
    answer: 1,
    explain: "Tetapi menunjukkan perbedaan: Bima ingin bermain bola, tetapi hujan turun.",
    feedback: [
      "Dan menambahkan informasi, tetapi di sini kedua ide menunjukkan perbedaan.",
      "Tetapi menunjukkan perbedaan antara keinginan Bima bermain bola dan hujan yang turun.",
      "Kalimat ini mengubah cerita: Bima ingin bermain bola.",
    ],
  },
  {
    prompt: "Kalimat manakah yang menggunakan kata penghubung dengan tepat?",
    choices: [
      "Aku suka membaca dan suka menggambar.",
      "Aku suka membaca tetapi suka menggambar.",
      "Aku suka menari dan tetapi bermain musik.",
    ],
    answer: 0,
    explain: "Dan tepat untuk menghubungkan dua kegiatan yang sama-sama disukai.",
    feedback: [
      "Dan menghubungkan dua kegiatan yang sama-sama aku sukai.",
      "Tidak ada perbedaan; gunakan dan untuk dua kegiatan yang sama-sama disukai.",
      "Dan dan tetapi tidak digunakan bersama seperti ini. Pilih satu kata penghubung.",
    ],
  },
  {
    prompt: "Rani suka menyanyi, tetapi Rani tidak suka menari. Kalimat yang memiliki arti yang sama adalah ...",
    choices: [
      "Rani suka menyanyi dan suka menari.",
      "Rani suka menyanyi tetapi tidak suka menari.",
      "Rani tidak suka menyanyi dan suka menari.",
    ],
    answer: 1,
    explain: "Tetapi menunjukkan perbedaan: Rani suka menyanyi dan tidak suka menari.",
    feedback: [
      "Kalimat ini mengatakan Rani juga suka menari, tetapi Rani tidak suka menari.",
      "Rani suka menyanyi dan tidak suka menari. Tetapi menunjukkan perbedaan itu.",
      "Kalimat ini mengubah arti: Rani suka menyanyi, bukan tidak suka menyanyi.",
    ],
  },
];

const savedQuizAnswers = Array.isArray(workbookAnswers.quizAnswers) ? workbookAnswers.quizAnswers : [];
let quizAnswers = questions.map((question, index) => {
  const answer = savedQuizAnswers[index];
  return Number.isInteger(answer) && answer >= 0 && answer < question.choices.length ? answer : null;
});
const savedQuizSelections = Array.isArray(workbookAnswers.quizSelections) ? workbookAnswers.quizSelections : [];
let quizSelections = questions.map((question, index) => {
  const answer = savedQuizSelections[index];
  return Number.isInteger(answer) && answer >= 0 && answer < question.choices.length ? answer : null;
});
const storedCurrentQuestion = workbookAnswers.currentQuestion;
let currentQuestion = Number.isInteger(storedCurrentQuestion) && storedCurrentQuestion >= 0 && storedCurrentQuestion < questions.length
  ? storedCurrentQuestion
  : Math.max(0, quizAnswers.findIndex((answer) => answer === null));
let selectedAnswer = null;
let correctAnswers = quizAnswers.filter((answer, index) => answer !== null && answer === questions[index].answer).length;
let answered = false;
const questionArea = document.querySelector("#quiz-question-area");
const questionCount = document.querySelector("#question-count");
const progressFill = document.querySelector("#progress-fill");
const quizFeedback = document.querySelector("#quiz-feedback");
const nextButton = document.querySelector("#next-question");
const previousButton = document.querySelector("#prev-question");
const resultPanel = document.querySelector("#quiz-result");
const quizShell = document.querySelector("#quiz-shell");

function saveQuizAnswers() {
  workbookAnswers.quizAnswers = quizAnswers;
  workbookAnswers.quizSelections = quizSelections;
  workbookAnswers.currentQuestion = currentQuestion;
  saveWorkbookAnswers();
}

function getAnswerFeedback(question, answerIndex) {
  return question.feedback?.[answerIndex] || question.explain;
}

function renderQuestion() {
  if (activeSpeechUtterance) stopInstructionAudio("Bacaan dihentikan karena soal berubah.");
  const shouldFocusQuestion = questionArea.contains(document.activeElement)
    || document.activeElement === nextButton
    || document.activeElement === previousButton;
  const question = questions[currentQuestion];
  const isEditingAnswer = workbookAnswers.quizEditingQuestion === currentQuestion;
  answered = quizAnswers[currentQuestion] !== null && !isEditingAnswer;
  selectedAnswer = answered ? quizAnswers[currentQuestion] : (quizSelections[currentQuestion] ?? quizAnswers[currentQuestion] ?? null);
  questionCount.textContent = `SOAL ${currentQuestion + 1} DARI ${questions.length}`;
  progressFill.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  const title = document.createElement("h3");
  title.className = "question-title";
  title.tabIndex = -1;
  title.textContent = question.prompt;
  const choices = document.createElement("div");
  choices.className = "answer-list";
  question.choices.forEach((choice, index) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "answer-option";
    option.dataset.answer = String(index);
    const letter = document.createElement("span");
    letter.className = "answer-letter";
    letter.textContent = String.fromCharCode(65 + index);
    const label = document.createElement("span");
    label.textContent = choice;
    option.append(letter, label);
    if (answered) {
      option.disabled = true;
      if (index === question.answer) option.classList.add("answer-correct");
      if (index === selectedAnswer && index !== question.answer) option.classList.add("answer-incorrect");
    }
    if (index === selectedAnswer) option.classList.add("selected");
    option.addEventListener("click", () => {
      if (answered) return;
      if (activeSpeechUtterance) stopInstructionAudio("Bacaan dihentikan karena jawaban berubah.");
      choices.querySelectorAll(".answer-option").forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");
      selectedAnswer = index;
      quizSelections[currentQuestion] = index;
      workbookAnswers.quizEditingQuestion = quizAnswers[currentQuestion] === null ? null : currentQuestion;
      saveQuizAnswers();
      nextButton.disabled = false;
      quizFeedback.textContent = "Sudah memilih? Tekan tombol Periksa Jawaban. Jawaban sebelumnya tetap tersimpan sampai diperbarui.";
      quizFeedback.className = "quiz-feedback";
    });
    choices.append(option);
  });
  questionArea.replaceChildren(title, choices);
  if (shouldFocusQuestion) title.focus();
  if (answered) {
    const isCorrect = selectedAnswer === question.answer;
    quizFeedback.textContent = `${isCorrect ? "✓ Jawabanmu benar." : "↻ Tidak apa-apa."} ${getAnswerFeedback(question, selectedAnswer)}`;
    quizFeedback.className = `quiz-feedback ${isCorrect ? "correct" : "incorrect"}`;
  } else {
    quizFeedback.textContent = isEditingAnswer
      ? "Pilih jawaban pengganti, lalu periksa. Jawaban sebelumnya belum dihapus."
      : "";
    quizFeedback.className = "quiz-feedback";
  }
  if (answered) {
    const reviseAnswer = document.createElement("button");
    reviseAnswer.type = "button";
    reviseAnswer.className = "button button-soft quiz-revise-answer";
    reviseAnswer.textContent = "Perbaiki jawaban";
    reviseAnswer.addEventListener("click", () => {
      workbookAnswers.quizEditingQuestion = currentQuestion;
      quizSelections[currentQuestion] = quizAnswers[currentQuestion];
      renderQuestion();
    });
    questionArea.append(reviseAnswer);
  }
  nextButton.textContent = answered ? (currentQuestion === questions.length - 1 ? "Lihat Hasil" : "Soal Berikutnya") : "Periksa Jawaban";
  nextButton.disabled = !answered && selectedAnswer === null;
  previousButton.disabled = currentQuestion === 0;
}

nextButton.addEventListener("click", () => {
  if (!answered) {
    if (selectedAnswer === null) return;
    if (activeSpeechUtterance) stopInstructionAudio("Bacaan dihentikan karena jawaban diperiksa.");
    const isCorrect = selectedAnswer === questions[currentQuestion].answer;
    quizAnswers[currentQuestion] = selectedAnswer;
    quizSelections[currentQuestion] = null;
    delete workbookAnswers.quizEditingQuestion;
    answered = true;
    correctAnswers = quizAnswers.filter((answer, index) => answer !== null && answer === questions[index].answer).length;
    saveQuizAnswers();
    questionArea.querySelectorAll(".answer-option").forEach((option) => {
      option.disabled = true;
      const choiceIndex = Number(option.dataset.answer);
      if (choiceIndex === questions[currentQuestion].answer) option.classList.add("answer-correct");
      if (choiceIndex === selectedAnswer && !isCorrect) option.classList.add("answer-incorrect");
    });
    document.querySelector("#live-score").textContent = String(correctAnswers * 10);
    quizFeedback.textContent = `${isCorrect ? "✓ Benar! Hebat!" : "↻ Tidak apa-apa, mari belajar."} ${getAnswerFeedback(questions[currentQuestion], selectedAnswer)}`;
    quizFeedback.className = `quiz-feedback ${isCorrect ? "correct" : "incorrect"}`;
    nextButton.textContent = currentQuestion === questions.length - 1 ? "Lihat Hasil" : "Soal Berikutnya";
    return;
  }
  if (currentQuestion < questions.length - 1) {
    currentQuestion += 1;
    saveQuizAnswers();
    renderQuestion();
  } else showResult();
});

previousButton.addEventListener("click", () => {
  if (currentQuestion > 0) {
    currentQuestion -= 1;
    saveQuizAnswers();
    renderQuestion();
  }
});

function showResult() {
  if (quizAnswers.some((answer) => answer === null)) {
    workbookAnswers.quizResultShown = false;
    saveQuizAnswers();
    return;
  }
  const score = correctAnswers * 10;
  const wrongAnswers = questions.length - correctAnswers;
  let message;
  if (score >= 90) message = "Hebat! Kamu sudah sangat memahami materi!";
  else if (score >= 70) message = "Bagus! Tinggal sedikit lagi.";
  else if (score >= 50) message = "Yuk, belajar lagi dan coba sekali lagi!";
  else message = "Jangan menyerah! Kita belajar bersama.";
  workbookAnswers.quizCompleted = true;
  workbookAnswers.quizResultShown = true;
  saveQuizAnswers();
  earnAchievement("quiz");
  quizShell.hidden = true;
  resultPanel.hidden = false;
  resultPanel.replaceChildren();
  const medal = document.createElement("div");
  medal.className = "result-medal";
  medal.setAttribute("aria-hidden", "true");
  medal.textContent = "";
  const title = document.createElement("h3");
  title.textContent = "Kuis selesai!";
  const scoreText = document.createElement("div");
  scoreText.className = "final-score";
  scoreText.textContent = `Skormu: ${score}/100`;
  const detail = document.createElement("p");
  detail.className = "result-detail";
  detail.textContent = `${correctAnswers} jawaban benar · ${wrongAnswers} jawaban salah`;
  const resultMessage = document.createElement("p");
  resultMessage.className = "result-message";
  resultMessage.textContent = message;
  const retry = document.createElement("button");
  retry.type = "button";
  retry.id = "retry-quiz";
  retry.className = "button button-primary";
  retry.textContent = "↻ Ulangi Kuis";
  retry.addEventListener("click", resetQuiz);
  resultPanel.append(medal, title, scoreText, detail, resultMessage, retry);
}

function resetQuiz() {
  workbookAnswers.quizResultShown = false;
  currentQuestion = 0;
  selectedAnswer = quizAnswers[currentQuestion] ?? quizSelections[currentQuestion] ?? null;
  quizShell.hidden = false;
  resultPanel.hidden = true;
  saveQuizAnswers();
  renderQuestion();
}

renderQuestion();
document.querySelector("#live-score").textContent = String(correctAnswers * 10);
if (workbookAnswers.quizResultShown === true) showResult();

function syncWorkbookPrintValues() {
  practicePage.querySelectorAll("textarea, input:not([type='checkbox']), select").forEach((field) => {
    const container = field.closest(".smooth-input-shell") || field;
    let printValue = container.nextElementSibling;
    if (!printValue?.classList.contains("print-field-value")) {
      printValue = document.createElement("div");
      printValue.className = "print-field-value";
      container.insertAdjacentElement("afterend", printValue);
    }
    printValue.textContent = field.value.trim() || "Belum diisi.";
  });
  practicePage.querySelectorAll("input[type='checkbox']").forEach((field) => {
    const label = field.closest("label");
    if (!label) return;
    let printValue = label.nextElementSibling;
    if (!printValue?.classList.contains("print-check-value")) {
      printValue = document.createElement("span");
      printValue.className = "print-check-value";
      label.insertAdjacentElement("afterend", printValue);
    }
    printValue.textContent = `${field.checked ? "[x]" : "[ ]"} ${label.textContent.trim()}`;
  });
}

function printWorkbook() {
  saveWorkbookAnswers();
  syncWorkbookPrintValues();
  window.print();
}

async function downloadBlankWorkbookPdf() {
  const pdfButton = document.querySelector("#save-workbook-blank-pdf");
  const pdfStatus = document.querySelector("#pdf-download-status");
  pdfButton.disabled = true;
  pdfStatus.textContent = "Menyiapkan unduhan LKPD kosong...";

  try {
    const response = await fetch(blankWorkbookPdfPath);
    if (!response.ok) {
      throw new Error(`file tidak ditemukan atau tidak dapat diakses (HTTP ${response.status})`);
    }

    const pdfBlob = await response.blob();
    const signature = new TextDecoder().decode(await pdfBlob.slice(0, 5).arrayBuffer());
    if (!pdfBlob.size || signature !== "%PDF-") {
      throw new Error("file yang ditemukan bukan dokumen PDF yang valid");
    }

    const objectUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = objectUrl;
    downloadLink.download = "LKPD_CETAK_HOBI_DAN_KATA_SAMBUNG.pdf";
    downloadLink.hidden = true;
    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    pdfStatus.textContent = "Unduhan LKPD cetak dimulai. Jawaban dan progres belajarmu tidak berubah.";
  } catch (error) {
    console.error(`Gagal mengunduh LKPD cetak dari ${blankWorkbookPdfPath}.`, error);
    pdfStatus.textContent = `LKPD kosong belum dapat diunduh. Periksa file: ${blankWorkbookPdfPath}. ${error instanceof Error ? error.message : "Terjadi kesalahan."} Jawaban dan progres belajarmu tidak berubah.`;
  } finally {
    pdfButton.disabled = false;
  }
}

function createWorkbookPdf(mode) {
  const isBlank = mode === "blank";
  const pdfButton = document.querySelector(isBlank ? "#save-workbook-blank-pdf" : "#save-workbook-answers-pdf");
  const pdfStatus = document.querySelector("#pdf-download-status");
  if (!window.jspdf?.jsPDF) {
    const error = new Error("Pustaka pembuatan PDF tidak tersedia.");
    console.error(error);
    pdfStatus.textContent = "PDF belum dapat dibuat karena pustaka PDF tidak tersedia. Jawabanmu tidak berubah.";
    return;
  }

  pdfButton.disabled = true;
  pdfStatus.textContent = "Menyiapkan PDF...";

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const bottom = 282;
    let y = margin;
    const pdfText = (value) => String(value ?? "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[—–]/g, "-")
      .replace(/[·•]/g, "-")
      .replace(/→/g, "->")
      .replace(/✓/g, "[x]")
      .replace(/\u00a0/g, " ");
    const ensureSpace = (height) => {
      if (y + height > bottom) {
        pdf.addPage();
        y = margin;
      }
    };
    const wrap = (value, width = contentWidth) => pdf.splitTextToSize(pdfText(value), width);
    const addParagraph = (value, { fontSize = 10, bold = false, gap = 2, indent = 0 } = {}) => {
      const lines = wrap(value, contentWidth - indent);
      const lineHeight = fontSize * 0.48;
      ensureSpace(lines.length * lineHeight + gap);
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(fontSize);
      pdf.setTextColor(25, 25, 25);
      pdf.text(lines, margin + indent, y);
      y += lines.length * lineHeight + gap;
    };
    const addSection = (title) => {
      ensureSpace(22);
      y += 2;
      pdf.setDrawColor(100, 75, 55);
      pdf.setLineWidth(0.4);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 7;
      addParagraph(title, { fontSize: 13, bold: true, gap: 4 });
    };
    const addQuestion = (label, options = null, selected = "", answerLines = 0) => {
      const questionLines = wrap(label);
      const optionLines = options
        ? options.reduce((total, option) => total + wrap(option, contentWidth - 8).length, 0)
        : 0;
      const answerHeight = options
        ? optionLines * 4.8 + options.length + 2
        : selected
          ? wrap(selected, contentWidth - 3).length * 4.8 + 4
          : answerLines * 7.5 + 2;
      const blockHeight = questionLines.length * 4.8 + 1 + answerHeight;
      ensureSpace(blockHeight);
      addParagraph(label, { bold: true, gap: 1 });
      if (options) {
        options.forEach((option) => {
          const mark = !isBlank && option === selected ? "(x) " : "( ) ";
          addParagraph(`${mark}${option}`, { indent: 3, fontSize: 10, gap: 1 });
        });
        y += 1;
        return;
      }
      if (!isBlank && selected) {
        addParagraph(selected, { indent: 3, gap: 2 });
        return;
      }
      for (let line = 0; line < answerLines; line += 1) {
        ensureSpace(7.5);
        pdf.setDrawColor(120, 120, 120);
        pdf.setLineWidth(0.25);
        pdf.line(margin + 3, y + 5, pageWidth - margin, y + 5);
        y += 7.5;
      }
      y += 2;
    };
    const addDetails = (selector) => {
      const details = practicePage.querySelector(selector);
      if (!details) return;
      const parts = [...details.children].map((child, index) => {
        if (index === 0 && child.tagName === "SUMMARY") return child.textContent.trim();
        if (child.tagName === "OL" || child.tagName === "UL") {
          return [...child.children]
            .map((item, itemIndex) => `${itemIndex + 1}. ${item.textContent.trim()}`)
            .join(" ");
        }
        return child.textContent.trim();
      }).filter(Boolean);
      if (parts.length) addParagraph(parts.join(" "), { fontSize: 9, gap: 4 });
    };
    const addImage = () => {
      const image = practicePage.querySelector(".observation-art img");
      if (!image || !image.complete || !image.naturalWidth) {
        throw new Error("Ilustrasi kegiatan belum berhasil dimuat.");
      }
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Browser tidak dapat memproses ilustrasi.");
      context.drawImage(image, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.82);
      const width = Math.min(contentWidth, 150);
      const height = width * image.naturalHeight / image.naturalWidth;
      ensureSpace(height + 5);
      pdf.addImage(imageData, "JPEG", margin, y, width, height, undefined, "FAST");
      y += height + 5;
    };

    pdf.setProperties({
      title: isBlank ? "LKPD Kosong - Hobi yang Jadi Prestasi" : "Hasil Pengerjaan - Hobi yang Jadi Prestasi",
      subject: "Bahasa Indonesia Kelas 2",
    });
    addParagraph("RUANG BELAJAR - BAHASA INDONESIA KELAS 2", { fontSize: 9, bold: true, gap: 3 });
    addParagraph(practicePage.querySelector("#workbook-title")?.textContent.trim() || "Buku Kerja: Hobi dan Kata Penghubung", { fontSize: 18, bold: true, gap: 5 });
    addParagraph("Nama siswa: __________________________________    Kelas: __________", { gap: 2 });
    addParagraph("Tanggal: ______________________________", { gap: 6 });

    const observationButtons = [...practicePage.querySelectorAll("[data-observation-answer]")];
    addSection("AKTIVITAS 1 - AMATI DAN SIMAK");
    addDetails(".activity-step[data-activity-step='1'] .activity-instructions");
    addQuestion(
      practicePage.querySelector(".observation-instruction")?.textContent || "Kegiatan apa yang dilakukan anak pada gambar?",
      observationButtons.map((button) => button.textContent.trim()),
      observationButtons.find((button) => button.dataset.observationAnswer === observationAnswer)?.textContent.trim() || "",
    );
    addImage();
    addSection(`CERITA - ${hobbyStoryTitle.toLocaleUpperCase("id")}`);
    [...practicePage.querySelectorAll("#hobby-story-text > p")].forEach((paragraph) => addParagraph(paragraph.textContent.trim(), { gap: 4 }));
    [...practicePage.querySelectorAll(".listening-question")].forEach((question, index) => {
      const options = [...question.querySelectorAll("[data-listening-answer]")];
      const selected = options.find((button) => button.dataset.listeningAnswer === listeningAnswers[index])?.textContent.trim() || "";
      addQuestion(question.querySelector("p")?.textContent || "", options.map((button) => button.textContent.trim()), selected);
    });

    addSection("AKTIVITAS 2 - KELOMPOKKAN KALIMAT");
    addDetails(".activity-step[data-activity-step='2'] .activity-instructions");
    addParagraph(practicePage.querySelector(".connector-instructions")?.textContent || "");
    const activityTwoOptions = [...practicePage.querySelectorAll("[data-connector-choice]")].map((button) => button.textContent.trim());
    activityTwoQuestions.forEach((question, index) => {
      addQuestion(
        `${index + 1}. ${question.sentence}`,
        activityTwoOptions,
        activityTwoAnswers[index]?.toLocaleUpperCase("id") || "",
      );
    });

    addSection("AKTIVITAS 3 - LENGKAPI KALIMAT");
    addDetails(".activity-step[data-activity-step='3'] .activity-instructions");
    connectorItems.forEach((item, index) => {
      const options = [...connectorActivity.querySelectorAll(".mini-activity-row")][index]
        ?.querySelectorAll(".choice-button");
      const labels = options ? [...options].map((button) => button.textContent.trim()) : ["DAN", "TETAPI"];
      addQuestion(item.sentence, labels, connectorAnswers.get(item.id)?.toLocaleUpperCase("id") || "");
    });

    addSection("AKTIVITAS 4 - SUSUN KALIMAT");
    addDetails(".activity-step[data-activity-step='4'] .activity-instructions");
    sentenceBuildExercises.forEach((exercise, index) => {
      const wordBank = practicePage.querySelectorAll(".sentence-build-card .sentence-word-bank")[index];
      const words = wordBank ? [...wordBank.querySelectorAll("button")].map((button) => button.textContent.trim()) : exercise.expectedWords;
      const state = sentenceBuildStates[index];
      const answer = state.order.map((wordIndex) => exercise.expectedWords[wordIndex]).join(" ");
      addParagraph(`Latihan ${index + 1} dari ${sentenceBuildExercises.length} - Kata-kata: ${words.join(" / ")}`, { bold: true, gap: 1 });
      addQuestion("Susun kata-kata menjadi kalimat.", null, answer, 2);
    });

    addSection("AKTIVITAS 5 - TULIS KALIMATMU");
    addDetails(".activity-step[data-activity-step='5'] .activity-instructions");
    const writingParts = [...practicePage.querySelectorAll(".sentence-writing-part")];
    writingParts.forEach((part, index) => {
      const input = part.querySelector("textarea");
      addQuestion(
        `${part.querySelector("h3")?.textContent.trim() || `Bagian ${index + 1}`}. ${part.querySelector("p")?.textContent.trim() || ""} ${part.querySelector(".sentence-writing-pattern")?.textContent.trim() || ""}`,
        null,
        input?.value.trim() || "",
        3,
      );
    });
    addParagraph(practicePage.querySelector(".self-check legend")?.textContent || "Checklist periksa sendiri", { bold: true, gap: 2 });
    [...practicePage.querySelectorAll(".self-check label")].forEach((label) => {
      const checkbox = label.querySelector("input[type='checkbox']");
      addParagraph(`${!isBlank && checkbox?.checked ? "(x)" : "( )"} ${label.textContent.trim()}`, { indent: 2, gap: 2 });
    });
    addParagraph(practicePage.querySelector(".assessment-note")?.textContent || "", { fontSize: 9, gap: 4 });

    addSection(practicePage.querySelector("#speaking-title")?.textContent.trim() || "CERITAKAN HOBIMU");
    addParagraph(practicePage.querySelector(".speaking-activity > p")?.textContent || "", { gap: 4 });
    addParagraph(practicePage.querySelector(".speaking-alternative")?.textContent || "", { gap: 4 });
    addDetails(".speaking-activity .activity-instructions");
    const rubricItems = [
      ["Menyampaikan hobi", "#speaking-hobby-rating"],
      ["Menggunakan kata sambung", "#speaking-connector-rating"],
      ["Berbicara dengan jelas", "#speaking-clarity-rating"],
      ["Mendengarkan dan menanggapi dengan sopan", "#speaking-listening-rating"],
      ["Menyalin kalimat dengan tulisan terbaca", "#writing-copy-rating"],
    ];
    rubricItems.forEach(([label, selector]) => {
      const select = practicePage.querySelector(selector);
      const choices = [...select.options].filter((option) => option.value).map((option) => option.textContent.trim());
      addQuestion(label, choices, select.value || "");
    });
    const teacherNote = practicePage.querySelector("#speaking-teacher-note");
    addQuestion(teacherNote?.labels?.[0]?.textContent || "Catatan guru", null, teacherNote?.value.trim() || "", 3);

    const pdfBlob = pdf.output("blob");
    if (!(pdfBlob instanceof Blob) || pdfBlob.type !== "application/pdf" || pdfBlob.size === 0) {
      throw new Error("Dokumen PDF kosong atau tidak valid.");
    }
    const objectUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = objectUrl;
    downloadLink.download = isBlank ? "LKPD-Hobi-Kosong.pdf" : "Hasil-Pengerjaan-LKPD-Hobi.pdf";
    downloadLink.hidden = true;
    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    pdfStatus.textContent = isBlank
      ? "Unduhan LKPD kosong dimulai. PDF tidak mengambil jawaban digital; data pengerjaan tidak diubah."
      : "Unduhan hasil pengerjaan dimulai. PDF memuat jawaban yang terisi saat ini; jawaban dan progres tidak diubah.";
  } catch (error) {
    console.error(`Gagal membuat PDF ${isBlank ? "kosong" : "hasil pengerjaan"}.`, error);
    pdfStatus.textContent = error instanceof DOMException && error.name === "SecurityError"
      ? "PDF belum dapat dibuat karena browser memblokir akses ilustrasi. Buka website melalui Live Server dan coba lagi; jawabanmu tidak berubah."
      : `PDF belum dapat dibuat: ${error instanceof Error ? error.message : "terjadi kesalahan."} Jawabanmu tidak berubah.`;
  } finally {
    pdfButton.disabled = false;
  }
}

document.querySelector("#save-workbook-blank-pdf").addEventListener("click", downloadBlankWorkbookPdf);
document.querySelector("#save-workbook-answers-pdf").addEventListener("click", () => createWorkbookPdf("answers"));
document.querySelector("#print-workbook").addEventListener("click", printWorkbook);
window.addEventListener("beforeprint", syncWorkbookPrintValues);

function resetPracticeActivities() {
  listeningAnswers.fill(null);
  workbookAnswers.listeningAnswers = [...listeningAnswers];
  workbookAnswers.completedActivities = [];
  workbookAnswers.sentenceWritingChecked = false;
  workbookAnswers.fields = {};
  observationAnswer = null;
  observationFeedback.textContent = "";
  observationFeedback.className = "feedback";
  renderObservationAnswer();
  updateListeningActivity();

  completedActivities.clear();
  document.querySelectorAll("[data-activity-step]").forEach((step, index) => {
    step.classList.remove("is-complete", "correct-pop");
    const label = step.querySelector(".step-label b");
    if (label) label.textContent = `${index + 1} / 5`;
  });
  activityProgressLabel.textContent = "0 / 5 tahap selesai";
  activityProgress.setAttribute("aria-valuenow", "0");
  activityProgressFill.style.width = "0%";

  activityTwoAnswers.fill(null);
  activeActivityTwoIndex = 0;
  Object.entries(activityTwoGroups).forEach(([connector, group]) => {
    group.sentences.length = 0;
    group.list.replaceChildren();
    const empty = document.createElement("li");
    empty.className = "connector-group-empty";
    empty.textContent = "Belum ada kalimat.";
    group.list.append(empty);
    group.count.textContent = "0 kalimat";
    workbookAnswers.activityTwoAnswers = activityTwoAnswers;
    workbookAnswers.activityTwoIndex = 0;
    if (connector === "dan") activityTwoSummary.textContent = "Pilih DAN atau TETAPI untuk mulai mengelompokkan.";
  });
  renderActivityTwoQuestion();

  connectorCorrect.clear();
  connectorAnswers.clear();
  connectorActivity.querySelectorAll(".mini-activity-row").forEach((row) => {
    row.querySelectorAll(".choice-button").forEach((button) => {
      button.disabled = false;
      button.classList.remove("is-correct", "is-wrong");
    });
    const feedback = row.querySelector(".feedback");
    feedback.textContent = "";
    feedback.className = "feedback";
  });
  connectorSummary.textContent = "";
  connectorSummary.hidden = true;

  sentenceBuildResetters.forEach((reset) => reset());
  sentenceBuildStates.forEach((state) => {
    state.order = [];
    state.attempts = 0;
    state.solved = false;
  });

  Object.values(studentSentenceInputs).forEach((input) => { input.value = ""; });
  practicePage.querySelectorAll("input[id], textarea[id], select[id]").forEach((field) => {
    if (field.type === "checkbox") field.checked = false;
    else field.value = "";
  });
  Object.values(studentSentenceFeedback).forEach((feedback) => {
    feedback.textContent = "";
    feedback.className = "feedback sentence-writing-feedback";
  });
  document.querySelectorAll("#latihan .self-check input").forEach((checkbox) => { checkbox.checked = false; });
  syncWorkbookPrintValues();
}

document.querySelector("#clear-answers").addEventListener("click", () => {
  if (!window.confirm("Hapus semua jawaban materi, latihan, dan kuis yang tersimpan di browser ini?")) return;

  let removedFromBrowser = true;
  try {
    localStorage.removeItem(studentAnswersStorageKey);
  } catch {
    removedFromBrowser = false;
  }
  workbookAnswers = { fields: {} };
  resetMaterialCheck();
  resetPracticeActivities();
  quizAnswers.fill(null);
  quizSelections.fill(null);
  currentQuestion = 0;
  selectedAnswer = null;
  correctAnswers = 0;
  answered = false;
  quizShell.hidden = false;
  resultPanel.hidden = true;
  resultPanel.replaceChildren();
  document.querySelector("#live-score").textContent = "0";
  renderQuestion();

  achievements.practice = false;
  achievements.quiz = false;
  try {
    localStorage.setItem(achievementStorageKey, JSON.stringify(achievements));
  } catch {
    removedFromBrowser = false;
  }
  updateAchievements();
  updateJourney(document.querySelector(".page.is-visible")?.id || "latihan", false);
  showAnswerStorageStatus(removedFromBrowser
    ? "Jawaban materi, latihan, dan kuis telah dihapus dari browser ini. Kunjungan dan kartu hobimu tetap disimpan."
    : "Jawaban di halaman ini telah dihapus, tetapi browser gagal menghapus data tersimpan. Periksa izin penyimpanan browser.");
});

completedActivities.forEach((stepNumber) => {
  const step = document.querySelector(`[data-activity-step="${stepNumber}"]`);
  step?.classList.add("is-complete");
  const label = step?.querySelector(".step-label b");
  if (label) label.textContent = `${stepNumber} / 5 ✓`;
});
activityProgressLabel.textContent = `${completedActivities.size} / 5 tahap selesai`;
activityProgress.setAttribute("aria-valuenow", String(completedActivities.size));
activityProgressFill.style.width = `${completedActivities.size * 20}%`;
updateJourney(document.querySelector(".page.is-visible")?.id || "beranda", false);