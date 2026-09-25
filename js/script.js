const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const hero = document.querySelector(".hero");
const heroVideo = document.querySelector("[data-hero-video]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll("[data-year]").forEach((year) => {
  year.textContent = new Date().getFullYear();
});

function closeMenu(restoreFocus = false) {
  if (!menuToggle || !nav) return;
  nav.classList.remove("is-open");
  header.classList.remove("menu-visible");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menu");
  document.body.classList.remove("menu-open");
  if (restoreFocus) menuToggle.focus();
}

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const opening = menuToggle.getAttribute("aria-expanded") !== "true";
    nav.classList.toggle("is-open", opening);
    header.classList.toggle("menu-visible", opening);
    menuToggle.setAttribute("aria-expanded", String(opening));
    menuToggle.setAttribute("aria-label", opening ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("menu-open", opening);
    if (opening) nav.querySelector("a")?.focus();
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) closeMenu(true);
  });

  document.addEventListener("click", (event) => {
    if (nav.classList.contains("is-open") && !event.target.closest(".site-header")) closeMenu();
  });

  window.matchMedia("(min-width: 900px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });
}

let scrollQueued = false;
function updateScrollState() {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
  if (hero && !reducedMotion.matches) {
    hero.style.setProperty("--hero-shift", `${Math.min(window.scrollY * 0.09, 42)}px`);
  }
  scrollQueued = false;
}
updateScrollState();
window.addEventListener("scroll", () => {
  if (!scrollQueued) {
    scrollQueued = true;
    window.requestAnimationFrame(updateScrollState);
  }
}, { passive: true });

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  document.documentElement.classList.add("motion-ready");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
  revealItems.forEach((item) => observer.observe(item));
}

if (heroVideo) {
  const videoSource = heroVideo.querySelector("source");
  const desktopVideo = window.matchMedia("(min-width: 640px)");
  const clips = [videoSource?.dataset.src, heroVideo.dataset.secondClip].filter(Boolean);
  let sourceLoaded = false;
  let activeClip = 0;
  let switching = false;
  const disableVideo = () => {
    heroVideo.pause();
    heroVideo.hidden = true;
  };

  const syncVideo = () => {
    if (reducedMotion.matches || navigator.connection?.saveData || !desktopVideo.matches) {
      disableVideo();
      return;
    }
    heroVideo.hidden = false;
    if (!sourceLoaded && videoSource && clips.length) {
      videoSource.src = clips[0];
      heroVideo.load();
      sourceLoaded = true;
    }
    heroVideo.play().catch(disableVideo);
  };

  syncVideo();
  heroVideo.addEventListener("error", disableVideo);
  videoSource?.addEventListener("error", disableVideo);
  heroVideo.addEventListener("timeupdate", () => {
    if (clips.length < 2 || switching || heroVideo.hidden || !Number.isFinite(heroVideo.duration) || heroVideo.currentTime < heroVideo.duration - 0.45) return;
    switching = true;
    heroVideo.classList.add("is-switching");
    heroVideo.pause();
    window.setTimeout(() => {
      if (heroVideo.hidden) {
        switching = false;
        return;
      }
      activeClip = (activeClip + 1) % clips.length;
      videoSource.src = clips[activeClip];
      heroVideo.load();
      heroVideo.play().catch(disableVideo);
    }, 350);
  });
  heroVideo.addEventListener("playing", () => {
    heroVideo.classList.remove("is-switching");
    switching = false;
  });
  reducedMotion.addEventListener("change", syncVideo);
  desktopVideo.addEventListener("change", syncVideo);
}
