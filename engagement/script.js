(() => {
  "use strict";

  const body = document.body;
  const preloader = document.querySelector(".preloader");
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const countdown = document.querySelector(".countdown");
  const countdownMessage = document.getElementById("countdownMessage");
  const musicButton = document.getElementById("musicButton");
  const wishesSection = document.getElementById("wishes");
  const wishesCarousel = document.querySelector(".wishes-carousel");
  const wishesTrack = document.getElementById("wishesTrack");
  const wishesFallback = document.getElementById("wishesFallback");
  const wishesPrev = document.getElementById("wishesPrev");
  const wishesNext = document.getElementById("wishesNext");
  const wishModal = document.getElementById("wishModal");
  const initialWishTrigger = document.getElementById("openWishForm");
  const wishForm = document.getElementById("wishForm");
  const wishNameInput = document.getElementById("wishName");
  const wishMessageInput = document.getElementById("wishMessage");
  const wishCount = document.getElementById("wishCount");
  const wishStatus = document.getElementById("wishStatus");
  const wishSuccess = document.getElementById("wishSuccess");
  const directionsButton = document.getElementById("directionsButton");
  const engagementRsvpForm = document.getElementById("engagementRsvpForm");
  const engagementRsvpStatus = document.getElementById("engagementRsvpStatus");
  const engagementRsvpSuccess = document.getElementById("engagementRsvpSuccess");
  const engagementRsvpSuccessTitle = document.getElementById("engagementRsvpSuccessTitle");
  const engagementRsvpSuccessMessage = document.getElementById("engagementRsvpSuccessMessage");

  const WISHES_ENDPOINT = "https://script.google.com/macros/s/AKfycby9Zs7paKUzQCU1aYKtglO_4pLWQLfqPx-QsWvTkjVdDPkog2_Klxr3IcxGbxTrM3E/exec";
  const ENGAGEMENT_RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbzFZv6HXFM-GanZZ4f6Y-ayJJ8RncXd37Y8lJO4KFrFtAd_fEMGBPG2-SeCjq6qNnga0w/exec";
  const ST_MARYS_CHURCH_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=St.%20Mary%27s%20Church%2C%20Kathikudam";
  const AUDIO_SRC = "assets/audio/engagement-song.mp3";
  const MAX_WISH_LENGTH = 180;
  const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let wishesAutoplayTimer = 0;
  let wishesScrollSettleTimer = 0;
  let wishesUserInteracted = false;
  let wishesSectionVisible = !("IntersectionObserver" in window);
  let wishesHoverPaused = false;
  let wishesAutoScrolling = false;

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

  const setFieldError = (key, message) => {
    const error = document.querySelector(`[data-error-for="${key}"]`);
    if (error) error.textContent = message || "";
  };
  const setWishError = setFieldError;

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

  window.setTimeout(() => {
    preloader?.classList.add("is-hidden");
    body.classList.remove("is-loading");
  }, 900);

  const setScrolledState = () => {
    body.classList.toggle("has-scrolled", window.scrollY > 80);
  };

  window.addEventListener("scroll", setScrolledState, { passive: true });
  setScrolledState();

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
      { threshold: 0.18 }
    );
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  const updateCountdown = () => {
    if (!countdown) return;

    const target = new Date(countdown.dataset.eventTime).getTime();
    const difference = target - Date.now();

    if (difference <= 0) {
      ["days", "hours", "minutes", "seconds"].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = "00";
      });
      if (countdownMessage) countdownMessage.textContent = "Today is the day. ❤️";
      return;
    }

    const values = {
      days: Math.floor(difference / 86400000),
      hours: Math.floor((difference / 3600000) % 24),
      minutes: Math.floor((difference / 60000) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };

    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = String(value).padStart(2, "0");
    });
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  if (directionsButton) {
    if (ST_MARYS_CHURCH_MAPS_URL.includes("PASTE_")) {
      directionsButton.removeAttribute("target");
      directionsButton.href = "#";
      directionsButton.addEventListener("click", event => event.preventDefault());
      directionsButton.setAttribute("aria-disabled", "true");
    } else {
      directionsButton.href = ST_MARYS_CHURCH_MAPS_URL;
    }
  }

  const engagementAudio = new Audio(AUDIO_SRC);
  engagementAudio.preload = "none";
  if (musicButton) {
    fetch(AUDIO_SRC, { method: "HEAD" })
      .then(response => {
        musicButton.hidden = !response.ok;
      })
      .catch(() => {
        musicButton.hidden = true;
      });
  }

  musicButton?.addEventListener("click", async () => {
    if (engagementAudio.paused) {
      try {
        await engagementAudio.play();
        musicButton.setAttribute("aria-pressed", "true");
        musicButton.querySelector("strong").textContent = "Pause music";
      } catch (error) {
        musicButton.hidden = true;
      }
      return;
    }

    engagementAudio.pause();
    musicButton.setAttribute("aria-pressed", "false");
    musicButton.querySelector("strong").textContent = "Play music";
  });

  const pauseMusicForInactivePage = () => {
    if (engagementAudio.paused) return;

    engagementAudio.pause();
    musicButton?.setAttribute("aria-pressed", "false");
    musicButton?.querySelector("strong")?.replaceChildren("Play music");
  };

  window.addEventListener("pagehide", pauseMusicForInactivePage);
  window.addEventListener("blur", pauseMusicForInactivePage);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseMusicForInactivePage();
  });

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
    const plus = document.createElement("b");
    const label = document.createElement("span");

    cta.className = "wish-card wish-card--cta";
    cta.id = "openWishForm";
    cta.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-hidden", "true");
    label.textContent = "Add Your Wish";
    cta.append(plus, label);
    cta.addEventListener("click", openWishModal);
    return cta;
  };

  const renderWishes = wishes => {
    if (!wishesTrack) return;
    clearWishesAutoplay();
    wishesAutoScrolling = !wishesUserInteracted;
    wishesTrack.replaceChildren(...wishes.map(createWishCard), createWishCta());
    if (!wishesUserInteracted) {
      wishesTrack.scrollTo({ left: 0, behavior: "auto" });
      window.clearTimeout(wishesScrollSettleTimer);
      wishesScrollSettleTimer = window.setTimeout(() => {
        wishesAutoScrolling = false;
      }, 700);
    }
    initWishesAutoplay();
  };

  const loadApprovedWishes = async () => {
    renderWishes(shuffleWishes(fallbackWishes, "engagementWishesFirst"));

    try {
      const response = await fetch(WISHES_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "getApprovedWishes" })
      });
      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Could not load wishes");
      }

      const wishes = Array.isArray(result.wishes)
        ? result.wishes
            .map(item => ({
              name: String(item.name || "").trim(),
              wish: String(item.wish || "").trim()
            }))
            .filter(item => item.name && item.wish)
        : [];

      if (wishes.length > 0) {
        renderWishes(shuffleWishes(wishes, "engagementWishesFirst"));
        if (wishesFallback) wishesFallback.hidden = true;
      }
    } catch (error) {
      if (wishesFallback) wishesFallback.hidden = false;
    }
  };

  const getWishCards = (includeCta = false) => {
    if (!wishesTrack) return [];
    const selector = includeCta ? ".wish-card" : ".wish-card:not(.wish-card--cta)";
    return Array.from(wishesTrack.querySelectorAll(selector));
  };

  const nearestWishIndex = cards => {
    if (!wishesTrack || cards.length === 0) return -1;

    return cards.reduce((nearest, card, index) => {
      const current = Math.abs(cards[nearest].offsetLeft - wishesTrack.scrollLeft);
      const next = Math.abs(card.offsetLeft - wishesTrack.scrollLeft);
      return next < current ? index : nearest;
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
    const currentIndex = Math.max(0, nearestWishIndex(cards));
    const nextCard = cards[(currentIndex + 1) % cards.length];

    wishesAutoScrolling = true;
    scrollToWishCard(nextCard);
    window.clearTimeout(wishesScrollSettleTimer);
    wishesScrollSettleTimer = window.setTimeout(() => {
      wishesAutoScrolling = false;
    }, 900);
  };

  const initWishesAutoplay = () => {
    clearWishesAutoplay();

    if (wishesUserInteracted || reducedMotionQuery?.matches) return;
    scheduleWishesAutoplay(4500);
  };

  const moveWishes = direction => {
    stopWishesAutoplay();
    const cards = getWishCards(true);
    if (!wishesTrack || cards.length === 0) return;

    const nextIndex = Math.min(
      Math.max(nearestWishIndex(cards) + direction, 0),
      cards.length - 1
    );
    scrollToWishCard(cards[nextIndex]);
  };

  wishesPrev?.addEventListener("click", () => moveWishes(-1));
  wishesNext?.addEventListener("click", () => moveWishes(1));

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

  function clearWishesAutoplay() {
    window.clearTimeout(wishesAutoplayTimer);
    wishesAutoplayTimer = 0;
  }

  function scheduleWishesAutoplay(delay = 5500) {
    clearWishesAutoplay();
    if (!canRunWishesAutoplay()) return;

    wishesAutoplayTimer = window.setTimeout(() => {
      advanceWishesAutoplay();
      scheduleWishesAutoplay();
    }, delay);
  }

  function stopWishesAutoplay() {
    if (wishesUserInteracted) return;
    wishesUserInteracted = true;
    wishesAutoScrolling = false;
    clearWishesAutoplay();
    window.clearTimeout(wishesScrollSettleTimer);
  }

  wishesCarousel?.addEventListener("pointerdown", stopWishesAutoplay, { passive: true });
  wishesCarousel?.addEventListener("touchstart", stopWishesAutoplay, { passive: true });
  wishesCarousel?.addEventListener("wheel", stopWishesAutoplay, { passive: true });
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
  wishesTrack?.addEventListener("scroll", () => {
    if (wishesAutoScrolling || wishesUserInteracted) return;
    stopWishesAutoplay();
  }, { passive: true });
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
    const wishesObserver = new IntersectionObserver(entries => {
      const [entry] = entries;
      wishesSectionVisible = entry.isIntersecting && entry.intersectionRatio >= 0.35;
      if (wishesSectionVisible) {
        scheduleWishesAutoplay(4500);
      } else {
        clearWishesAutoplay();
      }
    }, { threshold: [0, 0.35, 0.65] });
    wishesObserver.observe(wishesSection);
  }
  loadApprovedWishes();

  const validateEngagementRsvp = () => {
    const namesInput = document.getElementById("engagementGuestNames");
    const attendance = engagementRsvpForm?.querySelector("input[name='attendance']:checked");
    const names = namesInput?.value.trim() || "";

    setFieldError("engagementGuestNames", names ? "" : "Please enter the invited name(s).");
    setFieldError("engagementAttendance", attendance ? "" : "Please select your response.");

    if (!names) {
      namesInput?.focus();
      return false;
    }

    if (!attendance) {
      engagementRsvpForm?.querySelector("input[name='attendance']")?.focus();
      return false;
    }

    return true;
  };

  document.getElementById("engagementGuestNames")?.addEventListener("input", event => {
    if (event.target.value.trim()) setFieldError("engagementGuestNames", "");
  });

  engagementRsvpForm?.querySelectorAll("input[name='attendance']").forEach(option => {
    option.addEventListener("change", () => setFieldError("engagementAttendance", ""));
  });

  engagementRsvpForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!engagementRsvpStatus || !validateEngagementRsvp()) return;

    const submitButton = engagementRsvpForm.querySelector("button[type='submit']");
    const buttonText = submitButton?.querySelector("span");
    const originalText = buttonText?.textContent || "Confirm RSVP";
    const attendance = engagementRsvpForm.querySelector("input[name='attendance']:checked").value;

    if (submitButton) submitButton.disabled = true;
    if (buttonText) buttonText.textContent = "Sending…";
    engagementRsvpStatus.className = "form-status";
    engagementRsvpStatus.textContent = "";

    try {
      if (ENGAGEMENT_RSVP_ENDPOINT.includes("PASTE_")) {
        throw new Error("Engagement RSVP is not connected yet.");
      }

      const response = await fetch(ENGAGEMENT_RSVP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "submitEngagementRsvp",
          names: document.getElementById("engagementGuestNames").value.trim(),
          attendance,
          message: document.getElementById("engagementGuestMessage").value.trim(),
          submittedAt: new Date().toISOString()
        })
      });
      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "RSVP submission failed");
      }

      engagementRsvpForm.reset();
      engagementRsvpForm.hidden = true;
      if (engagementRsvpSuccessTitle) {
        engagementRsvpSuccessTitle.textContent =
          attendance === "Joyfully accept" ? "Thank you!" : "Thank you for letting us know.";
      }
      if (engagementRsvpSuccessMessage) {
        engagementRsvpSuccessMessage.textContent =
          attendance === "Joyfully accept"
            ? "We can’t wait to celebrate with you. ❤️"
            : "You’ll be in our thoughts on the day. ❤️";
      }
      if (engagementRsvpSuccess) engagementRsvpSuccess.hidden = false;
    } catch (error) {
      engagementRsvpStatus.classList.add("is-error");
      engagementRsvpStatus.textContent = "We couldn’t send your RSVP. Please try again.";
    } finally {
      if (submitButton) submitButton.disabled = false;
      if (buttonText) buttonText.textContent = originalText;
    }
  });

  let wishModalTrigger = null;
  let wishCloseTimer = 0;

  const updateWishCount = () => {
    if (!wishMessageInput || !wishCount) return;
    const length = wishMessageInput.value.length;
    const remaining = Math.max(0, MAX_WISH_LENGTH - length);
    wishCount.hidden = length === 0;
    wishCount.textContent = `${remaining} ${remaining === 1 ? "character" : "characters"} remaining`;
  };

  const resetWishForm = () => {
    wishForm?.reset();
    if (wishForm) wishForm.hidden = false;
    if (wishSuccess) wishSuccess.hidden = true;
    if (wishStatus) {
      wishStatus.className = "form-status";
      wishStatus.textContent = "";
    }
    ["wishName", "wishMessage"].forEach(key => setWishError(key, ""));
    updateWishCount();
  };

  function openWishModal(event) {
    if (!wishModal) return;
    event?.preventDefault();
    window.clearTimeout(wishCloseTimer);
    wishModalTrigger = event?.currentTarget || document.activeElement;
    resetWishForm();
    wishModal.hidden = false;
    body.classList.add("wish-modal-open");
    window.setTimeout(() => wishNameInput?.focus(), 80);
  }

  initialWishTrigger?.addEventListener("click", openWishModal);

  const closeWishModal = () => {
    if (!wishModal) return;
    body.classList.remove("wish-modal-open");
    wishCloseTimer = window.setTimeout(() => {
      wishModal.hidden = true;
      resetWishForm();
      if (wishModalTrigger instanceof HTMLElement) wishModalTrigger.focus();
    }, 120);
  };

  const getModalFocusables = () => {
    if (!wishModal) return [];
    return Array.from(
      wishModal.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")
    ).filter(element => element.offsetParent !== null);
  };

  wishModal?.querySelectorAll("[data-wish-close]").forEach(element => {
    element.addEventListener("click", closeWishModal);
  });

  document.addEventListener("keydown", event => {
    if (!wishModal || wishModal.hidden) return;

    if (event.key === "Escape") {
      closeWishModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getModalFocusables();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  wishNameInput?.addEventListener("input", event => {
    if (event.target.value.trim()) setWishError("wishName", "");
  });

  wishMessageInput?.addEventListener("input", event => {
    updateWishCount();
    if (event.target.value.trim()) setWishError("wishMessage", "");
  });

  const validateWish = () => {
    const name = wishNameInput?.value.trim() || "";
    const wish = wishMessageInput?.value.trim() || "";

    setWishError("wishName", name ? "" : "Please enter your name.");
    setWishError("wishMessage", wish ? "" : "Please write a wish.");

    if (wish.length > MAX_WISH_LENGTH) {
      setWishError("wishMessage", "Please keep your wish to 180 characters.");
    }

    if (!name) {
      wishNameInput?.focus();
      return false;
    }

    if (!wish || wish.length > MAX_WISH_LENGTH) {
      wishMessageInput?.focus();
      return false;
    }

    return true;
  };

  wishForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!wishStatus || !validateWish()) return;

    const submitButton = wishForm.querySelector("button[type='submit']");
    const buttonText = submitButton?.querySelector("span");
    const originalText = buttonText?.textContent || "Share My Blessing ❤️";

    if (submitButton) submitButton.disabled = true;
    if (buttonText) buttonText.textContent = "Sending…";
    wishStatus.className = "form-status";
    wishStatus.textContent = "";

    try {
      const response = await fetch(WISHES_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "submitWish",
          name: wishNameInput.value.trim(),
          wish: wishMessageInput.value.trim(),
          publicPermission: true,
          submittedAt: new Date().toISOString()
        })
      });
      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Wish submission failed");
      }

      wishForm.hidden = true;
      if (wishSuccess) wishSuccess.hidden = false;
      wishSuccess?.querySelector("button")?.focus();
    } catch (error) {
      wishStatus.classList.add("is-error");
      wishStatus.textContent = "We couldn’t send your wish. Please try again.";
    } finally {
      if (submitButton) submitButton.disabled = false;
      if (buttonText) buttonText.textContent = originalText;
    }
  });
})();
