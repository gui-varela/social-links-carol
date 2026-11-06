const SPRITE = "assets/icons/sprite.svg";
const GOOGLE_FALLBACK_URL = "https://share.google/rhQ1G3dLco5bFbjpc";
const AUTOPLAY_MS = 8000;

const root = document.getElementById("reviews-widget");
const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
};

const icon = (id, className = "icon") => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `${SPRITE}#${id}`);
  svg.append(use);
  return svg;
};

const stars = (rating) => {
  const wrap = el("span", { class: "stars", role: "img", "aria-label": `${rating} de 5 estrelas` });
  for (let i = 1; i <= 5; i++) {
    const star = icon("star");
    if (i > Math.round(rating)) star.classList.add("is-off");
    wrap.append(star);
  }
  return wrap;
};

const nf = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const showFallbackLink = () => {
  const link = el("a", {
    class: "link-arrow",
    href: GOOGLE_FALLBACK_URL,
    target: "_blank",
    rel: "noopener",
    text: "Ver avaliações no Google",
  });
  root.replaceChildren(el("p", { class: "reviews-fallback" }, [link]));
  root.hidden = false;
};

const buildCard = (review, index, total) => {
  const avatar = el("span", { class: "avatar", "aria-hidden": "true" });
  if (review.photo) {
    avatar.append(el("img", { src: review.photo, alt: "", loading: "lazy", referrerpolicy: "no-referrer" }));
  } else {
    avatar.textContent = (review.author || "?").trim().charAt(0).toUpperCase();
  }

  return el(
    "div",
    {
      class: "review-card",
      role: "group",
      "aria-roledescription": "slide",
      "aria-label": `${index + 1} de ${total}`,
    },
    [
      el("div", { class: "review-top" }, [icon("quote", "icon quote-mark"), stars(review.rating ?? 5)]),
      el("blockquote", { class: "review-text", text: review.text }),
      el("footer", { class: "review-author" }, [
        avatar,
        el("span", { class: "who" }, [
          el("span", { class: "name", text: review.author }),
          el("span", { class: "when", text: [review.when, "no Google"].filter(Boolean).join(" · ") }),
        ]),
      ]),
    ]
  );
};

const render = (data) => {
  const reviews = data.reviews.filter((r) => r && r.text && r.text.trim());
  const total = reviews.length;
  const mapsUrl = data.googleMapsUri || GOOGLE_FALLBACK_URL;

  const summary = el("div", { class: "reviews-summary" }, [
    el("span", { class: "google" }, [icon("google"), "Google"]),
    el("span", { class: "score", text: nf.format(data.rating) }),
    stars(data.rating),
    el("span", { class: "count", text: `${data.userRatingCount} avaliações` }),
  ]);

  const track = el("div", { class: "review-track", "aria-live": "off" });
  const cards = reviews.map((review, i) => buildCard(review, i, total));
  track.append(...cards);

  const prev = el("button", { class: "icon-btn", type: "button", "aria-label": "Depoimento anterior" }, [icon("left")]);
  const next = el("button", { class: "icon-btn", type: "button", "aria-label": "Próximo depoimento" }, [icon("right")]);
  const toggle = el("button", { class: "icon-btn", type: "button", "aria-label": "Pausar rotação automática" }, [icon("pause")]);
  const dots = el("div", { class: "dots" });
  const dotButtons = reviews.map((_, i) => {
    const b = el("button", { type: "button", "aria-label": `Ir para o depoimento ${i + 1}` });
    b.addEventListener("click", () => go(i, true));
    dots.append(b);
    return b;
  });

  const controls = el("div", { class: "review-controls" }, total > 1 ? [prev, dots, next, toggle] : []);
  const more = el("p", { class: "reviews-more" }, [
    el("a", {
      class: "link-arrow",
      href: mapsUrl,
      target: "_blank",
      rel: "noopener",
      text: "Ver todas as avaliações no Google",
    }),
  ]);

  const parts = [];
  if (data.sample) {
    parts.push(el("p", { class: "sample-flag", text: "Dados de exemplo (visível apenas em ambiente local). Rode o script de avaliações para trazer as reais." }));
  }
  parts.push(summary, track, controls, more);
  root.replaceChildren(...parts);
  root.hidden = false;

  let current = 0;
  let timer = null;
  let autoplay = !reduceMotion && total > 1;

  function go(index, userInitiated = false) {
    if (userInitiated) stop(true);
    current = (index + total) % total;
    cards.forEach((card, i) => {
      const active = i === current;
      card.classList.toggle("is-active", active);
      card.toggleAttribute("inert", !active);
    });
    dotButtons.forEach((b, i) => {
      if (i === current) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
  }

  function start() {
    if (!autoplay || timer) return;
    timer = setInterval(() => go(current + 1), AUTOPLAY_MS);
  }

  function pause() {
    clearInterval(timer);
    timer = null;
  }

  function stop(permanent) {
    pause();
    if (permanent) {
      autoplay = false;
      track.setAttribute("aria-live", "polite");
      setToggleState();
    }
  }

  function setToggleState() {
    toggle.replaceChildren(icon(autoplay ? "pause" : "play"));
    toggle.setAttribute("aria-label", autoplay ? "Pausar rotação automática" : "Retomar rotação automática");
  }

  prev.addEventListener("click", () => go(current - 1, true));
  next.addEventListener("click", () => go(current + 1, true));
  toggle.addEventListener("click", () => {
    autoplay = !autoplay;
    track.setAttribute("aria-live", autoplay ? "off" : "polite");
    setToggleState();
    if (autoplay) start();
    else pause();
  });

  root.addEventListener("mouseenter", pause);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", pause);
  root.addEventListener("focusout", start);
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(current - 1, true);
    if (e.key === "ArrowRight") go(current + 1, true);
  });

  let startX = null;
  track.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
  });
  track.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 48) go(current + (dx < 0 ? 1 : -1), true);
  });
  track.addEventListener("pointercancel", () => {
    startX = null;
  });

  document.addEventListener("visibilitychange", () => (document.hidden ? pause() : start()));

  go(0);
  setToggleState();
  start();
};

async function init() {
  if (!root) return;
  try {
    const res = await fetch(root.dataset.src, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    const valid = Array.isArray(data.reviews) && data.reviews.length > 0 && typeof data.rating === "number";
    if (!valid || (data.sample && !isLocal)) return showFallbackLink();
    render(data);
  } catch {
    showFallbackLink();
  }
}

init();
