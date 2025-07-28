fetch("../../content/armor.json")
  .then((response) => response.json())
  .then((data) => {
    const container = document.getElementById("table-container");

    // Create the table and header row
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headers = [
      "Armor Type",
      "AC",
      "DR",
      "Max Dexterity",
      "Special",
      "Cost",
      "Weight",
    ];
    headers.forEach((text) => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    // Loop over each armor category
    Object.entries(data).forEach(([category, armors]) => {
      // Category row (e.g., "Light Armor")
      const categoryRow = document.createElement("tr");
      const categoryCell = document.createElement("td");
      categoryCell.colSpan = headers.length;
      categoryCell.textContent = category;
      categoryCell.style.fontWeight = "bold";
      tbody.appendChild(categoryRow);
      categoryRow.appendChild(categoryCell);

      // Armor rows
      armors.forEach((armor) => {
        const row = document.createElement("tr");

        // Special column logic
        let special = "—";
        if (armor.cumbersome && armor.strength_requirement) {
          special = `Cumbersome / Str ${armor.strength_requirement}`;
        } else if (armor.cumbersome) {
          special = "Cumbersome";
        } else if (armor.lightweight) {
          special = "Lightweight";
        }

        // Handle max dex formatting
        const maxDex =
          armor.max_dexterity === null
            ? "No Limit"
            : `Max ${armor.max_dexterity}`;

        const costText =
          armor.cost_silver <= 100
            ? `${armor.cost_silver} sp`
            : `${armor.cost_silver / 100} gp`;

        const fields = [
          `${armor.name}`,
          `${armor.AC} AC`,
          `${armor.damage_reduction} DR`,
          maxDex,
          special,
          costText,
          `${armor.weight_lb} lb.`,
        ];

        fields.forEach((val) => {
          const td = document.createElement("td");
          td.innerHTML = val;
          row.appendChild(td);
        });

        tbody.appendChild(row);
      });
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // Add click listener for column highlighting
    table.addEventListener("click", function (e) {
      const cell = e.target.closest("td, th");
      if (!cell) return;

      const columnIndex = cell.cellIndex;
      if (columnIndex < 0) return;

      // Remove previous highlights
      table
        .querySelectorAll("td, th")
        .forEach((el) => el.classList.remove("highlight-col"));

      // Highlight the clicked column
      const rows = table.rows;
      for (let i = 0; i < rows.length; i++) {
        const col = rows[i].cells[columnIndex];
        if (col) col.classList.add("highlight-col");
      }
      document.addEventListener("click", function (event) {
        if (!table.contains(event.target)) {
          table
            .querySelectorAll("td, th")
            .forEach((el) => el.classList.remove("highlight-col"));
        }
      });
    });
  })
  .catch((err) => {
    console.error("Failed to load armor.json:", err);
  });
