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

function renderCard(data) {
  const row = document.getElementById("transformations-row");
  const card = document.createElement("article");
  card.className = "t-card";

  // optional: data.image (add this property in JSON if you have art)
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
      <div class="t-level">Levels: ${
        data.transformation_levels?.length || 0
      }</div>

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

      <div class="t-badges" title="Signature boons from Level 1">
        ${
          (data.transformation_levels?.[0]?.boons || [])
            .slice(0, 3)
            .map((b) => `<span class="t-badge">${b.name}</span>`)
            .join("") || ""
        }
      </div>

      <div class="t-line">${truncate(
        firstSentence(data.becoming || ""),
        120
      )}</div>
    </div>
  `;

  row.appendChild(card);
}

async function boot() {
  const results = await Promise.all(
    transformationFiles.map((path) =>
      fetch(path)
        .then((r) => r.json())
        .catch(() => null)
    )
  );
  results.filter(Boolean).forEach(renderCard);
}

document.addEventListener("DOMContentLoaded", boot);
