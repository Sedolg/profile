(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme ---------- */
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch (_) {}
  $("#themeToggle").addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (_) {}
  });

  /* ---------- nav: scrolled state, progress bar, active link ---------- */
  const nav = $(".nav");
  const progress = $(".scroll-progress");
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 20);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navLinks = $$(".nav__links a");
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${e.target.id}`));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  navLinks.forEach((a) => {
    const s = $(a.getAttribute("href"));
    if (s) sectionObserver.observe(s);
  });

  /* ---------- mobile menu ---------- */
  const burger = $("#navBurger");
  const menu = $(".nav__links");
  burger.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  navLinks.forEach((a) =>
    a.addEventListener("click", () => {
      menu.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          revealObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- typed roles ---------- */
  const typed = $("#typed");
  const roles = [
    "Full-Stack Developer",
    "React · Next.js · TypeScript",
    "Node.js · Python · PostgreSQL",
    "AWS · Docker · CI/CD",
    "AI · LLMs · RAG",
  ];
  if (!reduceMotion) {
    let r = 0, i = roles[0].length, deleting = true;
    const tick = () => {
      const word = roles[r];
      i += deleting ? -1 : 1;
      typed.textContent = word.slice(0, i);
      let delay = deleting ? 40 : 80;
      if (!deleting && i === word.length) { deleting = true; delay = 1800; }
      else if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2000);
  }

  /* ---------- animated counters ---------- */
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = +el.dataset.count;
        const prefix = el.dataset.prefix || "";
        const suffix = el.dataset.suffix || "";
        const duration = 1600;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        reduceMotion ? (el.textContent = prefix + target + suffix) : requestAnimationFrame(step);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  $$("[data-count]").forEach((el) => counterObserver.observe(el));

  /* ---------- service card spotlight ---------- */
  $$(".service").forEach((card) =>
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    })
  );

  /* ---------- carousel ---------- */
  const carousel = $("#workCarousel");
  if (carousel) {
    const track = $(".carousel__track", carousel);
    const slides = $$(".slide", carousel);
    const thumbs = $$(".thumb", carousel);
    const bar = $(".carousel__progress span", carousel);
    const AUTOPLAY_MS = 6000;
    let index = 0;
    let timer = null;
    let paused = false;

    const go = (n) => {
      index = (n + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((s, i) => {
        const active = i === index;
        s.classList.toggle("is-active", active);
        s.setAttribute("aria-hidden", String(!active));
      });
      thumbs.forEach((t, i) => {
        t.classList.toggle("is-active", i === index);
        t.setAttribute("aria-selected", String(i === index));
      });
      restart();
    };

    const restart = () => {
      clearTimeout(timer);
      bar.style.transition = "none";
      bar.style.transform = "scaleX(0)";
      if (paused || reduceMotion) return;
      void bar.offsetWidth; // reflow so the transition restarts
      bar.style.transition = `transform ${AUTOPLAY_MS}ms linear`;
      bar.style.transform = "scaleX(1)";
      timer = setTimeout(() => go(index + 1), AUTOPLAY_MS);
    };

    const setPaused = (v) => { paused = v; restart(); };

    $("[data-carousel-prev]").addEventListener("click", () => go(index - 1));
    $("[data-carousel-next]").addEventListener("click", () => go(index + 1));
    thumbs.forEach((t, i) => t.addEventListener("click", () => go(i)));

    carousel.addEventListener("mouseenter", () => setPaused(true));
    carousel.addEventListener("mouseleave", () => setPaused(false));
    carousel.addEventListener("focusin", () => setPaused(true));
    carousel.addEventListener("focusout", () => setPaused(false));
    document.addEventListener("visibilitychange", () => setPaused(document.hidden));

    carousel.tabIndex = 0;
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    });

    // swipe / drag
    const viewport = $(".carousel__viewport", carousel);
    let startX = 0, dx = 0, dragging = false;
    viewport.addEventListener("pointerdown", (e) => {
      dragging = true; startX = e.clientX; dx = 0;
      track.style.transition = "none";
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      track.style.transform = `translateX(calc(-${index * 100}% + ${dx}px))`;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.style.transition = "";
      const threshold = viewport.offsetWidth * 0.15;
      if (dx > threshold) go(index - 1);
      else if (dx < -threshold) go(index + 1);
      else go(index);
    };
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    // only autoplay while the carousel is on screen
    new IntersectionObserver(([e]) => setPaused(!e.isIntersecting), { threshold: 0.3 }).observe(carousel);

    go(0);
  }

  /* ---------- lightbox ---------- */
  const lightbox = $("#lightbox");
  const lbImg = $("img", lightbox);
  const lbCap = $("figcaption", lightbox);
  let lastFocus = null;
  const openLightbox = (src, caption) => {
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = caption;
    lbCap.textContent = caption;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    $(".lightbox__close", lightbox).focus();
  };
  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };
  $$(".gallery__item").forEach((item) =>
    item.addEventListener("click", () => openLightbox(item.dataset.full, item.dataset.caption))
  );
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.closest(".lightbox__close")) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });

  $("#year").textContent = new Date().getFullYear();

  /* ---------- hero neural-network canvas ---------- */
  const canvas = $("#neuralBg");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, nodes, raf;
    const mouse = { x: -9999, y: -9999 };
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const init = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 16000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const light = root.dataset.theme === "light";
      const LINK = 130;
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const mdx = n.x - mouse.x, mdy = n.y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 120) { n.x += mdx / md; n.y += mdy / md; }
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            const alpha = (1 - d / LINK) * (light ? 0.35 : 0.45);
            ctx.strokeStyle = `rgba(124, 92, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = light ? "rgba(79, 70, 229, .7)" : "rgba(34, 211, 238, .85)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const hero = $(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

    // pause when the hero is off screen
    new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(draw);
    }).observe(hero);

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 150);
    });
    init();
  }
})();
