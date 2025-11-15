// Global Search Functionality for DnDeividas

class SearchManager {
  constructor() {
    this.searchData = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load all searchable content
      const [
        armor,
        transformations,
        tools,
        potions,
        poisons,
        materials,
        ingredients,
        enchantments,
      ] = await Promise.all([
        this.loadJSON("/content/armor.json").catch(() => ({})),
        this.loadJSON("/content/transformations.json").catch(() => []),
        this.loadJSON("/content/tools.json").catch(() => []),
        this.loadJSON("/content/potions.json").catch(() => []),
        this.loadJSON("/content/poisons.json").catch(() => []),
        this.loadJSON("/content/materials.json").catch(() => []),
        this.loadJSON("/content/ingredients.json").catch(() => []),
        this.loadJSON("/content/enchantments.json").catch(() => []),
      ]);

      // Index armor
      Object.entries(armor).forEach(([category, items]) => {
        if (Array.isArray(items)) {
          items.forEach((item) => {
            this.searchData.push({
              name: item.name,
              type: "Armor",
              category: category,
              url: "/pages/equipment/armor.html",
              searchText: `${item.name} ${category} armor AC${item.AC} DR${item.damage_reduction}`,
              details: `${category} - AC: ${item.AC}, DR: ${item.damage_reduction}`,
            });
          });
        }
      });

      // Index transformations
      if (Array.isArray(transformations)) {
        transformations.forEach((trans) => {
          this.searchData.push({
            name: trans.name,
            type: "Transformation",
            category: "Character",
            url: "/pages/system/transformations.html",
            searchText: `${trans.name} transformation ${
              trans.features?.prerequisites?.ability_scores || ""
            } ${trans.becoming || ""}`,
            details: trans.features?.prerequisites?.ability_scores || "",
          });
        });
      }

      // Index tools
      if (Array.isArray(tools)) {
        tools.forEach((tool) => {
          this.searchData.push({
            name: tool.name,
            type: "Tool",
            category: "Equipment",
            url: "/pages/system/tool_crafting.html",
            searchText: `${tool.name} tool ${tool.ability || ""} ${(
              tool.utilize || []
            ).join(" ")} ${(tool.craft || []).join(" ")}`,
            details: `Ability: ${tool.ability || "N/A"}`,
          });
        });
      }

      // Index potions
      if (Array.isArray(potions)) {
        potions.forEach((potion) => {
          this.searchData.push({
            name: potion.name || "Unknown Potion",
            type: "Potion",
            category: "Equipment",
            url: "/pages/equipment/potions.html",
            searchText: `${potion.name || ""} potion ${potion.effect || ""} ${
              potion.rarity || ""
            }`,
            details: potion.rarity || "",
          });
        });
      }

      // Index poisons
      if (Array.isArray(poisons)) {
        poisons.forEach((poison) => {
          this.searchData.push({
            name: poison.name || "Unknown Poison",
            type: "Poison",
            category: "Equipment",
            url: "/pages/equipment/poisons.html",
            searchText: `${poison.name || ""} poison ${poison.effect || ""} ${
              poison.type || ""
            }`,
            details: poison.type || "",
          });
        });
      }

      // Index materials
      if (Array.isArray(materials)) {
        materials.forEach((material) => {
          this.searchData.push({
            name: material.name || "Unknown Material",
            type: "Material",
            category: "Crafting",
            url: "/pages/system/tool_crafting.html",
            searchText: `${material.name || ""} material ${
              material.properties || ""
            }`,
            details: material.rarity || "",
          });
        });
      }

      // Index ingredients
      if (Array.isArray(ingredients)) {
        ingredients.forEach((ingredient) => {
          this.searchData.push({
            name: ingredient.name || "Unknown Ingredient",
            type: "Ingredient",
            category: "Crafting",
            url: "/pages/system/tool_crafting.html",
            searchText: `${ingredient.name || ""} ingredient ${
              ingredient.effect || ""
            }`,
            details: ingredient.rarity || "",
          });
        });
      }

      // Index enchantments
      if (Array.isArray(enchantments)) {
        enchantments.forEach((enchantment) => {
          this.searchData.push({
            name: enchantment.name || "Unknown Enchantment",
            type: "Enchantment",
            category: "Magic",
            url: "/pages/system/enchanting.html",
            searchText: `${enchantment.name || ""} enchantment ${
              enchantment.effect || ""
            }`,
            details: enchantment.level || "",
          });
        });
      }

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize search:", error);
    }
  }

  async loadJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`);
    }
    return response.json();
  }

  search(query) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    return this.searchData
      .map((item) => {
        const searchText = item.searchText.toLowerCase();
        let score = 0;

        // Exact name match gets highest score
        if (item.name.toLowerCase() === query.toLowerCase()) {
          score = 1000;
        }
        // Name starts with query
        else if (item.name.toLowerCase().startsWith(query.toLowerCase())) {
          score = 500;
        }
        // Name contains query
        else if (item.name.toLowerCase().includes(query.toLowerCase())) {
          score = 250;
        }
        // Check if all search terms are present
        else {
          const matchCount = searchTerms.filter((term) =>
            searchText.includes(term)
          ).length;
          if (matchCount === searchTerms.length) {
            score = 100 + matchCount * 10;
          } else if (matchCount > 0) {
            score = matchCount * 5;
          }
        }

        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Limit to top 20 results
  }
}

// Initialize global search manager
const searchManager = new SearchManager();

// Setup search functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize search data
  searchManager.initialize();

  // Get search input
  const searchInput = document.querySelector(".search-container input");
  if (!searchInput) return;

  let searchTimeout;
  let searchResultsContainer = null;

  // Create search results dropdown
  function createSearchResults() {
    if (searchResultsContainer) return searchResultsContainer;

    searchResultsContainer = document.createElement("div");
    searchResultsContainer.className = "search-results";
    searchResultsContainer.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--dropdown);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.8);
      max-height: 400px;
      overflow-y: auto;
      z-index: 1001;
      display: none;
      margin-top: 8px;
    `;

    const searchContainer = document.querySelector(".search-container");
    searchContainer.style.position = "relative";
    searchContainer.appendChild(searchResultsContainer);

    return searchResultsContainer;
  }

  // Display search results
  function displayResults(results) {
    const container = createSearchResults();

    if (results.length === 0) {
      container.innerHTML =
        '<div style="padding: 1rem; text-align: center; color: var(--muted);">No results found</div>';
      container.style.display = "block";
      return;
    }

    container.innerHTML = results
      .map(
        (result) => `
      <a href="${result.url}" class="search-result-item" style="
        display: block;
        padding: 0.75rem 1rem;
        color: var(--link);
        text-decoration: none;
        border-bottom: 1px solid #222;
        transition: background 0.2s;
      " onmouseover="this.style.background='var(--dropdown-hover)'" onmouseout="this.style.background='transparent'">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-bold); color: var(--highlight); margin-bottom: 4px;">
              ${result.name}
            </div>
            <div style="font-size: 0.85rem; color: var(--muted); font-family: var(--font-text);">
              ${result.type}${result.details ? ` • ${result.details}` : ""}
            </div>
          </div>
          <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">
            ${result.category}
          </div>
        </div>
      </a>
    `
      )
      .join("");

    container.style.display = "block";
  }

  // Hide search results
  function hideResults() {
    if (searchResultsContainer) {
      searchResultsContainer.style.display = "none";
    }
  }

  // Handle search input
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value;

    clearTimeout(searchTimeout);

    if (query.trim().length < 2) {
      hideResults();
      return;
    }

    // Debounce search
    searchTimeout = setTimeout(() => {
      const results = searchManager.search(query);
      displayResults(results);
    }, 300);
  });

  // Handle focus
  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim().length >= 2) {
      const results = searchManager.search(searchInput.value);
      displayResults(results);
    }
  });

  // Handle blur with delay to allow clicking on results
  searchInput.addEventListener("blur", () => {
    setTimeout(hideResults, 200);
  });

  // Handle Enter key
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const results = searchManager.search(searchInput.value);
      if (results.length > 0) {
        window.location.href = results[0].url;
      }
    } else if (e.key === "Escape") {
      hideResults();
      searchInput.blur();
    }
  });

  // Close search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      hideResults();
    }
  });
});
