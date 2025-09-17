// Enhanced Transformations JavaScript - Supports multiple transformations per file

// You can list multiple JSON files here if you like.
const transformationFiles = ["/content/transformations.json"];

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len - 1).trimEnd() + "…" : str;
}

function firstSentence(text) {
  if (!text) return "";
  const m = text.match(/.*?[.?!](\s|$)/);
  return (m ? m[0] : text).trim();
}

// Accepts any of:
//   { ...one transformation object... }
//   [ {...}, {...} ]
//   { transformations: [ {...}, {...} ] }
function pickTransformations(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.transformations)) return json.transformations;
  return [json];
}

function createDetailedView(data) {
  return `
    <div class="t-detailed-content" style="display: none;">
      <div class="t-description">${
        data.becoming || "No description available."
      }</div>

      <div class="t-save-dc">Save DC: ${data.features?.save_dc || "—"}</div>

      <div class="t-prereq">
        <div class="t-prereq-title">Prerequisites</div>
        <div class="t-prereq-content">
          <strong>Ability Scores:</strong>
          ${
            data.features?.prerequisites?.ability_scores || "None specified"
          }<br>
          <strong>Acquisition:</strong>
          ${
            data.features?.prerequisites?.acquisition ||
            "No acquisition method specified."
          }
        </div>
      </div>

      ${
        data.features?.level_milestones?.length
          ? `
        <div class="t-milestones">
          <div class="t-milestones-header" onclick="toggleMilestones(this)">
            <span class="t-milestones-title">Level Milestones</span>
            <span class="t-level-arrow">▼</span>
          </div>
          <div class="t-milestones-content">
            ${data.features.level_milestones
              .map(
                (milestone) => `
              <div class="t-milestone">
                <div class="t-milestone-bullet"></div>
                <div class="t-milestone-text">${milestone}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }

      <div class="t-levels">
        ${(data.transformation_levels || [])
          .map(
            (level) => `
          <div class="t-level-header" onclick="toggleLevel(this)">
            <span class="t-level-title">Level ${level.level}</span>
            <span class="t-level-arrow">▼</span>
          </div>
          <div class="t-level-content">
            <div class="t-abilities">
              ${(level.boons || [])
                .map(
                  (boon) => `
                <div class="t-ability t-boon">
                  <div class="t-ability-name">${boon.name}${
                    boon.prerequisite ? ` (Requires: ${boon.prerequisite})` : ""
                  }</div>
                  <div class="t-ability-effect">${boon.effect}</div>
                </div>
              `
                )
                .join("")}
              ${(level.flaws || [])
                .map(
                  (flaw) => `
                <div class="t-ability t-flaw">
                  <div class="t-ability-name">${flaw.name}</div>
                  <div class="t-ability-effect">${flaw.effect}</div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderCard(data) {
  const row = document.getElementById("transformations-row");
  const card = document.createElement("article");
  card.className = "t-card";

  const hasImage = !!data.image;

  card.innerHTML = `
    <div class="t-head">${(data.name || "Unknown").toUpperCase()}</div>
    <div class="t-hero">
      ${
        hasImage
          ? `<img alt="${data.name}" src="${data.image}">`
          : `<div class="t-monogram">${(data.name || "?").slice(0, 1)}</div>`
      }
    </div>
    <div class="t-panel">
      <div class="t-grid">
        <div class="t-cell">
          <div class="k">Save DC</div>
          <div class="v">${data.features?.save_dc || "—"}</div>
        </div>
        <div class="t-cell">
          <div class="k">Prereq</div>
          <div class="v">${truncate(
            data.features?.prerequisites?.ability_scores || "—",
            24
          )}</div>
        </div>
      </div>
      <div class="t-line">${truncate(
        firstSentence(data.becoming || ""),
        120
      )}</div>

      <div class="t-toggle-container">
        <button class="t-toggle-btn" onclick="toggleDetails(this)">
          <span class="t-toggle-text">View Details</span>
          <span class="t-toggle-arrow">▼</span>
        </button>
      </div>
    </div>

    ${createDetailedView(data)}
  `;

  row.appendChild(card);
}

function toggleDetails(button) {
  const card = button.closest(".t-card");
  const detailedContent = card.querySelector(".t-detailed-content");
  const toggleText = button.querySelector(".t-toggle-text");
  const toggleArrow = button.querySelector(".t-toggle-arrow");

  if (
    detailedContent.style.display === "none" ||
    !detailedContent.style.display
  ) {
    detailedContent.style.display = "block";
    toggleText.textContent = "Hide Details";
    toggleArrow.style.transform = "rotate(180deg)";
    button.classList.add("active");
  } else {
    detailedContent.style.display = "none";
    toggleText.textContent = "View Details";
    toggleArrow.style.transform = "rotate(0deg)";
    button.classList.remove("active");
  }
}

function toggleLevel(header) {
  header.classList.toggle("active");
  const content = header.nextElementSibling;
  content.classList.toggle("active");
}

function toggleMilestones(header) {
  header.classList.toggle("active");
  const content = header.nextElementSibling;
  content.classList.toggle("active");
}

async function boot() {
  const payloads = await Promise.all(
    transformationFiles.map((path) =>
      fetch(path)
        .then((r) => r.json())
        .catch((err) => {
          console.error(`Failed to load ${path}:`, err);
          return null;
        })
    )
  );

  const all = payloads.filter(Boolean).flatMap(pickTransformations);
  all.forEach(renderCard);
}

document.addEventListener("DOMContentLoaded", boot);
