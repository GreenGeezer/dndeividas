const container = document.querySelector(".central-box");

// Show loading state
container.innerHTML =
  '<p style="text-align: center; color: var(--muted); padding: 2rem;">Loading potions data...</p>';

fetch("../../content/potions.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    // Clear loading state
    container.innerHTML = "";

    // Add page title
    const title = document.createElement("h1");
    title.textContent = "Potions & Elixirs";
    title.style.cssText =
      "color: var(--highlight); text-align: center; margin-bottom: 2rem; font-family: var(--font-bold);";
    container.appendChild(title);

    // Create potions grid
    const potionsGrid = document.createElement("div");
    potionsGrid.style.cssText = "display: grid; gap: 1.5rem;";

    data.potions.forEach((potion) => {
      // Skip incomplete entries
      if (
        !potion.title ||
        potion.title.includes(".md") ||
        !potion.description
      ) {
        return;
      }

      const card = document.createElement("div");
      card.className = "potion-card";
      card.style.cssText = `
        background: linear-gradient(180deg, #111 0%, var(--bg) 70%);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
        transition: transform 0.2s, box-shadow 0.2s;
      `;

      // Card header
      const header = document.createElement("div");
      header.style.cssText = `
        padding: 16px 20px;
        background: rgba(30, 30, 30, 0.9);
        border-bottom: 2px solid var(--border);
      `;

      const titleEl = document.createElement("h2");
      titleEl.textContent = potion.title;
      titleEl.style.cssText =
        "margin: 0 0 8px 0; color: var(--highlight); font-family: var(--font-bold); font-size: 1.3rem;";

      const cost = document.createElement("div");
      cost.textContent = `Cost: ${potion.cost}`;
      cost.style.cssText =
        "color: var(--muted); font-family: var(--font-text); font-size: 0.9rem;";

      header.appendChild(titleEl);
      header.appendChild(cost);
      card.appendChild(header);

      // Card body
      const body = document.createElement("div");
      body.style.cssText = "padding: 20px;";

      // Brief description preview
      const preview = document.createElement("p");
      preview.textContent =
        potion.description.slice(0, 120) +
        (potion.description.length > 120 ? "..." : "");
      preview.style.cssText =
        "color: var(--muted); font-family: var(--font-text); margin: 0 0 12px 0; line-height: 1.6; font-size: 0.9rem;";
      body.appendChild(preview);

      // Toggle button
      const toggleContainer = document.createElement("div");
      toggleContainer.className = "t-toggle-container";
      toggleContainer.style.cssText = "margin-top: 12px; text-align: center;";

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "t-toggle-btn";
      toggleBtn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 8px 16px;
        background: rgba(30, 30, 30, 0.9);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        font-family: var(--font-bold);
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
      `;

      const toggleText = document.createElement("span");
      toggleText.textContent = "View Details";

      const toggleArrow = document.createElement("span");
      toggleArrow.textContent = "▼";
      toggleArrow.style.cssText = "transition: transform 0.2s;";

      toggleBtn.appendChild(toggleText);
      toggleBtn.appendChild(toggleArrow);
      toggleContainer.appendChild(toggleBtn);
      body.appendChild(toggleContainer);

      // Detailed content (hidden by default)
      const detailsContent = document.createElement("div");
      detailsContent.style.cssText =
        "display: none; padding-top: 16px; border-top: 1px solid #222; margin-top: 16px;";

      // Full Description
      const descSection = document.createElement("div");
      descSection.style.cssText = "margin-bottom: 16px;";

      const descLabel = document.createElement("h3");
      descLabel.textContent = "Description";
      descLabel.style.cssText =
        "color: var(--text); font-family: var(--font-bold); font-size: 1rem; margin: 0 0 8px 0;";

      const descText = document.createElement("p");
      descText.textContent = potion.description;
      descText.style.cssText =
        "color: var(--muted); font-family: var(--font-text); margin: 0; line-height: 1.6;";

      descSection.appendChild(descLabel);
      descSection.appendChild(descText);
      detailsContent.appendChild(descSection);

      // Acquisition
      if (potion.aquisition) {
        const acqSection = document.createElement("div");
        acqSection.style.cssText =
          "margin-bottom: 16px; padding: 12px; background: rgba(20, 20, 20, 0.9); border-radius: 8px; border-left: 3px solid var(--highlight);";

        const acqLabel = document.createElement("h3");
        acqLabel.textContent = "Acquisition";
        acqLabel.style.cssText =
          "color: var(--highlight); font-family: var(--font-bold); font-size: 0.95rem; margin: 0 0 8px 0;";

        const acqText = document.createElement("p");
        acqText.textContent = potion.aquisition;
        acqText.style.cssText =
          "color: var(--muted); font-family: var(--font-text); margin: 0; line-height: 1.5; font-size: 0.9rem;";

        acqSection.appendChild(acqLabel);
        acqSection.appendChild(acqText);
        detailsContent.appendChild(acqSection);
      }

      // Effect
      if (potion.effect) {
        const effectSection = document.createElement("div");
        effectSection.style.cssText =
          "padding: 12px; background: rgba(0, 100, 0, 0.1); border-radius: 8px; border-left: 3px solid #22c55e;";

        const effectLabel = document.createElement("h3");
        effectLabel.textContent = "Effect";
        effectLabel.style.cssText =
          "color: #22c55e; font-family: var(--font-bold); font-size: 0.95rem; margin: 0 0 8px 0;";

        const effectText = document.createElement("p");
        effectText.textContent = potion.effect;
        effectText.style.cssText =
          "color: var(--text); font-family: var(--font-text); margin: 0; line-height: 1.5; font-size: 0.9rem;";

        effectSection.appendChild(effectLabel);
        effectSection.appendChild(effectText);
        detailsContent.appendChild(effectSection);
      }

      body.appendChild(detailsContent);
      card.appendChild(body);

      // Toggle functionality
      toggleBtn.addEventListener("click", () => {
        if (detailsContent.style.display === "none") {
          detailsContent.style.display = "block";
          toggleText.textContent = "Hide Details";
          toggleArrow.style.transform = "rotate(180deg)";
          toggleBtn.style.background = "rgba(250, 204, 21, 0.1)";
          toggleBtn.style.borderColor = "var(--highlight)";
          toggleBtn.style.color = "var(--highlight)";
        } else {
          detailsContent.style.display = "none";
          toggleText.textContent = "View Details";
          toggleArrow.style.transform = "rotate(0deg)";
          toggleBtn.style.background = "rgba(30, 30, 30, 0.9)";
          toggleBtn.style.borderColor = "var(--border)";
          toggleBtn.style.color = "var(--text)";
        }
      });
      potionsGrid.appendChild(card);

      // Add hover effect
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-4px)";
        card.style.boxShadow = "0 12px 28px rgba(0, 0, 0, 0.8)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)";
        card.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.6)";
      });
    });

    container.appendChild(potionsGrid);
  })
  .catch((err) => {
    console.error("Failed to load potions.json:", err);
    container.innerHTML =
      '<p style="text-align: center; color: #ef4444; padding: 2rem;">Failed to load potions data. Please refresh the page.</p>';
  });
