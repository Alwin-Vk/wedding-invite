(() => {
  "use strict";

  const body = document.body;
  const preloader = document.querySelector(".preloader");
  const header = document.getElementById("siteHeader");
  const hero = document.querySelector(".hero");
  const heroSlideshow = document.querySelector(".hero__slideshow");
  const heroSlides = Array.from(document.querySelectorAll(".hero__slide"));
  const heroContent = document.querySelector(".hero__content");
  const progressBar = document.querySelector(".page-progress span");
  const musicButton = document.getElementById("musicButton");
  const musicLabel = musicButton?.querySelector(".music-button__label");
  const audio = document.getElementById("weddingAudio");

  body.classList.add("is-loading");

  const revealPage = () => {
    preloader?.classList.add("is-hidden");
    body.classList.remove("is-loading");
    body.classList.add("hero-ready");
  };

  // Always reveal the page, even if an image or font is slow.
  window.addEventListener("load", () => window.setTimeout(revealPage, 2300));
  window.setTimeout(revealPage, 5000);

  const updateScrollEffects = () => {
    const y = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pageProgress = docHeight > 0 ? (y / docHeight) * 100 : 0;

    if (progressBar) progressBar.style.width = `${pageProgress}%`;
    header?.classList.toggle("is-scrolled", y > 60);
    body.classList.toggle("has-scrolled", y > 36);

    if (hero && heroContent && y < window.innerHeight * 1.2) {
      const progress = Math.min(y / window.innerHeight, 1);
      heroContent.style.opacity = String(Math.max(0, 1 - progress * 1.08));
      heroContent.style.transform = `translate3d(0, ${-progress * 52}px, 0)`;

      if (heroSlideshow) {
        heroSlideshow.style.opacity = String(Math.max(0.48, 1 - progress * 0.52));
      }
    }
  };

  window.addEventListener("scroll", updateScrollEffects, { passive: true });
  updateScrollEffects();

  // Section reveal animations.
  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );

    revealElements.forEach(element => observer.observe(element));
  } else {
    revealElements.forEach(element => element.classList.add("is-visible"));
  }

  // Cinematic hero slideshow.
  let activeHeroIndex = 0;

  const activateSlide = index => {
    heroSlides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });
  };

  if (heroSlides.length > 0) {
    activateSlide(0);
  }

  if (heroSlides.length > 1) {
    window.setInterval(() => {
      activeHeroIndex = (activeHeroIndex + 1) % heroSlides.length;
      activateSlide(activeHeroIndex);
    }, 9000);
  }

  // Countdown.
  const target = new Date("2026-08-20T16:30:00+05:30").getTime();
  const countdownElements = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds")
  };

  const pad = value => String(Math.max(0, value)).padStart(2, "0");

  const updateCountdown = () => {
    const distance = target - Date.now();

    if (distance <= 0) {
      Object.values(countdownElements).forEach(element => {
        if (element) element.textContent = "00";
      });
      const note = document.querySelector(".countdown-note");
      if (note) note.textContent = "Today is the day.";
      return;
    }

    if (countdownElements.days) {
      countdownElements.days.textContent = pad(Math.floor(distance / 86400000));
    }
    if (countdownElements.hours) {
      countdownElements.hours.textContent = pad(
        Math.floor((distance % 86400000) / 3600000)
      );
    }
    if (countdownElements.minutes) {
      countdownElements.minutes.textContent = pad(
        Math.floor((distance % 3600000) / 60000)
      );
    }
    if (countdownElements.seconds) {
      countdownElements.seconds.textContent = pad(
        Math.floor((distance % 60000) / 1000)
      );
    }
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  // Music player.
  if (audio && musicButton && musicLabel) {
    audio.volume = 0.22;

    const savedMusicState = localStorage.getItem("weddingMusicState");
    const savedMusicTime = Number(localStorage.getItem("weddingMusicTime") || "0");

    if (Number.isFinite(savedMusicTime) && savedMusicTime > 0) {
      audio.currentTime = savedMusicTime;
    }

    let musicState = savedMusicState;

    const updateMusicState = isPlaying => {
      musicButton.classList.toggle("is-playing", isPlaying);
      musicButton.setAttribute("aria-pressed", String(isPlaying));
      musicButton.setAttribute(
        "aria-label",
        isPlaying ? "Pause song" : "Play song"
      );
      musicLabel.textContent = isPlaying
        ? "Pause song"
        : musicState === "playing"
          ? "Resume song"
          : "Play song";
    };

    updateMusicState(false);

    const saveMusicProgress = () => {
      localStorage.setItem("weddingMusicTime", String(audio.currentTime || 0));
    };

    const pauseMusicForInactivePage = () => {
      if (audio.paused) return;

      audio.pause();
      musicState = "playing";
      localStorage.setItem("weddingMusicState", "playing");
      saveMusicProgress();
      updateMusicState(false);
    };

    musicButton.addEventListener("click", async () => {
      try {
        if (audio.paused) {
          await audio.play();
          musicState = "playing";
          localStorage.setItem("weddingMusicState", musicState);
          updateMusicState(true);
        } else {
          audio.pause();
          musicState = "paused";
          localStorage.setItem("weddingMusicState", musicState);
          saveMusicProgress();
          updateMusicState(false);
        }
      } catch (error) {
        console.error("Audio playback failed:", error);
        musicLabel.textContent = "Tap again";
      }
    });

    audio.addEventListener("timeupdate", () => {
      if (Math.floor(audio.currentTime) % 5 === 0) saveMusicProgress();
    });

    window.addEventListener("pagehide", pauseMusicForInactivePage);
    window.addEventListener("blur", pauseMusicForInactivePage);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pauseMusicForInactivePage();
    });
  }

  // Native RSVP form.
  const RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbxQ40JQSt6BJxYWfHVnV_yNPCVL_fgebFusIC8vmo1xvRhLhRDdBJpROoCuUtFn8hwS/exec";
  const rsvpForm = document.getElementById("rsvpForm");
  const formStatus = document.getElementById("formStatus");
  const rsvpCard = document.querySelector(".rsvp-card");
  const rsvpSuccessPanel = document.getElementById("rsvpSuccessPanel");
  const rsvpSuccessTitle = document.getElementById("rsvpSuccessTitle");
  const rsvpSuccessMessage = document.getElementById("rsvpSuccessMessage");
  const calendarActions = document.getElementById("calendarActions");
  const addCalendarButton = document.getElementById("addCalendarButton");

  if (!rsvpForm || !formStatus) return;

  const setFieldError = (key, message) => {
    const errorElement = document.querySelector(`[data-error-for="${key}"]`);
    if (errorElement) errorElement.textContent = message || "";

    if (key === "attendance") {
      document
        .querySelector(".attendance-field")
        ?.classList.toggle("has-error", Boolean(message));
    } else {
      document
        .getElementById(key)
        ?.closest(".form-field")
        ?.classList.toggle("has-error", Boolean(message));
    }
  };

  const validateRsvp = () => {
    const namesInput = document.getElementById("guestNames");
    const attendance = rsvpForm.querySelector(
      'input[name="attendance"]:checked'
    );
    const names = namesInput?.value.trim() || "";

    setFieldError("guestNames", names ? "" : "Please enter the invited name(s).");
    setFieldError("attendance", attendance ? "" : "Please select your response.");

    if (!names) {
      namesInput?.focus();
      namesInput?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    if (!attendance) {
      const attendanceField = document.querySelector(".attendance-field");
      attendanceField?.scrollIntoView({ behavior: "smooth", block: "center" });
      rsvpForm.querySelector('input[name="attendance"]')?.focus();
      return false;
    }

    return true;
  };

  document.getElementById("guestNames")?.addEventListener("input", event => {
    if (event.target.value.trim()) setFieldError("guestNames", "");
  });

  rsvpForm
    .querySelectorAll('input[name="attendance"]')
    .forEach(option =>
      option.addEventListener("change", () => setFieldError("attendance", ""))
    );


  const calendarEvent = {
    title: "Alwin & Annmareena’s Wedding",
    start: "20260820T110000Z",
    end: "20260820T170000Z",
    location: "Fathima Matha Church, West Koratty, Thrissur, Kerala",
    description:
      "Holy Matrimony — 4:30 PM\n" +
      "Fathima Matha Church, West Koratty, Thrissur, Kerala\n" +
      "Church directions: https://maps.app.goo.gl/mVEn6FETac7NuXJQ6\n\n" +
      "Reception — 6:00 PM\n" +
      "La Mirage, Koratty, Thrissur, Kerala\n" +
      "Reception directions: https://maps.app.goo.gl/AKp7GL7sriovNhSv9\n\n" +
      "Wedding website: https://alwinannmareena.com\n\n" +
      "We can’t wait to celebrate with you. ❤️"
  };

  const escapeIcsText = value =>
    String(value)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const buildGoogleCalendarUrl = () => {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: calendarEvent.title,
      dates: `${calendarEvent.start}/${calendarEvent.end}`,
      details: calendarEvent.description,
      location: calendarEvent.location,
      ctz: "Asia/Kolkata"
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const downloadCalendarFile = () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Alwin and Annmareena//Wedding Invitation//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:alwin-annmareena-wedding-20260820@alwinannmareena.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
      `DTSTART:${calendarEvent.start}`,
      `DTEND:${calendarEvent.end}`,
      `SUMMARY:${escapeIcsText(calendarEvent.title)}`,
      `LOCATION:${escapeIcsText(calendarEvent.location)}`,
      `DESCRIPTION:${escapeIcsText(calendarEvent.description)}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "alwin-annmareena-wedding.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const addToCalendar = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
      window.open(buildGoogleCalendarUrl(), "_blank", "noopener");
      return;
    }

    downloadCalendarFile();
  };

  addCalendarButton?.addEventListener("click", addToCalendar);

  const showRsvpResult = attending => {
    if (!rsvpSuccessPanel || !rsvpCard) return;

    rsvpCard.classList.add("is-complete");
    rsvpSuccessPanel.hidden = false;
    rsvpSuccessPanel.classList.add("is-entering");

    if (rsvpSuccessTitle) {
      rsvpSuccessTitle.textContent = attending
        ? "Thank you!"
        : "Thank you for letting us know.";
    }

    if (rsvpSuccessMessage) {
      rsvpSuccessMessage.textContent = attending
        ? "We can’t wait to celebrate with you. ❤️"
        : "You’ll be in our thoughts on the day. ❤️";
    }

    if (calendarActions) {
      calendarActions.hidden = !attending;
      calendarActions.style.display = attending ? "" : "none";
    }

    window.setTimeout(() => {
      const intro = rsvpCard.querySelector(".rsvp-card__intro");
      rsvpForm.hidden = true;
      if (intro) intro.hidden = true;
      rsvpSuccessPanel.classList.remove("is-entering");
      rsvpSuccessPanel.classList.add("is-visible");
      rsvpSuccessPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
  };

  rsvpForm.addEventListener("submit", async event => {
    event.preventDefault();
    formStatus.className = "form-status";
    formStatus.innerHTML = "";

    if (!validateRsvp()) return;

    if (RSVP_ENDPOINT.includes("PASTE_YOUR")) {
      formStatus.classList.add("is-error");
      formStatus.innerHTML =
        "<strong>RSVP is not connected yet.</strong><span>Complete RSVP_SETUP.md and add the Web App URL.</span>";
      return;
    }

    const submitButton = rsvpForm.querySelector('button[type="submit"]');
    const buttonText = submitButton?.querySelector("span");
    const originalText = buttonText?.textContent || "Confirm RSVP";
    const attendance = rsvpForm.querySelector(
      'input[name="attendance"]:checked'
    ).value;

    const payload = {
      names: document.getElementById("guestNames").value.trim(),
      attendance,
      message: document.getElementById("guestMessage").value.trim(),
      submittedAt: new Date().toISOString()
    };

    if (submitButton) submitButton.disabled = true;
    if (buttonText) buttonText.textContent = "Sending…";

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

      const attending = attendance === "Joyfully accept";
      rsvpForm.reset();
      formStatus.className = "form-status";
      formStatus.innerHTML = "";
      showRsvpResult(attending);
    } catch (error) {
      console.error("RSVP submission failed:", error);
      formStatus.classList.add("is-error");
      formStatus.innerHTML =
        "<strong>We couldn’t send your RSVP.</strong><span>Please try again in a moment.</span>";
    } finally {
      if (submitButton) submitButton.disabled = false;
      if (buttonText) buttonText.textContent = originalText;
    }
  });
})();
