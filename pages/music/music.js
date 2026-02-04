// Music file mappings - UPDATE THESE WITH YOUR ACTUAL FILE PATHS
const MUSIC_FILES = {
  "ambience-forest": "/music/ambience/forest.mp3",
  "ambience-rain": "/music/ambience/rain.mp3",
  "ambience-animals": "/music/ambience/animals.mp3",
  "location-town": "/music/locations/town.mp3",
  "location-dungeon": "/music/locations/dungeon.mp3",
  "character-john-blank": "/music/characters/john-blank.mp3",
  "combat-general": "/music/combat/general.mp3",
  "combat-mountain": "/music/combat/mountain.mp3",
  "combat-desert": "/music/combat/desert.mp3",
  "event-boss": "/music/events/boss.mp3",
};

class MusicMixer {
  constructor() {
    this.tracks = new Map();
    this.init();
  }

  init() {
    // Initialize all tracks
    document.querySelectorAll(".music-track").forEach((trackEl) => {
      const id = trackEl.dataset.id;
      const audio = new Audio(MUSIC_FILES[id]);
      audio.loop = true;

      this.tracks.set(id, {
        audio: audio,
        element: trackEl,
        isPlaying: false,
      });

      this.setupTrackControls(id);
    });

    // Setup category toggles - ENTIRE HEADER IS CLICKABLE
    document.querySelectorAll(".music-category-header").forEach((header) => {
      header.addEventListener("click", () => {
        const content = header.nextElementSibling;
        const toggle = header.querySelector(".music-category-toggle");

        content.classList.toggle("active");
        toggle.textContent = content.classList.contains("active") ? "▲" : "▼";
      });
    });

    // Setup master controls
    document
      .getElementById("stopAll")
      .addEventListener("click", () => this.stopAll());
    document
      .getElementById("saveScene")
      .addEventListener("click", () => this.saveScene());
    document.getElementById("sceneSelect").addEventListener("change", (e) => {
      if (e.target.value) this.loadScene(e.target.value);
    });
    document
      .getElementById("deleteScene")
      .addEventListener("click", () => this.deleteScene());

    // Load saved scenes
    this.loadSceneList();

    // Check for URL parameters (for triggering from other pages)
    this.checkUrlTrigger();

    // Expand all categories by default
    document.querySelectorAll(".music-category-content").forEach((content) => {
      content.classList.add("active");
    });
    document.querySelectorAll(".music-category-toggle").forEach((toggle) => {
      toggle.textContent = "▲";
    });
  }

  setupTrackControls(trackId) {
    const track = this.tracks.get(trackId);
    const element = track.element;

    // Play/Pause button
    const playBtn = element.querySelector(".music-play-btn");
    playBtn.addEventListener("click", () => this.togglePlay(trackId));

    // Volume control
    const volumeSlider = element.querySelector(".music-volume");
    const volumeDisplay = element.querySelector(".music-volume-display");

    volumeSlider.addEventListener("input", (e) => {
      const volume = e.target.value / 100;
      track.audio.volume = volume;
      volumeDisplay.textContent = `${e.target.value}%`;
    });

    // Set initial volume
    track.audio.volume = volumeSlider.value / 100;

    // Link button
    const linkBtn = element.querySelector(".music-link-btn");
    linkBtn.addEventListener("click", () => this.copyLink(trackId));
  }

  togglePlay(trackId) {
    const track = this.tracks.get(trackId);
    const playBtn = track.element.querySelector(".music-play-btn");

    if (track.isPlaying) {
      track.audio.pause();
      playBtn.textContent = "▶";
      playBtn.classList.remove("playing");
      track.isPlaying = false;
    } else {
      track.audio.play().catch((err) => console.error("Playback failed:", err));
      playBtn.textContent = "⏸";
      playBtn.classList.add("playing");
      track.isPlaying = true;
    }
  }

  stopAll() {
    this.tracks.forEach((track, id) => {
      if (track.isPlaying) {
        track.audio.pause();
        track.audio.currentTime = 0;
        track.element.querySelector(".music-play-btn").textContent = "▶";
        track.element
          .querySelector(".music-play-btn")
          .classList.remove("playing");
        track.isPlaying = false;
      }
    });
  }

  saveScene() {
    const sceneName = prompt("Enter a name for this scene:");
    if (!sceneName) return;

    const scene = {
      name: sceneName,
      tracks: [],
    };

    this.tracks.forEach((track, id) => {
      if (track.isPlaying) {
        const volume = track.element.querySelector(".music-volume").value;
        scene.tracks.push({ id, volume });
      }
    });

    // Save to localStorage
    const scenes = this.getSavedScenes();
    scenes[sceneName] = scene;
    localStorage.setItem("dnd-music-scenes", JSON.stringify(scenes));

    this.loadSceneList();
    alert(`Scene "${sceneName}" saved!`);
  }

  loadScene(sceneName) {
    const scenes = this.getSavedScenes();
    const scene = scenes[sceneName];

    if (!scene) return;

    // Stop all current tracks
    this.stopAll();

    // Load scene tracks
    scene.tracks.forEach(({ id, volume }) => {
      const track = this.tracks.get(id);
      if (track) {
        // Set volume
        const volumeSlider = track.element.querySelector(".music-volume");
        const volumeDisplay = track.element.querySelector(
          ".music-volume-display"
        );
        volumeSlider.value = volume;
        volumeDisplay.textContent = `${volume}%`;
        track.audio.volume = volume / 100;

        // Play track
        this.togglePlay(id);
      }
    });
  }

  deleteScene() {
    const select = document.getElementById("sceneSelect");
    const sceneName = select.value;

    if (!sceneName) {
      alert("Please select a scene to delete");
      return;
    }

    if (!confirm(`Delete scene "${sceneName}"?`)) return;

    const scenes = this.getSavedScenes();
    delete scenes[sceneName];
    localStorage.setItem("dnd-music-scenes", JSON.stringify(scenes));

    this.loadSceneList();
  }

  getSavedScenes() {
    const saved = localStorage.getItem("dnd-music-scenes");
    return saved ? JSON.parse(saved) : {};
  }

  loadSceneList() {
    const select = document.getElementById("sceneSelect");
    const scenes = this.getSavedScenes();

    select.innerHTML = '<option value="">Load Scene...</option>';

    Object.keys(scenes).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  }

  copyLink(trackId) {
    const url = `${window.location.origin}${window.location.pathname}?play=${trackId}`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert(
          "Link copied! You can paste this on character pages or anywhere else."
        );
      })
      .catch((err) => {
        // Fallback for older browsers
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        alert("Link copied!");
      });
  }

  checkUrlTrigger() {
    const params = new URLSearchParams(window.location.search);
    const playTrack = params.get("play");

    if (playTrack && this.tracks.has(playTrack)) {
      // Small delay to ensure audio context is ready
      setTimeout(() => {
        this.togglePlay(playTrack);
      }, 500);
    }
  }

  // Public method to trigger from external pages
  static triggerTrack(trackId) {
    window.open(`/pages/music/music.html?play=${trackId}`, "_blank");
  }
}

// Initialize the mixer
const mixer = new MusicMixer();

// Make it globally accessible for external triggers
window.MusicMixer = MusicMixer;
