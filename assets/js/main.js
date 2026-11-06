const header = document.getElementById("header");
const fab = document.getElementById("fab");
const hero = document.getElementById("topo");
const footer = document.querySelector(".site-footer");

const onScroll = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

if ("IntersectionObserver" in window) {
  const revealer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => revealer.observe(el));

  // Botão flutuante: aparece depois do hero e some quando o rodapé entra em tela
  let heroVisible = true;
  let footerVisible = false;
  const syncFab = () => {
    fab.hidden = heroVisible;
    fab.classList.toggle("is-away", footerVisible);
  };
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    syncFab();
  }).observe(hero);
  new IntersectionObserver(([e]) => {
    footerVisible = e.isIntersecting;
    syncFab();
  }).observe(footer);
} else {
  document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
}
