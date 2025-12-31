const container = document.querySelector(".central-box");

// Show loading state
container.innerHTML = '<p class="loading-message">Loading weapons data...</p>';

// Fetch weapons, masteries, and properties data
Promise.all([
  fetch("../../content/weapons.json").then((res) => res.json()),
  fetch("../../content/masteries.json").then((res) => res.json()),
  fetch("../../content/properties.json").then((res) => res.json()),
])
  .then(([weaponsData, masteriesData, propertiesData]) => {
    // Clear loading state
    container.innerHTML = "";

    // Add page title
    const title = document.createElement("h1");
    title.className = "page-title";
    title.textContent = "Weapons";
    container.appendChild(title);

    // Create table container
    const tableContainer = document.createElement("div");
    tableContainer.id = "table-container";

    // Categories to display
    const categories = [
      { key: "simple_melee", label: "Simple Melee Weapons" },
      { key: "simple_ranged", label: "Simple Ranged Weapons" },
      { key: "martial_melee", label: "Martial Melee Weapons" },
      { key: "martial_ranged", label: "Martial Ranged Weapons" },
    ];

    // Helper function to parse properties and create tooltips
    function createPropertiesWithTooltips(propertiesStr) {
      if (!propertiesStr || propertiesStr === "—") {
        return document.createTextNode("—");
      }

      const container = document.createElement("span");
      container.className = "properties-container";

      // Split properties by comma
      const properties = propertiesStr.split(",").map((p) => p.trim());

      properties.forEach((prop, index) => {
        // Extract the base property name (before any parentheses)
        const baseProp = prop.split("(")[0].trim();

        // Check if we have a description for this property
        if (propertiesData[baseProp]) {
          const propSpan = document.createElement("span");
          propSpan.className = "property-name";
          propSpan.textContent = prop;

          const tooltip = document.createElement("div");
          tooltip.className = "property-tooltip";
          tooltip.textContent = propertiesData[baseProp];

          propSpan.appendChild(tooltip);
          container.appendChild(propSpan);
        } else {
          // If no description, just show as plain text
          container.appendChild(document.createTextNode(prop));
        }

        // Add comma separator if not the last property
        if (index < properties.length - 1) {
          container.appendChild(document.createTextNode(", "));
        }
      });

      return container;
    }

    categories.forEach((category) => {
      const weapons = weaponsData[category.key];
      if (!weapons || weapons.length === 0) return;

      // Create table
      const table = document.createElement("table");

      // Table header with category name
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");

      const categoryHeader = document.createElement("th");
      categoryHeader.colSpan = 6;
      categoryHeader.textContent = category.label;
      headerRow.appendChild(categoryHeader);
      thead.appendChild(headerRow);

      // Column headers
      const columnRow = document.createElement("tr");
      ["Name", "Cost", "Damage", "Weight", "Properties", "Mastery"].forEach(
        (header) => {
          const th = document.createElement("th");
          th.textContent = header;
          columnRow.appendChild(th);
        }
      );
      thead.appendChild(columnRow);
      table.appendChild(thead);

      // Table body
      const tbody = document.createElement("tbody");
      weapons.forEach((weapon) => {
        const row = document.createElement("tr");

        // Name
        const nameCell = document.createElement("td");
        nameCell.textContent = weapon.name;
        row.appendChild(nameCell);

        // Cost
        const costCell = document.createElement("td");
        costCell.textContent = weapon.cost;
        row.appendChild(costCell);

        // Damage
        const damageCell = document.createElement("td");
        damageCell.textContent = weapon.damage;
        row.appendChild(damageCell);

        // Weight
        const weightCell = document.createElement("td");
        weightCell.textContent = weapon.weight || "—";
        row.appendChild(weightCell);

        // Properties with tooltips
        const propertiesCell = document.createElement("td");
        propertiesCell.className = "properties-cell";
        propertiesCell.appendChild(
          createPropertiesWithTooltips(weapon.properties || "—")
        );
        row.appendChild(propertiesCell);

        // Mastery with tooltip
        const masteryCell = document.createElement("td");
        masteryCell.className = "mastery-cell";

        const masterySpan = document.createElement("span");
        masterySpan.className = "mastery-name";
        masterySpan.textContent = weapon.mastery;
        masterySpan.dataset.mastery = weapon.mastery;

        // Create tooltip
        const tooltip = document.createElement("div");
        tooltip.className = "mastery-tooltip";
        tooltip.textContent = masteriesData[weapon.mastery] || "";

        masterySpan.appendChild(tooltip);
        masteryCell.appendChild(masterySpan);
        row.appendChild(masteryCell);

        tbody.appendChild(row);
      });
      table.appendChild(tbody);

      tableContainer.appendChild(table);
    });

    container.appendChild(tableContainer);
  })
  .catch((err) => {
    console.error("Failed to load weapons data:", err);
    container.innerHTML =
      '<p class="error-message">Failed to load weapons data. Please refresh the page.</p>';
  });
