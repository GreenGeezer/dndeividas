const container = document.querySelector(".central-box");

// Show loading state
container.innerHTML =
  '<p class="loading-message">Loading materials data...</p>';

fetch("../../content/materials.json")
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
    title.textContent = "Crafting Materials";
    container.appendChild(title);

    // Add subtitle
    const subtitle = document.createElement("p");
    subtitle.className = "page-subtitle";
    subtitle.textContent =
      "Special materials that can be used to craft enhanced weapons and armor";
    container.appendChild(subtitle);

    // Sort materials alphabetically
    const sortedMaterials = [...data].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Create materials grid
    const materialsGrid = document.createElement("div");
    materialsGrid.className = "materials-grid";

    sortedMaterials.forEach((material) => {
      // Skip incomplete entries
      if (!material.name || !material.description) {
        return;
      }

      const card = document.createElement("div");
      card.className = "material-card";

      // Card header
      const header = document.createElement("div");
      header.className = "material-header";

      const titleEl = document.createElement("h2");
      titleEl.className = "material-title";
      titleEl.textContent = material.name;

      header.appendChild(titleEl);
      card.appendChild(header);

      // Card body
      const body = document.createElement("div");
      body.className = "material-body";

      // Armor Effect (always visible)
      if (material.armor_effect) {
        const armorSection = document.createElement("div");
        armorSection.className = "material-armor-effect";

        const armorLabel = document.createElement("h3");
        armorLabel.className = "material-effect-title";
        armorLabel.textContent = "Armor Effect";

        const armorText = document.createElement("p");
        armorText.className = "material-effect-text";
        armorText.textContent = material.armor_effect;

        const armorCost = document.createElement("p");
        armorCost.className = "material-cost";
        armorCost.innerHTML = `<strong>Cost:</strong> ${material.armor_cost}`;

        armorSection.appendChild(armorLabel);
        armorSection.appendChild(armorText);
        armorSection.appendChild(armorCost);
        body.appendChild(armorSection);
      }

      // Weapon Effect (always visible)
      if (material.weapon_effect) {
        const weaponSection = document.createElement("div");
        weaponSection.className = "material-weapon-effect";

        const weaponLabel = document.createElement("h3");
        weaponLabel.className = "material-effect-title";
        weaponLabel.textContent = "Weapon Effect";

        const weaponText = document.createElement("p");
        weaponText.className = "material-effect-text";
        weaponText.textContent = material.weapon_effect;

        const weaponCost = document.createElement("p");
        weaponCost.className = "material-cost";
        weaponCost.innerHTML = `<strong>Cost:</strong> ${material.weapon_cost}`;

        weaponSection.appendChild(weaponLabel);
        weaponSection.appendChild(weaponText);
        weaponSection.appendChild(weaponCost);
        body.appendChild(weaponSection);
      }

      // Parse description to extract title and main text
      let descriptionText = material.description;
      let materialTitle = "";

      // Check if description starts with --- title: format
      const titleMatch = material.description.match(
        /^---\s*title:\s*(.+?)\s*---\s*/i
      );
      if (titleMatch) {
        materialTitle = titleMatch[1];
        descriptionText = material.description
          .replace(/^---\s*title:\s*.+?\s*---\s*/i, "")
          .trim();
      }

      // Toggle button for lore
      const toggleContainer = document.createElement("div");
      toggleContainer.className = "t-toggle-container";

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "t-toggle-btn";

      const toggleText = document.createElement("span");
      toggleText.textContent = "View Lore";

      const toggleArrow = document.createElement("span");
      toggleArrow.className = "t-toggle-arrow";
      toggleArrow.textContent = "▼";

      toggleBtn.appendChild(toggleText);
      toggleBtn.appendChild(toggleArrow);
      toggleContainer.appendChild(toggleBtn);
      body.appendChild(toggleContainer);

      // Lore content (hidden by default)
      const loreContent = document.createElement("div");
      loreContent.className = "material-details";

      const descSection = document.createElement("div");
      descSection.className = "material-section";

      const descLabel = document.createElement("h3");
      descLabel.className = "material-section-title";
      descLabel.textContent = "Lore & Description";

      const descText = document.createElement("p");
      descText.className = "material-section-text";
      descText.textContent = descriptionText;

      descSection.appendChild(descLabel);
      descSection.appendChild(descText);
      loreContent.appendChild(descSection);

      body.appendChild(loreContent);
      card.appendChild(body);

      // Toggle functionality
      toggleBtn.addEventListener("click", () => {
        if (loreContent.classList.contains("active")) {
          loreContent.classList.remove("active");
          toggleBtn.classList.remove("active");
          toggleText.textContent = "View Lore";
          toggleArrow.style.transform = "rotate(0deg)";
        } else {
          loreContent.classList.add("active");
          toggleBtn.classList.add("active");
          toggleText.textContent = "Hide Lore";
          toggleArrow.style.transform = "rotate(180deg)";
        }
      });

      materialsGrid.appendChild(card);
    });

    container.appendChild(materialsGrid);
  })
  .catch((err) => {
    console.error("Failed to load materials.json:", err);
    container.innerHTML =
      '<p class="error-message">Failed to load materials data. Please refresh the page.</p>';
  });
