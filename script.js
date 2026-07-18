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
  const RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycby9Zs7paKUzQCU1aYKtglO_4pLWQLfqPx-QsWvTkjVdDPkog2_Klxr3IcxGbxTrM3E/exec";
  const rsvpForm = document.getElementById("rsvpForm");
  const formStatus = document.getElementById("formStatus");
  const rsvpCard = document.querySelector(".rsvp-card");
  const rsvpSuccessPanel = document.getElementById("rsvpSuccessPanel");
  const rsvpSuccessTitle = document.getElementById("rsvpSuccessTitle");
  const rsvpSuccessMessage = document.getElementById("rsvpSuccessMessage");
  const calendarActions = document.getElementById("calendarActions");
  const addCalendarButton = document.getElementById("addCalendarButton");
  const wishesSection = document.getElementById("wishes");
  const wishesCarousel = document.querySelector(".wishes-carousel");
  const wishesTrack = document.getElementById("wishesTrack");
  const wishesFallback = document.getElementById("wishesFallback");
  const wishesPrev = document.getElementById("wishesPrev");
  const wishesNext = document.getElementById("wishesNext");
  const wishModal = document.getElementById("wishModal");
  const wishForm = document.getElementById("wishForm");
  const wishNameInput = document.getElementById("wishName");
  const wishMessageInput = document.getElementById("wishMessage");
  const wishCount = document.getElementById("wishCount");
  const wishStatus = document.getElementById("wishStatus");
  const wishSuccess = document.getElementById("wishSuccess");

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

  const fallbackWishes = [
    {
      name: "With love",
      wish: "Wishing you both a lifetime filled with love, laughter, and countless beautiful memories."
    },
    {
      name: "Family",
      wish: "May this new chapter bring you endless joy and togetherness."
    },
    {
      name: "A loved one",
      wish: "So happy to celebrate this beautiful beginning with you both."
    },
    {
      name: "Friend",
      wish: "May your love grow stronger with every passing year."
    }
  ];

  const reducedMotionQuery = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  );
  let wishesAutoplayTimer = 0;
  let wishesScrollSettleTimer = 0;
  let wishesUserInteracted = false;
  let wishesSectionVisible = !("IntersectionObserver" in window);
  let wishesHoverPaused = false;
  let wishesAutoScrolling = false;

  const getWishKey = wish =>
    `${String(wish.name || "").trim()}::${String(wish.wish || "").trim()}`;

  const shuffleWishes = (wishes, storageKey) => {
    const shuffledWishes = [...wishes];

    for (let index = shuffledWishes.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledWishes[index], shuffledWishes[swapIndex]] = [
        shuffledWishes[swapIndex],
        shuffledWishes[index]
      ];
    }

    if (shuffledWishes.length > 1) {
      try {
        const firstWishKey = getWishKey(shuffledWishes[0]);
        if (sessionStorage.getItem(storageKey) === firstWishKey) {
          shuffledWishes.push(shuffledWishes.shift());
        }
        sessionStorage.setItem(storageKey, getWishKey(shuffledWishes[0]));
      } catch (error) {
        // Session storage can be unavailable in private browsing modes.
      }
    }

    return shuffledWishes;
  };

  const getWishCards = (includeCta = false) => {
    if (!wishesTrack) return [];

    const selector = includeCta
      ? ".wish-card"
      : ".wish-card:not(.wish-card--cta)";

    return Array.from(wishesTrack.querySelectorAll(selector));
  };

  const clearWishesAutoplay = () => {
    window.clearTimeout(wishesAutoplayTimer);
    wishesAutoplayTimer = 0;
  };

  const canRunWishesAutoplay = () =>
    Boolean(
      wishesTrack &&
        wishesSectionVisible &&
        !wishesUserInteracted &&
        !wishesHoverPaused &&
        !document.hidden &&
        !reducedMotionQuery?.matches &&
        getWishCards().length > 1
    );

  const getNearestWishIndex = cards => {
    if (!wishesTrack || cards.length === 0) return -1;

    return cards.reduce((nearestIndex, card, index) => {
      const nearestDistance = Math.abs(
        cards[nearestIndex].offsetLeft - wishesTrack.scrollLeft
      );
      const distance = Math.abs(card.offsetLeft - wishesTrack.scrollLeft);
      return distance < nearestDistance ? index : nearestIndex;
    }, 0);
  };

  const scrollToWishCard = card => {
    if (!wishesTrack || !card) return;

    wishesTrack.scrollTo({
      left: card.offsetLeft,
      behavior: "smooth"
    });
  };

  const advanceWishesAutoplay = () => {
    if (!canRunWishesAutoplay()) return;

    const cards = getWishCards();
    const currentIndex = Math.max(0, getNearestWishIndex(cards));
    const nextCard = cards[(currentIndex + 1) % cards.length];

    wishesAutoScrolling = true;
    scrollToWishCard(nextCard);
    window.clearTimeout(wishesScrollSettleTimer);
    wishesScrollSettleTimer = window.setTimeout(() => {
      wishesAutoScrolling = false;
    }, 900);
  };

  const scheduleWishesAutoplay = (delay = 5500) => {
    clearWishesAutoplay();

    if (!canRunWishesAutoplay()) return;

    wishesAutoplayTimer = window.setTimeout(() => {
      advanceWishesAutoplay();
      scheduleWishesAutoplay();
    }, delay);
  };

  const initWishesAutoplay = () => {
    clearWishesAutoplay();

    if (wishesUserInteracted || reducedMotionQuery?.matches) return;
    scheduleWishesAutoplay(4500);
  };

  const stopWishesAutoplay = () => {
    if (wishesUserInteracted) return;

    wishesUserInteracted = true;
    wishesAutoScrolling = false;
    clearWishesAutoplay();
    window.clearTimeout(wishesScrollSettleTimer);
  };

  const moveWishesManually = direction => {
    stopWishesAutoplay();

    const cards = getWishCards(true);
    if (!wishesTrack || cards.length === 0) return;

    const currentIndex = getNearestWishIndex(cards);
    const nextIndex = Math.min(
      Math.max(currentIndex + direction, 0),
      cards.length - 1
    );

    scrollToWishCard(cards[nextIndex]);
  };

  const createWishCard = ({ name, wish }) => {
    const card = document.createElement("article");
    const text = document.createElement("p");
    const footer = document.createElement("footer");
    const prefix = document.createElement("span");

    card.className = "wish-card";
    text.textContent = wish;
    prefix.textContent = "Love,";
    footer.textContent = name;
    footer.prepend(prefix, " ");

    card.append(text, footer);
    return card;
  };

  const createWishCta = () => {
    const cta = document.createElement("button");
    const text = document.createElement("span");
    const plus = document.createElement("b");
    const note = document.createElement("small");
    const action = document.createElement("em");

    cta.className = "wish-card wish-card--cta";
    cta.id = "openWishForm";
    cta.type = "button";
    text.textContent = "Share Your Wishes";
    plus.textContent = "+";
    note.textContent = "Your blessing will become part of our story.";
    action.textContent = "Add Yours →";
    plus.setAttribute("aria-hidden", "true");

    cta.append(plus, text, note, action);
    cta.addEventListener("click", openWishModal);
    return cta;
  };

  const renderWishes = wishes => {
    if (!wishesTrack) return;

    clearWishesAutoplay();
    if (!wishesUserInteracted) {
      wishesAutoScrolling = true;
      window.clearTimeout(wishesScrollSettleTimer);
    }

    wishesTrack.replaceChildren(
      ...wishes.map(createWishCard),
      createWishCta()
    );

    if (!wishesUserInteracted) {
      wishesTrack.scrollTo({ left: 0, behavior: "auto" });
      wishesScrollSettleTimer = window.setTimeout(() => {
        wishesAutoScrolling = false;
      }, 700);
    }

    initWishesAutoplay();
  };

  async function loadApprovedWishes() {
    if (!wishesTrack) return;

    renderWishes(shuffleWishes(fallbackWishes, "weddingWishesFirst"));

    try {
      const response = await fetch(RSVP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "getApprovedWishes" })
      });
      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Could not load wishes");
      }

      const approvedWishes = Array.isArray(result.wishes)
        ? result.wishes
            .map(item => ({
              name: String(item.name || "").trim(),
              wish: String(item.wish || "").trim()
            }))
            .filter(item => item.name && item.wish)
        : [];

      if (approvedWishes.length > 0) {
        renderWishes(shuffleWishes(approvedWishes, "weddingWishesFirst"));
        if (wishesFallback) wishesFallback.hidden = true;
      }
    } catch (error) {
      console.error("Approved wishes failed to load:", error);
      if (wishesFallback) wishesFallback.hidden = false;
    }
  }

  let wishModalTrigger = null;
  let wishCloseTimer = 0;

  const getWishModalFocusables = () => {
    if (!wishModal) return [];

    return Array.from(
      wishModal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(element => element.offsetParent !== null);
  };

  const resetWishForm = () => {
    wishForm?.reset();
    if (wishForm) wishForm.hidden = false;
    if (wishSuccess) wishSuccess.hidden = true;
    if (wishStatus) {
      wishStatus.className = "form-status";
      wishStatus.textContent = "";
    }
    ["wishName", "wishMessage"].forEach(key =>
      setWishError(key, "")
    );
    updateWishCount();
  };

  function openWishModal(event) {
    if (!wishModal) return;

    window.clearTimeout(wishCloseTimer);
    wishModalTrigger = event?.currentTarget || document.activeElement;
    resetWishForm();
    wishModal.hidden = false;
    wishModal.classList.remove("is-closing");
    body.classList.add("wish-modal-open");
    window.requestAnimationFrame(() => {
      wishModal.classList.add("is-open");
      window.setTimeout(() => wishNameInput?.focus(), 80);
    });
  }

  const closeWishModal = () => {
    if (!wishModal) return;

    wishModal.classList.remove("is-open");
    wishModal.classList.add("is-closing");
    body.classList.remove("wish-modal-open");

    wishCloseTimer = window.setTimeout(() => {
      wishModal.hidden = true;
      wishModal.classList.remove("is-closing");
      resetWishForm();
      if (wishModalTrigger instanceof HTMLElement) {
        wishModalTrigger.focus();
      }
    }, 300);
  };

  document
    .getElementById("openWishForm")
    ?.addEventListener("click", openWishModal);

  wishModal
    ?.querySelectorAll("[data-wish-close]")
    .forEach(element => element.addEventListener("click", closeWishModal));

  document.addEventListener("keydown", event => {
    if (!wishModal || wishModal.hidden) return;

    if (event.key === "Escape") {
      closeWishModal();
      return;
    }

    if (event.key === "Tab") {
      const focusableElements = getWishModalFocusables();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  });

  const setWishError = (key, message) => {
    const errorElement = document.querySelector(`[data-error-for="${key}"]`);
    if (errorElement) errorElement.textContent = message || "";

    document
      .getElementById(key)
      ?.closest(".form-field")
      ?.classList.toggle("has-error", Boolean(message));
  };

  const updateWishCount = () => {
    if (!wishMessageInput || !wishCount) return;
    const length = wishMessageInput.value.length;
    const remaining = Math.max(0, 180 - length);

    wishCount.hidden = length === 0;
    wishCount.textContent = `${remaining} ${
      remaining === 1 ? "character" : "characters"
    } remaining`;
    wishCount.classList.toggle("is-warning", length > 0 && remaining < 20);
  };

  const validateWish = () => {
    const name = wishNameInput?.value.trim() || "";
    const wish = wishMessageInput?.value.trim() || "";

    setWishError("wishName", name ? "" : "Please enter your name.");
    setWishError("wishMessage", wish ? "" : "Please write a wish.");

    if (wish.length > 180) {
      setWishError("wishMessage", "Please keep your wish to 180 characters.");
    }

    if (!name) {
      wishNameInput?.focus();
      return false;
    }

    if (!wish || wish.length > 180) {
      wishMessageInput?.focus();
      return false;
    }

    return true;
  };

  wishNameInput?.addEventListener("input", event => {
    if (event.target.value.trim()) setWishError("wishName", "");
  });

  wishMessageInput?.addEventListener("input", event => {
    updateWishCount();
    if (event.target.value.trim()) setWishError("wishMessage", "");
  });

  wishForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!wishStatus) return;

    wishStatus.className = "form-status";
    wishStatus.textContent = "";

    if (!validateWish()) return;

    const submitButton = wishForm.querySelector('button[type="submit"]');
    const buttonText = submitButton?.querySelector("span");
    const originalText = buttonText?.textContent || "Share My Blessing ❤️";
    const payload = {
      action: "submitWish",
      name: wishNameInput.value.trim(),
      wish: wishMessageInput.value.trim(),
      publicPermission: true,
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
        throw new Error(result.message || "Wish submission failed");
      }

      wishForm.hidden = true;
      if (wishSuccess) wishSuccess.hidden = false;
      wishSuccess?.querySelector("button")?.focus();
    } catch (error) {
      console.error("Wish submission failed:", error);
      wishStatus.classList.add("is-error");
      wishStatus.textContent = "We couldn’t send your wish. Please try again.";
    } finally {
      if (submitButton) submitButton.disabled = false;
      if (buttonText) buttonText.textContent = originalText;
    }
  });

  wishesPrev?.addEventListener("click", () => moveWishesManually(-1));
  wishesNext?.addEventListener("click", () => moveWishesManually(1));

  wishesCarousel?.addEventListener("pointerdown", stopWishesAutoplay, {
    passive: true
  });
  wishesCarousel?.addEventListener("touchstart", stopWishesAutoplay, {
    passive: true
  });
  wishesCarousel?.addEventListener("wheel", stopWishesAutoplay, {
    passive: true
  });
  wishesCarousel?.addEventListener("keydown", stopWishesAutoplay);
  wishesCarousel?.addEventListener("focusin", stopWishesAutoplay);
  wishesCarousel?.addEventListener("mouseenter", () => {
    if (wishesUserInteracted) return;
    wishesHoverPaused = true;
    clearWishesAutoplay();
  });
  wishesCarousel?.addEventListener("mouseleave", () => {
    if (wishesUserInteracted) return;
    wishesHoverPaused = false;
    scheduleWishesAutoplay();
  });
  wishesTrack?.addEventListener(
    "scroll",
    () => {
      if (wishesAutoScrolling || wishesUserInteracted) return;
      stopWishesAutoplay();
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearWishesAutoplay();
      return;
    }

    scheduleWishesAutoplay(4500);
  });

  const handleReducedMotionChange = event => {
    if (event.matches) {
      clearWishesAutoplay();
      return;
    }

    scheduleWishesAutoplay(4500);
  };

  if (reducedMotionQuery?.addEventListener) {
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
  } else if (reducedMotionQuery?.addListener) {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }

  if ("IntersectionObserver" in window && wishesSection) {
    const wishesObserver = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        wishesSectionVisible =
          entry.isIntersecting && entry.intersectionRatio >= 0.35;

        if (wishesSectionVisible) {
          scheduleWishesAutoplay(4500);
        } else {
          clearWishesAutoplay();
        }
      },
      { threshold: [0, 0.35, 0.65] }
    );

    wishesObserver.observe(wishesSection);
  }

  updateWishCount();
  loadApprovedWishes();

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
      action: "submitRsvp",
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
