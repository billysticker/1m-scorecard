const CONFIG = {
  leadWebhookUrl: "https://billysticker.app.n8n.cloud/webhook/scorecard-lead",
  bookingUrl: "https://chirocandy.com/schedule/",
  trainingUrl: "https://go.chirocandy.com/next-1-million-training",
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

const RECOMMENDATIONS = {
  numbers: {
    low: {
      headline: "You're flying blind on the economics.",
      body: "You can't fix a leak you can't measure. Lifetime value, cost per new patient, show rate, and close rate are the four numbers that tell you whether marketing is the problem or the front desk is. Most practices at this score are blaming ads for a show-rate or close-rate issue.",
      services: ["Marketing Economics Audit (on your call)", "LTV & Close Rate Benchmarking"],
      ctaLabel: "Audit the economics first",
    },
    mid: {
      headline: "You know some numbers. Not the ones that matter most.",
      body: "You likely track new patients and collections but not cost per acquisition, show rate, or close percentage. Those are where the seven-figure offices find their next million.",
      services: ["Marketing Economics Audit (on your call)"],
      ctaLabel: "Fill the tracking gaps",
    },
    high: {
      headline: "You know your numbers. Now scale what's working.",
      body: "Offices at this level are ready to increase spend with confidence because they know exactly what a new patient is worth.",
      services: ["Growth Scaling Plan (on your call)"],
      ctaLabel: "Scale with confidence",
    },
  },
  trust: {
    low: {
      headline: "Your community doesn't have a reason to trust you yet.",
      body: "Patients check reviews before choosing a doctor the same way they check Amazon before buying a $20 product. Leads that don't show up are almost always a trust problem, not an ad problem.",
      services: [
        "Review Generation & Reputation Management",
        "Video Testimonial Production",
        "Weekly Culture Content for Social",
      ],
      ctaLabel: "Build the trust file",
    },
    mid: {
      headline: "You have some trust signals. Competitors have more.",
      body: "A hundred reviews feels good until you see the office down the street with four hundred. Reviews should be a weekly KPI, and testimonials and team content should be showing your culture every week.",
      services: ["Review Generation & Reputation Management", "Video Testimonial Production"],
      ctaLabel: "Outpace the office down the street",
    },
    high: {
      headline: "Trust is your strength. Protect it and amplify it.",
      body: "Keep reviews on the weekly scoreboard and put your culture on camera so every touchpoint reinforces what people already believe about you.",
      services: ["Weekly Culture Content for Social"],
      ctaLabel: "Protect and amplify trust",
    },
  },
  known: {
    low: {
      headline: "Your community's folder on you is nearly empty.",
      body: "Every potential patient has a mental folder with your name on it, and right now there's almost nothing in it. Docs twenty years in still hear \"I didn't know you were here.\" This is the biggest reason discounted offers stop working.",
      services: [
        "Weekly Video Content Program",
        "Meta (Facebook & Instagram) Ads + Content",
        "Community Event Strategy",
        "Invisible Intent Direct Mail",
      ],
      ctaLabel: "Fill the mental folder",
    },
    mid: {
      headline: "People have heard of you. They don't think of you first.",
      body: "You're doing some content or some ads, but not consistently enough to become the name already in their head. One video a week promoted to your community is the minimum for seven-figure offices.",
      services: [
        "Weekly Video Content Program",
        "Meta (Facebook & Instagram) Ads + Content",
        "Streaming TV Ads (established offices)",
      ],
      ctaLabel: "Become the name they think of first",
    },
    high: {
      headline: "You're known. Now widen the net.",
      body: "You've built the folder. High-intent data targeting and streaming TV let you reach the people in your community most likely to need care next.",
      services: ["High-Intent Audience Targeting", "Streaming TV Ads"],
      ctaLabel: "Widen the net",
    },
  },
  found: {
    low: {
      headline: "When someone searches 'chiropractor near me,' you're invisible.",
      body: "The people searching Google, Maps, and AI are the most aware, highest-value patients in your community. Miss three a week at a $1,500 LTV and that's roughly $20K a month going to the office that did show up.",
      services: ["Local SEO & Google Maps 3-Pack Optimization", "Google Ads", "AI Search Visibility"],
      ctaLabel: "Show up when they search",
    },
    mid: {
      headline: "You show up sometimes. Seven-figure offices show up every time.",
      body: "The Maps 3-pack is the most valuable real estate on the internet for a local business. Strong SEO plus AI search visibility is how you own it.",
      services: ["Local SEO & Google Maps 3-Pack Optimization", "AI Search Visibility"],
      ctaLabel: "Own the Maps 3-pack",
    },
    high: {
      headline: "You're easy to find. Keep it that way.",
      body: "Rankings erode without ongoing work. AI search is the new front door and most practices haven't optimized for it yet.",
      services: ["AI Search Visibility"],
      ctaLabel: "Stay findable in AI search",
    },
  },
};

const scoreGrid = document.querySelector("#scoreGrid");
const totalScore = document.querySelector("#totalScore");
const toolbarScore = document.querySelector("#toolbarScore");
const answeredCount = document.querySelector("#answeredCount");
const categoryResults = document.querySelector("#categoryResults");
const priorityOrder = document.querySelector("#priorityOrder");
const diagnosisText = document.querySelector("#diagnosisText");
const recommendationGrid = document.querySelector("#recommendationGrid");
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
  renderRecommendations(scores);
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getScoreBand(score) {
  if (score <= 4) return "low";
  if (score <= 7) return "mid";
  return "high";
}

function buildBookingUrl(scores) {
  const url = new URL(CONFIG.bookingUrl, window.location.href);
  const params = url.searchParams;
  const fullName = capturedLead
    ? [capturedLead.firstName, capturedLead.lastName].filter(Boolean).join(" ")
    : "";

  if (fullName) params.set("name", fullName);
  if (capturedLead?.email) params.set("email", capturedLead.email);
  params.set(
    "utm_content",
    `n${scores.numbers}-t${scores.trust}-k${scores.known}-f${scores.found}-${getTopPriority(scores)}`,
  );

  return url.toString();
}

function updateCtaLinks(scores) {
  const bookingHref = buildBookingUrl(scores);
  document.querySelectorAll("[data-booking-link]").forEach((link) => {
    link.href = bookingHref;
  });
  document.querySelectorAll("[data-training-link]").forEach((link) => {
    link.href = CONFIG.trainingUrl;
  });
}

function renderRecommendations(scores) {
  if (!recommendationGrid) return;

  const ranked = Object.keys(categories)
    .map((key) => [key, scores[key]])
    .sort((a, b) => a[1] - b[1]);
  const lowestKey = ranked[0][0];

  recommendationGrid.innerHTML = ranked
    .map(([key, score]) => {
      const band = getScoreBand(score);
      const rec = RECOMMENDATIONS[key][band];
      const isStart = key === lowestKey;

      return `
        <article class="recommendation-card${isStart ? " recommendation-card-start" : ""}" data-band="${band}">
          <header class="recommendation-card-head">
            <div>
              <p class="recommendation-kicker">${escapeHtml(categories[key].name)} · ${score}/10</p>
              <h4>${escapeHtml(rec.headline)}</h4>
            </div>
            <div class="recommendation-tags">
              ${isStart ? `<span class="start-here-tag">Start Here</span>` : ""}
              <span class="rec-badge rec-badge-${band}">${band}</span>
            </div>
          </header>
          <p class="recommendation-body">${escapeHtml(rec.body)}</p>
          <p class="recommendation-services-label">Services to focus on</p>
          <ul>
            ${rec.services.map((service) => `<li>${escapeHtml(service)}</li>`).join("")}
          </ul>
        </article>
      `;
    })
    .join("");

  updateCtaLinks(scores);
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
  updateCtaLinks(getScores());
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

if (new URLSearchParams(window.location.search).has("preview")) {
  previewResults();
}

function previewResults() {
  const sample = {
    numbers: [1, 1, 1, 1, 1],
    trust: [1, 1, 1, 1, 2],
    known: [2, 2, 2, 1, 1],
    found: [0, 1, 1, 1, 1],
  };

  Object.entries(sample).forEach(([key, values]) => {
    values.forEach((value, index) => {
      const input = document.querySelector(`input[name="${key}-${index}"][value="${value}"]`);
      if (input) input.checked = true;
    });
  });

  capturedLead = {
    firstName: "Preview",
    lastName: "Visitor",
    email: "preview@chirocandy.com",
    phone: "5551234567",
  };

  updateScore();
  showStep("results");
}
