(() => {
  const body = document.body;
  const preloader = document.querySelector(".preloader");
  const header = document.getElementById("siteHeader");
  const hero = document.querySelector(".hero");
  const heroMedia = document.querySelector(".hero__media");
  const heroContent = document.querySelector(".hero__content");
  const progressBar = document.querySelector(".page-progress span");
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
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = `${docHeight > 0 ? (y / docHeight) * 100 : 0}%`;
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

  audio.volume = 0.22;

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
        musicLabel.textContent = "Play music";
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
      musicLabel.textContent = "Tap again";
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) {
      audio.pause();
      musicButton.classList.remove("is-playing");
      musicButton.setAttribute("aria-pressed", "false");
      musicLabel.textContent = "Play music";
    }
  });

  const RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbxAm8j0pGLhQYWByOpzCI7gmlR3t1EZNa58UI-Bcqm_IqdxL96BM4ldufMwwZQis9Cc/exec";
  const rsvpForm = document.getElementById("rsvpForm");
  const formStatus = document.getElementById("formStatus");

  const setFieldError = (key, message) => {
    const error = document.querySelector(`[data-error-for="${key}"]`);
    if (error) error.textContent = message || "";
    if (key === "attendance") {
      document.querySelector(".attendance-field")?.classList.toggle("has-error", Boolean(message));
    } else {
      document.getElementById(key)?.closest(".form-field")?.classList.toggle("has-error", Boolean(message));
    }
  };

  const validateRsvp = () => {
    const names = document.getElementById("guestNames").value.trim();
    const attendance = rsvpForm.querySelector('input[name="attendance"]:checked');
    setFieldError("guestNames", names ? "" : "Please enter the invited name(s).");
    setFieldError("attendance", attendance ? "" : "Please select your response.");
    return Boolean(names && attendance);
  };

  rsvpForm.addEventListener("submit", async event => {
    event.preventDefault();
    formStatus.className = "form-status";
    formStatus.textContent = "";

    if (!validateRsvp()) return;

    if (RSVP_ENDPOINT.includes("PASTE_YOUR")) {
      formStatus.classList.add("is-error");
      formStatus.textContent = "RSVP is not connected yet. Complete RSVP_SETUP.md and paste the Web App URL into script.js.";
      return;
    }

    const submitButton = rsvpForm.querySelector('button[type="submit"]');
    const originalText = submitButton.querySelector("span").textContent;
    const payload = {
      names: document.getElementById("guestNames").value.trim(),
      attendance: rsvpForm.querySelector('input[name="attendance"]:checked').value,
      message: document.getElementById("guestMessage").value.trim(),
      submittedAt: new Date().toISOString()
    };

    submitButton.disabled = true;
    submitButton.querySelector("span").textContent = "Sending…";

    try {
      const response = await fetch(RSVP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Submission failed");
      }
      rsvpForm.reset();
      formStatus.classList.add("is-success");
      formStatus.textContent = "Thank you — your RSVP has been received.";
    } catch (error) {
      console.error("RSVP submission failed:", error);
      formStatus.classList.add("is-error");
      formStatus.textContent = "We couldn’t send your RSVP. Please try again.";
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector("span").textContent = originalText;
    }
  });

})();
