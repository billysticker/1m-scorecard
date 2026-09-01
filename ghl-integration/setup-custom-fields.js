#!/usr/bin/env node
/**
 * Creates the $1M Scorecard contact custom fields in Go High Level.
 *
 * Verified against HighLevel API v2 (https://marketplace.gohighlevel.com/docs/):
 *   GET  /locations/:locationId/customFields?model=contact
 *   POST /locations/:locationId/customFields
 *
 * Base URL:  https://services.leadconnectorhq.com
 * Version:   2021-07-28
 * Auth:      Authorization: Bearer <PRIVATE_INTEGRATION_TOKEN>
 *
 * Required env:
 *   GHL_TOKEN         Private Integration token (contacts.write is not
 *                     required here; locations/customFields.readonly +
 *                     locations/customFields.write are).
 *   GHL_LOCATION_ID   Sub-account (location) ID
 *
 * Usage:
 *   GHL_TOKEN=pit-... GHL_LOCATION_ID=abc123 node setup-custom-fields.js
 */

const BASE_URL = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

const FIELDS = [
  { name: "1M Total Score", dataType: "NUMERICAL" },
  { name: "Numbers Score", dataType: "NUMERICAL" },
  { name: "Trust Score", dataType: "NUMERICAL" },
  { name: "Known Score", dataType: "NUMERICAL" },
  { name: "Found Score", dataType: "NUMERICAL" },
  { name: "Top Priority", dataType: "TEXT" },
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Version: API_VERSION,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function ghlFetch(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const detail = data?.message || data?.error || text || response.statusText;
    const error = new Error(`${method} ${path} → ${response.status}: ${detail}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function fieldLabel(field) {
  const id = field.id || "(no id)";
  const key = field.fieldKey || field.key || "(no fieldKey)";
  return `id=${id}  fieldKey=${key}`;
}

async function listContactFields(token, locationId) {
  const data = await ghlFetch(
    `/locations/${encodeURIComponent(locationId)}/customFields?model=contact`,
    { token },
  );
  return Array.isArray(data?.customFields) ? data.customFields : [];
}

async function createContactField(token, locationId, field) {
  const data = await ghlFetch(
    `/locations/${encodeURIComponent(locationId)}/customFields`,
    {
      token,
      method: "POST",
      body: {
        name: field.name,
        dataType: field.dataType,
        model: "contact",
      },
    },
  );
  return data?.customField || data?.field || data;
}

async function main() {
  const token = process.env.GHL_TOKEN?.trim();
  const locationId = process.env.GHL_LOCATION_ID?.trim();

  if (!token || !locationId) {
    fail(
      [
        "Missing GHL_TOKEN and/or GHL_LOCATION_ID.",
        "",
        "Example:",
        "  GHL_TOKEN=pit-... GHL_LOCATION_ID=abc123 node setup-custom-fields.js",
        "",
        "See ghl-integration/README.md for how to create a Private Integration token.",
      ].join("\n"),
    );
  }

  console.log(`Location ${locationId}`);
  console.log("Fetching existing contact custom fields…");

  let existing;
  try {
    existing = await listContactFields(token, locationId);
  } catch (error) {
    fail(
      `Could not list custom fields. Check the token, location ID, and scopes (locations/customFields.readonly).\n${error.message}`,
    );
  }

  const byName = new Map(
    existing
      .filter((field) => field?.name)
      .map((field) => [normalizeName(field.name), field]),
  );

  const results = [];

  for (const field of FIELDS) {
    const already = byName.get(normalizeName(field.name));
    if (already) {
      console.log(`SKIP  ${field.name} (already exists)  ${fieldLabel(already)}`);
      results.push({ ...field, status: "skipped", field: already });
      continue;
    }

    try {
      const created = await createContactField(token, locationId, field);
      byName.set(normalizeName(field.name), created);
      console.log(`CREATE ${field.name}  ${fieldLabel(created)}`);
      results.push({ ...field, status: "created", field: created });
    } catch (error) {
      if (field.dataType === "NUMERICAL" && (error.status === 400 || error.status === 422)) {
        try {
          const created = await createContactField(token, locationId, {
            ...field,
            dataType: "NUMBER",
          });
          byName.set(normalizeName(field.name), created);
          console.log(`CREATE ${field.name} (NUMBER)  ${fieldLabel(created)}`);
          results.push({ ...field, dataType: "NUMBER", status: "created", field: created });
          continue;
        } catch (retryError) {
          fail(`Could not create "${field.name}".\n${error.message}\n${retryError.message}`);
        }
      }
      fail(`Could not create "${field.name}".\n${error.message}`);
    }
  }

  console.log("\nContact custom fields ready:");
  console.log("────────────────────────────────────────────────────────");
  for (const result of results) {
    const field = result.field || {};
    console.log(
      `${field.name || result.name}\n  id:       ${field.id || ""}\n  fieldKey: ${field.fieldKey || field.key || ""}`,
    );
  }
  console.log("────────────────────────────────────────────────────────");
  console.log(
    "Paste each fieldKey into the n8n HTTP Request node if it differs from the workflow defaults (contact.1m_total_score, contact.numbers_score, contact.trust_score, contact.known_score, contact.found_score, contact.top_priority).",
  );
}

main().catch((error) => fail(error.stack || error.message));
