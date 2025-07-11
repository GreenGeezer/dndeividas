function loadHeader() {
  fetch("/header.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then((html) => {
      const headerContainer = document.getElementById("main-header");
      if (headerContainer) {
        headerContainer.innerHTML = html;
      } else {
        console.warn('No element with id="main-header" found.');
      }
    })
    .catch((error) => {
      console.error("Failed to load header:", error);
    });
}

document.addEventListener("DOMContentLoaded", loadHeader);
