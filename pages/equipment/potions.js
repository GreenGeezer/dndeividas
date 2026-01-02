const container = document.querySelector(".central-box");

// Show loading state
container.innerHTML = '<p class="loading-message">Loading potions data...</p>';

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
    title.className = "page-title";
    title.textContent = "Potions & Elixirs";
    container.appendChild(title);

    // Helper function to parse cost to GP
    function parseToGP(costStr) {
      if (!costStr) return 0;
      const match = costStr.match(/([\d.]+)\s*(gp|sp)/i);
      if (!match) return 0;
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      return unit === "sp" ? value / 100 : value;
    }

    // Helper function to determine rarity
    function getRarity(costGP) {
      if (costGP <= 5) return "Common";
      if (costGP <= 50) return "Uncommon";
      if (costGP <= 200) return "Rare";
      if (costGP <= 1000) return "Very Rare";
      return "Legendary";
    }

    // Filter valid potions and categorize by rarity
    const validPotions = data.potions.filter(
      (p) => p.title && !p.title.includes(".md") && p.description
    );

    const potionsByRarity = {
      Common: [],
      Uncommon: [],
      Rare: [],
      "Very Rare": [],
      Legendary: [],
    };

    validPotions.forEach((potion) => {
      const costGP = parseToGP(potion.cost);
      const rarity = getRarity(costGP);
      potionsByRarity[rarity].push(potion);
    });

    // Sort alphabetically within each rarity
    Object.keys(potionsByRarity).forEach((rarity) => {
      potionsByRarity[rarity].sort((a, b) => a.title.localeCompare(b.title));
    });

    // Create tabs
    const tabContainer = document.createElement("div");
    tabContainer.style.cssText =
      "display: flex; gap: 8px; margin-bottom: 2rem; flex-wrap: wrap; justify-content: center;";

    const rarities = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"];
    const tabContents = {};

    rarities.forEach((rarity, index) => {
      const count = potionsByRarity[rarity].length;
      if (count === 0) return;

      const tab = document.createElement("button");
      tab.textContent = `${rarity} (${count})`;
      tab.style.cssText = `
        padding: 10px 20px;
        background: rgba(30, 30, 30, 0.9);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        font-family: var(--font-bold);
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
      `;

      tab.addEventListener("mouseenter", () => {
        if (!tab.classList.contains("active")) {
          tab.style.background = "rgba(40, 40, 40, 0.9)";
        }
      });
      tab.addEventListener("mouseleave", () => {
        if (!tab.classList.contains("active")) {
          tab.style.background = "rgba(30, 30, 30, 0.9)";
        }
      });

      tab.addEventListener("click", () => {
        // Hide all content
        Object.values(tabContents).forEach((content) => {
          content.style.display = "none";
        });
        // Remove active state from all tabs
        tabContainer.querySelectorAll("button").forEach((btn) => {
          btn.classList.remove("active");
          btn.style.background = "rgba(30, 30, 30, 0.9)";
          btn.style.borderColor = "var(--border)";
          btn.style.color = "var(--text)";
        });
        // Show selected content
        tabContents[rarity].style.display = "grid";
        // Add active state
        tab.classList.add("active");
        tab.style.background = "rgba(250, 204, 21, 0.1)";
        tab.style.borderColor = "var(--highlight)";
        tab.style.color = "var(--highlight)";
      });

      // Set first tab as active
      if (index === 0 || (index > 0 && Object.keys(tabContents).length === 0)) {
        tab.classList.add("active");
        tab.style.background = "rgba(250, 204, 21, 0.1)";
        tab.style.borderColor = "var(--highlight)";
        tab.style.color = "var(--highlight)";
      }

      tabContainer.appendChild(tab);

      // Create content for this rarity
      const content = document.createElement("div");
      content.style.cssText = "display: grid; gap: 1.5rem;";
      if (Object.keys(tabContents).length > 0) {
        content.style.display = "none";
      }
      tabContents[rarity] = content;
    });

    container.appendChild(tabContainer);

    // Create cards for each rarity
    rarities.forEach((rarity) => {
      if (!tabContents[rarity]) return;

      potionsByRarity[rarity].forEach((potion) => {
        // Skip incomplete entries
        if (
          !potion.title ||
          potion.title.includes(".md") ||
          !potion.description
        ) {
          return;
        }

        const card = document.createElement("div");
        card.className = "material-card";

        // Card header
        const header = document.createElement("div");
        header.className = "material-header";

        const titleEl = document.createElement("h2");
        titleEl.className = "material-title";
        titleEl.textContent = potion.title;

        const cost = document.createElement("div");
        cost.textContent = `Cost: ${potion.cost}`;
        cost.style.cssText =
          "color: var(--muted); font-family: var(--font-text); font-size: 0.9rem; margin-top: 8px;";

        header.appendChild(titleEl);
        header.appendChild(cost);
        card.appendChild(header);

        // Card body
        const body = document.createElement("div");
        body.className = "material-body";

        // Description (always visible)
        const descSection = document.createElement("div");
        descSection.className = "material-section";
        descSection.style.cssText = "margin-bottom: 12px;";

        const descText = document.createElement("p");
        descText.className = "material-section-text";
        descText.textContent = potion.description;

        descSection.appendChild(descText);
        body.appendChild(descSection);

        // Toggle button for details
        const toggleContainer = document.createElement("div");
        toggleContainer.className = "t-toggle-container";

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "t-toggle-btn";

        const toggleText = document.createElement("span");
        toggleText.textContent = "View Details";

        const toggleArrow = document.createElement("span");
        toggleArrow.className = "t-toggle-arrow";
        toggleArrow.textContent = "▼";

        toggleBtn.appendChild(toggleText);
        toggleBtn.appendChild(toggleArrow);
        toggleContainer.appendChild(toggleBtn);
        body.appendChild(toggleContainer);

        // Detailed content (hidden by default)
        const detailsContent = document.createElement("div");
        detailsContent.className = "material-details";

        // Effect
        if (potion.effect) {
          const effectSection = document.createElement("div");
          effectSection.className = "material-armor-effect";

          const effectLabel = document.createElement("h3");
          effectLabel.className = "material-effect-title";
          effectLabel.textContent = "Effect";

          const effectText = document.createElement("p");
          effectText.className = "material-effect-text";
          effectText.textContent = potion.effect;

          effectSection.appendChild(effectLabel);
          effectSection.appendChild(effectText);
          detailsContent.appendChild(effectSection);
        }

        // Acquisition
        if (potion.aquisition) {
          const acqSection = document.createElement("div");
          acqSection.style.cssText =
            "margin-bottom: 16px; padding: 12px; background: rgba(20, 20, 20, 0.9); border-radius: 8px; border-left: 3px solid var(--highlight);";

          const acqLabel = document.createElement("h3");
          acqLabel.style.cssText =
            "color: var(--highlight); font-family: var(--font-bold); font-size: 0.95rem; margin: 0 0 8px 0;";
          acqLabel.textContent = "Acquisition";

          const acqText = document.createElement("p");
          acqText.style.cssText =
            "color: var(--muted); font-family: var(--font-text); margin: 0; line-height: 1.5; font-size: 0.9rem;";
          acqText.textContent = potion.aquisition;

          acqSection.appendChild(acqLabel);
          acqSection.appendChild(acqText);
          detailsContent.appendChild(acqSection);
        }

        body.appendChild(detailsContent);
        card.appendChild(body);

        // Toggle functionality
        toggleBtn.addEventListener("click", () => {
          if (detailsContent.classList.contains("active")) {
            detailsContent.classList.remove("active");
            toggleBtn.classList.remove("active");
            toggleText.textContent = "View Details";
            toggleArrow.style.transform = "rotate(0deg)";
          } else {
            detailsContent.classList.add("active");
            toggleBtn.classList.add("active");
            toggleText.textContent = "Hide Details";
            toggleArrow.style.transform = "rotate(180deg)";
          }
        });

        tabContents[rarity].appendChild(card);
      });
    });

    // Append all tab contents to container
    Object.values(tabContents).forEach((content) => {
      container.appendChild(content);
    });
  })
  .catch((err) => {
    console.error("Failed to load potions.json:", err);
    container.innerHTML =
      '<p class="error-message">Failed to load potions data. Please refresh the page.</p>';
  });
