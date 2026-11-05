# PEAXAI — sitio web divulgativo

Sitio web estático (Quarto + R) que presenta **PEAXAI** (*Probabilistic Efficiency Analysis using Explainable Artificial Intelligence*) en inglés y castellano.

## Estructura

```
_quarto.yml               Configuración del sitio (navegación, tema, salida en docs/)
index.qmd                 Página principal en inglés (secciones 1–10 y cierre)
research.qmd              Publicaciones, congresos y equipo (inglés)
es/index.qmd              Página principal en castellano
es/research.qmd           Publicaciones, congresos y equipo (castellano)
R/compute_results.R       Cálculos con PEAXAI (se ejecuta a mano, ver abajo)
R/site.R                  Funciones auxiliares que usan las páginas (no ejecutan PEAXAI)
data/peaxai_results.json  Resultados calculados con PEAXAI (los lee la web)
data/peaxai_models.rds    Modelos ajustados (para reproducibilidad; la web no lo usa)
data/published_results.yml  Cifras publicadas en MLWA (2026) con su ubicación en el artículo
data/conferences.yml      Congresos: solo se publican las entradas con verified: true
assets/css/peaxai.scss    Identidad visual (colores, tipografía, maquetación)
assets/js/peaxai.js       Gráficos interactivos (Plotly.js) y textos dinámicos EN/ES
assets/vendor/            Plotly.js (paquete cartesiano 2.35.2, licencia MIT)
docs/                     Web renderizada, lista para publicar
```

## Flujo de trabajo

1. **Actualizar resultados** (solo cuando cambien los datos, el modelo o la versión de PEAXAI). Desde la raíz del proyecto en RStudio:

   ```r
   source("R/compute_results.R")   # ~3 minutos
   ```

   Escribe `data/peaxai_results.json`. Utiliza `data_example` (100 DMU simuladas, 1 input y 1 output) y las 97 empresas de la Comunitat Valenciana del conjunto `firms` incluidos en PEAXAI.

2. **Renderizar la web**: botón *Render Website* en la pestaña *Build* de RStudio, o `quarto render` en la terminal. Las páginas solo leen los resultados precalculados, por lo que el renderizado tarda unos segundos y la web no necesita un servidor R.

3. **Previsualizar**: `quarto preview` (abre un servidor local; abrir `docs/index.html` directamente también funciona en la mayoría de navegadores).

4. **Publicar en GitHub Pages**: hacer *commit* y *push* de la carpeta `docs/` y, en *Settings → Pages* del repositorio `PEAXAI-web`, elegir *Deploy from a branch → main → /docs*.

## Paquetes de R necesarios

`PEAXAI` (CRAN), `Benchmarking`, `kernelshap`, `jsonlite`, `yaml`, `knitr`, `rmarkdown`.

## Añadir un congreso

Editar `data/conferences.yml`, rellenar todos los campos y poner `verified: true`. Las entradas con `verified: false` no se publican. Volver a renderizar.

## Notas metodológicas

- La probabilidad mostrada es la probabilidad, según el clasificador, de pertenecer a la clase eficiente definida por DEA (modelo aditivo ponderado, VRS); no es la probabilidad de ser verdaderamente eficiente.
- Ejemplo 2-D: SVM con núcleo radial seleccionado por `PEAXAI_fitting()` (VC 5 particiones). Caso real: red neuronal (`nnet`) seleccionada del mismo modo, con la configuración de la viñeta del paquete.
- Los valores SHAP locales (gráfico en cascada) se obtienen con `kernelshap`, el motor que usa PEAXAI; `PEAXAI_local_importance()` devuelve esas mismas contribuciones normalizadas.
- Las curvas PDP/ICE se calculan en `R/compute_results.R` sobre el clasificador ajustado con PEAXAI; no son una función del paquete.
- Los peers que se muestran son los de `PEAXAI_peer(weighted = FALSE)` (distancia euclídea entre el objetivo contrafactual y las unidades observadas que superan el umbral).
