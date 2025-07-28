fetch("../../content/tools.json")
  .then((res) => res.json())
  .then((tools) => {
    const container = document.getElementById("tools-container");

    tools.forEach((tool) => {
      const block = document.createElement("div");
      block.classList.add("lang-group-block"); // Reuse styling

      const title = document.createElement("h2");
      title.textContent = tool.name;
      block.appendChild(title);

      const ability = document.createElement("p");
      ability.innerHTML = `<strong>Ability:</strong> ${tool.ability}`;
      block.appendChild(ability);

      if (tool.utilize?.length) {
        const util = document.createElement("p");
        util.innerHTML = `<strong>Utilize:</strong> ${tool.utilize.join(", ")}`;
        block.appendChild(util);
      }

      if (tool.craft?.length) {
        const craft = document.createElement("p");
        craft.innerHTML = `<strong>Craft:</strong> ${tool.craft.join(", ")}`;
        block.appendChild(craft);
      }

      if (tool.variants?.length) {
        const varHeader = document.createElement("p");
        varHeader.innerHTML = `<strong>Variants:</strong>`;
        block.appendChild(varHeader);

        const list = document.createElement("ul");
        tool.variants.forEach((variant) => {
          const li = document.createElement("li");
          li.textContent = `${variant.type} – ${variant.cost || "N/A"}${
            variant.weight ? `, ${variant.weight}` : ""
          }`;
          list.appendChild(li);
        });
        block.appendChild(list);
      }

      block.appendChild(document.createElement("br"));

      const info = document.createElement("p");
      info.innerHTML = `<strong>Cost:</strong> ${tool.cost} | <strong>Weight:</strong> ${tool.weight}`;
      info.className = "dehighlight-text";
      block.appendChild(info);

      container.appendChild(block);
    });
  })
  .catch((err) => {
    console.error("Error loading tools.json:", err);
    document.getElementById("tools-container").innerText =
      "Failed to load tools.";
  });
