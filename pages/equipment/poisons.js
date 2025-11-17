const container = document.querySelector(".central-box");

// Show loading state
container.innerHTML =
  '<p style="text-align: center; color: var(--muted); padding: 2rem;">Loading poisons data...</p>';

fetch("../../content/poisons.json")
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
    title.textContent = "Poisons & Toxins";
    title.style.cssText =
      "color: var(--highlight); text-align: center; margin-bottom: 2rem; font-family: var(--font-bold);";
    container.appendChild(title);

    // Helper function to determine rarity based on market value
    function getRarity(marketValue) {
      if (!marketValue) return "Common";
      if (marketValue <= 5) return "Common";
      if (marketValue <= 50) return "Uncommon";
      if (marketValue <= 200) return "Rare";
      if (marketValue <= 1000) return "Very Rare";
      return "Legendary";
    }

    // Filter valid poisons and categorize by rarity
    const validPoisons = data.poisons.filter((p) => p.title && p.description);

    const poisonsByRarity = {
      Common: [],
      Uncommon: [],
      Rare: [],
      "Very Rare": [],
      Legendary: [],
    };

    validPoisons.forEach((poison) => {
      const marketValue = poison.stats?.market_value || 0;
      const rarity = getRarity(marketValue);
      poisonsByRarity[rarity].push(poison);
    });

    // Sort alphabetically within each rarity
    Object.keys(poisonsByRarity).forEach((rarity) => {
      poisonsByRarity[rarity].sort((a, b) => a.title.localeCompare(b.title));
    });

    // Create tabs
    const tabContainer = document.createElement("div");
    tabContainer.style.cssText =
      "display: flex; gap: 8px; margin-bottom: 2rem; flex-wrap: wrap; justify-content: center;";

    const rarities = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"];
    const tabContents = {};

    rarities.forEach((rarity, index) => {
      const count = poisonsByRarity[rarity].length;
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

      poisonsByRarity[rarity].forEach((poison) => {
        // Skip incomplete entries
        if (!poison.title || !poison.description) {
          return;
        }

        const card = document.createElement("div");
        card.className = "poison-card";
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
        titleEl.textContent = poison.title;
        titleEl.style.cssText =
          "margin: 0 0 8px 0; color: var(--highlight); font-family: var(--font-bold); font-size: 1.3rem;";

        // Types and Cost row
        const metaRow = document.createElement("div");
        metaRow.style.cssText =
          "display: flex; gap: 12px; flex-wrap: wrap; align-items: center;";

        // Types badges
        if (poison.types && poison.types.length > 0) {
          poison.types.forEach((type) => {
            const typeBadge = document.createElement("span");
            typeBadge.textContent = type;
            typeBadge.style.cssText =
              "font-family: var(--font-text); font-size: 0.75rem; border: 1px solid #ef4444; padding: 3px 8px; border-radius: 999px; background: rgba(239, 68, 68, 0.1); color: #ef4444;";
            metaRow.appendChild(typeBadge);
          });
        }

        // Market value
        if (poison.stats && poison.stats.market_value) {
          const cost = document.createElement("div");
          cost.textContent = `${poison.stats.market_value} gp`;
          cost.style.cssText =
            "margin-left: auto; color: var(--muted); font-family: var(--font-text); font-size: 0.9rem;";
          metaRow.appendChild(cost);
        }

        header.appendChild(titleEl);
        header.appendChild(metaRow);
        card.appendChild(header);

        // Card body
        const body = document.createElement("div");
        body.style.cssText = "padding: 20px;";

        // Brief description preview
        const preview = document.createElement("p");
        preview.textContent =
          poison.description.slice(0, 120) +
          (poison.description.length > 120 ? "..." : "");
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
        descText.textContent = poison.description;
        descText.style.cssText =
          "color: var(--muted); font-family: var(--font-text); margin: 0; line-height: 1.6;";

        descSection.appendChild(descLabel);
        descSection.appendChild(descText);
        detailsContent.appendChild(descSection);

        // Acquisition
        if (poison.aquisition) {
          const acqSection = document.createElement("div");
          acqSection.style.cssText =
            "margin-bottom: 16px; padding: 12px; background: rgba(20, 20, 20, 0.9); border-radius: 8px; border-left: 3px solid var(--highlight);";

          const acqLabel = document.createElement("h3");
          acqLabel.textContent = "Acquisition";
          acqLabel.style.cssText =
            "color: var(--highlight); font-family: var(--font-bold); font-size: 0.95rem; margin: 0 0 8px 0;";

          const acqText = document.createElement("p");
          acqText.textContent = poison.aquisition;
          acqText.style.cssText =
            "color: var(--muted); font-family: var(--font-text); margin: 0; line-height: 1.5; font-size: 0.9rem;";

          acqSection.appendChild(acqLabel);
          acqSection.appendChild(acqText);
          detailsContent.appendChild(acqSection);
        }

        // Effect
        if (poison.effect) {
          const effectSection = document.createElement("div");
          effectSection.style.cssText =
            "padding: 12px; background: rgba(100, 0, 0, 0.1); border-radius: 8px; border-left: 3px solid #ef4444; margin-bottom: 16px;";

          const effectLabel = document.createElement("h3");
          effectLabel.textContent = "Effect";
          effectLabel.style.cssText =
            "color: #ef4444; font-family: var(--font-bold); font-size: 0.95rem; margin: 0 0 8px 0;";

          const effectText = document.createElement("p");
          effectText.textContent = poison.effect;
          effectText.style.cssText =
            "color: var(--text); font-family: var(--font-text); margin: 0; line-height: 1.5; font-size: 0.9rem;";

          effectSection.appendChild(effectLabel);
          effectSection.appendChild(effectText);
          detailsContent.appendChild(effectSection);
        }

        // Stats grid
        if (poison.stats) {
          const statsGrid = document.createElement("div");
          statsGrid.style.cssText =
            "display: grid; grid-template-columns: 1fr 1fr; gap: 8px;";

          const stats = [
            { label: "Save DC", value: poison.stats.saving_throw_dc },
            { label: "Modification DC", value: poison.stats.modification_dc },
            { label: "Medicine DC", value: poison.stats.medicine_dc },
            { label: "Market Value", value: poison.stats.market_value + " gp" },
          ];

          stats.forEach((stat) => {
            if (stat.value !== undefined && stat.value !== null) {
              const statCell = document.createElement("div");
              statCell.style.cssText =
                "background: #0d0d0d; border: 1px solid #2a2a2a; padding: 8px 10px; border-radius: 8px;";

              const statLabel = document.createElement("div");
              statLabel.textContent = stat.label;
              statLabel.style.cssText =
                "color: var(--muted); font-size: 0.75rem; font-family: var(--font-text); margin-bottom: 4px;";

              const statValue = document.createElement("div");
              statValue.textContent = stat.value;
              statValue.style.cssText =
                "color: var(--text); font-family: var(--font-bold); font-size: 0.9rem;";

              statCell.appendChild(statLabel);
              statCell.appendChild(statValue);
              statsGrid.appendChild(statCell);
            }
          });

          detailsContent.appendChild(statsGrid);
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

        // Add hover effect
        card.addEventListener("mouseenter", () => {
          card.style.transform = "translateY(-4px)";
          card.style.boxShadow = "0 12px 28px rgba(0, 0, 0, 0.8)";
        });
        card.addEventListener("mouseleave", () => {
          card.style.transform = "translateY(0)";
          card.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.6)";
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
    console.error("Failed to load poisons.json:", err);
    container.innerHTML =
      '<p style="text-align: center; color: #ef4444; padding: 2rem;">Failed to load poisons data. Please refresh the page.</p>';
  });
