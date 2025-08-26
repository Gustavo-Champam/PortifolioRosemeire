// ==== Utilitários ====
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

// ==== Ano no rodapé ====
$("#year").textContent = new Date().getFullYear();

// ==== Menu mobile com scroll lock ====
const nav = $(".nav");
const toggle = $(".nav-toggle");

function travarScroll(travar) {
  document.body.style.overflow = travar ? "hidden" : "";
}

toggle?.addEventListener("click", () => {
  const aberto = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", aberto ? "true" : "false");
  travarScroll(aberto);
});
$$(".nav a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("open");
  toggle?.setAttribute("aria-expanded", "false");
  travarScroll(false);
}));

// Fecha menu ao redimensionar para desktop
window.addEventListener("resize", () => {
  if (window.innerWidth > 720 && nav.classList.contains("open")) {
    nav.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
    travarScroll(false);
  }
});

// ==== Barra de progresso ====
const barra = $(".progress .bar");
document.addEventListener("scroll", () => {
  const rolado = window.scrollY;
  const altura = document.body.scrollHeight - window.innerHeight;
  const pct = Math.min(100, Math.max(0, (rolado / Math.max(1, altura)) * 100));
  barra.style.width = pct + "%";
});

// ==== Reveal on scroll ====
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add("is-visible");
      io.unobserve(e.target);
    }
  }
}, { threshold: .12 });
$$(".reveal").forEach(el => io.observe(el));

// ==== Smooth anchor com offset do header (dinâmico) ====
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute("href").slice(1);
  if (!id) return;

  const alvo = document.getElementById(id);
  if (!alvo) return;

  e.preventDefault();
  const header = $(".site-header");
  const headerAltura = header ? header.getBoundingClientRect().height : 72;
  const y = alvo.getBoundingClientRect().top + window.scrollY - (headerAltura + 14);
  window.scrollTo({ top: y, behavior: "smooth" });
});

// ==== Botão voltar ao topo ====
const toTop = $(".to-top");
window.addEventListener("scroll", () => {
  toTop.classList.toggle("show", window.scrollY > 600);
});

// ==== Tabs / filtro ====
const tabs  = $$(".tab");
const itens = $$("#gallery .item");
function aplicarFiltro(filtro) {
  itens.forEach(it => {
    const mostrar = filtro === "all" || it.dataset.category === filtro;
    it.style.display = mostrar ? "" : "none";
  });
  requestAnimationFrame(redimensionarTodasAsPecas);
  $("#gallery")?.setAttribute("aria-label", `Exibindo categoria: ${filtro === "all" ? "todas" : filtro}`);
}
tabs.forEach(btn => btn.addEventListener("click", () => {
  tabs.forEach(b => {
    b.classList.remove("is-active");
    b.setAttribute("aria-selected", "false");
  });
  btn.classList.add("is-active");
  btn.setAttribute("aria-selected", "true");
  aplicarFiltro(btn.dataset.filter);
}));

// ==== Masonry (grid-auto-rows) ====
const grid = $("#gallery");
function redimensionarItemMasonry(item) {
  if (!item || !grid) return;
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
function redimensionarTodasAsPecas() {
  $$("#gallery .item").forEach(redimensionarItemMasonry);
}
window.addEventListener("load",  redimensionarTodasAsPecas);
window.addEventListener("resize", redimensionarTodasAsPecas);
$$("#gallery img").forEach(img =>
  img.addEventListener("load", () => redimensionarItemMasonry(img.closest(".item")))
);
// Recalcular após as fontes (evita “saltos” de legenda)
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => redimensionarTodasAsPecas());
}
requestAnimationFrame(() => redimensionarTodasAsPecas());
setTimeout(redimensionarTodasAsPecas, 300);

// ==== Lightbox com teclado e carga sob demanda ====
const lightbox   = $("#lightbox");
const lbImg      = $(".lightbox-img");
const lbCap      = $(".lightbox-cap");
const lbClose    = $(".lightbox-close");
const lbPrev     = $(".lightbox .prev");
const lbNext     = $(".lightbox .next");
let indiceAtual  = -1;
const figurasVisiveis = () => $$("#gallery figure.item").filter(f => f.style.display !== "none");

function abrirLightbox(i){
  const figs = figurasVisiveis();
  if (i < 0 || i >= figs.length) return;
  indiceAtual = i;
  const fig = figs[i];
  const img = fig.querySelector("img");
  const grande = img.getAttribute("data-large") || img.src;

  // só “puxa” a maior quando abre
  lbImg.src = grande;
  lbImg.alt = img.alt;
  lbCap.textContent = fig.querySelector("figcaption")?.textContent ?? "";
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  travarScroll(true);
}
function fecharLightbox(){
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  travarScroll(false);
}
function navegarLightbox(dir){
  const figs = figurasVisiveis();
  if (figs.length === 0) return;
  indiceAtual = (indiceAtual + dir + figs.length) % figs.length;
  const fig = figs[indiceAtual];
  const img = fig.querySelector("img");
  const grande = img.getAttribute("data-large") || img.src;
  lbImg.src = grande;
  lbImg.alt = img.alt;
  lbCap.textContent = fig.querySelector("figcaption")?.textContent ?? "";
}

$("#gallery")?.addEventListener("click", e => {
  const fig = e.target.closest("figure.item");
  if (!fig) return;
  abrirLightbox(figurasVisiveis().indexOf(fig));
});

lbClose?.addEventListener("click", fecharLightbox);
lbPrev?.addEventListener("click", () => navegarLightbox(-1));
lbNext?.addEventListener("click", () => navegarLightbox(1));

document.addEventListener("keydown", e => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") fecharLightbox();
  if (e.key === "ArrowLeft") navegarLightbox(-1);
  if (e.key === "ArrowRight") navegarLightbox(1);
});
lightbox?.addEventListener("click", e => { if (e.target === lightbox) fecharLightbox(); });
