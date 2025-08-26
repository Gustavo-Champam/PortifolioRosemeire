// Utilitários
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

// Ano no rodapé
$("#year").textContent = new Date().getFullYear();

// Menu mobile
const nav = $(".nav");
const toggle = $(".nav-toggle");
toggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
});
$$(".nav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

// Barra de progresso
const bar = $(".progress .bar");
document.addEventListener("scroll", () => {
  const scrolled = window.scrollY;
  const height = document.body.scrollHeight - window.innerHeight;
  const pct = Math.min(100, Math.max(0, (scrolled / Math.max(1, height)) * 100));
  bar.style.width = pct + "%";
});

// Reveal on scroll
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add("is-visible");
      io.unobserve(e.target);
    }
  }
}, { threshold: .12 });
$$(".reveal").forEach(el => io.observe(el));

// Smooth anchor com offset do header
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href").slice(1);
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  const y = target.getBoundingClientRect().top + window.scrollY - 72;
  window.scrollTo({ top: y, behavior: "smooth" });
});

// Botão voltar ao topo
const toTop = $(".to-top");
window.addEventListener("scroll", () => {
  toTop.classList.toggle("show", window.scrollY > 600);
});

// Tabs / filtro
const tabs  = $$(".tab");
const items = $$("#gallery .item");
function applyFilter(filter){
  items.forEach(it => {
    const show = filter === "all" || it.dataset.category === filter;
    it.style.display = show ? "" : "none";
  });
  requestAnimationFrame(resizeAllMasonryItems);
  $("#gallery").setAttribute("aria-label", `Exibindo categoria: ${filter === "all" ? "todas" : filter}`);
}
tabs.forEach(btn => btn.addEventListener("click", () => {
  tabs.forEach(b => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  applyFilter(btn.dataset.filter);
}));

// Masonry (grid-auto-rows)
const grid = $("#gallery");
function resizeMasonryItem(item){
  if (!item) return;
  const cs   = getComputedStyle(grid);
  const rowH = parseInt(cs.getPropertyValue("grid-auto-rows"), 10);
  const gap  = parseInt(cs.getPropertyValue("gap"), 10) || 0;

  const img  = item.querySelector("img");
  const cap  = item.querySelector("figcaption");
  const imgH = img ? img.getBoundingClientRect().height : 0;
  const capH = cap ? cap.getBoundingClientRect().height : 0;

  const bt = parseInt(getComputedStyle(item).getPropertyValue("border-top-width"))  || 0;
  const bb = parseInt(getComputedStyle(item).getPropertyValue("border-bottom-width")) || 0;
  const extra = bt + bb + 12; // folga visual

  const contentH = imgH + capH + extra;
  const span = Math.ceil((contentH + gap) / (rowH + gap));
  item.style.gridRowEnd = "span " + span;
}
function resizeAllMasonryItems(){
  $$("#gallery .item").forEach(resizeMasonryItem);
}
window.addEventListener("load",  resizeAllMasonryItems);
window.addEventListener("resize", resizeAllMasonryItems);
$$("#gallery img").forEach(img =>
  img.addEventListener("load", () => resizeMasonryItem(img.closest(".item")))
);
// Recalcular após as fontes (evita “saltos” de legenda)
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => resizeAllMasonryItems());
}
requestAnimationFrame(() => resizeAllMasonryItems());
setTimeout(resizeAllMasonryItems, 300);

// Lightbox com teclado
const lightbox = $("#lightbox");
const lbImg = $(".lightbox-img");
const lbCap = $(".lightbox-cap");
const lbClose = $(".lightbox-close");
const lbPrev = $(".lightbox .prev");
const lbNext = $(".lightbox .next");
let currentIndex = -1;
const figures = () => $$("#gallery figure.item").filter(f => f.style.display !== "none");

$("#gallery").addEventListener("click", e => {
  const fig = e.target.closest("figure.item");
  if (!fig) return;
  openLightbox(figures().indexOf(fig));
});
function openLightbox(i){
  const figs = figures();
  if (i < 0 || i >= figs.length) return;
  currentIndex = i;
  const fig = figs[i];
  const img = fig.querySelector("img");
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  lbCap.textContent = fig.querySelector("figcaption")?.textContent ?? "";
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
}
function closeLightbox(){
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
}
function navLightbox(dir){
  const figs = figures();
  if (figs.length === 0) return;
  currentIndex = (currentIndex + dir + figs.length) % figs.length;
  const fig = figs[currentIndex];
  const img = fig.querySelector("img");
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  lbCap.textContent = fig.querySelector("figcaption")?.textContent ?? "";
}
lbClose.addEventListener("click", closeLightbox);
lbPrev.addEventListener("click", () => navLightbox(-1));
lbNext.addEventListener("click", () => navLightbox(1));
document.addEventListener("keydown", e => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") navLightbox(-1);
  if (e.key === "ArrowRight") navLightbox(1);
});
lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
