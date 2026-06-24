var CONFIG = {
  whatsapp: "5492478579700",
  instagram: "https://www.instagram.com/el_42motos/",
};

var MOTOS = [];
var FINANCE_CONFIG = null;

var fmtPrice = function (n) {
  var v = Number(n);
  return Number.isFinite(v)
    ? "$" + v.toLocaleString("es-AR", { maximumFractionDigits: 0 })
    : "Consultar";
};

var onlyNumber = function (value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  var cleaned = String(value || "").replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  var n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

var roundUp = function (value, step) {
  step = Math.max(1, Number(step) || 1);
  return Math.ceil(Number(value || 0) / step) * step;
};

var esc = function (str) {
  return String(str || "").replace(/[&<>'"]/g, function (ch) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[ch];
  });
};

var waLink = function (msg) {
  return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
};

/* ---- TRACKING ---- */
function trackEvent(tipo, datos) {
  var sb = window.__SUPABASE__;
  if (!sb) return;
  var payload = { tipo: tipo, pagina: window.location.pathname };
  if (datos) Object.keys(datos).forEach(function (k) { payload[k] = datos[k]; });
  sb.from("eventos_whatsapp").insert(payload).then();
}

function trackCotizacion(datos) {
  var sb = window.__SUPABASE__;
  if (!sb) return;
  sb.from("cotizaciones").insert(datos).then();
}

/* ---- DATA LOADING ---- */
async function loadData() {
  var sb = window.__SUPABASE__;
  if (!sb) {
    var grid = document.getElementById("motoGrid");
    if (grid) grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--color-muted);padding:60px 0">Catálogo no disponible. Configurá Supabase para activarlo.</p>';
    return;
  }

  var r = await sb.from("motos").select("*").eq("disponible", true).order("orden", { ascending: true });
  if (r.error) { console.error("Error catálogo:", r.error); return; }
  MOTOS = r.data || [];

  var c = await sb.from("configuracion").select("valor").eq("clave", "financiera").single();
  if (!c.error && c.data) FINANCE_CONFIG = c.data.valor;
}

async function loadPromos() {
  var sb = window.__SUPABASE__;
  if (!sb) return;
  var r = await sb.from("promociones").select("*").eq("activo", true).limit(1);
  if (r.error || !r.data || !r.data.length) return;
  mostrarBanner(r.data[0]);
}

function mostrarBanner(promo) {
  var el = document.getElementById("promoBanner");
  if (!el) {
    el = document.createElement("div");
    el.id = "promoBanner";
    el.className = "promo-banner";
    el.innerHTML =
      '<span class="promo-banner__text"></span>' +
      '<button class="promo-banner__close" id="promoBannerClose" aria-label="Cerrar promo">&times;</button>';
    var header = document.getElementById("header");
    if (header && header.parentNode) header.parentNode.insertBefore(el, header.nextSibling);
  }
  el.querySelector(".promo-banner__text").textContent = (promo.emoji || "") + " " + promo.texto;
  if (promo.color) el.style.background = promo.color;
  el.classList.remove("is-hidden");
  var closeBtn = document.getElementById("promoBannerClose");
  if (closeBtn) {
    closeBtn.onclick = function () { el.classList.add("is-hidden"); };
  }
}

/* ---- RENDER CARDS ---- */
function renderMotos(filter) {
  filter = filter || "all";
  var grid = document.getElementById("motoGrid");
  if (!grid) return;

  var list = MOTOS.filter(function (m) { return filter === "all" || m.condicion === filter; });

  grid.innerHTML = list
    .map(function (m) {
      var name = esc(m.nombre);
      var precioStr = m.precio_texto || (m.precio ? fmtPrice(m.precio) : "");
      var tags = "";
      if (m.destacada) tags += '<span class="chip chip--xs chip--destacada">★ Destacada</span>';
      if (m.etiqueta) tags += '<span class="chip chip--xs chip--tag">' + esc(m.etiqueta) + "</span>";

      var pricing = "";
      if (m.precio_anterior) pricing += '<span class="precio-anterior">' + fmtPrice(m.precio_anterior) + "</span>";
      pricing += '<span class="precio">' + (precioStr || "Consultar precio") + "</span>";

      var waMsg =
        "¡Hola El 42! Me interesa la " +
        m.nombre +
        (precioStr ? " (" + precioStr + ")" : "") +
        " que vi en la web. ¿Me pasás info y financiación?";
      var href = waLink(waMsg);
      var canQuote = Number.isFinite(Number(m.precio));
      var motoId = m.id || "";

      return (
        '<article class="moto-card" data-cond="' +
        esc(m.condicion) +
        '" data-moto-id="' +
        motoId +
        '">' +
        '<a class="moto-card__media js-open-gallery" href="' +
        href +
        '" data-moto-id="' +
        motoId +
        '" data-moto-nombre="' +
        name +
        '" aria-label="Ver fotos de ' +
        name +
        '">' +
        '<img src="' +
        esc(m.img) +
        '" alt="' +
        name +
        ' — El 42 Motos" width="1080" height="1350" loading="lazy" onerror="this.closest(\'.moto-card__media\').classList.add(\'is-missing-img\'); this.remove();" />' +
        "</a>" +
        '<div class="moto-card__body">' +
        '<h3 class="moto-card__title">' +
        name +
        "</h3>" +
        (tags ? '<div class="moto-card__tags">' + tags + "</div>" : "") +
        '<div class="moto-card__pricing">' +
        pricing +
        "</div>" +
        "</div>" +
        '<div class="moto-card__actions">' +
        '<a class="btn btn--primary btn--sm moto-card__cta js-wa-consulta" href="' +
        href +
        '" data-moto-id="' +
        motoId +
        '" data-moto-nombre="' +
        name +
        '">' +
        '<svg class="ico-wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.06c-.24.68-1.2 1.26-1.97 1.42-.52.11-1.2.2-3.5-.75-2.94-1.22-4.83-4.2-4.98-4.39-.14-.2-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.24-.27.64-.39.99-.39.12 0 .23 0 .33.01.29.01.43.03.62.48.24.56.81 1.96.88 2.1.07.14.12.31.02.51-.09.2-.14.31-.27.48-.14.16-.29.36-.41.49-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.61.76 1.88.9.27.14.46.2.52.31.07.11.07.62-.17 1.29z" fill="currentColor"/></svg>' +
        " Consultar" +
        "</a>" +
        (canQuote
          ? '<a class="btn btn--ghost btn--sm moto-card__quote" href="#cotizador" data-quote-moto="' +
            name +
            '">Cotizar cuotas</a>'
          : "") +
        "</div>" +
        "</article>"
      );
    })
    .join("");

  grid.querySelectorAll(".moto-card").forEach(function (c, i) {
    c.classList.add("reveal");
    setTimeout(function () { c.classList.add("is-visible"); }, 40 * i);
  });
}

/* ---- GALERÍA ---- */
var GALLERY = { images: [], index: 0, motoId: "" };

function initGallery() {
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest(".js-open-gallery");
    if (!trigger) return;
    e.preventDefault();
    var motoId = trigger.getAttribute("data-moto-id");
    if (!motoId) return;
    abrirGaleria(motoId, trigger.getAttribute("href"));
  });

  var close = document.getElementById("galleryClose");
  if (close) close.onclick = cerrarGaleria;

  var overlay = document.getElementById("galleryOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) cerrarGaleria();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (!document.getElementById("galleryOverlay").classList.contains("is-open")) return;
    if (e.key === "Escape") cerrarGaleria();
    if (e.key === "ArrowLeft") galeriaNavegar(-1);
    if (e.key === "ArrowRight") galeriaNavegar(1);
  });

  var prev = document.getElementById("galleryPrev");
  var next = document.getElementById("galleryNext");
  if (prev) prev.onclick = function () { galeriaNavegar(-1); };
  if (next) next.onclick = function () { galeriaNavegar(1); };
}

async function abrirGaleria(motoId, fallbackHref) {
  var sb = window.__SUPABASE__;
  if (!sb) { window.location.href = fallbackHref; return; }

  var r = await sb.from("moto_imagenes").select("url").eq("moto_id", motoId).order("orden");
  var imgs = r.data || [];

  var moto = null;
  for (var i = 0; i < MOTOS.length; i++) {
    if (MOTOS[i].id === motoId) { moto = MOTOS[i]; break; }
  }

  var todas = [{ url: moto ? moto.img : "" }].concat(imgs.map(function (x) { return { url: x.url }; }));

  if (todas.length <= 1) {
    trackEvent("consulta_moto", { moto_id: motoId, moto_nombre: moto ? moto.nombre : "" });
    window.location.href = fallbackHref;
    return;
  }

  GALLERY.images = todas;
  GALLERY.index = 0;
  GALLERY.motoId = motoId;
  mostrarImagenGaleria();
  document.getElementById("galleryOverlay").classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function mostrarImagenGaleria() {
  var img = document.getElementById("galleryImg");
  var counter = document.getElementById("galleryCounter");
  var prev = document.getElementById("galleryPrev");
  var next = document.getElementById("galleryNext");
  if (img) img.src = GALLERY.images[GALLERY.index].url;
  if (counter) counter.textContent = (GALLERY.index + 1) + " de " + GALLERY.images.length;
  if (prev) prev.classList.toggle("is-hidden", GALLERY.index <= 0);
  if (next) next.classList.toggle("is-hidden", GALLERY.index >= GALLERY.images.length - 1);
}

function galeriaNavegar(dir) {
  var nuevo = GALLERY.index + dir;
  if (nuevo < 0 || nuevo >= GALLERY.images.length) return;
  GALLERY.index = nuevo;
  mostrarImagenGaleria();
}

function cerrarGaleria() {
  document.getElementById("galleryOverlay").classList.remove("is-open");
  document.body.style.overflow = "";
}

/* ---- COTIZADOR V3 ---- */
var moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function updateFinanceSummary(data) {
  var d = data || {};
  var nameEl = document.getElementById("summaryMotoName");
  var imgEl = document.getElementById("summaryMotoImage");
  var installmentEl = document.getElementById("summaryInstallment");
  var priceEl = document.getElementById("summaryPrice");
  var downEl = document.getElementById("summaryDown");
  var financedEl = document.getElementById("summaryFinanced");
  var installmentsEl = document.getElementById("summaryInstallments");
  var waBtn = document.getElementById("summaryWhatsAppBtn");

  if (nameEl) nameEl.textContent = d.name || "Seleccioná una moto";
  if (imgEl) { imgEl.src = d.image || ""; imgEl.alt = d.image ? (d.name || "") : ""; }
  if (installmentEl) installmentEl.textContent = moneyFormatter.format(d.installmentValue || 0);
  if (priceEl) priceEl.textContent = moneyFormatter.format(d.price || 0);
  if (downEl) downEl.textContent = moneyFormatter.format(d.downPayment || 0);
  if (financedEl) financedEl.textContent = moneyFormatter.format(Math.max((d.price || 0) - (d.downPayment || 0), 0));
  if (installmentsEl) installmentsEl.textContent = d.installments || 0;
  if (waBtn && d.whatsappUrl) waBtn.href = d.whatsappUrl;
}

function initQuoteCalculator() {
  if (!FINANCE_CONFIG) return;
  var motosConPrecio = MOTOS.filter(function (m) { return Number.isFinite(Number(m.precio)); });
  if (!motosConPrecio.length) return;

  var selectedMotoIdx = -1;
  var selectedPlanIdx = -1;
  var downPct = Number(FINANCE_CONFIG.entregaMinimaPct) || 20;

  /* ---- Custom Select ---- */
  var trigger = document.getElementById("csTrigger");
  var dropdown = document.getElementById("csDropdown");
  var csSelect = document.getElementById("csMotoSelect");

  function buildDropdown() {
    dropdown.innerHTML = motosConPrecio.map(function (m, i) {
      return '<button class="cs-option' + (i === selectedMotoIdx ? ' is-selected' : '') + '" data-cs-idx="' + i + '">' +
        (m.img ? '<img class="cs-option__thumb" src="' + esc(m.img) + '" alt="" loading="lazy" />' : '') +
        '<span class="cs-option__name">' + esc(m.nombre) + '</span>' +
        '<span class="cs-option__price">' + fmtPrice(m.precio) + '</span></button>';
    }).join('');
  }
  buildDropdown();

  function updateTrigger() {
    if (selectedMotoIdx < 0) {
      trigger.innerHTML = '<span class="cs-trigger__placeholder">Seleccioná una moto</span><svg class="cs-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';
      return;
    }
    var m = motosConPrecio[selectedMotoIdx];
    trigger.innerHTML =
      (m.img ? '<img class="cs-trigger__thumb" src="' + esc(m.img) + '" alt="" />' : '') +
      '<span class="cs-trigger__label">' + esc(m.nombre) + '</span>' +
      '<span class="cs-trigger__price">' + fmtPrice(m.precio) + '</span>' +
      '<svg class="cs-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';
  }

  function toggleDropdown(e) {
    e.stopPropagation();
    var isOpen = dropdown.classList.contains("is-open");
    closeDropdown();
    if (!isOpen) {
      dropdown.classList.add("is-open");
      trigger.classList.add("is-open");
    }
  }

  function closeDropdown() {
    dropdown.classList.remove("is-open");
    trigger.classList.remove("is-open");
  }

  trigger.addEventListener("click", toggleDropdown);

  dropdown.addEventListener("click", function (e) {
    var opt = e.target.closest(".cs-option");
    if (!opt) return;
    var idx = Number(opt.dataset.csIdx);
    if (!isNaN(idx) && idx >= 0) {
      selectedMotoIdx = idx;
      updateTrigger();
      buildDropdown();
      closeDropdown();
      recalcular();
    }
  });

  document.addEventListener("click", function (e) {
    if (csSelect && !csSelect.contains(e.target)) closeDropdown();
  });

  /* ---- Plan Selector ---- */
  var planContainer = document.getElementById("planSelector");

  function buildPlans() {
    planContainer.innerHTML = FINANCE_CONFIG.planes.map(function (p, i) {
      var isActive = i === selectedPlanIdx || (selectedPlanIdx < 0 && Number(p.cuotas) === Number(FINANCE_CONFIG.planInicial || 12));
      if (selectedPlanIdx < 0 && isActive) selectedPlanIdx = i;
      return '<button class="plan-btn' + (isActive ? ' is-active' : '') + '" data-plan-idx="' + i + '">' +
        esc(p.cuotas) + '<br><small style="font-weight:400;font-size:.7rem;opacity:.75">cuotas</small></button>';
    }).join('');
  }
  buildPlans();

  planContainer.addEventListener("click", function (e) {
    var btn = e.target.closest(".plan-btn");
    if (!btn || btn.classList.contains("is-active")) return;
    planContainer.querySelectorAll(".plan-btn").forEach(function (b) { b.classList.remove("is-active"); });
    btn.classList.add("is-active");
    selectedPlanIdx = Number(btn.dataset.planIdx);
    recalcular();
  });

  /* ---- Calculation ---- */
  var resultEl = document.getElementById("csResult");
  var installmentEl = document.getElementById("csInstallment");
  var priceEl = document.getElementById("csPrice");
  var downEl = document.getElementById("csDown");
  var waBtn = document.getElementById("csWhatsAppBtn");
  var disclaimerEl = document.getElementById("csDisclaimer");

  if (disclaimerEl) disclaimerEl.textContent = FINANCE_CONFIG.disclaimer || "";

  function recalcular() {
    if (selectedMotoIdx < 0 || selectedPlanIdx < 0) {
      resultEl.classList.remove("is-visible");
      return;
    }

    var moto = motosConPrecio[selectedMotoIdx];
    var plan = FINANCE_CONFIG.planes[selectedPlanIdx];
    var price = Number(moto.precio) || 0;
    var entrega = roundUp(price * (downPct / 100), 1000);
    var financia = Math.max(price - entrega, 0);
    var totalRecargo = financia * (1 + Number(plan.recargoTotalPct || 0) / 100);
    var cuota = roundUp(totalRecargo / Math.max(1, Number(plan.cuotas || 1)), FINANCE_CONFIG.redondeo || 1);

    installmentEl.textContent = fmtPrice(cuota);
    priceEl.textContent = fmtPrice(price);
    downEl.textContent = fmtPrice(entrega);

    var venc = new Date();
    venc.setMonth(venc.getMonth() + 1);
    var expEl = document.getElementById("ccExpiry");
    if (expEl) expEl.textContent = String(venc.getMonth() + 1).padStart(2, "0") + "/" + String(venc.getFullYear()).slice(-2);

    var amountEl = document.getElementById("ccAmount");
    if (amountEl) {
      var oldVal = amountEl.textContent;
      amountEl.textContent = fmtPrice(cuota);
      if (oldVal !== amountEl.textContent) {
        amountEl.style.transition = "none";
        amountEl.style.transform = "scale(1.08)";
        setTimeout(function () {
          amountEl.style.transition = "transform .25s ease";
          amountEl.style.transform = "scale(1)";
        }, 10);
      }
    }

    var brandEl = document.getElementById("ccBrand");
    if (brandEl) brandEl.textContent = plan.cuotas + " CUOTAS";
    var numberEl = document.getElementById("ccNumber");
    if (numberEl) {
      var num = String(plan.cuotas).padStart(2, "0") + "  ••••  ••••  " + String(price).slice(-4).padStart(4, "0");
      numberEl.textContent = num;
    }

    var face = document.getElementById("cc3dFace");
    if (face) face.classList.add("has-moto");

    var holderEl = document.getElementById("ccHolder");
    if (holderEl) holderEl.textContent = moto.nombre.toUpperCase();

    var waMsg =
      "¡Hola El 42! Quiero consultar esta simulación:\n" +
      "Moto: " + moto.nombre + "\n" +
      "Precio: " + fmtPrice(price) + "\n" +
      "Entrega (" + downPct + "%): " + fmtPrice(entrega) + "\n" +
      "Plan: " + plan.cuotas + " cuotas de " + fmtPrice(cuota) + "\n" +
      "¿Me confirman disponibilidad?";

    waBtn.setAttribute("href", waLink(waMsg));

    trackCotizacion({
      moto_nombre: moto.nombre, precio: price, entrega: entrega,
      plan_cuotas: plan.cuotas, cuota_estimada: cuota,
    });

    updateFinanceSummary({
      name: moto.nombre,
      image: moto.img || "",
      price: price,
      downPayment: entrega,
      installments: Number(plan.cuotas),
      installmentValue: cuota,
      whatsappUrl: waLink(waMsg),
    });

    resultEl.classList.add("is-visible");
  }

  /* ---- 3D Card Mouse Tracking + Flip ---- */
  var cc3d = document.getElementById("cc3d");
  var ccInner = document.getElementById("cc3dInner");
  var ccGlow = document.getElementById("ccGlow");
  var ccInputNumber = document.getElementById("ccInputNumber");
  var ccInputName = document.getElementById("ccInputName");
  var ccInputExpiry = document.getElementById("ccInputExpiry");
  var ccInputCvc = document.getElementById("ccInputCvc");
  var ccSig = document.getElementById("ccSig");
  var ccCvcDisplay = document.getElementById("ccCvcDisplay");

  function isFlipped() {
    return ccInner && ccInner.classList.contains("is-flipped");
  }

  function setFlip(flipped) {
    if (!ccInner) return;
    ccInner.classList.toggle("is-flipped", flipped);
    if (flipped) {
      ccInner.style.transform = "";
    }
  }

  function syncCardInputs() {
    if (!ccInputNumber) return;
    var numEl = document.getElementById("ccNumber");
    if (numEl) {
      var raw = ccInputNumber.value.replace(/\D/g, "").slice(0, 16);
      var formatted = raw.replace(/(.{4})/g, "$1 ").trim() || "•••• •••• •••• ••••";
      numEl.textContent = formatted;
      ccInputNumber.value = raw ? formatted : "";
    }
    var holderEl = document.getElementById("ccHolder");
    if (holderEl && ccInputName) {
      holderEl.textContent = ccInputName.value.toUpperCase() || "T U  C U O T A";
    }
    var expEl = document.getElementById("ccExpiry");
    if (expEl && ccInputExpiry) {
      var v = ccInputExpiry.value.replace(/[^\d/]/g, "").slice(0, 5);
      if (v.length === 3 && v.indexOf("/") < 0) v = v.slice(0, 2) + "/" + v.slice(2);
      expEl.textContent = v || "**/**";
    }
    if (ccCvcDisplay && ccInputCvc) {
      var cvc = ccInputCvc.value.replace(/\D/g, "").slice(0, 4);
      ccCvcDisplay.textContent = cvc.padEnd(3, "•") || "•••";
    }
  }

  if (ccInputNumber) {
    ccInputNumber.addEventListener("input", function () {
      syncCardInputs();
      setFlip(false);
    });
  }
  if (ccInputName) {
    ccInputName.addEventListener("input", function () {
      syncCardInputs();
      setFlip(false);
    });
  }
  if (ccInputExpiry) {
    ccInputExpiry.addEventListener("input", function () {
      syncCardInputs();
      setFlip(false);
    });
  }
  if (ccInputCvc) {
    ccInputCvc.addEventListener("focus", function () { setFlip(true); });
    ccInputCvc.addEventListener("blur", function () {
      if (!this.value) setFlip(false);
    });
    ccInputCvc.addEventListener("input", function () {
      syncCardInputs();
      setFlip(true);
    });
  }

  /* Click en el campo CVC del admin panel tmb sincroniza */
  if (ccSig && ccInputCvc) {
    ccSig.textContent = "CVC";
  }

  if (cc3d && ccInner) {
    cc3d.addEventListener("mousemove", function (e) {
      if (isFlipped()) return;
      var rect = cc3d.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      var rotX = (y - 0.5) * -16;
      var rotY = (x - 0.5) * 16;
      ccInner.style.transform = "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";
      if (ccGlow) {
        var gx = x * 100;
        var gy = y * 100;
        ccGlow.style.background = "radial-gradient(circle at " + gx + "% " + gy + "%, rgba(255,255,255,.12) 0%, transparent 60%)";
      }
    });

    cc3d.addEventListener("mouseleave", function () {
      if (isFlipped()) return;
      ccInner.style.transform = "rotateX(0deg) rotateY(0deg)";
      if (ccGlow) ccGlow.style.background = "radial-gradient(circle at 50% 50%, rgba(255,255,255,.08) 0%, transparent 60%)";
    });
  }

  /* ---- data-quote-moto click handler ---- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-quote-moto]");
    if (!t) return;
    var name = t.getAttribute("data-quote-moto");
    setTimeout(function () {
      for (var i = 0; i < motosConPrecio.length; i++) {
        if (motosConPrecio[i].nombre === name) {
          selectedMotoIdx = i;
          updateTrigger();
          buildDropdown();
          if (selectedPlanIdx < 0) selectedPlanIdx = 0;
          planContainer.querySelectorAll(".plan-btn").forEach(function (b, bi) {
            b.classList.toggle("is-active", bi === selectedPlanIdx);
          });
          recalcular();
          break;
        }
      }
    }, 80);
  });

  /* ---- Init ---- */
  if (motosConPrecio.length) {
    selectedMotoIdx = 0;
    if (selectedPlanIdx < 0) selectedPlanIdx = 0;
    updateTrigger();
    buildDropdown();
    planContainer.querySelectorAll(".plan-btn").forEach(function (b, bi) {
      b.classList.toggle("is-active", bi === selectedPlanIdx);
    });
    recalcular();
  }
}

/* ---- LEAD FORM ---- */
function initLeadForm() {
  var form = document.getElementById("leadForm");
  var submitBtn = document.getElementById("leadSubmitBtn");
  var successEl = document.getElementById("leadSuccess");
  var nameEl = document.getElementById("leadName");
  var phoneEl = document.getElementById("leadPhone");
  var motoEl = document.getElementById("leadMoto");
  var msgEl = document.getElementById("leadMessage");

  if (!form) return;

  /* populate moto dropdown */
  if (motoEl && MOTOS.length) {
    motoEl.innerHTML = '<option value="">Cualquiera — contame opciones</option>' +
      MOTOS.map(function (m) {
        return '<option value="' + esc(m.nombre) + '">' + esc(m.nombre) + "</option>";
      }).join("");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var nombre = nameEl.value.trim();
    var telefono = phoneEl.value.trim();
    if (!nombre || !telefono) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    var data = {
      nombre: nombre,
      telefono: telefono,
      moto_interes: motoEl ? motoEl.value : "",
      mensaje: msgEl ? msgEl.value.trim() : "",
    };

    var sb = window.__SUPABASE__;
    var ok = false;
    if (sb) {
      var r = await sb.from("leads").insert(data);
      if (!r.error) ok = true;
    }

    /* Always send WhatsApp too */
    var waMsg = "¡Hola El 42! Soy " + nombre + " (tel: " + telefono + ")";
    if (data.moto_interes) waMsg += ". Me interesa: " + data.moto_interes;
    if (data.mensaje) waMsg += ". " + data.mensaje;
    waMsg += ". Complete el formulario en la web.";

    form.style.display = "none";
    if (successEl) {
      successEl.classList.add("is-visible");
      var waLinkBtn = successEl.querySelector(".js-wa");
      if (waLinkBtn) {
        waLinkBtn.setAttribute("href", waLink(waMsg));
        waLinkBtn.setAttribute("target", "_blank");
        waLinkBtn.setAttribute("rel", "noopener");
      }
    }

    trackEvent("consulta_general", { nombre: nombre, telefono: telefono, mensaje: data.mensaje || "" });
  });
}

/* ---- FILTROS ---- */
function initFilters() {
  var filters = document.querySelectorAll(".filter");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filters.forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      renderMotos(btn.dataset.filter);
    });
  });
}

/* ---- WHATSAPP TRACKING ---- */
function initWhatsApp() {
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".js-wa, .js-wa-consulta, .wa-float, .mobile-cta__btn");
    if (!btn) return;
    var msg = btn.getAttribute("data-wa-msg") || "¡Hola El 42! Quiero hacer una consulta.";
    var motoId = btn.getAttribute("data-moto-id") || "";
    var motoNombre = btn.getAttribute("data-moto-nombre") || "";
    trackEvent("consulta_moto", { moto_id: motoId, moto_nombre: motoNombre, mensaje: msg.substring(0, 200) });
  });

  document.querySelectorAll(".js-wa, .js-wa-consulta").forEach(function (el) {
    var msg = el.getAttribute("data-wa-msg") || "¡Hola El 42! Quiero hacer una consulta.";
    el.setAttribute("href", waLink(msg));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
}

/* ---- HEADER (glassmorphism) ---- */
function initHeader() {
  var header = document.getElementById("header");
  var toggle = document.getElementById("navToggle");
  var navMobile = document.getElementById("navMobile");
  if (!header || !toggle || !navMobile) return;

  /* Scroll state */
  var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 20); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Toggle mobile menu */
  var toggleMenu = function (open) {
    var isOpen = open !== undefined ? open : !navMobile.classList.contains("is-open");
    navMobile.classList.toggle("is-open", isOpen);
    toggle.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("nav-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  };
  toggle.addEventListener("click", function () { toggleMenu(); });

  /* Close on link click (mobile) */
  navMobile.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { toggleMenu(false); });
  });

  /* Close on Escape */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && navMobile.classList.contains("is-open")) toggleMenu(false);
  });

  /* Close on resize to desktop */
  var mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", function () { if (mq.matches) toggleMenu(false); });

  /* ---- Active section tracking ---- */
  var sections = ["motos", "como-compras", "cotizador", "contacto", "usados", "ubicaciones"];
  var navLinks = document.querySelectorAll(".nav-link, .nav-mobile__link");

  var setActive = function (id) {
    navLinks.forEach(function (l) {
      var isActive = l.getAttribute("data-section") === id;
      l.classList.toggle("is-active", isActive);
    });
  };

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        var best = null;
        entries.forEach(function (e) {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
        });
        if (best) setActive(best.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] }
    );
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }
}

/* ---- REVEAL (enhanced) ---- */
function initReveal() {
  var items = [
    { sel: ".section__head", anim: "reveal" },
    { sel: ".step", anim: "reveal" },
    { sel: ".feature", anim: "reveal" },
    { sel: ".location", anim: "reveal" },
    { sel: ".finance-card", anim: "reveal" },
    { sel: ".quote-copy", anim: "reveal-left" },
    { sel: ".quote-card", anim: "reveal-right" },
    { sel: ".ig-cell", anim: "reveal-scale" },
    { sel: ".cta-final__inner", anim: "reveal" },
    { sel: ".trust-card", anim: "reveal" },
    { sel: ".brands__head", anim: "reveal" },
    { sel: ".cotizador-sim", anim: "reveal-left" },
    { sel: ".cotizador-visual", anim: "reveal-right" },
    { sel: ".finance-summary", anim: "reveal-right" },
    { sel: ".lead-copy", anim: "reveal-left" },
    { sel: ".lead-form", anim: "reveal-right" },
    { sel: ".two-cards", anim: "reveal-stagger" },
  ];

  var allEls = [];
  items.forEach(function (item) {
    var els = document.querySelectorAll(item.sel);
    els.forEach(function (el) {
      el.classList.add(item.anim);
      allEls.push(el);
    });
  });

  /* Stagger children */
  document.querySelectorAll(".reveal-stagger").forEach(function (parent) {
    parent.querySelectorAll(":scope > *").forEach(function (child) {
      child.classList.add("reveal");
    });
  });

  if (!("IntersectionObserver" in window)) {
    allEls.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );
  allEls.forEach(function (el) { io.observe(el); });
}

/* ---- PARALLAX HERO ---- */
function initParallax() {
  var bg = document.querySelector(".hero__bg");
  if (!bg) return;
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        var speed = 0.2;
        bg.style.transform = "translateY(" + (y * speed * -1) + "px)";
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ---- MARQUEE PAUSE ---- */
function initMarqueePause() {
  var track = document.getElementById("brandsTrack");
  if (!track) return;
  var pause = function () { track.classList.add("is-paused"); };
  var resume = function () { track.classList.remove("is-paused"); };
  track.addEventListener("mouseenter", pause);
  track.addEventListener("mouseleave", resume);
  track.addEventListener("touchstart", pause);
  track.addEventListener("touchend", resume);
}

/* ---- COUNTER BUMP ---- */
function initCounterBump() {
  var targets = document.querySelectorAll(
    "#csInstallment, #summaryInstallment, #ccAmount"
  );
  if (!targets.length) return;
  var observer = new MutationObserver(function () {
    targets.forEach(function (el) {
      el.classList.remove("is-bump");
      void el.offsetWidth;
      el.classList.add("is-bump");
      setTimeout(function () { el.classList.remove("is-bump"); }, 350);
    });
  });
  targets.forEach(function (el) {
    observer.observe(el, { childList: true, characterData: true, subtree: true });
  });
}

/* ---- HERO CARROUSEL ---- */
function initHeroCarousel() {
  var container = document.getElementById("heroCarousel");
  if (!container) return;

  var slides = [{ url: "img/hero.jpg" }];
  var seen = {};
  for (var i = 0; i < MOTOS.length && slides.length < 7; i++) {
    var img = MOTOS[i].img;
    if (img && !seen[img]) { seen[img] = true; slides.push({ url: img }); }
  }

  container.innerHTML = slides.map(function (s, i) {
    return '<div class="hero__slide' + (i === 0 ? " is-active" : "") + '" style="background-image:url(\'' + s.url + '\')"></div>';
  }).join("");

  var idx = 0;
  setInterval(function () {
    var all = container.querySelectorAll(".hero__slide");
    if (!all.length) return;
    all[idx].classList.remove("is-active");
    idx = (idx + 1) % all.length;
    all[idx].classList.add("is-active");
  }, 5000);
}

/* ---- INIT ---- */
document.addEventListener("DOMContentLoaded", async function () {
  await loadData();
  await loadPromos();
  renderMotos();
  initHeroCarousel();
  initQuoteCalculator();
  initLeadForm();
  initFilters();
  initWhatsApp();
  initHeader();
  initReveal();
  initParallax();
  initMarqueePause();
  initCounterBump();
  initGallery();
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});
