const WORKER_LIBRARY_URL =
  "https://fred_fetcher.dnd-worker.workers.dev/library.json";

class MusicMixer {
  constructor() {
    this.tracks = new Map();
    this.trackFiles = new Map();
    this.library = null;
    this.laneVolumes = new Map();
    this.laneFadeTimers = new Map();
    this.activeScoreId = null;
    this.pendingScoreId = null;
    this.combatActive = false;
    this.activeCombatId = null;
    this.init();
  }

  async init() {
    await this.loadLibrary();
    this.renderLibrary();
    this.initializeTracks();
    this.bindLaneControls();
    this.bindCategoryToggles();
    this.bindMasterControls();
    this.loadSceneList();
    this.checkUrlTrigger();
    this.expandAllCategories();
  }

  async loadLibrary() {
    let library = null;

    try {
      const response = await fetch(WORKER_LIBRARY_URL, { cache: "no-store" });
      if (!response.ok) throw new Error("Worker library unavailable");
      library = await response.json();
    } catch (error) {
      console.error("Music library load failed:", error);
      library = { lanes: [] };
      this.renderLoadError();
    }

    this.library = library || { lanes: [] };
    this.trackFiles.clear();
    const baseUrl = this.library.baseUrl || "";

    this.laneVolumes.clear();
    (this.library.lanes || []).forEach((lane) => {
      const laneVolume = lane.volume ?? 100;
      this.laneVolumes.set(lane.id, laneVolume / 100);
    });

    (this.library.lanes || []).forEach((lane) => {
      (lane.categories || []).forEach((category) => {
        (category.tracks || []).forEach((track) => {
          const resolved = this.resolveFileUrl(track.file, baseUrl);
          this.trackFiles.set(track.id, resolved);
        });
      });
    });
  }

  renderLoadError() {
    const container = document.getElementById("music-lanes");
    if (!container) return;
    container.innerHTML = `
      <div class="music-load-error">
        <strong>Music library not available.</strong>
        <span>Check the Worker URL and R2 prefix.</span>
      </div>
    `;
  }

  resolveFileUrl(file, baseUrl) {
    if (!file) return "";
    if (file.startsWith("http://") || file.startsWith("https://")) {
      return encodeURI(file);
    }
    if (!baseUrl) return file;
    const trimmedBase = baseUrl.replace(/\/+$/, "");
    const trimmedFile = file.replace(/^\/+/, "");
    return encodeURI(`${trimmedBase}/${trimmedFile}`);
  }

  renderLibrary() {
    const container = document.getElementById("music-lanes");
    if (!container) return;

    const categories = [];
    (this.library.lanes || []).forEach((lane) => {
      (lane.categories || []).forEach((category) => {
        categories.push({
          laneId: lane.id,
          category,
        });
      });
    });

    container.innerHTML = categories
      .map((entry) => this.renderCategoryBlock(entry.laneId, entry.category))
      .join("");
  }

  renderCategoryBlock(laneId, category) {
    const tracks = category.tracks
      .map((track) => this.renderTrack(laneId, category.id, track))
      .join("");

    return `
      <div class="music-category">
        <div class="music-category-header">
          <h2 class="music-category-title">${category.title}</h2>
          <button class="music-category-toggle">▼</button>
        </div>
        <div class="music-category-content">
          ${tracks}
        </div>
      </div>
    `;
  }

  renderTrack(laneId, categoryId, track) {
    const volume = track.volume ?? 70;
    return `
      <div
        class="music-track"
        data-id="${track.id}"
        data-lane="${laneId}"
        data-category="${categoryId}"
      >
        <div class="music-track-info">
          <button class="music-play-btn">▶</button>
          <span class="music-track-name">${track.name}</span>
          <button class="music-link-btn" title="Copy link">🔗</button>
        </div>
        <div class="music-track-controls">
          <input
            type="range"
            class="music-volume"
            min="0"
            max="100"
            value="${volume}"
          />
          <span class="music-volume-display">${volume}%</span>
        </div>
      </div>
    `;
  }

  initializeTracks() {
    this.tracks.clear();

    document.querySelectorAll(".music-track").forEach((trackEl) => {
      const id = trackEl.dataset.id;
      const lane = trackEl.dataset.lane || this.getCategoryFromId(id);
      const category = trackEl.dataset.category || lane;
      const source = this.trackFiles.get(id);
      if (!source) {
        console.warn(`Missing audio file for track: ${id}`);
        return;
      }

      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = source;
      audio.loop = true;

      this.tracks.set(id, {
        audio: audio,
        element: trackEl,
        isPlaying: false,
        mutedByPriority: false,
        baseVolume: 0.7,
        lane: lane,
        category: category,
        fadeTimer: null,
      });

      this.setupTrackControls(id);
    });
  }

  bindLaneControls() {
    document.querySelectorAll(".music-lane-slider").forEach((slider) => {
      const lane = slider.dataset.lane;
      this.laneVolumes.set(lane, slider.value / 100);
      slider.addEventListener("input", (event) => {
        const volume = event.target.value / 100;
        this.laneVolumes.set(lane, volume);
        this.applyLaneVolume(lane);
      });
    });

    this.laneVolumes.forEach((_, lane) => this.applyLaneVolume(lane));

    document.querySelectorAll(".music-lane-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const lane = button.dataset.lane;
        const action = button.dataset.action;
        if (action === "stop") {
          this.stopLane(lane);
        }
      });
    });
  }

  bindCategoryToggles() {
    document.querySelectorAll(".music-category-header").forEach((header) => {
      header.addEventListener("click", () => {
        const content = header.nextElementSibling;
        const toggle = header.querySelector(".music-category-toggle");

        content.classList.toggle("active");
        toggle.textContent = content.classList.contains("active") ? "▲" : "▼";
      });
    });
  }

  bindMasterControls() {
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
  }

  expandAllCategories() {
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

    const playBtn = element.querySelector(".music-play-btn");
    playBtn.addEventListener("click", () => this.togglePlay(trackId));

    const volumeSlider = element.querySelector(".music-volume");
    const volumeDisplay = element.querySelector(".music-volume-display");

    volumeSlider.addEventListener("input", (e) => {
      const volume = e.target.value / 100;
      track.baseVolume = volume;
      if (!track.mutedByPriority) {
        track.audio.volume = this.getTargetVolume(trackId);
      }
      volumeDisplay.textContent = `${e.target.value}%`;
    });

    track.baseVolume = volumeSlider.value / 100;
    track.audio.volume = this.getTargetVolume(trackId);

    const linkBtn = element.querySelector(".music-link-btn");
    linkBtn.addEventListener("click", () => this.copyLink(trackId));
  }

  togglePlay(trackId) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    if (track.isPlaying) {
      this.stopTrack(trackId, { resetTime: false, fade: true });
    } else {
      this.playTrack(trackId);
    }
  }

  playTrack(trackId) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    if (track.lane === "ambience") {
      this.startTrack(trackId, { fadeIn: true });
      return;
    }

    if (track.lane === "combat") {
      if (this.combatActive && this.activeCombatId === trackId) {
        this.stopCombat();
        return;
      }
      this.startCombat(trackId);
      return;
    }

    if (this.combatActive) {
      if (this.activeScoreId && this.activeScoreId !== trackId) {
        this.stopTrack(this.activeScoreId, { resetTime: false, fade: true });
      }
      if (this.pendingScoreId && this.pendingScoreId !== trackId) {
        this.setTrackState(this.pendingScoreId, "");
      }
      this.pendingScoreId = trackId;
      this.setTrackState(trackId, "Queued");
      return;
    }

    this.stopOtherScore(trackId, { fade: true });
    this.startTrack(trackId, { fadeIn: true });
    this.activeScoreId = trackId;
  }

  startCombat(trackId) {
    this.combatActive = true;
    this.pendingScoreId = null;

    if (this.activeCombatId && this.activeCombatId !== trackId) {
      this.stopTrack(this.activeCombatId, { resetTime: false, fade: true });
    }

    this.muteScoreTracks();
    this.startTrack(trackId, { fadeIn: true });
    this.activeCombatId = trackId;
  }

  stopCombat() {
    this.combatActive = false;

    const combatTrack = this.activeCombatId;
    if (combatTrack) {
      this.stopTrack(combatTrack, { resetTime: false, fade: true });
    }
    this.activeCombatId = null;

    const resumeId = this.pendingScoreId || this.activeScoreId;
    this.pendingScoreId = null;

    if (resumeId && this.tracks.has(resumeId)) {
      this.unmuteTrack(resumeId);
      if (!this.tracks.get(resumeId).isPlaying) {
        this.startTrack(resumeId, { fadeIn: true });
      } else {
        this.fadeTo(resumeId, this.getTargetVolume(resumeId), 600);
      }
      this.activeScoreId = resumeId;
    } else {
      this.activeScoreId = null;
    }

    this.unmuteScoreTracks();
  }

  startTrack(trackId, { fadeIn = false, mutedByPriority = false } = {}) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    track.mutedByPriority = mutedByPriority;
    const targetVolume = mutedByPriority ? 0 : this.getTargetVolume(trackId);

    track.audio
      .play()
      .then(() => {
        this.setPlayingState(trackId, true);
        this.setTrackState(trackId, "");
        if (fadeIn) {
          track.audio.volume = 0;
          this.fadeTo(trackId, targetVolume, 700);
        } else {
          track.audio.volume = targetVolume;
        }
      })
      .catch((err) => {
        console.error("Playback failed:", err);
        this.setTrackState(trackId, "Error");
      });
  }

  stopTrack(trackId, { resetTime = false, fade = false } = {}) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    const finalizeStop = () => {
      track.audio.pause();
      if (resetTime) track.audio.currentTime = 0;
      track.mutedByPriority = false;
      this.setPlayingState(trackId, false);
      this.setTrackState(trackId, "");
      if (this.activeScoreId === trackId) this.activeScoreId = null;
      if (this.activeCombatId === trackId) this.activeCombatId = null;
    };

    if (fade) {
      this.fadeTo(trackId, 0, 500, finalizeStop);
    } else {
      this.clearFade(trackId);
      finalizeStop();
    }
  }

  setPlayingState(trackId, isPlaying) {
    const track = this.tracks.get(trackId);
    const playBtn = track.element.querySelector(".music-play-btn");
    playBtn.textContent = isPlaying ? "⏸" : "▶";
    playBtn.classList.toggle("playing", isPlaying);
    track.isPlaying = isPlaying;
  }

  stopOtherScore(trackId, { fade = false } = {}) {
    this.tracks.forEach((track, id) => {
      if (id === trackId) return;
      if (track.lane !== "score") return;
      if (track.isPlaying) {
        this.stopTrack(id, { resetTime: false, fade });
      }
    });
  }

  muteScoreTracks() {
    this.tracks.forEach((track, id) => {
      if (track.lane !== "score") return;
      if (track.isPlaying) {
        track.mutedByPriority = true;
        this.fadeTo(id, 0, 500);
      }
    });
  }

  unmuteScoreTracks() {
    this.tracks.forEach((track, id) => {
      if (track.lane !== "score") return;
      if (track.isPlaying) {
        track.mutedByPriority = false;
        this.fadeTo(id, this.getTargetVolume(id), 700);
      }
    });
  }

  unmuteTrack(trackId) {
    const track = this.tracks.get(trackId);
    if (!track) return;
    track.mutedByPriority = false;
  }

  fadeTo(trackId, targetVolume, duration = 600, callback) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    this.clearFade(trackId);

    const startVolume = track.audio.volume;
    const diff = targetVolume - startVolume;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      track.audio.volume = startVolume + diff * progress;
      if (progress < 1) {
        track.fadeTimer = requestAnimationFrame(step);
      } else {
        track.fadeTimer = null;
        if (callback) callback();
      }
    };

    track.fadeTimer = requestAnimationFrame(step);
  }

  clearFade(trackId) {
    const track = this.tracks.get(trackId);
    if (!track || !track.fadeTimer) return;
    cancelAnimationFrame(track.fadeTimer);
    track.fadeTimer = null;
  }

  stopAll() {
    this.combatActive = false;
    this.activeScoreId = null;
    this.pendingScoreId = null;
    this.activeCombatId = null;

    this.tracks.forEach((track, id) => {
      this.clearFade(id);
      track.audio.pause();
      track.audio.currentTime = 0;
      track.audio.volume = this.getTargetVolume(id);
      track.mutedByPriority = false;
      this.setPlayingState(id, false);
      this.setTrackState(id, "");
    });
  }

  saveScene() {
    const sceneName = prompt("Enter a name for this scene:");
    if (!sceneName) return;

    const scene = {
      name: sceneName,
      tracks: [],
      lanes: {},
    };

    this.tracks.forEach((track, id) => {
      if (track.isPlaying) {
        const volume = track.element.querySelector(".music-volume").value;
        scene.tracks.push({ id, volume });
      }
    });

    document.querySelectorAll(".music-lane-slider").forEach((slider) => {
      scene.lanes[slider.dataset.lane] = slider.value;
    });

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

    this.stopAll();

    if (scene.lanes) {
      document.querySelectorAll(".music-lane-slider").forEach((slider) => {
        const laneValue = scene.lanes[slider.dataset.lane];
        if (laneValue !== undefined) {
          slider.value = laneValue;
          this.laneVolumes.set(slider.dataset.lane, laneValue / 100);
        }
      });
    }

    scene.tracks.forEach(({ id, volume }) => {
      const track = this.tracks.get(id);
      if (track) {
        const volumeSlider = track.element.querySelector(".music-volume");
        const volumeDisplay = track.element.querySelector(
          ".music-volume-display"
        );
        volumeSlider.value = volume;
        volumeDisplay.textContent = `${volume}%`;
        track.baseVolume = volume / 100;
        track.audio.volume = this.getTargetVolume(id);

        this.playTrack(id);
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
      .catch(() => {
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
      setTimeout(() => {
        this.playTrack(playTrack);
      }, 500);
    }
  }

  applyLaneVolume(lane) {
    this.clearLaneFade(lane);
    const start = performance.now();
    const duration = 300;
    const startVolumes = [];

    this.tracks.forEach((track, id) => {
      if (track.lane !== lane) return;
      if (!track.isPlaying) return;
      if (track.mutedByPriority) return;
      startVolumes.push({ id, volume: track.audio.volume });
    });

    if (!startVolumes.length) return;

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      startVolumes.forEach((entry) => {
        const target = this.getTargetVolume(entry.id);
        const next = entry.volume + (target - entry.volume) * progress;
        const track = this.tracks.get(entry.id);
        if (track) track.audio.volume = next;
      });

      if (progress < 1) {
        this.laneFadeTimers.set(lane, requestAnimationFrame(step));
      } else {
        this.laneFadeTimers.delete(lane);
      }
    };

    this.laneFadeTimers.set(lane, requestAnimationFrame(step));
  }

  clearLaneFade(lane) {
    const timer = this.laneFadeTimers.get(lane);
    if (!timer) return;
    cancelAnimationFrame(timer);
    this.laneFadeTimers.delete(lane);
  }

  stopLane(lane) {
    if (lane === "combat") {
      if (this.combatActive) {
        this.stopCombat();
      }
      return;
    }

    if (lane === "score") {
      this.pendingScoreId = null;
      this.activeScoreId = null;
    }

    this.tracks.forEach((track, id) => {
      if (track.lane !== lane) return;
      if (track.isPlaying) {
        this.stopTrack(id, { resetTime: false, fade: true });
      }
    });
  }

  setTrackState(trackId, text) {
    const track = this.tracks.get(trackId);
    if (!track) return;
    const stateEl = track.element.querySelector(".music-track-state");
    if (stateEl) stateEl.textContent = text;
  }

  getTargetVolume(trackId) {
    const track = this.tracks.get(trackId);
    if (!track) return 0;
    const laneVolume = this.laneVolumes.get(track.lane) ?? 1;
    return track.baseVolume * laneVolume;
  }

  getCategoryFromId(trackId) {
    if (!trackId) return "misc";
    const prefix = trackId.split("-")[0];
    if (prefix === "ambience") return "ambience";
    if (prefix === "location") return "location";
    if (prefix === "character") return "character";
    if (prefix === "combat") return "combat";
    if (prefix === "event") return "event";
    return "misc";
  }

  static triggerTrack(trackId) {
    window.open(`/pages/music/music.html?play=${trackId}`, "_blank");
  }
}

const mixer = new MusicMixer();
window.MusicMixer = MusicMixer;
