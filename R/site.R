# =============================================================================
# Helpers used by the Quarto pages (sourced in a hidden chunk).
# They only read precomputed files; nothing here runs PEAXAI.
# =============================================================================

pxa_root <- function() {
  # Pages live in "/" (English) or "/es" (Spanish); find the project root
  if (file.exists("_quarto.yml")) "." else ".."
}

pxa_html <- function(...) knitr::asis_output(paste0(..., collapse = ""))

pxa_esc <- function(x) {
  x <- gsub("&", "&amp;", x, fixed = TRUE)
  x <- gsub("<", "&lt;", x, fixed = TRUE)
  gsub(">", "&gt;", x, fixed = TRUE)
}

# ---- Scripts + embedded data -------------------------------------------------
pxa_setup <- function() {
  root <- pxa_root()
  rel  <- if (root == ".") "" else "../"
  res  <- readLines(file.path(root, "data", "peaxai_results.json"), warn = FALSE, encoding = "UTF-8")
  pub  <- yaml::read_yaml(file.path(root, "data", "published_results.yml"))
  pub_json <- jsonlite::toJSON(pub, auto_unbox = TRUE, digits = NA)
  pxa_html(
    '\n```{=html}\n',
    '<script src="', rel, 'assets/vendor/plotly-cartesian.min.js"></script>\n',
    '<script>window.PEAXAI_DATA = ', paste(res, collapse = ""), ';\n',
    'window.PEAXAI_PUBLISHED = ', pub_json, ';</script>\n',
    '<script src="', rel, 'assets/js/peaxai.js" defer></script>\n',
    '```\n'
  )
}

# ---- Numbers used in prose (so text never drifts from the computations) -----
pxa_results <- function() {
  jsonlite::read_json(file.path(pxa_root(), "data", "peaxai_results.json"), simplifyVector = TRUE)
}
pxa_published <- function() {
  yaml::read_yaml(file.path(pxa_root(), "data", "published_results.yml"))
}
# Name of the input with the largest global importance (for prose)
pxa_top_input <- function(res, lang = "en") {
  imp <- unlist(res$real$importance)
  inp <- imp[names(imp) != "operating_income"]
  lab <- list(en = c(total_assets = "total assets", employees = "the number of employees",
                     fixed_assets = "fixed assets", personnel_expenses = "personnel expenses"),
              es = c(total_assets = "el activo total", employees = "el número de empleados",
                     fixed_assets = "el inmovilizado material", personnel_expenses = "los gastos de personal"))
  unname(lab[[lang]][names(which.max(inp))])
}

fmt_num <- function(x, digits = 2, lang = "en") {
  formatC(x, format = "f", digits = digits, decimal.mark = if (lang == "es") "," else ".")
}

# ---- Publications ------------------------------------------------------------
pxa_publications <- function(lang = "en") {
  pubs <- list(
    list(year = "2026",
         title = "Probability-based efficiency analysis through machine learning",
         authors = "Ricardo González-Moyano, Juan Aparicio, José L. Zofío, Víctor J. España",
         journal = "<em>Machine Learning with Applications</em>, 24, 100920",
         doi = "10.1016/j.mlwa.2026.100920",
         note_en = "Methodology and application to 917 Spanish food-industry firms. Open access.",
         note_es = "Metodología y aplicación a 917 empresas de la industria alimentaria española. Acceso abierto."),
    list(year = "2026",
         title = "PEAXAI: A probabilistic efficiency analysis using explainable artificial intelligence in R",
         authors = "Ricardo González-Moyano, Juan Aparicio, José L. Zofío, Víctor J. España",
         journal = "<em>SoftwareX</em>, 36, 103089",
         doi = "10.1016/j.softx.2026.103089",
         note_en = "Software article describing the R package. Open access.",
         note_es = "Artículo de software que describe el paquete de R. Acceso abierto.")
  )
  related <- list(
    year = if (lang == "es") "En prensa" else "In press",
    title = "Artificial intelligence methodologies in efficiency and productivity analysis: state of the art",
    authors = "Ricardo González-Moyano, José L. Zofío, Juan Aparicio",
    journal = if (lang == "es")
      "Capítulo 8 en C. Daraio (ed.), <em>Handbook on Research Methods and Applications on Productivity and Efficiency</em>. Edward Elgar"
    else
      "Chapter 8 in C. Daraio (ed.), <em>Handbook on Research Methods and Applications on Productivity and Efficiency</em>. Edward Elgar",
    note = if (lang == "es") "Revisión del estado del arte que sitúa a PEAXAI en la literatura."
           else "State-of-the-art review that situates PEAXAI in the literature."
  )
  lab_doi <- "DOI"
  lab_read <- if (lang == "es") "Leer el artículo" else "Read the article"
  items <- vapply(pubs, function(p) paste0(
    '<li><div class="yr">', p$year, '</div><div>',
    '<div class="t">', pxa_esc(p$title), '</div>',
    '<div class="a">', p$authors, '</div>',
    '<div class="j">', p$journal, '</div>',
    '<div class="status">', if (lang == "es") p$note_es else p$note_en, '</div>',
    '<div class="l"><a href="https://doi.org/', p$doi, '">', lab_read, '</a>',
    '<span>', lab_doi, ': <a href="https://doi.org/', p$doi, '">', p$doi, '</a></span></div>',
    '</div></li>'), character(1))
  rel_item <- paste0(
    '<li><div class="yr" style="font-size:1.05rem">', related$year, '</div><div>',
    '<div class="t">', pxa_esc(related$title), '</div>',
    '<div class="a">', related$authors, '</div>',
    '<div class="j">', related$journal, '</div>',
    '<div class="status">', related$note, '</div></div></li>')
  pxa_html('<ul class="pxa-pubs">', paste(items, collapse = ""), rel_item, '</ul>')
}

# ---- Conferences (only verified entries are shown) ----------------------------
pxa_conferences <- function(lang = "en") {
  f <- file.path(pxa_root(), "data", "conferences.yml")
  cf <- yaml::read_yaml(f)$conferences
  cf <- Filter(function(x) isTRUE(x$verified) && nzchar(x$start), cf)
  if (length(cf) == 0) {
    msg <- if (lang == "es")
      "Las presentaciones en congresos se publicarán aquí una vez verificadas."
    else
      "Conference presentations will be listed here once verified."
    return(pxa_html('<p class="pxa-empty">', msg, '</p>'))
  }
  cf <- cf[order(vapply(cf, function(x) x$start, ""), decreasing = TRUE)]
  fmt_d <- function(s, e) {
    s <- as.Date(s); e <- as.Date(e)
    loc <- if (lang == "es") "es_ES" else "en_GB"
    months_en <- month.name
    months_es <- c("enero","febrero","marzo","abril","mayo","junio","julio","agosto",
                   "septiembre","octubre","noviembre","diciembre")
    mm <- if (lang == "es") months_es else months_en
    d1 <- as.integer(format(s, "%d")); d2 <- as.integer(format(e, "%d"))
    m1 <- mm[as.integer(format(s, "%m"))]; m2 <- mm[as.integer(format(e, "%m"))]
    y  <- format(e, "%Y")
    if (s == e) paste(d1, m1, y)
    else if (m1 == m2) paste0(d1, "–", d2, " ", m1, " ", y)
    else paste0(d1, " ", m1, " – ", d2, " ", m2, " ", y)
  }
  es <- lang == "es"
  items <- vapply(cf, function(x) {
    tt <- if (!is.null(x$title) && nzchar(x$title)) paste0('<div class="tt">', pxa_esc(x$title), '</div>') else ""
    lk <- if (!is.null(x$link) && nzchar(x$link)) paste0('<div><a href="', x$link, '">',
                 if (es) "Web del congreso" else "Conference website", '</a></div>') else ""
    paste0(
      '<li><div class="d">', fmt_d(x$start, x$end), '</div>',
      '<div class="c">', pxa_esc(x$name), '</div>',
      '<div class="d">', pxa_esc(if (es) x$place_es else x$place_en), '</div>',
      tt,
      '<div class="d">', pxa_esc(if (es) x$type_es else x$type_en), ' · ', pxa_esc(x$speakers), '</div>',
      lk, '</li>')
  }, character(1))
  pxa_html('<ul class="pxa-timeline">', paste(items, collapse = ""), '</ul>')
}

# ---- Team ----------------------------------------------------------------------
pxa_team <- function(lang = "en") {
  es <- lang == "es"
  team <- list(
    list(name = "Ricardo González-Moyano", orcid = "0009-0002-8608-5545",
         role = if (es) "Autor principal y mantenedor del paquete · Personal investigador" else "Lead author and package maintainer · Researcher",
         aff = if (es) "Instituto de Matemáticas, Ciencia de Datos e Inteligencia Artificial (i-MInD), Universidad Miguel Hernández de Elche"
               else "Institute of Mathematics, Data Science and Artificial Intelligence (i-MInD), Universidad Miguel Hernández, Elche"),
    list(name = "Juan Aparicio", orcid = "0000-0002-0867-0004",
         role = if (es) "Coautor · Catedrático" else "Co-author · Full Professor",
         aff = if (es) "i-MInD, Universidad Miguel Hernández de Elche · Valencian Graduate School and Research Network of Artificial Intelligence (ValgrAI)"
               else "i-MInD, Universidad Miguel Hernández, Elche · Valencian Graduate School and Research Network of Artificial Intelligence (ValgrAI)"),
    list(name = "José L. Zofío", orcid = "0000-0003-1170-9501",
         role = if (es) "Coautor · Catedrático" else "Co-author · Full Professor",
         aff = if (es) "Departamento de Economía, Universidad Autónoma de Madrid · Rotterdam School of Management, Erasmus University"
               else "Department of Economics, Universidad Autónoma de Madrid · Rotterdam School of Management, Erasmus University"),
    list(name = "Víctor J. España", orcid = "0000-0002-1807-6180",
         role = if (es) "Coautor · Profesor Ayudante Doctor" else "Co-author · Assistant Professor",
         aff = if (es) "Departamento de Estadística, Investigación Operativa y Cálculo Numérico, Universidad Nacional de Educación a Distancia (UNED)"
               else "Department of Statistics, Operations Research and Numerical Analysis, Universidad Nacional de Educación a Distancia (UNED)")
  )
  items <- vapply(team, function(p) paste0(
    '<div><div class="n">', p$name, '</div><div class="r">', p$role, '</div>',
    '<div class="af">', p$aff, '</div>',
    '<div class="ln"><a href="https://orcid.org/', p$orcid, '">ORCID ', p$orcid, '</a></div></div>'),
    character(1))
  pxa_html('<div class="pxa-team">', paste(items, collapse = ""), '</div>')
}
