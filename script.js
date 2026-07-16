(() => {
  const body = document.body;
  const preloader = document.querySelector(".preloader");
  const header = document.getElementById("siteHeader");
  const hero = document.querySelector(".hero");
  const heroMedia = document.querySelector(".hero__media");
  const heroContent = document.querySelector(".hero__content");
  const musicButton = document.getElementById("musicButton");
  const musicLabel = musicButton.querySelector(".music-button__label");
  const audio = document.getElementById("weddingAudio");

  body.classList.add("is-loading");

  window.addEventListener("load", () => {
    window.setTimeout(() => {
      preloader.classList.add("is-hidden");
      body.classList.remove("is-loading");
    }, 950);
  });

  const updateScrollEffects = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 60);

    if (hero && y < window.innerHeight * 1.2) {
      const progress = Math.min(y / window.innerHeight, 1);
      heroContent.style.opacity = String(1 - progress * 1.1);
      heroContent.style.transform = `translateY(${-progress * 48}px)`;
      heroMedia.style.opacity = String(1 - progress * 0.55);
    }
  };

  window.addEventListener("scroll", updateScrollEffects, { passive: true });
  updateScrollEffects();

  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

  const target = new Date("2026-08-20T16:30:00+05:30").getTime();
  const els = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds")
  };

  const pad = value => String(Math.max(0, value)).padStart(2, "0");

  const updateCountdown = () => {
    const distance = target - Date.now();

    if (distance <= 0) {
      els.days.textContent = "00";
      els.hours.textContent = "00";
      els.minutes.textContent = "00";
      els.seconds.textContent = "00";
      return;
    }

    els.days.textContent = pad(Math.floor(distance / 86400000));
    els.hours.textContent = pad(Math.floor((distance % 86400000) / 3600000));
    els.minutes.textContent = pad(Math.floor((distance % 3600000) / 60000));
    els.seconds.textContent = pad(Math.floor((distance % 60000) / 1000));
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  audio.volume = 0.24;

  musicButton.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        await audio.play();
        musicButton.classList.add("is-playing");
        musicButton.setAttribute("aria-pressed", "true");
        musicButton.setAttribute("aria-label", "Pause our song");
        musicLabel.textContent = "Pause music";
      } else {
        audio.pause();
        musicButton.classList.remove("is-playing");
        musicButton.setAttribute("aria-pressed", "false");
        musicButton.setAttribute("aria-label", "Play our song");
        musicLabel.textContent = "Play our song";
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
      musicLabel.textContent = "Tap again";
    }
  });
})();
