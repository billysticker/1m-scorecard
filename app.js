const CONFIG = {
  leadWebhookUrl: "https://billysticker.app.n8n.cloud/webhook/scorecard-lead",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const categories = {
  numbers: {
    name: "NUMBERS",
    sub: "Can you see it?",
    items: [
      "Patient lifetime value is documented and current.",
      "CAC is tracked by marketing source.",
      "Lead-to-scheduled rate is measured.",
      "Show-to-start conversion is measured.",
      "Retention, reactivation, and referrals are tracked.",
    ],
  },
  trust: {
    name: "TRUST",
    sub: "Do they believe?",
    items: [
      "Recent reviews arrive consistently.",
      "Review volume and rating support market leadership.",
      "The website and Maps profile prove authority.",
      "Doctor, team, and office culture are visible.",
      "Response time and follow-up build confidence.",
    ],
  },
  known: {
    name: "KNOWN",
    sub: "Do they remember?",
    items: [
      "The practice reaches the market consistently.",
      "Video and paid media create familiarity.",
      "Retargeting builds useful frequency.",
      "Community presence reinforces recognition.",
      "Content keeps the practice mentally available.",
    ],
  },
  found: {
    name: "FOUND",
    sub: "Can they find you?",
    items: [
      "The practice is competitive in Google Maps.",
      "Google Ads captures immediate demand.",
      "SEO covers services, conditions, and locations.",
      "The practice appears in relevant AI answers.",
      "Calls, forms, and landing pages are tracked.",
    ],
  },
};

const scoreGrid = document.querySelector("#scoreGrid");
const totalScore = document.querySelector("#totalScore");
const toolbarScore = document.querySelector("#toolbarScore");
const answeredCount = document.querySelector("#answeredCount");
const categoryResults = document.querySelector("#categoryResults");
const priorityOrder = document.querySelector("#priorityOrder");
const diagnosisText = document.querySelector("#diagnosisText");
const ltvInput = document.querySelector("#ltv");
const patientsInput = document.querySelector("#patients");
const annualInput = document.querySelector("#annual");
const calculatorNote = document.querySelector("#calculatorNote");
const viewResultsButton = document.querySelector("#viewResultsButton");
const completionMessage = document.querySelector("#completionMessage");
const leadCaptureForm = document.querySelector("#leadCaptureForm");
const captureError = document.querySelector("#captureError");
const submitLeadButton = document.querySelector("#submitLeadButton");
const firstNameInput = document.querySelector("#firstName");
const lastNameInput = document.querySelector("#lastName");
const emailInput = document.querySelector("#email");
const phoneInput = document.querySelector("#phone");

let capturedLead = null;

function showStep(step) {
  document.querySelectorAll("[data-screen]").forEach((screen) => {
    screen.hidden = screen.dataset.screen !== step;
  });
  document.body.dataset.step = step;
  window.scrollTo({ top: 0, behavior: "smooth" });

  const heading = document.querySelector(`[data-screen="${step}"] h1, [data-screen="${step}"] h2`);
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}

function buildScorecard() {
  scoreGrid.innerHTML = Object.entries(categories)
    .map(
      ([key, category], categoryIndex) => `
        <fieldset class="category">
          <legend class="sr-only">${category.name}</legend>
          <div class="cat-head">
            <div class="cat-title">
              <span class="num">0${categoryIndex + 1}</span>
              <span class="cat-name">${category.name}</span>
            </div>
            <span class="cat-score" id="score-${key}">0/10</span>
          </div>
          ${category.items
            .map(
              (item, itemIndex) => `
                <div class="statement">
                  <p id="question-${key}-${itemIndex}">${item}</p>
                  <div class="choices" role="radiogroup" aria-labelledby="question-${key}-${itemIndex}">
                    ${[0, 1, 2]
                      .map(
                        (value) => `
                          <input type="radio" name="${key}-${itemIndex}" id="${key}-${itemIndex}-${value}" value="${value}" />
                          <label for="${key}-${itemIndex}-${value}">${value === 0 ? "NO" : value === 1 ? "PART" : "YES"}</label>
                        `,
                      )
                      .join("")}
                  </div>
                </div>
              `,
            )
            .join("")}
        </fieldset>
      `,
    )
    .join("");

  scoreGrid.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener("change", updateScore);
  });
}

function getScores() {
  const scores = {};

  for (const key of Object.keys(categories)) {
    let categoryScore = 0;
    for (let itemIndex = 0; itemIndex < 5; itemIndex += 1) {
      const answer = document.querySelector(`input[name="${key}-${itemIndex}"]:checked`);
      categoryScore += answer ? Number(answer.value) : 0;
    }
    scores[key] = categoryScore;
  }

  return scores;
}

function updateScore() {
  const scores = getScores();
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const answered = document.querySelectorAll('.choices input[type="radio"]:checked').length;

  totalScore.textContent = `${total}/40`;
  toolbarScore.textContent = `${total}/40`;
  answeredCount.textContent = `${answered} of 20 answered`;
  viewResultsButton.disabled = answered !== 20;
  completionMessage.textContent =
    answered === 20
      ? "Scorecard complete. Your diagnosis is ready."
      : `Answer ${20 - answered} more ${20 - answered === 1 ? "statement" : "statements"} to view your results.`;

  for (const [key, score] of Object.entries(scores)) {
    document.querySelector(`#score-${key}`).textContent = `${score}/10`;
  }

  categoryResults.innerHTML = Object.entries(scores)
    .map(
      ([key, score]) => `
        <div class="category-result">
          <div class="category-result-label">
            <span>${categories[key].name}</span>
            <span>${score}/10</span>
          </div>
          <div class="band" role="progressbar" aria-label="${categories[key].name} score" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${score}">
            <div style="width: ${score * 10}%"></div>
          </div>
        </div>
      `,
    )
    .join("");

  const sortedScores = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  priorityOrder.innerHTML = sortedScores
    .map(
      ([key], index) => `
        <div>
          <small>0${index + 1}</small>
          <b>${categories[key].name}</b>
        </div>
      `,
    )
    .join("");

  const [lowestKey] = sortedScores[0];
  const band =
    total >= 32
      ? "Growth-ready"
      : total >= 24
        ? "Strong practice with meaningful leakage"
        : total >= 16
          ? "Major growth gaps"
          : "Foundation gaps";

  diagnosisText.textContent = `${band}. First diagnostic: ${categories[lowestKey].name}. ${categories[lowestKey].sub}`;
}

function numberValue(input) {
  const value = Number(input.value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function formatFlexibleNumber(value) {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });
}

function updatePatientsFromAnnual() {
  const ltv = numberValue(ltvInput);
  const annual = numberValue(annualInput);
  const exactPatients = ltv > 0 ? annual / ltv / 12 : 0;
  const wholePatients = Math.ceil(exactPatients);

  patientsInput.value = formatFlexibleNumber(exactPatients);
  calculatorNote.textContent =
    ltv > 0 && annual > 0
      ? `${formatFlexibleNumber(exactPatients)} patients per month — round up to ${wholePatients.toLocaleString("en-US")} whole patients to reach the annual goal.`
      : "Enter an annual opportunity and patient value to calculate the monthly patient target.";
}

function updateAnnualFromPatients() {
  const ltv = numberValue(ltvInput);
  const patients = numberValue(patientsInput);
  const annual = ltv * patients * 12;

  annualInput.value = annual ? Math.round(annual).toLocaleString("en-US") : "0";
  const wholePatients = Math.ceil(patients);
  calculatorNote.textContent = annual
    ? `${formatFlexibleNumber(patients)} patients per month produces ${annual.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} in annual opportunity${Number.isInteger(patients) ? "." : `; round up to ${wholePatients} whole patients.`}`
    : "Enter an annual opportunity and patient value to calculate the monthly patient target.";
}

function normalizeCurrencyInput(input) {
  const value = numberValue(input);
  input.value = value ? value.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "0";
}

function getTopPriority(scores) {
  const [lowestKey] = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];
  return categories[lowestKey].name;
}

function readContactFromForm() {
  return {
    firstName: firstNameInput.value.trim(),
    lastName: lastNameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
  };
}

function validateContact(contact) {
  if (!contact.firstName) return "Enter your first name.";
  if (!contact.lastName) return "Enter your last name.";
  if (!contact.email || !EMAIL_PATTERN.test(contact.email)) return "Enter a valid email address.";
  if (contact.phone.replace(/\D/g, "").length < 7) return "Enter a valid phone number.";
  return "";
}

function showCaptureError(message) {
  captureError.hidden = !message;
  captureError.textContent = message || "";
}

function buildLeadPayload(contact) {
  const scores = getScores();
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);

  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    totalScore: total,
    numbersScore: scores.numbers,
    trustScore: scores.trust,
    knownScore: scores.known,
    foundScore: scores.found,
    topPriority: getTopPriority(scores),
    source: "1m-scorecard",
    submittedAt: new Date().toISOString(),
  };
}

async function submitLeadAndShowResults({ fromForm = false } = {}) {
  const contact = fromForm ? readContactFromForm() : capturedLead;
  if (!contact) return;

  if (fromForm) {
    const error = validateContact(contact);
    if (error) {
      showCaptureError(error);
      return;
    }
  }

  showCaptureError("");

  if (fromForm) {
    submitLeadButton.disabled = true;
    submitLeadButton.textContent = "Saving…";
  }

  if (CONFIG.leadWebhookUrl) {
    try {
      const response = await fetch(CONFIG.leadWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildLeadPayload(contact)),
      });
      if (!response.ok) {
        throw new Error(`Webhook responded ${response.status}`);
      }
    } catch {
      showCaptureError("We couldn't save your details. Check your connection and try again.");
      if (!fromForm) showStep("capture");
      submitLeadButton.disabled = false;
      submitLeadButton.textContent = "See My Results →";
      return;
    }
  }

  capturedLead = contact;
  submitLeadButton.disabled = false;
  submitLeadButton.textContent = "See My Results →";
  showStep("results");
}

function resetScorecard({ returnToWelcome = false } = {}) {
  document.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.checked = false;
  });
  ltvInput.value = "2,500";
  patientsInput.value = "34";
  annualInput.value = "1,020,000";
  capturedLead = null;
  leadCaptureForm.reset();
  showCaptureError("");
  submitLeadButton.disabled = false;
  submitLeadButton.textContent = "See My Results →";
  updateScore();
  updatePatientsFromAnnual();
  if (returnToWelcome) {
    showStep("welcome");
  } else if (document.body.dataset.step === "capture") {
    showStep("score");
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

ltvInput.addEventListener("input", updatePatientsFromAnnual);
annualInput.addEventListener("input", updatePatientsFromAnnual);
patientsInput.addEventListener("input", updateAnnualFromPatients);

[ltvInput, annualInput].forEach((input) => {
  input.addEventListener("focus", () => {
    input.value = String(numberValue(input) || "");
    input.select();
  });
  input.addEventListener("blur", () => {
    normalizeCurrencyInput(input);
    updatePatientsFromAnnual();
  });
});

patientsInput.addEventListener("focus", () => {
  patientsInput.value = String(numberValue(patientsInput) || "");
  patientsInput.select();
});

document.querySelector("#getStartedButton").addEventListener("click", () => {
  const iframe = document.querySelector("#welcomeVideo");
  iframe?.contentWindow?.postMessage(JSON.stringify({ method: "pause" }), "https://player.vimeo.com");
  showStep("score");
});
document.querySelector("#backToWelcomeButton").addEventListener("click", () => showStep("welcome"));
document.querySelector("#viewResultsButton").addEventListener("click", () => {
  if (viewResultsButton.disabled) return;
  if (capturedLead) {
    void submitLeadAndShowResults();
    return;
  }
  showCaptureError("");
  showStep("capture");
});
document.querySelector("#backToScoreFromCaptureButton").addEventListener("click", () => showStep("score"));
leadCaptureForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void submitLeadAndShowResults({ fromForm: true });
});
document.querySelector("#backToScoreButton").addEventListener("click", () => showStep("score"));
document.querySelector("#editScoreButton").addEventListener("click", () => showStep("score"));
document.querySelector("#resetButton").addEventListener("click", () => resetScorecard());
document.querySelector("#startOverButton").addEventListener("click", () =>
  resetScorecard({ returnToWelcome: true }),
);
document.querySelector("#printButton").addEventListener("click", () => window.print());
document.querySelector("#resultPrintButton").addEventListener("click", () => window.print());

buildScorecard();
normalizeCurrencyInput(ltvInput);
normalizeCurrencyInput(annualInput);
updateScore();
updatePatientsFromAnnual();
