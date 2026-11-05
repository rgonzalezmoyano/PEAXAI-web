# =============================================================================
# PEAXAI website — precomputation of every result shown on the site
# -----------------------------------------------------------------------------
# Run this script once (from the project root) whenever you want to refresh the
# results:   source("R/compute_results.R")
#
# It writes data/peaxai_results.json, which the Quarto pages embed. Rendering
# the website does NOT re-run PEAXAI, so the site builds in seconds and works
# as a static site (no R server needed).
#
# Two datasets distributed with PEAXAI are used:
#   * data_example : 100 simulated DMUs, one input / one output (2-D story).
#   * firms        : SABI 2023, Spanish food industry. We use the 97 firms of
#                    the Comunidad Valenciana (as in the package vignette).
# All numbers on the site come from these computations, except the section
# "PEAXAI in practice", which quotes published results (see R/site.R).
# =============================================================================

suppressPackageStartupMessages({
  library(PEAXAI)
  library(Benchmarking)
  library(kernelshap)
  library(jsonlite)
})

set.seed(1)
thresholds <- c(0.75, 0.85, 0.95)
thr_names  <- as.character(thresholds)
out_file   <- file.path("data", "peaxai_results.json")
dir.create("data", showWarnings = FALSE)

quiet <- function(expr) {
  # PEAXAI / kernelshap print progress bars; keep the console readable
  res <- NULL
  invisible(utils::capture.output(res <- suppressWarnings(suppressMessages(expr))))
  res
}

# =============================================================================
# PART A. Two-dimensional illustration: data_example
# =============================================================================
data("data_example", package = "PEAXAI")
toy <- data_example[, c("x1", "y")]
n_toy <- nrow(toy)

# --- A1. DEA labels (weighted additive DEA, VRS) used by PEAXAI ---------------
toy_lab <- quiet(PEAXAI:::label_efficiency(data = toy, x = 1, y = 2, RTS = "vrs", seed = 1))
toy_dea_eff <- toy_lab$class_efficiency == "efficient"

# Radial DEA scores (only for the introductory section: how far each unit is
# from the observed best practice in input and output terms)
X <- as.matrix(toy$x1); Y <- as.matrix(toy$y)
theta <- Benchmarking::eff(Benchmarking::dea(X, Y, RTS = "vrs", ORIENTATION = "in"))
phi   <- Benchmarking::eff(Benchmarking::dea(X, Y, RTS = "vrs", ORIENTATION = "out"))

# Frontier vertices (efficient units sorted by input)
fr <- toy[toy_dea_eff, ]
fr <- fr[order(fr$x1), ]

# --- A2. Classifier: SVM with radial kernel (as in SoftwareX, Fig. 2) --------
toy_methods <- list(
  "svmRadial" = list(
    tuneGrid   = expand.grid(sigma = c(0.01, 0.1, 0.5, 1, 2), C = c(0.1, 1, 10, 100)),
    preProcess = c("center", "scale"),
    prob.model = TRUE
  )
)
toy_fit <- quiet(PEAXAI_fitting(
  data = toy, x = 1, y = 2, RTS = "vrs",
  imbalance_rate = seq(0.1, 0.4, 0.1),
  methods = toy_methods,
  trControl = list(method = "cv", number = 5),
  metric_priority = c("Balanced_Accuracy", "F1", "ROC_AUC"),
  hold_out = NULL, seed = 1, verbose = FALSE
))
toy_model <- toy_fit$best_model_fit$svmRadial
toy_perf  <- toy_fit$performance_train$svmRadial
toy_prob  <- PEAXAI_predict(toy, toy_model)

# Probability surface on a regular grid (heat map / contours)
gx <- seq(0.5, 10.5, length.out = 101)
gy <- seq(1.0, 10.0, length.out = 91)
grid <- expand.grid(x1 = gx, y = gy)
grid_p <- PEAXAI_predict(grid, toy_model)
grid_z <- matrix(grid_p, nrow = length(gy), ncol = length(gx), byrow = TRUE) # rows = y

# --- A3. Global importance (SHAP) --------------------------------------------
toy_imp <- quiet(PEAXAI_global_importance(
  final_model = toy_model, x = 1, y = 2,
  explain_data = toy, reference_data = toy,
  importance_method = list(name = "SHAP")
))

# --- A4. Counterfactuals under three improvement strategies -------------------
imp_df <- function(vx, vy) { d <- data.frame(x1 = vx, y = vy); rownames(d) <- "importance"; d }
strategies <- list(
  inputs  = imp_df(1, 0),                          # reduce resources only
  outputs = imp_df(0, 1),                          # increase output only
  shap    = imp_df(toy_imp[1, "x1"], toy_imp[1, "y"])         # SHAP-weighted direction
)

toy_cf <- list(); toy_peers <- list()
for (s in names(strategies)) {
  tg <- quiet(PEAXAI_counterfactuals(
    data = toy, x = 1, y = 2, final_model = toy_model,
    efficiency_thresholds = thresholds,
    directional_vector = list(relative_importance = strategies[[s]], baseline = "mean"),
    n_expand = 0.25, n_grid = 50, max_y = 1, min_x = 1
  ))
  pe_u <- quiet(PEAXAI_peer(data = toy, x = 1, y = 2, final_model = toy_model, targets = tg,
                            efficiency_thresholds = thresholds, weighted = FALSE,
                            relative_importance = strategies[[s]]))
  pe_w <- quiet(PEAXAI_peer(data = toy, x = 1, y = 2, final_model = toy_model, targets = tg,
                            efficiency_thresholds = thresholds, weighted = TRUE,
                            relative_importance = toy_imp))
  toy_cf[[s]] <- lapply(setNames(thr_names, thr_names), function(t) list(
    x    = round(tg[[t]]$counterfactual_dataset$x1, 5),
    y    = round(tg[[t]]$counterfactual_dataset$y, 5),
    beta = round(tg[[t]]$inefficiencies$betas, 5),
    prob = round(tg[[t]]$inefficiencies$probability, 5)
  ))
  toy_peers[[s]] <- lapply(setNames(thr_names, thr_names), function(t) list(
    unweighted = pe_u[[t]], weighted = pe_w[[t]]
  ))
}

# Direction vectors actually used (baseline = mean): g = importance * mean
toy_dirs <- lapply(strategies, function(v) c(gx = v$x1 * mean(toy$x1), gy = v$y * mean(toy$y)))

# Example for the introduction: two units with similar output and very different input
pairs <- subset(expand.grid(i = 1:n_toy, j = 1:n_toy), i < j)
pairs$dy <- abs(toy$y[pairs$i] - toy$y[pairs$j])
pairs$dx <- abs(toy$x1[pairs$i] - toy$x1[pairs$j])
pairs <- pairs[pairs$dy < 0.08 & (toy_dea_eff[pairs$i] | toy_dea_eff[pairs$j]), ]
best <- pairs[which.max(pairs$dx), ]
intro_pair <- c(best$i, best$j)[order(toy$x1[c(best$i, best$j)])]

# =============================================================================
# PART B. Real data: 97 food firms of the Comunidad Valenciana (SABI 2023)
# =============================================================================
data("firms", package = "PEAXAI")
real <- subset(firms, autonomous_community == "Comunidad Valenciana", select = -autonomous_community)
rownames(real) <- NULL
xr <- 1:4; yr <- 5
vars <- names(real)[c(xr, yr)]

real_lab <- quiet(PEAXAI:::label_efficiency(data = real, x = xr, y = yr, RTS = "vrs", seed = 1))

real_methods <- list(
  "nnet" = list(
    tuneGrid   = expand.grid(size = c(1, 5, 10, 20), decay = 10^seq(-5, -1, by = 1)),
    preProcess = c("center", "scale"),
    skip = TRUE, maxit = 100, MaxNWts = 100000, trace = FALSE
  )
)
real_fit <- quiet(PEAXAI_fitting(
  data = real, x = xr, y = yr, RTS = "vrs",
  imbalance_rate = seq(0.05, 0.4, 0.05),
  methods = real_methods,
  trControl = list(method = "cv", number = 5),
  metric_priority = c("Balanced_Accuracy", "F1", "ROC_AUC"),
  hold_out = NULL, seed = 1, verbose = FALSE
))
real_model <- real_fit$best_model_fit$nnet
real_perf  <- real_fit$performance_train$nnet
real_prob  <- PEAXAI_predict(real, real_model)

# --- B1. Global importance (SHAP, PEAXAI) -------------------------------------
real_imp <- quiet(PEAXAI_global_importance(
  final_model = real_model, x = xr, y = yr,
  explain_data = real, reference_data = real,
  importance_method = list(name = "SHAP")
))

# --- B2. Local SHAP values -----------------------------------------------------
# PEAXAI_local_importance() reports signed *relative* contributions. To draw a
# waterfall (baseline + contributions = prediction) we also keep the raw
# Shapley values from kernelshap, the engine PEAXAI uses for SHAP.
Xr <- real[, vars]
ks <- quiet(kernelshap::kernelshap(
  object = real_model, X = Xr, bg_X = Xr,
  pred_fun = function(object, newdata) PEAXAI_predict(newdata, object)
))
real_local_rel <- quiet(PEAXAI_local_importance(
  final_model = real_model, x = xr, y = yr,
  explain_data = real, reference_data = real,
  importance_method = list(name = "SHAP")
))

# --- B3. Counterfactuals, peers and rankings -----------------------------------
real_tg <- quiet(PEAXAI_counterfactuals(
  data = real, x = xr, y = yr, final_model = real_model,
  efficiency_thresholds = thresholds,
  directional_vector = list(relative_importance = real_imp, baseline = "mean"),
  n_expand = 0.25, n_grid = 50, max_y = 1, min_x = 1
))
real_peer <- quiet(PEAXAI_peer(data = real, x = xr, y = yr, final_model = real_model,
                               targets = real_tg, efficiency_thresholds = thresholds,
                               weighted = FALSE, relative_importance = real_imp))
rank_pred <- quiet(PEAXAI_ranking(data = real, x = xr, y = yr, final_model = real_model,
                                  rank_basis = "predicted"))
rank_att  <- quiet(PEAXAI_ranking(data = real, x = xr, y = yr, final_model = real_model,
                                  efficiency_thresholds = thresholds, targets = real_tg,
                                  rank_basis = "attainable"))

# Groups follow directly from PEAXAI_ranking(rank_basis = "attainable"):
#   meets     : already above the threshold (beta = 0)
#   reachable : reaches the threshold through the modelled adjustments (beta > 0)
#   below     : maximum attainable probability stays below the threshold
rank_json <- lapply(setNames(thr_names, thr_names), function(t) {
  r <- rank_att[[t]]
  thr <- as.numeric(t)
  grp <- ifelse(r$Probability_predicted >= thr, "meets",
         ifelse(r$Probability_target >= thr - 1e-8, "reachable", "below"))
  list(dmu = r$DMU, rank = r$Ranking, p = round(r$Probability_predicted, 4),
       ptarget = round(r$Probability_target, 4), beta = round(r$betas, 4), group = grp)
})

# --- B4. PDP and ICE (computed here on the PEAXAI classifier) -----------------
# These curves are not a native PEAXAI function: each firm's prediction is
# recomputed while one variable moves across its observed range.
pdp <- lapply(setNames(vars, vars), function(v) {
  g <- seq(min(real[[v]]), stats::quantile(real[[v]], 0.95), length.out = 40)
  ice <- sapply(g, function(val) { nd <- Xr; nd[[v]] <- val; PEAXAI_predict(nd, real_model) })
  list(grid = signif(g, 5), ice = round(ice, 4), pdp = round(colMeans(ice), 4))
})

# =============================================================================
# Export
# =============================================================================
res <- list(
  meta = list(
    generated = format(Sys.time(), "%Y-%m-%d"),
    peaxai_version = as.character(utils::packageVersion("PEAXAI")),
    r_version = paste(R.version$major, R.version$minor, sep = "."),
    thresholds = thresholds
  ),
  toy = list(
    n = n_toy,
    x = round(toy$x1, 4), y = round(toy$y, 4),
    dea_eff = toy_dea_eff,
    theta = round(theta, 4), phi = round(phi, 4),
    frontier = list(x = round(fr$x1, 4), y = round(fr$y, 4)),
    prob = round(toy_prob, 4),
    grid = list(x = round(gx, 4), y = round(gy, 4), z = round(grid_z, 4)),
    model = list(method = "SVM (radial kernel)",
                 imbalance = toy_perf$Imbalance_rate, sigma = toy_perf$sigma, C = toy_perf$C,
                 balanced_accuracy = toy_perf$Balanced_Accuracy, roc_auc = toy_perf$ROC_AUC,
                 recall = toy_perf$Recall, specificity = toy_perf$Specificity),
    importance = list(x1 = toy_imp[1, "x1"], y = toy_imp[1, "y"]),
    directions = toy_dirs,
    cf = toy_cf, peers = toy_peers,
    intro_pair = intro_pair
  ),
  real = list(
    n = nrow(real), vars = vars,
    data = lapply(real[, vars], function(v) signif(v, 5)),
    dea_eff = real_lab$class_efficiency == "efficient",
    prob = round(real_prob, 4),
    model = list(method = "Neural network (nnet)",
                 imbalance = real_perf$Imbalance_rate, size = real_perf$size, decay = real_perf$decay,
                 balanced_accuracy = real_perf$Balanced_Accuracy, roc_auc = real_perf$ROC_AUC,
                 recall = real_perf$Recall, specificity = real_perf$Specificity,
                 precision = real_perf$Precision),
    importance = as.list(real_imp[1, vars]),
    shap = list(baseline = round(as.numeric(ks$baseline), 4),
                values = round(unname(as.matrix(ks$S)), 4)),
    shap_rel = round(unname(as.matrix(real_local_rel[, vars])), 4),
    cf = lapply(setNames(thr_names, thr_names), function(t) list(
      targets = lapply(real_tg[[t]]$counterfactual_dataset[, vars], function(v) signif(v, 5)),
      beta = round(real_tg[[t]]$inefficiencies$betas, 4),
      prob = round(real_tg[[t]]$inefficiencies$probability, 4),
      peer = real_peer[[t]]
    )),
    rank_predicted = list(dmu = rank_pred$DMU, rank = rank_pred$Ranking,
                          p = round(rank_pred$Probability_predicted, 4)),
    rank_attainable = rank_json,
    pdp = pdp
  )
)

jsonlite::write_json(res, out_file, auto_unbox = TRUE, digits = NA, na = "null")
saveRDS(list(toy_fit = toy_fit, real_fit = real_fit), file.path("data", "peaxai_models.rds"))
message("Results written to ", out_file)
