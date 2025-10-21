import dayjs from "dayjs";

const SECONDS_PER_QUESTION = 300; // 5 minutes

// Quiz data (refined from your list, with fixed wording and clear MCQs)
const QUESTIONS = [
  {
    text: "Which two processes comprise cell division in eukaryotes?",
    options: ["Karyokinesis and cytokinesis", "S phase and G2 phase", "Anaphase and telophase", "Prophase and metaphase"],
    correctIndex: 0,
    hint: "One divides the nucleus; the other divides the cytoplasm."
  },
  {
    text: "Identify the stage shown in the image:",
    image: {
      url: "https://images.unsplash.com/photo-1532186651190-4f3a9b1f0f9c?q=80&w=1280&auto=format&fit=crop",
      caption: "Light micrograph of dividing cells"
    },
    options: ["Interphase", "Metaphase", "Anaphase", "Telophase"],
    correctIndex: 1,
    hint: "Chromosomes align at the equatorial plate."
  },
  {
    text: "Where does karyokinesis occur?",
    options: ["In the nucleus", "In the cytoplasm", "In the mitochondria", "In the ribosome"],
    correctIndex: 0
  },
  {
    text: "Where does cytokinesis occur?",
    options: ["In the nucleus", "In the cytoplasm", "In the nucleolus", "In the centromere"],
    correctIndex: 1
  },
  {
    text: "During interphase, chromatin is typically:",
    options: ["Coiled, compact, and highly condensed", "Uncoiled and dispersed", "Attached to the spindle", "Visible as sister chromatids only"],
    correctIndex: 1
  },
  {
    text: "Which is NOT a purpose of mitosis?",
    options: ["Development and growth", "Wound healing", "Cell replacement", "Producing gametes"],
    correctIndex: 3
  },
  {
    text: "Loss of control over cell division in somatic cells can result in:",
    options: ["Apoptosis", "Tumor formation", "Meiosis", "Differentiation"],
    correctIndex: 1
  },
  {
    text: "The centrosomes are primarily responsible for:",
    options: [
      "Organizing cytoplasmic microtubules into spindle fibers",
      "Holding sister chromatids together",
      "DNA replication",
      "Cytokinesis in plant cells"
    ],
    correctIndex: 0
  },
  {
    text: "Cohesin proteins are important because they:",
    options: [
      "Anchor the spindle to the membrane",
      "Hold sister chromatids together",
      "Replicate DNA during S phase",
      "Cross the nuclear envelope"
    ],
    correctIndex: 1
  },
  {
    text: "DNA replication occurs during which interphase sub-phase?",
    options: ["G0", "G1", "S", "G2"],
    correctIndex: 2
  },
  {
    text: "Anaphase is characterized by:",
    options: [
      "Chromosomes condensing",
      "Chromosomes aligning at the equator",
      "Sister chromatids separating to opposite poles",
      "Nuclear envelope reforming"
    ],
    correctIndex: 2
  },
  {
    text: "Telophase involves:",
    options: [
      "A reversal of prophase events and nuclear reformation",
      "Spindle formation",
      "Chromosome alignment",
      "Chromatid cohesion"
    ],
    correctIndex: 0
  },
  {
    text: "Cytokinesis in animal cells typically proceeds via:",
    options: ["Cell plate formation", "Cleavage furrow formation", "Binary fission", "Synapsis"],
    correctIndex: 1
  },
  {
    text: "Cytokinesis in plant cells typically proceeds via:",
    options: ["Cleavage furrow", "Cell plate formation", "Budding", "Fragmentation"],
    correctIndex: 1
  },
  {
    text: "A duplicated chromosome consists of:",
    options: ["Two homologous chromosomes", "Two sister chromatids joined at a centromere", "Two non-sister chromatids", "One chromatid and one centrosome"],
    correctIndex: 1
  },
  {
    text: "Homologous chromosomes share which features?",
    options: [
      "Same genes at the same loci, similar length, same centromere position",
      "Identical DNA sequence",
      "Attached by cohesin",
      "Always remain paired in mitosis"
    ],
    correctIndex: 0
  },
  {
    text: "During early meiosis I, homologous chromosomes pair in a process called:",
    options: ["Synapsis involving the synaptonemal complex", "Cytokinesis", "Replication", "Segregation"],
    correctIndex: 0
  }
];

const els = {
  quiz: document.getElementById("quiz"),
  timer: document.getElementById("timer"),
  progressBar: document.getElementById("progressBar"),
  submitBtn: document.getElementById("submitBtn"),
  nextBtn: document.getElementById("nextBtn"),
  tpl: document.getElementById("questionTemplate")
};

let state = {
  index: 0,
  selected: null,
  score: 0,
  remaining: SECONDS_PER_QUESTION,
  intervalId: null,
  locked: false
};

function formatSeconds(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function setProgress() {
  const pct = ((state.index) / QUESTIONS.length) * 100;
  els.progressBar.style.width = `${pct}%`;
}

function startTimer() {
  stopTimer();
  state.remaining = SECONDS_PER_QUESTION;
  els.timer.textContent = formatSeconds(state.remaining);
  state.intervalId = setInterval(() => {
    state.remaining -= 1;
    els.timer.textContent = formatSeconds(state.remaining);
    if (state.remaining <= 0) {
      // skip if unanswered
      revealAndLock(null, timedOut=true);
    }
  }, 1000);
}

function stopTimer() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

function renderQuestion() {
  const q = QUESTIONS[state.index];
  els.quiz.innerHTML = "";
  const frag = document.importNode(els.tpl.content, true);

  frag.getElementById("qIndexPill").textContent = `Q${state.index + 1} / ${QUESTIONS.length}`;
  frag.getElementById("qText").textContent = q.text;

  const fig = frag.getElementById("qFigure");
  if (q.image?.url) {
    fig.hidden = false;
    const img = frag.getElementById("qImage");
    img.src = q.image.url;
    img.alt = q.image.caption || "Question image";
    frag.getElementById("qCaption").textContent = q.image.caption || "";
  } else {
    fig.hidden = true;
  }

  const list = frag.getElementById("options");
  q.options.forEach((opt, i) => {
    const li = document.createElement("li");
    li.className = "option";
    li.setAttribute("role", "option");
    li.setAttribute("tabindex", "0");
    li.dataset.index = i.toString();
    li.innerHTML = `<input aria-hidden="true" /> <span>${opt}</span>`;
    li.addEventListener("click", () => selectOption(i));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectOption(i);
      }
    });
    list.appendChild(li);
  });

  if (q.hint) {
    const hint = frag.getElementById("hint");
    hint.hidden = false;
    hint.textContent = "Hint: " + q.hint;
  }

  els.quiz.appendChild(frag);

  state.selected = null;
  state.locked = false;
  els.submitBtn.disabled = true;
  els.nextBtn.disabled = true;
  setProgress();
  startTimer();
}

function selectOption(i) {
  if (state.locked) return;
  state.selected = i;
  const options = els.quiz.querySelectorAll(".option");
  options.forEach((el, idx) => {
    el.setAttribute("aria-selected", idx === i ? "true" : "false");
  });
  els.submitBtn.disabled = false;
}

function revealAndLock(selectedIdx, timedOut=false) {
  if (state.locked) return;
  state.locked = true;
  stopTimer();

  const q = QUESTIONS[state.index];
  const options = els.quiz.querySelectorAll(".option");

  options.forEach((el, idx) => {
    el.classList.remove("correct", "incorrect");
    if (idx === q.correctIndex) el.classList.add("correct");
    if (selectedIdx !== null && idx === selectedIdx && selectedIdx !== q.correctIndex) {
      el.classList.add("incorrect");
    }
  });

  if (selectedIdx === q.correctIndex) {
    state.score += 1;
  }

  els.submitBtn.disabled = true;
  els.nextBtn.disabled = false;

  // Auto-advance after short delay if timed out
  if (timedOut) {
    setTimeout(nextQuestion, 1200);
  }
}

function nextQuestion() {
  state.index += 1;
  if (state.index >= QUESTIONS.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

function showResults() {
  stopTimer();
  els.progressBar.style.width = "100%";
  const total = QUESTIONS.length;
  const score = state.score;
  const percent = Math.round((score / total) * 100);

  els.quiz.innerHTML = `
    <div class="results" role="status">
      <h2 class="big">Your score: ${score} / ${total}</h2>
      <p class="sub">Accuracy: ${percent}%</p>
      <p class="sub">Press <kbd>R</kbd> to retry.</p>
    </div>
  `;

  els.submitBtn.disabled = true;
  els.nextBtn.disabled = true;
}

function resetQuiz() {
  state = { index: 0, selected: null, score: 0, remaining: SECONDS_PER_QUESTION, intervalId: null, locked: false };
  renderQuestion();
}

// Wire up buttons and keys
els.submitBtn.addEventListener("click", () => {
  if (state.selected === null) return;
  revealAndLock(state.selected);
});

els.nextBtn.addEventListener("click", nextQuestion);

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r" && (state.index >= QUESTIONS.length || state.locked)) {
    resetQuiz();
  }
});

// Initialize
renderQuestion();

