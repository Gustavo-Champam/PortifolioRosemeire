// ==== Utilitários ====
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

// ==== Ano no rodapé ====
$("#year").textContent = new Date().getFullYear();

// ==== Menu mobile com scroll lock ====
const nav = $(".nav");
const toggle = $(".nav-toggle");

function travarScroll(travar) {
  document.documentElement.style.overflow = travar ? "hidden" : "";
  document.body.style.overscrollBehavior = travar ? "none" : "";
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

// Fecha menu ao redimensionar para desktop (debounced)
let resizeTmr;
window.addEventListener("resize", () => {
  clearTimeout(resizeTmr);
  resizeTmr = setTimeout(() => {
    if (window.innerWidth > 720 && nav.classList.contains("open")) {
      nav.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
      travarScroll(false);
    }
    redimensionarTodasAsPecas();
  }, 120);
}, { passive: true });

// ==== Barra de progresso + botão topo (1 handler de scroll, com rAF) ====
const barra = $(".progress .bar");
const toTop = $(".to-top");
let ticking = false;

function onScrollRaf() {
  const rolado = window.scrollY;
  const altura = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const pct = Math.min(100, Math.max(0, (rolado / altura) * 100));
  if (barra) barra.style.transform = `scaleX(${pct/100})`; // usa transform (mais barato que width)
  if (toTop) toTop.classList.toggle("show", rolado > 600);
  ticking = false;
}
function onScroll() {
  if (!ticking) {
    requestAnimationFrame(onScrollRaf);
    ticking = true;
  }
}
window.addEventListener("scroll", onScroll, { passive: true });

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

// ==== Tabs / filtro ====
const tabs  = $$(".tab");
const itens = $$("#gallery .item");
function aplicarFiltro(filtro) {
  // batch write
  const mostrarTudo = filtro === "all";
  for (const it of itens) {
    const mostrar = mostrarTudo || it.dataset.category === filtro;
    if (it.style.display !== (mostrar ? "" : "none")) {
      it.style.display = mostrar ? "" : "none";
    }
  }
  $("#gallery")?.setAttribute("aria-label", `Exibindo categoria: ${mostrarTudo ? "todas" : filtro}`);
  // recalcula uma vez depois de pintar
  requestAnimationFrame(redimensionarTodasAsPecas);
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

// ==== Masonry (lê primeiro, escreve depois; evita thrash) ====
const grid = $("#gallery");
function medirItem(item, cs, rowH, gap) {
  const img  = item.querySelector("img");
  const cap  = item.querySelector("figcaption");
  const imgH = img ? img.getBoundingClientRect().height : 0;
  const capH = cap ? cap.getBoundingClientRect().height : 0;
  const st   = getComputedStyle(item);
  const bt = parseInt(st.getPropertyValue("border-top-width"))  || 0;
  const bb = parseInt(st.getPropertyValue("border-bottom-width")) || 0;
  const extra = bt + bb + 12;
  const contentH = imgH + capH + extra;
  const span = Math.ceil((contentH + gap) / (rowH + gap));
  return span;
}
function redimensionarTodasAsPecas() {
  if (!grid) return;
  const cs   = getComputedStyle(grid);
  const rowH = parseInt(cs.getPropertyValue("grid-auto-rows"), 10) || 1;
  const gap  = parseInt(cs.getPropertyValue("gap"), 10) || 0;

  // READ phase
  const spans = [];
  const visiveis = $$("#gallery .item").filter(it => it.style.display !== "none");
  for (const it of visiveis) spans.push([it, medirItem(it, cs, rowH, gap)]);

  // WRITE phase
  for (const [it, span] of spans) it.style.gridRowEnd = "span " + span;
}
window.addEventListener("load",  redimensionarTodasAsPecas, { once: true });
$$("#gallery img").forEach(img => {
  if (img.complete) {
    // imagem já no cache: ajusta uma vez
    redimensionarTodasAsPecas();
  } else {
    img.addEventListener("load", () => redimensionarTodasAsPecas(), { once: true });
  }
});

// Recalcular após as fontes (uma única vez)
if (document.fonts?.ready) {
  document.fonts.ready.then(() => redimensionarTodasAsPecas());
}

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
  const grande = img.getAttribute("data-large") || img.currentSrc || img.src;

  lbImg.decoding = "async";
  lbImg.loading = "eager";
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
  // libera memória em máquinas mais fracas
  lbImg.removeAttribute("src");
}
function navegarLightbox(dir){
  const figs = figurasVisiveis();
  if (figs.length === 0) return;
  indiceAtual = (indiceAtual + dir + figs.length) % figs.length;
  const fig = figs[indiceAtual];
  const img = fig.querySelector("img");
  const grande = img.getAttribute("data-large") || img.currentSrc || img.src;
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
}, { passive: true });
lightbox?.addEventListener("click", e => { if (e.target === lightbox) fecharLightbox(); });
