/* ============================================================================
   PEAXAI website — interactive figures
   ----------------------------------------------------------------------------
   All numbers come from window.PEAXAI_DATA (computed in R/compute_results.R
   with the PEAXAI package) or window.PEAXAI_PUBLISHED (published figures in
   data/published_results.yml). Nothing is computed with invented values here:
   this file only selects, formats and draws precomputed results.
   Each figure is a <div class="pxa-widget" data-widget="..."> in the pages.
   ========================================================================== */
(function () {
  "use strict";

  const D = window.PEAXAI_DATA;
  const PUB = window.PEAXAI_PUBLISHED;
  const LANG = (document.documentElement.lang || "en").slice(0, 2) === "es" ? "es" : "en";

  // ---- Palette (mirrors assets/css/peaxai.scss) ---------------------------
  const C = {
    ink: "#12324a", ink2: "#4a5d6e", muted: "#6b7889", line: "#dbe3e8", grid: "#edf1f4",
    eff: "#0e8a72", effDeep: "#0a5a4c", ineff: "#8a96a8", target: "#e0860b",
    targetInk: "#9a5800", peer: "#6250d6", neg: "#c0504a"
  };
  const PROB_SCALE = [
    [0, "#ffffff"], [0.3, "#f1faf6"], [0.6, "#d3efe5"], [0.8, "#9fd9c5"], [0.93, "#58bb9c"], [1, "#2a9f82"]
  ];
  const FONT = "'Hanken Grotesk', system-ui, sans-serif";
  const CFG = { displayModeBar: false, responsive: true, scrollZoom: false, doubleClick: false };

  // ---- Text -------------------------------------------------------------------
  const I18N = {
    en: {
      resources: "Resources used (input)", output: "Output produced",
      org: "Organisation", firm: "Firm", orgShort: "Org.",
      effDEA: "Efficient (DEA)", ineffDEA: "Inefficient (DEA)", frontier: "DEA frontier",
      probEff: "Probability of the efficient class", prob: "P(efficient class)",
      meets: "Meets the threshold", notMeets: "Below the threshold",
      select: "Organisation", threshold: "Probability threshold", strategy: "Improvement strategy",
      reduce: "Reduce resources", increase: "Increase output", shapDir: "Importance-weighted (SHAP)",
      current: "Current situation", target: "Counterfactual target", peerSel: "Selected peer", candidates: "Candidate peers",
      highest: "Highest probability",
      distance: "Distance", euclid: "Euclidean", weighted: "Importance-weighted",
      firmA: "A", firmB: "B",
      inputChange: "Resources", outputChange: "Output", probChange: "Probability of the efficient class", beta: "Directional distance (β)",
      from: "from", to: "to",
      introReadout: (o, x, y, xt, yt, dx, dy) => `<strong>${o}</strong> uses <strong>${x}</strong> units of resources to produce <strong>${y}</strong>. The best observed practice obtains the same output with <strong>${xt}</strong> (${dx}) or, with the same resources, produces <strong>${yt}</strong> (${dy}).`,
      onFrontier: (o) => `<strong>${o}</strong> lies on the DEA frontier: no observed combination of other organisations uses fewer resources for its output or produces more with its resources.`,
      pairText: (yA, xA, xB, ratio) => `A and B produce almost the same output (≈ ${yA}), yet B uses ${xB} units of resources and A only ${xA}: ${ratio}× more for the same result.`,
      deaCount: (n) => `Traditional DEA: <strong>${n}</strong> efficient units, all others inefficient.`,
      peaxCount: (n, t) => `PEAXAI at p ≥ ${t}: <strong>${n}</strong> observed ${n === 1 ? "unit meets" : "units meet"} the criterion; the shaded region shows every input–output combination that would.`,
      reached: "Reaches the threshold",
      notReached: (p, t) => `With the bounds PEAXAI applies (inputs not below the observed minimum, outputs not above the observed maximum), this organisation cannot reach p ≥ ${t} in this direction. The target shown is the highest probability attainable: ${p}.`,
      already: (t) => `This organisation already meets p ≥ ${t}: no adjustment is required.`,
      noCandidates: (t) => `No observed organisation reaches p ≥ ${t}. With such a demanding threshold the benchmark set is empty, and PEAXAI reports no peer.`,
      ownPeer: "This organisation already meets the threshold, so it is its own reference.",
      peerText: (o, p, d, best, isBest) => isBest
        ? `PEAXAI selects <strong>${p}</strong> as the peer of ${o}: the observed unit above the threshold that is closest to its target (distance ${d}). Here it is also the unit with the highest probability.`
        : `PEAXAI selects <strong>${p}</strong> as the peer of ${o}: the observed unit above the threshold that is closest to its target (distance ${d}). The unit with the highest probability, ${best}, is further from where ${o} needs to go.`,
      peerTable: ["", "Resources", "Output", "Probability"],
      evaluated: "Evaluated", peerCol: "Peer",
      shapBase: "Average prediction", shapFinal: "This firm",
      raises: "raises", lowers: "lowers",
      shapText: (f, p, b, up, down) => `The model gives <strong>${f}</strong> a probability of <strong>${p}</strong> of belonging to the DEA-efficient class, against an average of ${b}. ${up}${down}`,
      shapUp: (v, s) => `${v} is the variable that raises the prediction most (${s}). `,
      shapDown: (v, s) => `${v} is the one that lowers it most (${s}).`,
      shapNoDown: "No variable lowers it noticeably.",
      shapNoUp: "No variable raises it noticeably. ",
      shapVal: "SHAP value (contribution to the probability)",
      featVal: "Variable value", low: "low", high: "high",
      importanceAxis: "Relative importance (share of mean |SHAP|)",
      input: "input", outputK: "output",
      crit: "Order by", critPred: "Current probability", critAtt: "Attainable performance",
      rankCols: ["Rank", "Firm", "Current P", "Attainable P", "Effort (β)", "Group", "Other ranking"],
      grpMeets: "Already meets", grpReach: "Can reach with adjustments", grpBelow: "Maximum below threshold",
      moved: (k) => `${k > 0 ? "▲" : "▼"} ${Math.abs(k)}`,
      same: "=",
      variable: "Variable",
      pdpLine: "Average response (PDP)", iceLine: "Individual firms (ICE)",
      pdpY: "Predicted probability of the efficient class",
      ba: "Balanced accuracy (5-fold CV)", sdNote: "Whiskers: ± 1 SD across folds",
      dea: "DEA", pGt: "p >", pGe: "p ≥",
      nFirms: "Firms classified as efficient",
      change: "Mean change from observed values (%)",
      reductions: "Reduction", increases: "Increase",
      ranks: (a, b) => `ranks ${a}–${b}`,
      firmsWord: "firms",
      view: "Show", viewTop: "Top 15", viewMovers: "Largest changes",
      atLeast: (t) => `≥ ${t}`,
      rankDrop: (f, a, b, p) => `<strong>${f}</strong> ranks ${a} by current probability (${p}) but ${b} by attainable performance: along the modelled direction its probability cannot reach the threshold.`,
      rankRise: (f, a, b, beta) => `<strong>${f}</strong> starts ${a} by current probability, yet a modelled adjustment of β = ${beta} is enough to reach the threshold, so it rises to ${b}.`,
      langSwitch: "ES", nav: null
    },
    es: {
      resources: "Recursos utilizados (input)", output: "Producción obtenida",
      org: "Organización", firm: "Empresa", orgShort: "Org.",
      effDEA: "Eficiente (DEA)", ineffDEA: "Ineficiente (DEA)", frontier: "Frontera DEA",
      probEff: "Probabilidad de la clase eficiente", prob: "P(clase eficiente)",
      meets: "Cumple el umbral", notMeets: "Por debajo del umbral",
      select: "Organización", threshold: "Umbral de probabilidad", strategy: "Estrategia de mejora",
      reduce: "Reducir recursos", increase: "Aumentar producción", shapDir: "Ponderada por importancia (SHAP)",
      current: "Situación actual", target: "Objetivo contrafactual", peerSel: "Peer seleccionado", candidates: "Peers candidatos",
      highest: "Mayor probabilidad",
      distance: "Distancia", euclid: "Euclídea", weighted: "Ponderada por importancia",
      firmA: "A", firmB: "B",
      inputChange: "Recursos", outputChange: "Producción", probChange: "Probabilidad de la clase eficiente", beta: "Distancia direccional (β)",
      from: "de", to: "a",
      introReadout: (o, x, y, xt, yt, dx, dy) => `<strong>${o}</strong> utiliza <strong>${x}</strong> unidades de recursos para producir <strong>${y}</strong>. La mejor práctica observada obtiene la misma producción con <strong>${xt}</strong> (${dx}) o, con los mismos recursos, produce <strong>${yt}</strong> (${dy}).`,
      onFrontier: (o) => `<strong>${o}</strong> está sobre la frontera DEA: ninguna combinación observada de otras organizaciones usa menos recursos para su producción ni produce más con sus recursos.`,
      pairText: (yA, xA, xB, ratio) => `A y B obtienen casi la misma producción (≈ ${yA}), pero B utiliza ${xB} unidades de recursos y A solo ${xA}: ${ratio} veces más para el mismo resultado.`,
      deaCount: (n) => `DEA tradicional: <strong>${n}</strong> unidades eficientes; todas las demás, ineficientes.`,
      peaxCount: (n, t) => `PEAXAI con p ≥ ${t}: <strong>${n}</strong> ${n === 1 ? "unidad observada cumple" : "unidades observadas cumplen"} el criterio; la región sombreada muestra todas las combinaciones de inputs y outputs que lo cumplirían.`,
      reached: "Alcanza el umbral",
      notReached: (p, t) => `Con los límites que aplica PEAXAI (inputs no inferiores al mínimo observado y outputs no superiores al máximo observado), esta organización no puede alcanzar p ≥ ${t} en esta dirección. El objetivo mostrado es la máxima probabilidad alcanzable: ${p}.`,
      already: (t) => `Esta organización ya cumple p ≥ ${t}: no necesita ningún ajuste.`,
      noCandidates: (t) => `Ninguna organización observada alcanza p ≥ ${t}. Con un umbral tan exigente el conjunto de referencias queda vacío y PEAXAI no asigna peer.`,
      ownPeer: "Esta organización ya cumple el umbral, por lo que es su propia referencia.",
      peerText: (o, p, d, best, isBest) => isBest
        ? `PEAXAI selecciona <strong>${p}</strong> como peer de ${o}: la unidad observada por encima del umbral más próxima a su objetivo (distancia ${d}). En este caso coincide con la unidad de mayor probabilidad.`
        : `PEAXAI selecciona <strong>${p}</strong> como peer de ${o}: la unidad observada por encima del umbral más próxima a su objetivo (distancia ${d}). La unidad con mayor probabilidad, ${best}, queda más lejos de hacia dónde necesita moverse ${o}.`,
      peerTable: ["", "Recursos", "Producción", "Probabilidad"],
      evaluated: "Evaluada", peerCol: "Peer",
      shapBase: "Predicción media", shapFinal: "Esta empresa",
      raises: "aumenta", lowers: "reduce",
      shapText: (f, p, b, up, down) => `El modelo asigna a la <strong>${f}</strong> una probabilidad de <strong>${p}</strong> de pertenecer a la clase eficiente según DEA, frente a una media de ${b}. ${up}${down}`,
      shapUp: (v, s) => `Su valor de ${v} es lo que más eleva la predicción (${s}). `,
      shapDown: (v, s) => `Su valor de ${v} es lo que más la reduce (${s}).`,
      shapNoDown: "Ninguna variable la reduce de forma apreciable.",
      shapNoUp: "Ninguna variable la eleva de forma apreciable. ",
      shapVal: "Valor SHAP (contribución a la probabilidad)",
      featVal: "Valor de la variable", low: "bajo", high: "alto",
      importanceAxis: "Importancia relativa (proporción del |SHAP| medio)",
      input: "input", outputK: "output",
      crit: "Ordenar por", critPred: "Probabilidad actual", critAtt: "Desempeño alcanzable",
      rankCols: ["Puesto", "Empresa", "P actual", "P alcanzable", "Esfuerzo (β)", "Grupo", "Otro ranking"],
      grpMeets: "Ya lo cumple", grpReach: "Puede alcanzarlo con ajustes", grpBelow: "Máximo por debajo del umbral",
      moved: (k) => `${k > 0 ? "▲" : "▼"} ${Math.abs(k)}`,
      same: "=",
      variable: "Variable",
      pdpLine: "Respuesta media (PDP)", iceLine: "Empresas individuales (ICE)",
      pdpY: "Probabilidad predicha de la clase eficiente",
      ba: "Exactitud equilibrada (VC con 5 particiones)", sdNote: "Bigotes: ± 1 DE entre particiones",
      dea: "DEA", pGt: "p >", pGe: "p ≥",
      nFirms: "Empresas clasificadas como eficientes",
      change: "Cambio medio respecto a los valores observados (%)",
      reductions: "Reducción", increases: "Aumento",
      ranks: (a, b) => `puestos ${a}–${b}`,
      firmsWord: "empresas",
      view: "Mostrar", viewTop: "Primeras 15", viewMovers: "Mayores cambios",
      atLeast: (t) => `≥ ${t}`,
      rankDrop: (f, a, b, p) => `La <strong>${f}</strong> ocupa el puesto ${a} por probabilidad actual (${p}), pero el ${b} por desempeño alcanzable: en la dirección modelizada su probabilidad no puede alcanzar el umbral.`,
      rankRise: (f, a, b, beta) => `La <strong>${f}</strong> parte del puesto ${a} por probabilidad actual, pero un ajuste modelizado de β = ${beta} basta para alcanzar el umbral, y sube al puesto ${b}.`,
      langSwitch: "EN"
    }
  };
  const T = I18N[LANG];

  const VAR_LABEL = {
    en: { total_assets: "Total assets", employees: "Employees", fixed_assets: "Fixed assets",
          personnel_expenses: "Personnel expenses", operating_income: "Operating income" },
    es: { total_assets: "Activo total", employees: "Empleados", fixed_assets: "Inmovilizado material",
          personnel_expenses: "Gastos de personal", operating_income: "Ingresos de explotación" }
  }[LANG];
  const VAR_LOWER = {
    en: { total_assets: "total assets", employees: "number of employees", fixed_assets: "fixed assets",
          personnel_expenses: "personnel expenses", operating_income: "operating income" },
    es: { total_assets: "activo total", employees: "número de empleados", fixed_assets: "inmovilizado material",
          personnel_expenses: "gastos de personal", operating_income: "ingresos de explotación" }
  }[LANG];
  const VAR_UNIT = { total_assets: "M€", employees: "", fixed_assets: "M€", personnel_expenses: "M€", operating_income: "M€" };
  const IS_OUTPUT = (v) => v === "operating_income";

  // ---- Formatting -------------------------------------------------------------
  const nf = (d) => new Intl.NumberFormat(LANG === "es" ? "es-ES" : "en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
  const f2 = (x) => nf(2).format(x), f1 = (x) => nf(1).format(x), f0 = (x) => nf(0).format(x), f3 = (x) => nf(3).format(x);
  const pct = (x) => (x > 0 ? "+" : x < 0 ? "−" : "") + nf(1).format(Math.abs(x)) + " %";
  const pctPlain = (x) => (x > 0 ? "+" : x < 0 ? "−" : "") + nf(1).format(Math.abs(x)) + "%";
  const signed = (x, d = 2) => (x > 0 ? "+" : x < 0 ? "−" : "") + nf(d).format(Math.abs(x));
  const orgName = (i) => `${T.org} ${i + 1}`;
  const firmName = (i) => `${T.firm} ${i + 1}`;
  const fmtThr = (t) => nf(2).format(t);

  // ---- Small DOM helpers ----------------------------------------------------------
  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    }
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function control(label, node) {
    const w = el("div", { class: "pxa-control" });
    w.appendChild(el("span", { class: "pxa-control-label" }, label));
    w.appendChild(node);
    return w;
  }
  function seg(options, value, onChange, aria) {
    const g = el("div", { class: "pxa-seg", role: "group", "aria-label": aria || "" });
    const set = (v) => {
      value = v;
      g.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === String(v))));
    };
    options.forEach((o) => {
      const b = el("button", { type: "button", "data-v": String(o.value) }, o.label);
      b.addEventListener("click", () => { set(o.value); onChange(o.value); });
      g.appendChild(b);
    });
    set(value);
    g.setValue = set;
    return g;
  }
  function select(options, value, onChange, aria) {
    const s = el("select", { class: "pxa-select", "aria-label": aria || "" });
    options.forEach((o) => { const op = el("option", { value: String(o.value) }, o.label); s.appendChild(op); });
    s.value = String(value);
    s.addEventListener("change", () => onChange(Number(s.value)));
    return s;
  }
  function legend(items) {
    const l = el("div", { class: "pxa-legend" });
    items.forEach((it) => {
      const k = el("i", { class: "pxa-key " + (it.cls || "") });
      if (it.color) k.style.background = it.color;
      if (it.border) { k.style.border = it.border; k.style.background = it.fill || "transparent"; }
      if (it.lineColor) k.style.borderTopColor = it.lineColor;
      const s = el("span"); s.appendChild(k); s.appendChild(document.createTextNode(it.label));
      l.appendChild(s);
    });
    return l;
  }

  function merge(a, b) {
    const out = Array.isArray(a) ? a.slice() : Object.assign({}, a);
    for (const k in b) {
      if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a && typeof a[k] === "object" && !Array.isArray(a[k])) out[k] = merge(a[k], b[k]);
      else out[k] = b[k];
    }
    return out;
  }
  const AXIS = { gridcolor: C.grid, zeroline: false, linecolor: C.line, showline: true, ticks: "outside", tickcolor: C.line, ticklen: 4,
                 title: { font: { size: 13, color: C.ink2 }, standoff: 8 }, tickfont: { size: 12, color: C.muted }, fixedrange: true };
  function layout(extra) {
    return merge({
      font: { family: FONT, size: 13, color: C.ink2 },
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      margin: { l: 58, r: 14, t: 8, b: 52 },
      xaxis: AXIS, yaxis: merge(AXIS, { ticklabelstandoff: 6 }), showlegend: false, dragmode: false, hovermode: "closest",
      hoverlabel: { bgcolor: "#ffffff", bordercolor: C.line, font: { family: FONT, color: C.ink, size: 13 }, align: "left" }
    }, extra || {});
  }
  function draw(div, traces, lay) { Plotly.react(div, traces, layout(lay), CFG); }

  // ---- Shared 2-D (toy) layers -------------------------------------------------------
  const TOY = D.toy;
  const XR = [0.5, 10.5], YR = [1, 10];
  function frontierTrace(width) {
    const fx = TOY.frontier.x, fy = TOY.frontier.y;
    const xs = [fx[0]].concat(fx, [XR[1]]);
    const ys = [YR[0]].concat(fy, [fy[fy.length - 1]]);
    return { x: xs, y: ys, type: "scatter", mode: "lines", line: { color: C.ink, width: width || 2 }, hoverinfo: "skip", name: T.frontier };
  }
  function heatTrace(opacity) {
    return { type: "heatmap", x: TOY.grid.x, y: TOY.grid.y, z: TOY.grid.z, zmin: 0, zmax: 1, colorscale: PROB_SCALE,
             showscale: false, hoverinfo: "skip", opacity: opacity === undefined ? 1 : opacity, zsmooth: "best" };
  }
  function contourTrace(t, width, dash, color) {
    return { type: "contour", x: TOY.grid.x, y: TOY.grid.y, z: TOY.grid.z, autocontour: false,
             contours: { start: t, end: t, size: 1, coloring: "none", showlabels: false },
             line: { color: color || C.effDeep, width: width || 2, dash: dash || "solid", smoothing: 1.1 }, showscale: false, hoverinfo: "skip" };
  }
  // Label next to a point, flipped to the left near the right edge so it is never clipped
  function labelAt(x, y, text, color, above) {
    const right = x > 7.5;
    return { x: x, y: y, text: text, showarrow: false, xanchor: right ? "right" : "left", yanchor: above ? "bottom" : "top",
             xshift: right ? -10 : 10, yshift: above ? 7 : -6, font: { size: 13, color: color, family: FONT },
             bgcolor: "rgba(255,255,255,0.78)", borderpad: 2 };
  }
  const idx = (n) => Array.from({ length: n }, (_, i) => i);
  function pointHover() { return `%{customdata[0]}<br>${T.resources}: %{x:.2f}<br>${T.output}: %{y:.2f}<br>${T.prob}: %{customdata[1]}<extra></extra>`; }
  function toyCustom(ids) { return ids.map((i) => [orgName(i), f2(TOY.prob[i])]); }
  function toyAxes(extra) {
    return merge({ xaxis: { range: XR, title: { text: T.resources } }, yaxis: { range: YR, title: { text: T.output } } }, extra || {});
  }

  // ===========================================================================
  // Widgets
  // ===========================================================================
  const W = {};

  // ---- Hero: the probability field ----------------------------------------------
  W.hero = function (root) {
    const div = el("div", { class: "pxa-chart tall" });
    root.appendChild(div);
    root.appendChild(legend([
      { label: T.effDEA, color: C.eff }, { label: T.ineffDEA, color: C.ineff },
      { label: T.frontier, cls: "line" },
      { label: `p = ${fmtThr(0.75)}`, cls: "dot" }, { label: `p = ${fmtThr(0.85)}`, cls: "dash" }, { label: `p = ${fmtThr(0.95)}`, cls: "longdash" }
    ]));
    const ids = idx(TOY.n);
    const traces = [heatTrace(), contourTrace(0.75, 1.6, "dot"), contourTrace(0.85, 1.6, "dash"), contourTrace(0.95, 1.6, "longdash"), frontierTrace(2.4),
      { x: ids.map((i) => TOY.x[i]), y: ids.map((i) => TOY.y[i]), type: "scatter", mode: "markers", customdata: toyCustom(ids),
        hovertemplate: pointHover(),
        marker: { size: 9, color: ids.map((i) => (TOY.dea_eff[i] ? C.eff : C.ineff)), line: { color: "#ffffff", width: 1.5 } } }];
    draw(div, traces, toyAxes({ margin: { t: 6 } }));
  };

  // ---- Section 2: inputs, outputs and the frontier ------------------------------------
  W.intro = function (root) {
    const pair = TOY.intro_pair.map((i) => i - 1); // R is 1-based
    const [A, B] = pair;
    let sel = B;
    const opts = idx(TOY.n).map((i) => ({ value: i, label: orgName(i) + (i === A ? " (A)" : i === B ? " (B)" : "") }));
    const s = select(opts, sel, (v) => { sel = v; update(); }, T.select);
    const ctr = el("div", { class: "pxa-controls" }); ctr.appendChild(control(T.select, s));
    const pairP = el("p", { class: "pxa-explain" },
      T.pairText(f2((TOY.y[A] + TOY.y[B]) / 2), f2(TOY.x[A]), f2(TOY.x[B]), f1(TOY.x[B] / TOY.x[A])));
    const grid = el("div", { class: "pxa-split" });
    const left = el("div"); const right = el("div");
    const div = el("div", { class: "pxa-chart tall" });
    left.appendChild(div);
    left.appendChild(legend([{ label: T.org, color: C.ineff }, { label: T.frontier, cls: "line" },
      { label: LANG === "es" ? "Mejora posible" : "Room for improvement", color: C.target, cls: "sq" }]));
    const read = el("div");
    right.appendChild(pairP); right.appendChild(ctr); right.appendChild(read);
    grid.appendChild(left); grid.appendChild(right); root.appendChild(grid);

    function update() {
      const i = sel, x = TOY.x[i], y = TOY.y[i], xt = TOY.theta[i] * x, yt = TOY.phi[i] * y;
      const ids = idx(TOY.n);
      const traces = [frontierTrace(),
        { x: ids.map((k) => TOY.x[k]), y: ids.map((k) => TOY.y[k]), type: "scatter", mode: "markers",
          customdata: ids.map((k) => [orgName(k)]), hovertemplate: `%{customdata[0]}<br>${T.resources}: %{x:.2f}<br>${T.output}: %{y:.2f}<extra></extra>`,
          marker: { size: 8, color: C.ineff, opacity: 0.75, line: { color: "#fff", width: 1 } } },
        { x: [A, B].map((k) => TOY.x[k]), y: [A, B].map((k) => TOY.y[k]), type: "scatter", mode: "markers+text", text: ["A", "B"],
          textposition: "top left", textfont: { size: 14, color: C.ink, family: FONT }, hoverinfo: "skip",
          marker: { size: 11, color: "rgba(0,0,0,0)", line: { color: C.ink, width: 1.5 } } }];
      const ann = [];
      const effUnit = TOY.theta[i] > 0.9999 && TOY.phi[i] < 1.0001;
      if (!effUnit) {
        traces.push({ x: [x, xt], y: [y, y], type: "scatter", mode: "lines", line: { color: C.target, width: 2.5 }, hoverinfo: "skip" });
        traces.push({ x: [x, x], y: [y, yt], type: "scatter", mode: "lines", line: { color: C.target, width: 2.5 }, hoverinfo: "skip" });
        traces.push({ x: [xt, x], y: [y, yt], type: "scatter", mode: "markers", hoverinfo: "skip",
          marker: { size: 9, symbol: "diamond", color: C.target, line: { color: "#fff", width: 1.5 } } });
      }
      traces.push({ x: [x], y: [y], type: "scatter", mode: "markers", hoverinfo: "skip",
        marker: { size: 14, color: C.ink, line: { color: "#fff", width: 2 } } });
      ann.push(labelAt(x, y, orgName(i), C.ink));
      draw(div, traces, toyAxes({ annotations: ann }));
      read.innerHTML = effUnit ? `<p class="pxa-explain">${T.onFrontier(orgName(i))}</p>` :
        `<p class="pxa-explain">${T.introReadout(orgName(i), f2(x), f2(y), f2(xt), f2(yt), pctPlain((xt / x - 1) * 100), pctPlain((yt / y - 1) * 100))}</p>`;
    }
    update();
    div.on("plotly_click", (ev) => {
      const pt = ev.points[0];
      if (pt.curveNumber === 1) { sel = pt.pointIndex; s.value = String(sel); update(); }
    });
  };

  // ---- Section 4: DEA vs PEAXAI -----------------------------------------------------------
  W.compare = function (root) {
    let thr = 0.85;
    const ctr = el("div", { class: "pxa-controls" });
    const range = el("input", { type: "range", min: "0.5", max: "0.95", step: "0.05", value: String(thr), class: "pxa-range", "aria-label": T.threshold });
    const val = el("span", { class: "pxa-range-value" }, fmtThr(thr));
    const rw = el("div", { class: "pxa-control" });
    rw.appendChild(el("span", { class: "pxa-control-label" }, T.threshold)); rw.appendChild(range); rw.appendChild(val);
    ctr.appendChild(rw);
    const pair = el("div", { class: "pxa-pair" });
    const a = el("div"), b = el("div");
    a.appendChild(el("p", { class: "pxa-figure-title" }, LANG === "es" ? "A · DEA tradicional" : "A · Traditional DEA"));
    a.appendChild(el("p", { class: "pxa-figure-sub" }, LANG === "es" ? "¿Es esta organización eficiente? Sí o no." : "Is this organisation efficient? Yes or no."));
    b.appendChild(el("p", { class: "pxa-figure-title" }, "B · PEAXAI"));
    b.appendChild(el("p", { class: "pxa-figure-sub" }, LANG === "es" ? "¿Con qué probabilidad se clasificaría como eficiente?" : "How likely is it to be classified as efficient?"));
    const da = el("div", { class: "pxa-chart" }), db = el("div", { class: "pxa-chart" });
    a.appendChild(da); b.appendChild(db);
    const la = legend([{ label: T.effDEA, color: C.eff }, { label: T.ineffDEA, color: C.ineff }, { label: T.frontier, cls: "line" }]);
    const lb = legend([{ label: T.meets, color: C.eff }, { label: T.notMeets, color: C.ineff }, { label: T.frontier, cls: "line" }, { label: "p = " + fmtThr(thr), cls: "dash" }]);
    a.appendChild(la); b.appendChild(lb);
    const ca = el("p", { class: "pxa-explain" }), cb = el("p", { class: "pxa-explain" });
    a.appendChild(ca); b.appendChild(cb);
    pair.appendChild(a); pair.appendChild(b);
    root.appendChild(ctr); root.appendChild(pair);

    const ids = idx(TOY.n);
    const nDEA = TOY.dea_eff.filter(Boolean).length;
    draw(da, [frontierTrace(),
      { x: TOY.x, y: TOY.y, type: "scatter", mode: "markers", customdata: ids.map((i) => [orgName(i), TOY.dea_eff[i] ? T.effDEA : T.ineffDEA]),
        hovertemplate: `%{customdata[0]}<br>%{customdata[1]}<extra></extra>`,
        marker: { size: 8, color: ids.map((i) => (TOY.dea_eff[i] ? C.eff : C.ineff)), line: { color: "#fff", width: 1 } } }], toyAxes());
    ca.innerHTML = T.deaCount(nDEA);

    function update() {
      const meets = ids.map((i) => TOY.prob[i] >= thr - 1e-9);
      // shaded region: probability >= threshold
      const mask = TOY.grid.z.map((row) => row.map((p) => (p >= thr ? 1 : 0)));
      draw(db, [heatTrace(0.55),
        { type: "heatmap", x: TOY.grid.x, y: TOY.grid.y, z: mask, zmin: 0, zmax: 1, showscale: false, hoverinfo: "skip",
          colorscale: [[0, "rgba(255,255,255,0)"], [1, "rgba(14,138,114,0.22)"]] },
        contourTrace(thr, 2.5, "dash"),
        frontierTrace(1.2),
        { x: TOY.x, y: TOY.y, type: "scatter", mode: "markers", customdata: toyCustom(ids), hovertemplate: pointHover(),
          marker: { size: 8, color: ids.map((i) => (meets[i] ? C.eff : C.ineff)), line: { color: "#fff", width: 1 } } }],
        toyAxes());
      lb.lastChild.lastChild.textContent = "p = " + fmtThr(thr);
      cb.innerHTML = T.peaxCount(meets.filter(Boolean).length, fmtThr(thr));
    }
    range.addEventListener("input", () => { thr = Math.round(Number(range.value) * 100) / 100; val.textContent = fmtThr(thr); update(); });
    update();
  };

  // ---- Section 6: counterfactual targets -------------------------------------------------
  function thrSeg(value, onChange) {
    return seg(D.meta.thresholds.map((t) => ({ value: t, label: fmtThr(t) })), value, onChange, T.threshold);
  }
  function toyOrgSelect(value, onChange) {
    const order = idx(TOY.n);
    return select(order.map((i) => ({ value: i, label: `${orgName(i)} · P = ${f2(TOY.prob[i])}` })), value, onChange, T.select);
  }

  W.counterfactual = function (root) {
    let sel = 3, thr = 0.85, strat = "shap"; // Organisation 4, as in the article's illustration
    const ctr = el("div", { class: "pxa-controls" });
    const s = toyOrgSelect(sel, (v) => { sel = v; update(); });
    ctr.appendChild(control(T.select, s));
    ctr.appendChild(control(T.threshold, thrSeg(thr, (v) => { thr = v; update(); })));
    ctr.appendChild(control(T.strategy, seg([{ value: "inputs", label: T.reduce }, { value: "outputs", label: T.increase }, { value: "shap", label: T.shapDir }],
      strat, (v) => { strat = v; update(); }, T.strategy)));
    const grid = el("div", { class: "pxa-split" });
    const left = el("div"), right = el("div");
    const div = el("div", { class: "pxa-chart tall" });
    left.appendChild(div);
    left.appendChild(legend([{ label: T.current, color: C.ink }, { label: T.target, color: C.target, cls: "sq" },
      { label: T.frontier, cls: "line" }, { label: T.threshold, cls: "dash" }]));
    const read = el("div");
    right.appendChild(read);
    grid.appendChild(left); grid.appendChild(right);
    root.appendChild(ctr); root.appendChild(grid);

    function update() {
      const cf = TOY.cf[strat][String(thr)];
      const i = sel, x = TOY.x[i], y = TOY.y[i], tx = cf.x[i], ty = cf.y[i], beta = cf.beta[i], pt = cf.prob[i];
      const ids = idx(TOY.n);
      const traces = [heatTrace(0.6), contourTrace(thr, 2, "dash"), frontierTrace(1.4),
        { x: TOY.x, y: TOY.y, type: "scatter", mode: "markers", customdata: toyCustom(ids), hovertemplate: pointHover(),
          marker: { size: 7, color: C.ineff, opacity: 0.55, line: { color: "#fff", width: 1 } } }];
      const ann = [];
      if (beta > 0) {
        ann.push({ x: tx, y: ty, ax: x, ay: y, xref: "x", yref: "y", axref: "x", ayref: "y", showarrow: true, arrowhead: 2,
                   arrowsize: 1.2, arrowwidth: 2.2, arrowcolor: C.target, text: "" });
        traces.push({ x: [tx], y: [ty], type: "scatter", mode: "markers", hovertemplate: `${T.target}<br>${T.resources}: %{x:.2f}<br>${T.output}: %{y:.2f}<extra></extra>`,
          marker: { size: 13, symbol: "diamond", color: C.target, line: { color: "#fff", width: 1.5 } } });
        ann.push({ x: tx, y: ty, text: T.target, showarrow: false, xanchor: "right", yanchor: "bottom", xshift: -8, yshift: 6,
          font: { size: 12, color: C.targetInk, family: FONT } });
      }
      traces.push({ x: [x], y: [y], type: "scatter", mode: "markers", hoverinfo: "skip", marker: { size: 13, color: C.ink, line: { color: "#fff", width: 2 } } });
      ann.push(labelAt(x, y, orgName(i), C.ink));
      draw(div, traces, toyAxes({ annotations: ann }));

      let dx = (tx / x - 1) * 100, dy = (ty / y - 1) * 100;
      if (Math.abs(dx) < 0.05) dx = 0;
      if (Math.abs(dy) < 0.05) dy = 0;
      let html = `<div class="pxa-readout">
        <div><div class="k">${T.inputChange}</div><div class="v ${dx < 0 ? "down" : ""}">${beta > 0 && dx !== 0 ? pctPlain(dx) : "0%"}</div><div class="s">${f2(x)} → ${f2(tx)}</div></div>
        <div><div class="k">${T.outputChange}</div><div class="v ${dy > 0 ? "up" : ""}">${beta > 0 && dy !== 0 ? pctPlain(dy) : "0%"}</div><div class="s">${f2(y)} → ${f2(ty)}</div></div>
        <div class="wide"><div class="k">${T.probChange}</div><div class="v">${f2(TOY.prob[i])} → ${f2(pt)}</div><div class="s">${T.beta}: ${f3(beta)}</div></div>
      </div>`;
      if (beta === 0 && TOY.prob[i] >= thr) html += `<p class="pxa-flag">${T.already(fmtThr(thr))}</p>`;
      else if (pt < thr - 1e-4) html += `<p class="pxa-flag">${T.notReached(f2(pt), fmtThr(thr))}</p>`;
      read.innerHTML = html;
    }
    update();
    div.on("plotly_click", (ev) => { const p = ev.points[0]; if (p.curveNumber === 3) { sel = p.pointIndex; s.value = String(sel); update(); } });
  };

  // ---- Section 7: peers ----------------------------------------------------------------------------
  W.peers = function (root) {
    let sel = 3, thr = 0.75;
    const wt = "unweighted";
    const ctr = el("div", { class: "pxa-controls" });
    const s = toyOrgSelect(sel, (v) => { sel = v; update(); });
    ctr.appendChild(control(T.select, s));
    ctr.appendChild(control(T.threshold, thrSeg(thr, (v) => { thr = v; update(); })));
    const grid = el("div", { class: "pxa-split" });
    const left = el("div"), right = el("div");
    const div = el("div", { class: "pxa-chart tall" });
    left.appendChild(div);
    left.appendChild(legend([{ label: T.current, color: C.ink }, { label: T.target, color: C.target, cls: "sq" },
      { label: T.candidates, border: `2px solid ${C.peer}` }, { label: T.peerSel, color: C.peer },
      { label: T.frontier, cls: "line" }, { label: T.threshold, cls: "dash" }]));
    const read = el("div"); right.appendChild(read);
    grid.appendChild(left); grid.appendChild(right);
    root.appendChild(ctr); root.appendChild(grid);
    const best = TOY.prob.indexOf(Math.max.apply(null, TOY.prob));

    function update() {
      const cf = TOY.cf.shap[String(thr)];
      const i = sel, x = TOY.x[i], y = TOY.y[i], tx = cf.x[i], ty = cf.y[i];
      const peer1 = TOY.peers.shap[String(thr)][wt][i];   // 1-based index or null
      const cand = idx(TOY.n).filter((k) => TOY.prob[k] >= thr - 1e-9);
      const ids = idx(TOY.n);
      const traces = [heatTrace(0.45), contourTrace(thr, 1.6, "dash"), frontierTrace(1.2),
        { x: TOY.x, y: TOY.y, type: "scatter", mode: "markers", customdata: toyCustom(ids), hovertemplate: pointHover(),
          marker: { size: 7, color: C.ineff, opacity: 0.45, line: { color: "#fff", width: 1 } } }];
      cand.forEach((k) => traces.push({ x: [tx, TOY.x[k]], y: [ty, TOY.y[k]], type: "scatter", mode: "lines", hoverinfo: "skip",
        line: { color: C.peer, width: 1, dash: "dot" }, opacity: 0.6 }));
      traces.push({ x: cand.map((k) => TOY.x[k]), y: cand.map((k) => TOY.y[k]), type: "scatter", mode: "markers",
        customdata: toyCustom(cand), hovertemplate: pointHover(), marker: { size: 11, color: "#fff", line: { color: C.peer, width: 2 } } });
      const ann = [];
      if (best !== (peer1 ? peer1 - 1 : -1) && cand.length) {
        ann.push({ x: TOY.x[best], y: TOY.y[best], text: T.highest, showarrow: true, arrowhead: 0, arrowwidth: 1, arrowcolor: C.muted,
          ax: 30, ay: 34, font: { size: 12, color: C.ink2, family: FONT } });
      }
      if (cf.beta[i] > 0) {
        traces.push({ x: [x, tx], y: [y, ty], type: "scatter", mode: "lines", line: { color: C.target, width: 2 }, hoverinfo: "skip" });
        traces.push({ x: [tx], y: [ty], type: "scatter", mode: "markers", hoverinfo: "skip", marker: { size: 12, symbol: "diamond", color: C.target, line: { color: "#fff", width: 1.5 } } });
      }
      let dist = null;
      if (peer1) {
        const p = peer1 - 1;
        traces.push({ x: [tx, TOY.x[p]], y: [ty, TOY.y[p]], type: "scatter", mode: "lines", line: { color: C.peer, width: 2.5 }, hoverinfo: "skip" });
        traces.push({ x: [TOY.x[p]], y: [TOY.y[p]], type: "scatter", mode: "markers", customdata: toyCustom([p]), hovertemplate: pointHover(),
          marker: { size: 14, color: C.peer, line: { color: "#fff", width: 2 } } });
        ann.push(labelAt(TOY.x[p], TOY.y[p], orgName(p), C.peer, true));
        // Euclidean distance between the target and the observed peer, as in PEAXAI_peer(weighted = FALSE)
        dist = Math.sqrt((TOY.x[p] - tx) ** 2 + (TOY.y[p] - ty) ** 2);
      }
      traces.push({ x: [x], y: [y], type: "scatter", mode: "markers", hoverinfo: "skip", marker: { size: 13, color: C.ink, line: { color: "#fff", width: 2 } } });
      ann.push(labelAt(x, y, orgName(i), C.ink));
      draw(div, traces, toyAxes({ annotations: ann }));

      let html = "";
      if (!cand.length || !peer1) html = `<p class="pxa-flag">${T.noCandidates(fmtThr(thr))}</p>`;
      else {
        const p = peer1 - 1;
        const tb = (r) => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td></tr>`;
        html = (p === i ? `<p class="pxa-explain">${T.ownPeer}</p>` :
          `<p class="pxa-explain">${T.peerText(orgName(i), orgName(p), f2(dist), orgName(best), p === best)}</p>`) +
          `<div class="pxa-table-wrap"><table class="pxa-rank" style="min-width:0"><thead><tr>${T.peerTable.map((h, j) => `<th class="${j ? "num" : ""}">${h}</th>`).join("")}</tr></thead><tbody>` +
          tb([`${T.evaluated} · ${orgName(i)}`, f2(x), f2(y), f2(TOY.prob[i])]) +
          (cf.beta[i] > 0 ? tb([T.target, f2(tx), f2(ty), f2(cf.prob[i])]) : "") +
          tb([`<span style="color:${C.peer};font-weight:600">${T.peerCol} · ${orgName(p)}</span>`, f2(TOY.x[p]), f2(TOY.y[p]), f2(TOY.prob[p])]) +
          `</tbody></table></div>`;
      }
      read.innerHTML = html;
    }
    update();
    div.on("plotly_click", (ev) => { const p = ev.points[0]; if (p.curveNumber === 3) { sel = p.pointIndex; s.value = String(sel); update(); } });
  };

  // ---- Real data helpers ---------------------------------------------------------------------------
  const R = D.real;
  const VARS = R.vars;
  const varTick = (v) => `${VAR_LABEL[v]} <span style="color:${C.muted}">(${IS_OUTPUT(v) ? T.outputK : T.input})</span>`;
  function fmtVar(v, x) { return (Math.abs(x) >= 100 ? f0(x) : f1(x)) + (VAR_UNIT[v] ? " " + VAR_UNIT[v] : ""); }

  // ---- Section 5A: global SHAP --------------------------------------------------------------------
  W.shapGlobal = function (root) {
    const pair = el("div", { class: "pxa-pair" });
    const a = el("div"), b = el("div");
    a.appendChild(el("p", { class: "pxa-figure-title" }, LANG === "es" ? "¿Qué variables pesan más en el modelo?" : "Which variables weigh most in the model?"));
    a.appendChild(el("p", { class: "pxa-figure-sub" }, LANG === "es" ? "Importancia global SHAP calculada con PEAXAI" : "Global SHAP importance computed with PEAXAI"));
    b.appendChild(el("p", { class: "pxa-figure-title" }, LANG === "es" ? "¿En qué dirección empujan?" : "In which direction do they push?"));
    b.appendChild(el("p", { class: "pxa-figure-sub" }, LANG === "es" ? "Cada punto es una empresa; el color indica si su valor es bajo o alto" : "Each dot is a firm; colour shows whether its value is low or high"));
    const da = el("div", { class: "pxa-chart" }), db = el("div", { class: "pxa-chart" });
    a.appendChild(da); b.appendChild(db);
    b.appendChild(legend([{ label: `${T.featVal}: ${T.low}`, color: "#c9d3dc" }, { label: T.high, color: C.ink }]));
    pair.appendChild(a); pair.appendChild(b); root.appendChild(pair);

    const order = VARS.slice().sort((u, v) => R.importance[u] - R.importance[v]);
    draw(da, [{ type: "bar", orientation: "h", y: order.map(varTick), x: order.map((v) => R.importance[v]),
      marker: { color: order.map((v) => (IS_OUTPUT(v) ? C.eff : C.ink2)), cornerradius: 4 },
      text: order.map((v) => nf(0).format(R.importance[v] * 100) + "%"), textposition: "outside", cliponaxis: false,
      textfont: { color: C.ink, size: 12 }, hovertemplate: "%{y}<br>%{text}<extra></extra>" }],
      { margin: { l: 190, r: 40, t: 4, b: 48 }, xaxis: { title: { text: T.importanceAxis }, tickformat: ".0%", rangemode: "tozero", showgrid: true },
        yaxis: { showline: false, ticks: "", showgrid: false }, bargap: 0.38 });

    // beeswarm-like strip: SHAP value vs variable, coloured by rank of the variable value
    const traces = [];
    order.forEach((v, j) => {
      const col = VARS.indexOf(v);
      const vals = R.data[v];
      const sorted = vals.slice().sort((p, q) => p - q);
      const rank = vals.map((x) => sorted.indexOf(x) / (vals.length - 1));
      const sv = R.shap.values.map((row) => row[col]);
      // deterministic jitter so the page is identical at every load
      const jit = sv.map((_, k) => (((k * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.5);
      traces.push({ type: "scatter", mode: "markers", x: sv, y: sv.map((_, k) => j + jit[k]),
        customdata: sv.map((s0, k) => [firmName(k), fmtVar(v, vals[k]), signed(s0, 3)]),
        hovertemplate: `%{customdata[0]}<br>${VAR_LABEL[v]}: %{customdata[1]}<br>SHAP: %{customdata[2]}<extra></extra>`,
        marker: { size: 7, color: rank, colorscale: [[0, "#c9d3dc"], [1, C.ink]], cmin: 0, cmax: 1, opacity: 0.85, line: { color: "#fff", width: 0.6 } } });
    });
    draw(db, traces, { margin: { l: 190, r: 12, t: 4, b: 48 },
      xaxis: { title: { text: T.shapVal }, zeroline: true, zerolinecolor: C.muted, zerolinewidth: 1 },
      yaxis: { tickmode: "array", tickvals: order.map((_, j) => j), ticktext: order.map(varTick), showline: false, ticks: "", showgrid: false, range: [-0.6, order.length - 0.4] } });
  };

  // ---- Section 5B: local SHAP waterfall ------------------------------------------------------------
  W.shapLocal = function (root) {
    const byProb = idx(R.n).sort((p, q) => R.prob[q] - R.prob[p]);
    // default: a firm with an intermediate probability (most informative explanation)
    let sel = byProb.find((k) => R.prob[k] > 0.3 && R.prob[k] < 0.8);
    if (sel === undefined) sel = byProb[Math.floor(byProb.length / 4)];
    const ctr = el("div", { class: "pxa-controls" });
    const s = select(byProb.map((k) => ({ value: k, label: `${firmName(k)} · P = ${f2(R.prob[k])}` })), sel, (v) => { sel = v; update(); }, T.firm);
    ctr.appendChild(control(T.firm, s));
    const grid = el("div", { class: "pxa-split" });
    const left = el("div"), right = el("div");
    const div = el("div", { class: "pxa-chart" });
    left.appendChild(div);
    left.appendChild(legend([{ label: LANG === "es" ? "Eleva la probabilidad" : "Raises the probability", color: C.eff, cls: "sq" },
      { label: LANG === "es" ? "Reduce la probabilidad" : "Lowers the probability", color: C.neg, cls: "sq" }]));
    const read = el("div"); right.appendChild(read);
    grid.appendChild(left); grid.appendChild(right);
    root.appendChild(ctr); root.appendChild(grid);
    const base = R.shap.baseline;

    function update() {
      const sv = R.shap.values[sel];
      const order = VARS.map((v, j) => ({ v, s: sv[j] })).sort((a, b) => Math.abs(b.s) - Math.abs(a.s));
      const labels = [T.shapBase], bases = [0], lens = [base], cols = [C.line], texts = [f2(base)];
      let cum = base;
      order.forEach((o) => {
        labels.push(`${VAR_LABEL[o.v]} = ${fmtVar(o.v, R.data[o.v][sel])}`);
        bases.push(o.s >= 0 ? cum : cum + o.s); lens.push(Math.abs(o.s));
        cols.push(o.s >= 0 ? C.eff : C.neg); texts.push(signed(o.s, 3)); cum += o.s;
      });
      labels.push(T.shapFinal); bases.push(0); lens.push(R.prob[sel]); cols.push(C.ink); texts.push(f2(R.prob[sel]));
      const n = labels.length;
      const ys = labels.map((_, k) => n - 1 - k);
      draw(div, [{ type: "bar", orientation: "h", y: ys, x: lens, base: bases, marker: { color: cols, cornerradius: 3 },
        text: texts, textposition: "outside", cliponaxis: false, textfont: { size: 12, color: C.ink },
        hovertemplate: "%{text}<extra></extra>" }],
        { margin: { l: 220, r: 50, t: 4, b: 48 }, bargap: 0.32,
          xaxis: { range: [0, 1.08], title: { text: T.prob }, tickformat: ".1f" },
          yaxis: { tickmode: "array", tickvals: ys, ticktext: labels, showline: false, ticks: "", showgrid: false } });
      const pos = order.filter((o) => o.s > 0.005), neg = order.filter((o) => o.s < -0.005);
      const up = pos.length ? T.shapUp(LANG === "es" ? VAR_LOWER[pos[0].v] : VAR_LABEL[pos[0].v], signed(pos[0].s, 2)) : T.shapNoUp;
      const down = neg.length ? T.shapDown(LANG === "es" ? VAR_LOWER[neg[0].v] : VAR_LABEL[neg[0].v], signed(neg[0].s, 2)) : T.shapNoDown;
      read.innerHTML = `<p class="pxa-explain">${T.shapText(firmName(sel), f2(R.prob[sel]), f2(base), up, down)}</p>`;
    }
    update();
  };

  // ---- Section 8: rankings --------------------------------------------------------------------------
  W.ranking = function (root) {
    let crit = "attainable", thr = 0.85, view = "top";
    const TOP = 15, MOV = 10;
    const ctr = el("div", { class: "pxa-controls" });
    ctr.appendChild(control(T.crit, seg([{ value: "predicted", label: T.critPred }, { value: "attainable", label: T.critAtt }], crit, (v) => { crit = v; update(); }, T.crit)));
    ctr.appendChild(control(T.threshold, thrSeg(thr, (v) => { thr = v; update(); })));
    ctr.appendChild(control(T.view, seg([{ value: "top", label: T.viewTop }, { value: "movers", label: T.viewMovers }], view, (v) => { view = v; update(); }, T.view)));
    const strip = el("div");
    const tw = el("div", { class: "pxa-table-wrap" });
    const expl = el("div");
    root.appendChild(ctr); root.appendChild(strip); root.appendChild(tw); root.appendChild(expl);
    const GC = { meets: C.eff, reachable: C.target, below: C.ineff };
    const GL = { meets: T.grpMeets, reachable: T.grpReach, below: T.grpBelow };
    const ord = (k) => { if (LANG === "es") return String(k); const sfx = ["th", "st", "nd", "rd"], v = k % 100; return k + (sfx[(v - 20) % 10] || sfx[v] || sfx[0]); };

    function update() {
      const A = R.rank_attainable[String(thr)];
      const P = R.rank_predicted;
      const posPred = {}, posAtt = {}, info = {};
      P.dmu.forEach((d, k) => { posPred[d] = P.rank[k]; });
      A.dmu.forEach((d, k) => { posAtt[d] = A.rank[k]; info[d] = { pt: A.ptarget[k], beta: A.beta[k], g: A.group[k], p: A.p[k] }; });
      const counts = { meets: 0, reachable: 0, below: 0 };
      A.group.forEach((g) => counts[g]++);
      strip.innerHTML = `<div class="pxa-groups">${["meets", "reachable", "below"].filter((g) => counts[g]).map((g) =>
        `<div style="flex:${Math.max(counts[g], 6)};background:${GC[g]}">${counts[g]}</div>`).join("")}</div>` +
        legend(["meets", "reachable", "below"].map((g) => ({ label: `${GL[g]} (${counts[g]})`, color: GC[g] }))).outerHTML;
      const base = crit === "predicted" ? P.dmu : A.dmu;
      let list;
      if (view === "top") list = base.slice(0, TOP);
      else {
        list = base.slice().sort((a, b) => Math.abs(posAtt[b] - posPred[b]) - Math.abs(posAtt[a] - posPred[a])).slice(0, MOV);
        list.sort((a, b) => (crit === "predicted" ? posPred[a] - posPred[b] : posAtt[a] - posAtt[b]));
      }
      const rows = list.map((d) => {
        const me = crit === "predicted" ? posPred[d] : posAtt[d];
        const other = crit === "predicted" ? posAtt[d] : posPred[d];
        const mv = other - me;   // >0: better placed under the criterion shown
        const it = info[d];
        const moved = Math.abs(mv) >= 5;
        const att = it.g === "meets" ? T.atLeast(fmtThr(thr)) : f2(it.pt);
        return `<tr class="${moved ? "moved" : ""}"><td class="num">${me}</td><td>${firmName(d - 1)}</td>
          <td class="num">${f2(it.p)}</td><td class="num">${att}</td><td class="num">${it.beta > 0 ? f3(it.beta) : "0"}</td>
          <td><span class="pxa-badge"><i style="background:${GC[it.g]}"></i>${GL[it.g]}</span></td>
          <td class="num">${other} <span class="pxa-move ${mv > 0 ? "up" : mv < 0 ? "down" : ""}">${mv === 0 ? "" : (mv > 0 ? "▲" : "▼") + Math.abs(mv)}</span></td></tr>`;
      }).join("");
      const cols = T.rankCols.slice();
      cols[6] = crit === "predicted" ? (LANG === "es" ? "Puesto alcanzable" : "Attainable rank") : (LANG === "es" ? "Puesto actual" : "Current rank");
      tw.innerHTML = `<table class="pxa-rank"><thead><tr>${cols.map((h, j) => `<th class="${[0, 2, 3, 4, 6].includes(j) ? "num" : ""}">${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
      // Interpretation from the two most extreme moves
      const all = A.dmu.slice();
      const drop = all.reduce((b, d) => (posAtt[d] - posPred[d] > posAtt[b] - posPred[b] ? d : b), all[0]);
      const rise = all.reduce((b, d) => (posPred[d] - posAtt[d] > posPred[b] - posAtt[b] ? d : b), all[0]);
      let html = "";
      if (posAtt[drop] - posPred[drop] >= 5) html += `<p class="pxa-explain">${T.rankDrop(firmName(drop - 1), ord(posPred[drop]), ord(posAtt[drop]), f2(info[drop].p))}</p>`;
      if (posPred[rise] - posAtt[rise] >= 5) html += `<p class="pxa-explain">${T.rankRise(firmName(rise - 1), ord(posPred[rise]), ord(posAtt[rise]), f3(info[rise].beta))}</p>`;
      expl.innerHTML = html;
    }
    update();
  };

  // ---- Section 9: PDP / ICE ------------------------------------------------------------------------
  W.pdp = function (root) {
    let v = "operating_income";
    const ctr = el("div", { class: "pxa-controls" });
    ctr.appendChild(control(T.variable, select(VARS.map((u, j) => ({ value: j, label: VAR_LABEL[u] })), VARS.indexOf(v), (j) => { v = VARS[j]; update(); }, T.variable)));
    const div = el("div", { class: "pxa-chart" });
    root.appendChild(ctr); root.appendChild(div);
    root.appendChild(legend([{ label: T.iceLine, color: C.ineff, cls: "sq" }, { label: T.pdpLine, color: C.eff, cls: "sq" }]));
    function update() {
      const P = R.pdp[v];
      const xs = [], ys = [];
      P.ice.forEach((row) => { row.forEach((p, k) => { xs.push(P.grid[k]); ys.push(p); }); xs.push(null); ys.push(null); });
      draw(div, [
        { type: "scatter", mode: "lines", x: xs, y: ys, line: { color: C.ineff, width: 1 }, opacity: 0.28, hoverinfo: "skip" },
        { type: "scatter", mode: "lines", x: P.grid, y: P.pdp, line: { color: C.eff, width: 3.5 },
          hovertemplate: `${VAR_LABEL[v]}: %{x:,.1f}<br>${T.pdpLine}: %{y:.2f}<extra></extra>` }],
        { xaxis: { title: { text: VAR_LABEL[v] + (VAR_UNIT[v] ? ` (${VAR_UNIT[v]})` : "") } },
          yaxis: { title: { text: T.pdpY }, range: [-0.02, 1.02] }, hovermode: "x" });
    }
    update();
  };

  // ---- Section 10: published evidence ---------------------------------------------------------------
  W.evClassifiers = function (root) {
    const div = el("div", { class: "pxa-chart short" }); root.appendChild(div);
    const m = PUB.classifiers.models.slice().reverse();
    draw(div, [{ type: "bar", orientation: "h", y: m.map((d) => d["name_" + LANG]), x: m.map((d) => d.balanced_accuracy),
      error_x: { type: "data", array: m.map((d) => d.sd), color: C.muted, thickness: 1.2, width: 4 },
      marker: { color: m.map((d) => (d.id === "nn" ? C.eff : C.ineff)), cornerradius: 4 },
      text: m.map((d) => f2(d.balanced_accuracy)), textposition: "inside", insidetextanchor: "start", textfont: { color: "#fff", size: 12 },
      hovertemplate: `%{y}<br>${T.ba}: %{x:.2f}<extra></extra>` }],
      { margin: { l: 140, r: 16, t: 4, b: 48 }, xaxis: { range: [0, 1.05], title: { text: T.ba } }, yaxis: { showline: false, ticks: "" }, bargap: 0.35 });
  };
  W.evClassification = function (root) {
    const div = el("div", { class: "pxa-chart short" }); root.appendChild(div);
    const c = PUB.classification;
    const cats = [T.dea, `${T.pGt} 0.50`, `${T.pGe} 0.75`, `${T.pGe} 0.85`, `${T.pGe} 0.95`].map((s) => s.replace(/0\.(\d\d)/, (m0) => fmtThr(Number(m0))));
    const vals = [c.dea_efficient, c.prob_above_050, c.prob_above_075, c.prob_above_085, c.prob_above_095];
    draw(div, [{ type: "bar", x: cats, y: vals, marker: { color: [C.ink, "#9ed8c6", "#4fb796", C.eff, C.effDeep], cornerradius: 4 },
      text: vals.map(String), textposition: "outside", cliponaxis: false, textfont: { color: C.ink, size: 13 },
      hovertemplate: `%{x}: %{y} ${T.firmsWord}<extra></extra>` }],
      { margin: { l: 48, r: 10, t: 14, b: 40 }, yaxis: { title: { text: T.nFirms }, rangemode: "tozero" }, xaxis: { showgrid: false }, bargap: 0.4 });
  };
  W.evAdjustments = function (root) {
    let k = 1;
    const a = PUB.adjustments;
    const ctr = el("div", { class: "pxa-controls" });
    ctr.appendChild(control(T.threshold, seg(a.thresholds.map((t, j) => ({ value: j, label: fmtThr(t) })), k, (v) => { k = v; update(); }, T.threshold)));
    const div = el("div", { class: "pxa-chart short" });
    const note = el("p", { class: "pxa-source" });
    root.appendChild(ctr); root.appendChild(div); root.appendChild(note);
    function update() {
      const vs = a.variables.slice().reverse();
      const x = vs.map((d) => d.values[k]);
      draw(div, [{ type: "bar", orientation: "h", y: vs.map((d) => d["var_" + LANG]), x: x,
        marker: { color: x.map((z) => (z < 0 ? C.ink2 : C.target)), cornerradius: 4 },
        text: x.map((z) => pctPlain(z)), textposition: "outside", cliponaxis: false, textfont: { color: C.ink, size: 12 },
        hovertemplate: "%{y}: %{text}<extra></extra>" }],
        { margin: { l: 150, r: 50, t: 4, b: 46 }, xaxis: { range: [-75, 85], title: { text: T.change }, zeroline: true, zerolinecolor: C.ink, ticksuffix: "%" },
          yaxis: { showline: false, ticks: "" }, bargap: 0.38 });
      note.textContent = LANG === "es"
        ? `Probabilidad media de la clase eficiente: ${f2(a.mean_probability.observed)} observada → ${f2(a.mean_probability.values[k])} en las proyecciones.`
        : `Mean probability of the efficient class: ${f2(a.mean_probability.observed)} observed → ${f2(a.mean_probability.values[k])} in the projections.`;
    }
    update();
  };
  W.evImportance = function (root) {
    const div = el("div", { class: "pxa-chart short" }); root.appendChild(div);
    const v = PUB.importance.values.slice().reverse();
    draw(div, [{ type: "bar", orientation: "h", y: v.map((d) => d["var_" + LANG]), x: v.map((d) => d.share),
      marker: { color: v.map((d) => (d.kind === "output" ? C.eff : C.ink2)), cornerradius: 4 },
      text: v.map((d) => nf(1).format(d.share * 100) + "%"), textposition: "outside", cliponaxis: false, textfont: { color: C.ink, size: 12 },
      hovertemplate: "%{y}: %{text}<extra></extra>" }],
      { margin: { l: 150, r: 46, t: 4, b: 46 }, xaxis: { tickformat: ".0%", range: [0, 0.42], title: { text: T.importanceAxis } }, yaxis: { showline: false, ticks: "" }, bargap: 0.38 });
  };
  W.evGroups = function (root) {
    const g = PUB.groups_085;
    const n = (r) => r.to - r.from + 1;
    const parts = [["already_above", T.grpMeets, C.eff], ["can_reach", T.grpReach, C.target], ["constrained", T.grpBelow, C.ineff]];
    root.innerHTML = `<div class="pxa-groups">${parts.map(([k, , c]) => `<div style="flex:${Math.max(n(g[k]), 24)};background:${c}">${n(g[k]) >= 150 ? T.ranks(g[k].from, g[k].to) : ""}</div>`).join("")}</div>`;
    root.appendChild(legend(parts.map(([k, l, c]) => ({ label: `${l}: ${T.ranks(g[k].from, g[k].to)}`, color: c }))));
  };

  // ---- Navigation: language switch & translated menu ------------------------------------------------
  function fixNav() {
    const onResearch = /research(\.html)?$/.test(location.pathname);
    document.querySelectorAll(".navbar .nav-link").forEach((a) => {
      const txt = a.textContent.trim();
      if (txt === "ES") {
        a.classList.add("pxa-lang");
        if (LANG === "es") {
          a.querySelector(".menu-text") ? (a.querySelector(".menu-text").textContent = "EN") : (a.textContent = "EN");
          a.setAttribute("href", onResearch ? "../research.html" : "../index.html");
          a.setAttribute("aria-label", "View in English");
          a.setAttribute("lang", "en");
        } else {
          a.setAttribute("href", onResearch ? "es/research.html" : "es/index.html");
          a.setAttribute("lang", "es");
        }
      } else if (LANG === "es") {
        const map = { "Story": ["Historia", "index.html#why-efficiency"], "Evidence": ["Evidencia", "index.html#evidence"], "Research": ["Investigación", "research.html"] };
        if (map[txt]) {
          const mt = a.querySelector(".menu-text");
          (mt || a).textContent = map[txt][0];
          a.setAttribute("href", map[txt][1]);
        }
      }
    });
    const brand = document.querySelector(".navbar-brand");
    if (brand && LANG === "es") brand.setAttribute("href", "index.html");
  }

  function init() {
    fixNav();
    if (!D || typeof Plotly === "undefined") return;
    document.querySelectorAll(".pxa-widget").forEach((root) => {
      const fn = W[root.dataset.widget];
      if (fn) { try { fn(root); } catch (e) { console.error("PEAXAI widget", root.dataset.widget, e); } }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
