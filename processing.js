//© Heba Sailem, heba.sailem@kcl.ac.uk
let datasets = {};

function initEventListeners() {
  const on = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };

  on("showImage", "change", showImageChanged);
  on("showAllLevels", "change", showAllLevelsChanged);
  on("showCellEmojiView", "change", showCellEmojiViewChanged);
  on("showEmojiView", "change", showEmojiViewChanged);
  on("showCluster", "change", showClusterLevelsChanged);
  on("showComposition", "change", showCompositionChanged);
  on("showGenes", "change", showGenesChanged);
  on("uploadNewFilesButton", "click", uploadNewFileClicked);
  on("input-2", "change", uploadCellTypeImages);
  on("demo1", "click", () => showDemo('demo1'));
  on("demo2", "click", () => showDemo('demo2'));
  on("demo3", "click", () => showDemo('demo3'));
  on("demo4", "click", () => showDemo('demo4'));
  on("demo5", "click", () => showDemo('demo5'));
  on("demo6", "click", () => showDemo('demo6'));
  on("demo7", "click", () => showDemo('demo7'));
  on("demo8", "click", () => showDemo('demo8'));
  on("demo9", "click", () => showDemo('demo9'));
  on("plotbutton", "click", generteCanvasClicked);
  on("closeSpotPopup", "click", () => {
    const el = document.getElementById("spotInfoPopup");
    if (el) el.style.display = "none";
  });

  document.querySelectorAll("input[name='clusterType']").forEach(radio => {
    radio.addEventListener("change", clusterViewSelectionChanged);
  });

  document.querySelectorAll("#nav-tab .nav-link").forEach(tab => {
    tab.addEventListener("click", showOrHideOptions);
  });
}

document.addEventListener("DOMContentLoaded", function () {
    const folderOption = document.getElementById("uploadFolderOption");
    const individualOption = document.getElementById("uploadIndividualOption");
    const folderSection = document.getElementById("folderUploadSection");
    const fileSection = document.getElementById("fileInputSection");

    folderOption.addEventListener("change", toggleUploadMethod);
    individualOption.addEventListener("change", toggleUploadMethod);

    function toggleUploadMethod() {
        if (folderOption.checked) {
        folderSection.style.display = "block";
        fileSection.style.display = "none";
        } else {
        folderSection.style.display = "none";
        fileSection.style.display = "block";
        }
    }
});

initEventListeners();

function resetGeneSelectionUI() {
  document.querySelectorAll('.popup-markergene-item[data-select-all="true"]').forEach(el => {
    el.classList.remove('bg-primary', 'text-white');
    el.classList.add('bg-light', 'text-dark');
  });

  document.querySelectorAll('.popup-gene-label').forEach(el => {
    el.classList.remove('popup-gene-selected');
  });

  document.querySelectorAll('.popup-gene-item').forEach(el => {
    el.style.border = 'none';
    el.style.outline = 'none';
  });
}

function updateSelectedGenesFromCheckboxes() {
  const selected = Array.from(document.querySelectorAll('.gene-checkbox:checked')).map(cb => cb.value);
  window.sketchOptions.selectedGenes = selected;
  document.getElementById('erasePopupGene').style.display = selected.length > 0 ? 'inline-block' : 'none';
}

function updateChartsIfInGeneMode() {
  if (window.mode === 'genes') {
    updateSpotColorsFromSelectedGenes();
    showGeneExpressionByClusterBarChart(dataSpots);
    showGeneExpressionByCellTypeBarChart(dataSpots);
  }
}

// ==== EVENT LISTENERS ====

document.getElementById('geneOptionsList').addEventListener('click', function (e) {
  if (!e.target.classList.contains('gene-checkbox')) return;

  const clickedBox = e.target;
  const isCtrlPressed = e.ctrlKey || e.metaKey;

  if (!isCtrlPressed) {
    document.querySelectorAll('.gene-checkbox').forEach(cb => {
      if (cb !== clickedBox) cb.checked = false;
    });
  }

  setTimeout(() => {
    let selected = document.querySelectorAll('.gene-checkbox:checked');
    if (selected.length === 0) {
      clickedBox.checked = true;
      selected = [clickedBox];
    }

    resetGeneSelectionUI();

    const allBoxes = document.querySelectorAll('.gene-checkbox');
    const selectAll = document.getElementById('selectAllGenes');
    selectAll.checked = selected.length === allBoxes.length;

    updateSelectedGenesFromCheckboxes();
    window.updateSelectedGeneLabel();
    updateChartsIfInGeneMode();
  }, 0);
});

document.getElementById('selectAllGenes').addEventListener('change', function () {
  const checkboxes = document.querySelectorAll('.gene-checkbox');
  const checked = this.checked;

  checkboxes.forEach((cb, idx) => {
    cb.checked = checked || idx === 0;
  });

  resetGeneSelectionUI();
  updateSelectedGenesFromCheckboxes();
  window.updateSelectedGeneLabel();
  updateChartsIfInGeneMode();
});

document.getElementById('geneSearchInput').addEventListener('input', function () {
  const query = this.value.toLowerCase();
  document.querySelectorAll('#geneOptionsList .form-check').forEach(item => {
    const label = item.querySelector('label');
    const geneName = label.textContent.toLowerCase();
    item.style.display = geneName.includes(query) ? '' : 'none';
  });
});

document.addEventListener('click', function (e) {
  const target = e.target.closest('.popup-gene-item, .popup-markergene-item');
  if (!target) return;

  const isSelectAll = target.getAttribute('data-select-all') === 'true';
  const isMainGeneItem = target.classList.contains('popup-gene-item');

  resetGeneSelectionUI();

  if (isSelectAll) {
    target.classList.remove('bg-light', 'text-dark');
    target.classList.add('bg-primary', 'text-white');

    const markerGeneSet = new Set(window.currentPopupMarkerGenes || []);
    const selectedGenes = [];

    document.querySelectorAll('.gene-checkbox').forEach(cb => {
      const shouldCheck = isMainGeneItem || markerGeneSet.has(cb.value);
      cb.checked = shouldCheck;
      if (shouldCheck) selectedGenes.push(cb.value);
    });

    const selectAllCheckbox = document.getElementById('selectAllGenes');
    if (selectAllCheckbox) selectAllCheckbox.checked = isMainGeneItem;

    window.sketchOptions.selectedGenes = selectedGenes;
    window.updateSelectedGeneLabel();
    updateChartsIfInGeneMode();
    document.getElementById('erasePopupGene').style.display = 'inline-block';

  } else {
    const selectedGene = target.getAttribute('data-gene');
    const labelSpan = target.querySelector('.popup-gene-label');

    if (labelSpan) labelSpan.classList.add('popup-gene-selected');
    target.style.border = '2px solid #0056b3';

    document.querySelectorAll('.gene-checkbox').forEach(cb => {
      cb.checked = cb.value === selectedGene;
    });

    const selectAll = document.getElementById('selectAllGenes');
    if (selectAll) selectAll.checked = false;

    window.sketchOptions.selectedGenes = [selectedGene];
    window.updateSelectedGeneLabel();
    updateChartsIfInGeneMode();
    document.getElementById('erasePopupGene').style.display = 'inline-block';
  }
});

document.getElementById('erasePopupGene').addEventListener('click', function () {
  const selectAll = document.getElementById('selectAllGenes');
  if (selectAll) {
    selectAll.checked = true;
    selectAll.dispatchEvent(new Event('change'));
  }

  document.querySelectorAll('.popup-gene-item, .popup-markergene-item').forEach(el => {
    el.classList.remove('bg-primary', 'text-white');
    el.style.border = 'none';
  });

  document.querySelectorAll('.popup-gene-label').forEach(el => {
    el.classList.remove('popup-gene-selected');
  });

  const allCheckboxes = document.querySelectorAll('.gene-checkbox');
  allCheckboxes.forEach(cb => cb.checked = true);

  window.sketchOptions.selectedGenes = Array.from(allCheckboxes).map(cb => cb.value);

  setTimeout(() => {
    if (window.mode === 'genes') {
      updateSpotColorsFromSelectedGenes();
    }
  }, 10);

  this.style.display = 'none';
});

window.updateSelectedGeneLabel = function() {
  const geneType = document.getElementById("SelectedGeneTypeForCluster");
  const geneCellType = document.getElementById("SelectedGeneTypeForCell");
  const selected = window.sketchOptions?.selectedGenes || [];

  if (selected.length === 0) {
    geneType.textContent = "N/A";
    geneCellType.textContent = "N/A";
  } else if (selected.length === 1) {
    geneType.textContent = selected[0]; // Single gene
    geneCellType.textContent = selected[0];
  } else {
    geneType.textContent = "Selected Gene(s)"; // Multiple
    geneCellType.textContent = "Selected Gene(s)";
  }
}

// ==== EXPRESSION THRESHOLD TOGGLE HANDLER ====
document.querySelectorAll('.expression-threshold-option').forEach(item => {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    const threshold = this.getAttribute('data-threshold') || 'all';
    window.expressionThresholdFilter = threshold;

    const labelMap = {
      high: 'High Expression',
      low: 'Low Expression',
      all: 'All Expression'
    };

    document.getElementById('expressionThresholdBtn').textContent = labelMap[threshold];

    if (window.mode === 'genes') {
      filterGeneExpression();
    }
  });
});

// ==== EXPRESSION FILTERING LOGIC ====
window.filterGeneExpression = function () {
  window.recomputeGeneExpressionStats();
  const filter = window.expressionThresholdFilter;

  dataSpots.forEach(spot => {
    if (filter === 'high') {
      spot.visible = spot.avgExpression > spot.geneMedian;
    } else if (filter === 'low') {
      spot.visible = spot.avgExpression <= spot.geneMedian;
    } else {
      spot.visible = true;
    }
  });
};

// ==== BOOTSTRAP COLLAPSE PANEL TOGGLE ====
const btn = document.getElementById("toggleImageOpacityBtn");
const icon = document.getElementById("toggleIcon");
const panel = document.getElementById("imageOpacityCont");
const collapse = new bootstrap.Collapse(panel, { toggle: false });

btn.addEventListener("click", () => {
  panel.classList.contains("show") ? collapse.hide() : collapse.show();
});

panel.addEventListener("shown.bs.collapse", () => icon.textContent = "−");
panel.addEventListener("hidden.bs.collapse", () => icon.textContent = "+");

// ==== OPACITY SLIDER ====
const opacitySlider = document.getElementById("imageOpacity");
const opacityValueDisplay = document.getElementById("opacityValue");

opacitySlider.addEventListener("input", () => {
  opacityValueDisplay.textContent = `${parseInt(opacitySlider.value)}`;
});

// ==== ENABLE TOOLTIP ====
document.addEventListener("DOMContentLoaded", () => {
  [...document.querySelectorAll('[data-bs-toggle="tooltip"]')]
    .forEach(el => new bootstrap.Tooltip(el));
});

// ==== FILE UPLOAD REGISTRATION ====
const fileUploadBindings = [
  ["positions", positinosUploaded],
  ["values", valuesUploaded],
  ["genesUpload", genesUploaded],
  ["umapUpload", umapUploaded]
];

function registerFileUpload(inputId, uploadHandler) {
  document.getElementById(inputId).addEventListener("change", uploadHandler);
}

fileUploadBindings.forEach(([id, handler]) => registerFileUpload(id, handler));

document.getElementById("folderInput").addEventListener("change", (e) => {
  uploadedFolderFiles = Array.from(e.target.files);
  document.getElementById("plotbutton").disabled = false;
});

function groupFilesByExampleRoot(fileList) {
  const grouped = {};
  for (const file of fileList) {
    const parts = file.webkitRelativePath.split("/");
    if (parts.length < 2) continue;
    const exampleId = parts[1];
    if (!grouped[exampleId]) grouped[exampleId] = [];
    grouped[exampleId].push(file);
  }
  return grouped;
}

async function parseAndAssignGlobals(fileList) {
    const fileMap = Object.fromEntries(fileList.map(f => [f.name.toLowerCase(), f]));
    const requiredFiles = ["spotpositions.csv", "spotclustermembership.csv"];

    try {
        for (const name of requiredFiles) {
            if (!fileMap[name]) {
                throw new Error(`Missing required file: ${name}`);
            }
        }
    } catch (error) {
        document.getElementById("loadingOverlay").style.display = "none";
        document.getElementById("displayExampleDropdown").style.display = "none";
        alert(`Missing required file. Please ensure each uploaded example folder contains all the necessary files with correct names.`);
        console.error(error);
    }

    positionsData = [];
    valuesData = [];
    genesData = [];
    umapData = [];
    expectedCellTypes = [];
    uploadedSVGFiles = {};
    window.uploadedEmojiFile = false;

    const readTextFile = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(`Failed reading: ${file.name}`);
            reader.readAsText(file);
        });

    const readImageFile = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                loadImage(e.target.result, (loadedImg) => {
                    img = loadedImg;
                    //   window.handleImageUploadUI();
                    resolve();
                });
            };
            reader.onerror = () => reject(`Failed to load image: ${file.name}`);
            reader.readAsDataURL(file);
        });

    const posText = await readTextFile(fileMap["spotpositions.csv"]);
    positionsData = posText.trim().split("\n").map(row => row.split(","));

    const valuesText = await readTextFile(fileMap["spotclustermembership.csv"]);
    const parsed = Papa.parse(valuesText.trim(), {
        header: false,
        skipEmptyLines: true
    });
    valuesData = parsed.data;
    expectedCellTypes = getCellTypesFromCSV(valuesData);
    populateClusterFeatureDropdown(valuesData);
    window.numberOfClusters = uniqueClusterCount(valuesData);
    generateClusterLegend(window.numberOfClusters);
    // window.uploadedEmojiFile = false;

    if (fileMap["topexpressedgenes.csv"]) {
        const genesText = await readTextFile(fileMap["topexpressedgenes.csv"]);
        genesData = scaleData(genesText.trim().split("\n").map(r => r.trim().split(",")));
    } else {
        genesData = '';
    }

    if (fileMap["spotumap.csv"]) {
        const umapText = await readTextFile(fileMap["spotumap.csv"]);
        umapData = scaleData(umapText.trim().split("\n").map(r => r.trim().split(",")));
    } else {
        umapData = '';
    }

    const imageFile = Object.values(fileMap).find(f => f.name.toLowerCase() === "tissue_image.png");
    if (imageFile) {
        await readImageFile(imageFile);
        window.handleImageUploadUI();
    }

    handleGeneFileUI(true);

    const normalizedExpected = expectedCellTypes.map(normalizeName);
    let unmatchedSVGs = [];
    Object.entries(fileMap).forEach(([name, file]) => {
        if (!name.endsWith(".svg")) return;
        const originalName = file.name.replace(".svg", "");
        const normalizedName = normalizeName(originalName);
        if (uploadedSVGFiles[normalizedName]) {
            console.warn(`Duplicate SVG file ignored: ${file.name}`);
            return;
        }
        if (!normalizedExpected.includes(normalizedName)) {
            unmatchedSVGs.push(file.name);
            return;
        }
        uploadedSVGFiles[normalizedName] = file;
    });
    updateUploadedFileListUI();

    // Validation
    const uploadedCount = Object.keys(uploadedSVGFiles).length;
    const expectedCount = expectedCellTypes.length;

    if (uploadedCount < expectedCount && uploadedCount > 0) {
        const remaining = expectedCount - uploadedCount;
        alert(`Expected "${remaining}" more cell type SVG file${remaining > 1 ? 's' : ''}.`);
    }
    if (unmatchedSVGs.length > 0) {
        alert(`The following SVG files don't match expected cell types:\n- ${unmatchedSVGs.join("\n- ")}`);
    }
    if (Object.keys(uploadedSVGFiles).length === expectedCellTypes.length) {
        validateSVGFiles();
    }
}

function loadAndVisualizeExample(exampleId) {
    const files = exampleFileMap[exampleId];
    if (!files) {
        alert(`Files for ${exampleId} not found.`);
        return Promise.reject(new Error("No files found for selected example."));
    }
    currentExampleId = exampleId;
    return parseAndAssignGlobals(files);
}

function populateExampleDropdown(exampleIds) {
    const dropdownMenu = document.querySelector("#exampleDropdown + .dropdown-menu");
    dropdownMenu.innerHTML = "";
    exampleIds.sort().forEach(exampleId => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "dropdown-item";
        a.href = "#";
        a.textContent = exampleId;
        a.addEventListener("click", () => {
            document.getElementById("loadingOverlay").style.display = "flex";
            loadAndVisualizeExample(exampleId)
                .then(() => {
                    checkRequiredUploads();
                    setDefaultGeneModeIfNeeded();
                    generateVis();
                    window.showDemoButton = "none";
                    document.getElementById("loadingOverlay").style.display = "none";
                    if (Array.isArray(umapData) && umapData.length > 0) {
                        console.log("UMAP data found. Starting UMAP visualization.");
                        setTimeout(() => {
                            showUMAP().catch((error) => console.error("Error in showUMAP:", error));
                        }, 0);
                    }
                })
                .catch(err => {
                    console.error("Error loading example:", err);
                });
        });
        li.appendChild(a);
        dropdownMenu.appendChild(li);
    });

    document.getElementById("exampleDropdown").textContent = "Select Example";
}

function toggleCheckboxVisibility(checkboxId, show) {
    const checkbox = document.getElementById(checkboxId);
    const label = document.querySelector(`label[for='${checkboxId}']`);
    checkbox.disabled = !show;
    checkbox.style.display = show ? "inline-block" : "none";
    if (label) label.style.display = show ? "inline-block" : "none";
}

function clearAllUploadInputs() {
  document.querySelectorAll('#fileInputSection input[type="file"]').forEach(input => input.value = "");
  if (typeof uploadedSVGFiles !== "undefined") uploadedSVGFiles = {};
  const svgList = document.getElementById("svg-file-list");
  if (svgList) svgList.textContent = "";
}

function updateUploadedFileListUI() {
  const listContainer = document.getElementById("svg-file-list");
  listContainer.innerHTML = "";
  const uploadedNames = Object.values(uploadedSVGFiles).map(file => file.name.replace(/:/g, "/"));
  listContainer.textContent = uploadedNames.join(", ");
}

window.onload = async function () {
    loadFontFile();
    document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
        radio.checked = false;
    });
    // await showDemo('demo5');
    await showDemo('demo5', { skipGenerateVis: true }); 
    document.getElementById("showEmojiView").click();
}

document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedScale = e.target.getAttribute('data-scale');
        if (selectedScale) {
            window.selectedGeneColorScale = selectedScale;
            updateColorScalePreview();
            if (window.mode === 'genes') generateVis();
        }
    });
});

document.getElementById("colorIntensitySlider").addEventListener("input", (e) => {
    window.geneColorIntensity = parseFloat(e.target.value);
    document.getElementById("intensityValue").innerText = `${window.geneColorIntensity.toFixed(1)}`;
    if (window.mode === 'genes') updateSpotColorsIntensity();
    updateColorScalePreview();
});

function uploadCellTypeImages(e) {
    const files = e.target.files;

    for (let file of files) {
        const originalName = file.name.replace(".svg", "");
        const normalizedName = normalizeName(originalName);

        // Skip if already uploaded
        if (uploadedSVGFiles[normalizedName]) {
            alert(`File "${file.name}" is already uploaded.`);
            continue;
        }

        // Restrict upload count to expectedCellTypes.length
        const remainingSlots = expectedCellTypes.length - Object.keys(uploadedSVGFiles).length;
        if (remainingSlots <= 0) {
            alert(`You can only upload ${expectedCellTypes.length} SVG files as only ${expectedCellTypes.length} cell types are available.`);
            break;
        }

        // Check if normalized name matches any expected cell type (also normalized)
        const match = expectedCellTypes.find(expected =>
            normalizeName(expected) === normalizedName
        );

        if (!match) {
            alert(`"${file.name}" does not match any expected cell type.`);
            continue;
        }

        uploadedSVGFiles[normalizedName] = file;
        updateUploadedFileListUI();
    }

    e.target.value = "";

    if (Object.keys(uploadedSVGFiles).length === expectedCellTypes.length) {
        validateSVGFiles();
    }
}

function showOrHideOptions() {
  const optionsContainer = document.getElementById("optionsContainer");
  const umapTab = document.getElementById("umapTab");
  const plottingTab = document.getElementById("plottingTab");
  const canvasContainerID = document.getElementById("canvasContainer");

  const umapUpload = document.getElementById("umapUpload");
  const umapFileUploaded = umapUpload && umapUpload.files && umapUpload.files.length > 0;
  const umapDataAvailable = Array.isArray(umapData) && umapData.length > 0;

  // UMAP tab is active
  if (umapTab.classList.contains("active")) {
    if (umapFileUploaded || umapDataAvailable) {
      optionsContainer.style.display = "block";
    } 
  // Plotting tab is active
  } else if (plottingTab.classList.contains("active")) {
    const isSelectUploadVisible = window.getComputedStyle(document.getElementById("selectUploadMethod")).display === "block";
    const isUploadNewFilesVisible = window.getComputedStyle(document.getElementById("uploadNewFilesButton")).display === "block";

    if (window.showDemoButton === "none") {
      if (isSelectUploadVisible) {
        optionsContainer.style.display = "none";
      } else if (isUploadNewFilesVisible) {
        optionsContainer.style.display = "block";
      }
    } else {
      optionsContainer.style.display = "none";
    }

  // Any other tab
  } else {
    if (window.showDemoButton === "clicked") {
      optionsContainer.style.display = "block";
    } else {
      optionsContainer.style.display = "none";
    }
  }

  // Update canvas pointer events
  canvasContainerID.style.pointerEvents = (optionsContainer.style.display === "none") ? "none" : "auto";
}


function preloadMappedEmojiSVGs() {
    if (!window.cellTypeVectors) window.cellTypeVectors = {};
  
    Object.entries(window.cellTypeToEmojiMap).forEach(([cellType, fileName]) => {
      fetch(`./smoothsvg/${fileName}`)
        .then(res => res.text())
        .then(svgText => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgText, "image/svg+xml");
  
          const svgElement = doc.querySelector("svg");
          if (!svgElement) return;

          svgElement.style.position = "absolute";
          svgElement.style.visibility = "hidden";
          svgElement.style.pointerEvents = "none";
          document.body.appendChild(svgElement);
  
          const viewBox = svgElement.getAttribute("viewBox") || "0 0 100 100";
          const [, , w, h] = viewBox.split(" ").map(parseFloat);
          const viewBoxSize = Math.max(w || 100, h || 100);
  
          const elements = Array.from(svgElement.querySelectorAll("path, text"));
          const vectorPaths = elements.map(el => {
            const tag = el.tagName.toLowerCase();
            const computed = window.getComputedStyle(el);
  
            if (tag === "path") {
              return {
                type: "path",
                d: el.getAttribute("d"),
                stroke: "black",
                fill: el.getAttribute("fill") || computed.fill || "none",
                strokeWidth: el.getAttribute("stroke-width") || computed.strokeWidth || "1",
                linecap: el.getAttribute("stroke-linecap") || computed.strokeLinecap || "butt",
              };
            } else if (tag === "text") {
              return {
                type: "text",
                text: el.textContent,
                x: parseFloat(el.getAttribute("x")) || 0,
                y: parseFloat(el.getAttribute("y")) || 0,
                fontSize: parseFloat(computed.fontSize) || 16,
                fontFamily: computed.fontFamily || "sans-serif",
                fill: "black",
              };
            } 
            return null;
          }).filter(Boolean);
  
          svgElement.remove();
  
          window.cellTypeVectors[cellType] = {
            viewBoxSize,
            shapes: vectorPaths
          };
        })
        .catch(err => {
          console.warn(`Error loading vector: ${cellType} → ${fileName}`, err);
        });
    });
}

function updateColorScalePreview() {
    const container = document.getElementById('gradientCanvasContainer');
    container.innerHTML = "";
    var colorRectangle = document.createElement("canvas");
    var xmax = 120;
    var ymax = 20;
    colorRectangle.width = xmax;
    colorRectangle.height = ymax;
    var ctx = colorRectangle.getContext("2d");

    // Get the selected color array
    const selectedScale = window.selectedGeneColorScale || 'Viridis';
    const colorGrad = [...getColorScaleArray(selectedScale)];
    const numColor = colorGrad.length;

    // Create gradient
    var grd = ctx.createLinearGradient(0, 0, xmax, 0);
    for (var j = 0; j < numColor; j++) {
        grd.addColorStop(j / numColor, adjustColorIntensity(colorGrad[j], window.geneColorIntensity));
        grd.addColorStop((j + 1) / numColor - 0.01, adjustColorIntensity(colorGrad[j], window.geneColorIntensity));
    }

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, xmax, ymax);
    container.appendChild(colorRectangle);
}

// track current selection

document.querySelectorAll(".color-scale-option").forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault();

        const scaleValue = item.getAttribute("data-scale");
        selectedScaleValue = scaleValue;

        const selectedScale = colorScales.find(scale => scale.value === scaleValue);
        if (selectedScale) {
            dataColors = selectedScale.colors;
            generateVis();
        }
    });
});

function uniqueClusterCount(valuesRows, clusterColumnName = 'Cluster-GE') {
    const headers = valuesRows[0];
    const idx = headers.findIndex(header => header.trim() === clusterColumnName);

    if (idx === -1) {
        console.error(`Cluster column '${clusterColumnName}' not found.`);
        return [];
    }

    let clusters = valuesRows.slice(1)
        .map(row => row[idx])
        .map(value => parseInt(value, 10))
        .filter(value => !isNaN(value));

    let uniqueClusters = [...new Set(clusters)].sort((a, b) => a - b);
    // if (uniqueClusters[0] === 0) {
    //     uniqueClusters = uniqueClusters.map(value => value + 1);
    // }
    return uniqueClusters;
}

function setSlidersForDemo(demo) {
  const presets = {
    demo5: { x: 1.26, offsetX: -37, offsetY: -168 },
    demo1: { x: 1.22, offsetX: -37, offsetY: -168 },
    demo2: { x: 1.78, offsetX: -646, offsetY: -997 },
    demo3: { x: 1.65, offsetX: -275, offsetY: -263 },
    demo4: { x: 1.28, offsetX: 74, offsetY: -545 },
    demo6: { x: 1.27, offsetX: -37, offsetY: -168 },
    demo7: { x: 1.92, offsetX: 679, offsetY: 502 },
    demo8: { x: 1.44, offsetX: -406, offsetY: -168 },
    demo9: { x: 1.35, offsetX: -108, offsetY: -48 },
  };

  const p = presets[demo];
  if (!p || !window.aspectRatio) return;

  const stretchX = p.x;
  const stretchY = stretchX * window.aspectRatio;

  document.getElementById("stretchX").value = stretchX.toFixed(2);
  document.getElementById("stretchY").value = stretchY.toFixed(2);
  document.getElementById("offsetX").value = p.offsetX;
  document.getElementById("offsetY").value = p.offsetY;

  document.getElementById("stretchXValue").innerText = stretchX.toFixed(2);
  document.getElementById("stretchYValue").innerText = stretchY.toFixed(2);
  document.getElementById("offsetXValue").innerText = p.offsetX;
  document.getElementById("offsetYValue").innerText = p.offsetY;
}

async function showDemo(demoValue = 'demo5', options = {}) {
    clearAllUploadInputs();
    toggleCheckboxVisibility("showGenes", document.getElementById("showGenes"));
    toggleCheckboxVisibility("showImage", document.getElementById("showImage"));

    infoBox.innerHTML = ''
    window.selectedClusterInLegend = null;
    document.getElementById("loadingOverlay").style.display = "flex";
    document.getElementById('displayExampleDropdown').style.display = 'none';
    window.whichDemo = demoValue;
    loadImageForDemo(demoValue);
    document.getElementById("umapTab").classList.remove("d-none");
    window.showDemoButton = "clicked"
    window.uploadedEmojiFile == false;

    setSlidersForDemo(window.whichDemo);

    if (window.whichDemo !== 'demo1'){
        preloadMappedEmojiSVGs();
        document.getElementById("showEmojiView").disabled = false;
        document.querySelector("label[for='showEmojiView']").classList.remove("disabled"); 
        document.getElementById("showEmojiView").style.display = 'inline-block';
        document.querySelector("label[for='showEmojiView']").style.display = 'inline-block'; 

        document.getElementById("showCellEmojiView").disabled = false;
        document.querySelector("label[for='showCellEmojiView']").classList.remove("disabled"); 
        document.getElementById("showCellEmojiView").style.display = 'inline-block';
        document.querySelector("label[for='showCellEmojiView']").style.display = 'inline-block'; 
        document.getElementById("expressionThresholdWrapper").classList.add("disabled");

        if(window.mode === 'genes'){
            document.getElementById("colorScaleDropdownBtn").classList.add("disabled");
            document.getElementById("expressionThresholdWrapper").classList.remove("disabled");
            document.getElementById("showEmojiView").checked = true;
            window.showEmojiView = true;
            document.getElementById("showAllLevels").checked = false;
            document.getElementById("showComposition").checked = false;
            window.showCluster = false;
            document.getElementById('showCluster').checked = false;
            document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
                radio.checked = false;
            });
        }
    } else {
        document.getElementById("colorScaleDropdownBtn").classList.remove("disabled");
        document.getElementById("showEmojiView").disabled = true;
        document.querySelector("label[for='showEmojiView']").classList.add("disabled"); 
        document.getElementById("showEmojiView").checked = false;
        document.getElementById("showEmojiView").style.display = 'inline-block';
        document.querySelector("label[for='showEmojiView']").style.display = 'inline-block'; 
        document.getElementById("showCellEmojiView").disabled = true;
        document.querySelector("label[for='showCellEmojiView']").classList.add("disabled"); 
        document.getElementById("showCellEmojiView").checked = false;
        document.getElementById("showCellEmojiView").style.display = 'inline-block';
        document.querySelector("label[for='showCellEmojiView']").style.display = 'inline-block'; 
        if (window.mode !== 'genes') {
            if(window.showEmojiView || window.showCellEmojiView){
                document.getElementById("showEmojiView").checked = false;
                document.getElementById("showAllLevels").checked = false;
                document.getElementById("showCellEmojiView").checked = false;
                document.getElementById("expressionThresholdWrapper").classList.add("disabled");
                window.showEmojiView = false;
                window.showAllLevels = false;
                window.showCellEmojiView = false;
                window.showCluster = true;
                document.getElementById('showCluster').checked = true;
                const radios = document.querySelectorAll("input[name='clusterType']");
                // Check if any radio is currently selected
                const anySelected = Array.from(radios).some(radio => radio.checked);
                // If none selected, select the first one
                if (!anySelected && radios.length > 0) {
                    radios[0].checked = true;
                }
                const selectedClusterView = document.querySelector("input[name='clusterType']:checked").value;
                window.selectedClusterView = selectedClusterView;
            } else if (window.showAllLevels){
                document.getElementById("showEmojiView").checked = false;
                document.getElementById("showEmojiView").disabled = true;
                document.querySelector("label[for='showEmojiView']").classList.add("disabled"); 
                document.getElementById("showCellEmojiView").checked = false;
                document.getElementById("showCellEmojiView").disabled = true;
                document.querySelector("label[for='showCellEmojiView']").classList.add("disabled"); 
            }
        } else if (window.mode == 'genes'){
            document.getElementById("colorScaleDropdownBtn").classList.add("disabled");
            document.getElementById("expressionThresholdWrapper").classList.remove("disabled");
            window.showCluster = true;
            document.getElementById('showCluster').checked = true;
            const radios = document.querySelectorAll("input[name='clusterType']");
            // Check if any radio is currently selected
            const anySelected = Array.from(radios).some(radio => radio.checked);
            // If none selected, select the first one
            if (!anySelected && radios.length > 0) {
                radios[0].checked = true;
            }
            const selectedClusterView = document.querySelector("input[name='clusterType']:checked").value;
            window.selectedClusterView = selectedClusterView;
        }
        
    }

    let positionsFile, valuesFile, genesFile;

    if (demoValue === 'demo1') {
        positionsFile = './demoData/mouse/SpotPositions.csv';
        valuesFile = './demoData/mouse/SpotClusterMembership.csv';
        genesFile = './demoData/mouse/TopExpressedGenes.csv';
    } else if (demoValue === 'demo2') {
        positionsFile = './demoData/p5/SpotPositions_Transformed_SP5.csv';
        valuesFile = './demoData/p5/SpotClusterMembership_SP5.csv';
        genesFile = './demoData/p5/TopExpressedGenes_SP5.csv';
    } else if (demoValue === 'demo3') {
        positionsFile = './demoData/p6/SpotPositions_SP6_matched.csv';
        valuesFile = './demoData/p6/SpotClusterMembership_SP6.csv';
        genesFile = './demoData/p6/TopExpressedGenes_SP6.csv';
    } else if (demoValue === 'demo4') {
        positionsFile = './demoData/p7/SpotPositions_SP7_matched.csv';
        valuesFile = './demoData/p7/SpotClusterMembership_SP7.csv';
        genesFile = './demoData/p7/TopExpressedGenes_SP7.csv';
    } else if (demoValue === 'demo5') {
        positionsFile = './demoData/p8/SpotPositions_SP8_matched.csv';
        valuesFile = './demoData/p8/SpotClusterMembership_SP8_withUMAP.csv';
        genesFile = './demoData/p8/TopExpressedGenes_SP8.csv';
    } else if (demoValue === 'demo6') {
        positionsFile = './demoData/p1/SpotPositions_SP1.csv';
        valuesFile = './demoData/p1/SpotClusterMembership_SP1.csv';
        genesFile = './demoData/p1/TopExpressedGenes_SP1.csv';
    } else if (demoValue === 'demo7') {
        positionsFile = './demoData/p2/SpotPositions_SP2.csv';
        valuesFile = './demoData/p2/SpotClusterMembership_SP2.csv';
        genesFile = './demoData/p2/TopExpressedGenes_SP2.csv';
    } else if (demoValue === 'demo8') {
        positionsFile = './demoData/p3/SpotPositions_SP3.csv';
        valuesFile = './demoData/p3/SpotClusterMembership_SP3.csv';
        genesFile = './demoData/p3/TopExpressedGenes_SP3.csv';
    } else if (demoValue === 'demo9') {
        positionsFile = './demoData/p4/SpotPositions_SP4.csv';
        valuesFile = './demoData/p4/SpotClusterMembership_SP4.csv';
        genesFile = './demoData/p4/TopExpressedGenes_SP4.csv';
    }

    let positionsCsv = await fetch(positionsFile)
    let positionsRes = await positionsCsv.text()
    // console.log(positionsRes);
    const positionsText = positionsRes;
    const positionsRows = positionsText.split('\n');
    positionsData = positionsRows.map(row => row.split(','));

    let valuesCsv = await fetch(valuesFile);
    let valuesRes = await valuesCsv.text();
    const parsed = Papa.parse(valuesRes.trim(), {
        header: false,
        skipEmptyLines: true,
    });
    const valuesRows = parsed.data;
    populateClusterFeatureDropdown(valuesRows);
    window.numberOfClusters = uniqueClusterCount(valuesRows, window.selectedClusterFeature);
    // console.log(window.numberOfClusters);
    valuesData = valuesRows;
    // console.log(valuesData);
    generateCellTypeDropdown(getCellTypesFromCSV(valuesData));
    

    let genesCsv = await fetch(genesFile)
    let genesRes = await genesCsv.text()
    const genesText = genesRes;
    const genesRows = genesText.split('\n');
    genesData = scaleData(genesRows.map(row => row.trim().split(',')));

    document.getElementById("optionsContainer").style.display = "block";
    let defaultScaleValue = 'ColorScale1';
    if (['demo2', 'demo3', 'demo4', 'demo5', 'demo6', 'demo7', 'demo8', 'demo9'].includes(demoValue)) {
        defaultScaleValue = 'ColorScale4';
    }

    selectedScaleValue = defaultScaleValue;
    const selectedScale = colorScales.find(scale => scale.value === defaultScaleValue);
    if (selectedScale) {
        dataColors = selectedScale.colors;
    }
    // generateVis();
    if (!options.skipGenerateVis) {
        generateVis();
    }

    document.getElementById("loadingOverlay").style.display = "none";
    generateClusterLegend(window.numberOfClusters);
    showOrHideOptions();

    //triggering showUMAP in the background
    setTimeout(() => {
        showUMAP(1)
            .then(() => console.log("UMAP visualization completed."))
            .catch((error) => console.error("Error in showUMAP:", error));
    }, 0);
}

function populateClusterFeatureDropdown(valuesData) {
    const headers = valuesData[0];
    const clusterCols = headers.filter(h => h.startsWith("Cluster-"));
    const clusterFeatureDropdown = document.querySelector("#clusterFeatureDropdown + .dropdown-menu");

    if (!clusterFeatureDropdown) {
        console.warn("Cluster feature dropdown element not found.");
        return;
    }

    clusterFeatureDropdown.innerHTML = "";

    if (clusterCols.length === 0) {
        alert("No Cluster-* columns found.");
        return;
    }

    // Set default selected cluster
    window.selectedClusterFeature = clusterCols.includes("Cluster-GE") ? "Cluster-GE" : clusterCols[0];

    clusterCols.forEach(col => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.className = "dropdown-item";
        btn.textContent = col;
        btn.onclick = () => {
            window.selectedClusterFeature = col;
            window.numberOfClusters = uniqueClusterCount(valuesData, window.selectedClusterFeature);
            document.querySelectorAll(".cluster-checkbox").forEach(cb => cb.checked = false);
            highlightClusterOnCanvas([]); // Show all spots by clearing highlights
            generateClusterLegend(window.numberOfClusters);
            generateVis();
            // reGenerateUMAP(clusters, selectedClusters);
             setTimeout(() => {
                showUMAP(1)
                    .then(() => console.log("UMAP visualization completed."))
                    .catch((error) => console.error("Error in showUMAP:", error));
                }, 0);
            };
        li.appendChild(btn);
        clusterFeatureDropdown.appendChild(li);
    });
}


async function loadCSV(filePath) {
    const response = await fetch(filePath);
    const text = await response.text();
    const rows = text.trim().split('\n').map((row) => row.split(','));
    const headers = rows.shift();
    return rows.map((row) =>
        headers.reduce((acc, header, i) => {
            acc[header] = isNaN(row[i]) ? row[i] : parseFloat(row[i]);
            return acc;
        }, {})
    );
}

function transformFileData(fileData) {
    const headers = fileData[0];
    const rows = fileData.slice(1);

    return rows.map((row) =>
        headers.reduce((acc, header, i) => {
            acc[header] = isNaN(row[i]) ? row[i] : parseFloat(row[i]);
            return acc;
        }, {})
    );
}

function getUMAPLayout() {
    return {
        xaxis: { title: 'UMAP Dimension 1' },
        yaxis: { title: 'UMAP Dimension 2' },
        height: 300,
        width: 400,
        margin: { t: 30, r: 10 },
        showlegend: false,
    };
}

function updateCheckboxStates() {
    const allCheckboxes = document.querySelectorAll('#cluster-dropdown-menu input[type="checkbox"]');

    if (selectedClusters.length >= MAX_SELECTIONS) {
        allCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.disabled = true;
            }
        });
    } else {
        allCheckboxes.forEach(checkbox => {
            checkbox.disabled = false;
        });
    }
}

async function showUMAP(showdemoCall = 0) {
    try {
        if (window.currentUMAPWorker) {
            console.log("Terminating previous UMAP worker...");
            window.currentUMAPWorker.terminate();
            window.currentUMAPWorker = null;
        }
        const umapPlotDiv = document.getElementById('umap-plot');
        umapPlotDiv.innerHTML = '<p>UMAP is loading...</p>';
        umapPlotDiv.style.textAlign = 'center';
        let topExpressedGenes = [];
        if (showdemoCall) {
            topExpressedGenes = transformFileData(genesData); 
        } else {
            topExpressedGenes = transformFileData(umapData);
        }
        window.spotClusterMembership = transformFileData(valuesData);

        const clusters = window.spotClusterMembership.map((row) => parseInt(row[window.selectedClusterFeature], 10));
        window.clusterInfo = clusters;
        window.top3CellTypeTexts = window.spotClusterMembership.map((spot) => {
            const clusterLikeKeys = Object.keys(spot).filter(k => k.toLowerCase().startsWith('cluster-'));
            
            const clusterInfoText = clusterLikeKeys
                .map(key => `${key}: ${spot[key]}`)
                .join('<br>');

            const top3 = Object.entries(spot)
                .filter(([key]) => key.toLowerCase() !== "barcode" && !clusterLikeKeys.includes(key))
                .map(([key, val]) => ({ key, val: parseFloat(val) }))
                .sort((a, b) => b.val - a.val)
                .slice(0, 3);

            const cellTypesText = top3
                .map(cell => `${cell.key}: ${parseFloat(cell.val * 100).toFixed(2)}%`)
                .join('<br>');

            return `<b>Cluster Info:</b><br>${clusterInfoText}<br><br><b>Top Cell Types:</b><br>${cellTypesText}`;
        });
        const geneNames = Object.keys(topExpressedGenes[0]);

        const numRows = topExpressedGenes.length;
        const geneExpressionMatrix = geneNames.map(gene => 
            topExpressedGenes.map(row => parseFloat(row[gene]) || 0)
        );

        // Compute mean and std deviation for each gene
        const geneMeans = geneExpressionMatrix.map(values =>
            values.reduce((sum, v) => sum + v, 0) / values.length
        );
        const geneStds = geneExpressionMatrix.map((values, i) => {
            const mean = geneMeans[i];
            const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
            return Math.sqrt(variance) || 1;
        });

        // Normalize each value (z-score)
        const geneExpressionData = Array.from({ length: numRows }, (_, i) =>
            geneNames.map((_, j) =>
                (geneExpressionMatrix[j][i] - geneMeans[j]) / geneStds[j]
            )
        );

        if (geneExpressionData.some((row) => row.length === 0)) {
            throw new Error('Some rows in gene expression data are empty.');
        }

        if (geneExpressionData.length !== clusters.length) {
            throw new Error('Mismatch between gene expression rows and cluster labels.');
        }

        const worker = new Worker('umapWorker.js');
        window.currentUMAPWorker = worker; // store reference globally

        return new Promise((resolve, reject) => {
            worker.postMessage({
                geneExpressionData,
                clusters,
                randomSeed: 'my-fixed-seed',
            });

            // Handle results from the worker
            worker.onmessage = (e) => {
                const {
                    success,
                    embedding,
                    error
                } = e.data;

                if (success) {
                    currentEmbedding = embedding;
                    // Clearing the "loading" message
                    umapPlotDiv.innerHTML = '';
                    // Generating the UMAP plot using Plotly
                    const trace = {
                        x: embedding.map((point) => point[0]),
                        y: embedding.map((point) => point[1]),
                        mode: 'markers',
                        marker: {
                            size: 5,
                            symbol: 'x',
                            color: window.selectedClusterFeature === 'Cluster-UMAP' ? clusters : 'grey',
                            colorscale: window.selectedClusterFeature === 'Cluster-UMAP' ? 'Viridis' : undefined,
                        },
                        hoverinfo: 'text',
                        text: window.top3CellTypeTexts
                    };
                    window.geneExpressionMatrix = topExpressedGenes;
                    const selectedGenes = window.sketchOptions.selectedGenes || [];
                    if (window.mode === 'genes' && selectedGenes.length > 0) {
                        reGenerateUMAP(clusters, []);
                    } else {
                        Plotly.newPlot('umap-plot', [trace], getUMAPLayout(), config);
                        const umapPlotDiv = document.getElementById('umap-plot');

                        umapPlotDiv.on('plotly_hover', function(data) {
                        if (data && data.points && data.points.length > 0) {
                            window.highlightedSpotIndex = data.points[0].pointIndex + 1;
                        }
                        });

                        umapPlotDiv.on('plotly_unhover', function() {
                        window.highlightedSpotIndex = -1;
                        });
                    }
                    resolve();

                } else {
                    umapPlotDiv.innerHTML = `<p style="color: red;">Error: ${error}</p>`;
                    reject(error);
                }

                worker.terminate(); // Terminating the worker after completion
                window.currentUMAPWorker = null;
            };

            // Handling worker errors
            worker.onerror = (error) => {
                umapPlotDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
                reject(error.message);
                worker.terminate();
                window.currentUMAPWorker = null;
            };
        });
    } catch (error) {
        const umapPlotDiv = document.getElementById('umap-plot');
        umapPlotDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        console.error('Error generating UMAP:', error);
    }
}

function reGenerateUMAP(allClusters, selectedClusters) {
    if (selectedClusters.length === 0) {
        if(window.mode === 'cellComposition'){
            const originalTrace = {
                x: currentEmbedding.map((point) => point[0]),
                y: currentEmbedding.map((point) => point[1]),
                mode: 'markers',
                // marker: {
                //     size: 8,
                //     color: 'grey',
                //     // opacity: 0.5,
                // },
                marker: {
                            size: 5,
                            symbol: 'x',
                            color: window.selectedClusterFeature === 'Cluster-UMAP' ? allClusters : 'grey',
                            colorscale: window.selectedClusterFeature === 'Cluster-UMAP' ? 'Viridis' : undefined,
                            // colorbar: window.selectedClusterFeature === 'Cluster-UMAP'
                            //     ? { title: 'Cluster-UMAP' }
                            //     : undefined,
                        },
                hoverinfo: 'text',
                text: window.top3CellTypeTexts
            };
            Plotly.newPlot('umap-plot', [originalTrace], getUMAPLayout(), config);
            const umapPlotDiv = document.getElementById('umap-plot');

            umapPlotDiv.on('plotly_hover', function(data) {
            if (data && data.points && data.points.length > 0) {
                window.highlightedSpotIndex = data.points[0].pointIndex + 1;
            }
            });

            umapPlotDiv.on('plotly_unhover', function() {
            window.highlightedSpotIndex = -1;
            });
        } else {
            const selectedGenes = window.sketchOptions.selectedGenes || [];
            const geneMatrix = window.geneExpressionMatrix || [];
            const colorMap = getColorScaleArray(window.selectedGeneColorScale || 'Viridis');

            if (!selectedGenes.length || !geneMatrix.length) {
                console.warn('Missing selected genes or gene expression matrix');
                return;
            }
            const allGeneNames = Object.keys(geneMatrix[0]);
            const selectedGeneIndices = selectedGenes.map(g => allGeneNames.indexOf(g)).filter(i => i !== -1);

            const avgExpressions = geneMatrix.map(row => {
                const vals = selectedGeneIndices.map(i => parseFloat(row[allGeneNames[i]]) || 0);
                return vals.reduce((sum, v) => sum + v, 0) / vals.length;
            });

            const maxScale = colorMap.length - 1;
            const geneColors = avgExpressions.map(val => {
                const colorIndex = Math.min(Math.floor(val), maxScale);
                const baseColor = colorMap[colorIndex];
                return adjustColorIntensity(baseColor, window.geneColorIntensity || 1);
            });

            const trace = {
                x: currentEmbedding.map((point) => point[0]),
                y: currentEmbedding.map((point) => point[1]),
                mode: 'markers',
                marker: {
                    size: 5,
                    symbol: 'x',
                    color: geneColors,
                },
                hoverinfo: 'text',
                text: avgExpressions.map((val, i) =>
                    `${window.top3CellTypeTexts[i]}`
                )
            };

            Plotly.newPlot('umap-plot', [trace], getUMAPLayout(), config);
            const umapPlotDiv = document.getElementById('umap-plot');

            umapPlotDiv.on('plotly_hover', function(data) {
            if (data && data.points && data.points.length > 0) {
                window.highlightedSpotIndex = data.points[0].pointIndex + 1;
            }
            });

            umapPlotDiv.on('plotly_unhover', function() {
            window.highlightedSpotIndex = -1;
            });
        }
        return;
    }    

    const umapPlotDiv = document.getElementById('umap-plot');
    // umapPlotDiv.innerHTML = '';
    umapPlotDiv.innerHTML = '<p>Re-generating UMAP...</p>';

    // const colors = ['red', 'green', 'yellow', 'orange', 'purple'];

    const colors = getColorScaleArray('allScale');

    const trace = {
        x: currentEmbedding.map((point) => point[0]),
        y: currentEmbedding.map((point) => point[1]),
        mode: 'markers',
        marker: {
            size: 5,
            symbol: 'x',
            color: allClusters.map((cluster) => {
                const index = selectedClusters.indexOf(cluster);
                return index !== -1 ? colors[index % colors.length] : 'gray';
            }),
        },
        hoverinfo: 'text',
        text: window.top3CellTypeTexts.map((text, i) =>
            selectedClusters.includes(allClusters[i]) ? text : ''
        )
    };

    umapPlotDiv.innerHTML = '';
    Plotly.newPlot('umap-plot', [trace], getUMAPLayout(), config);

    umapPlotDiv.on('plotly_hover', function(data) {
    if (data && data.points && data.points.length > 0) {
        window.highlightedSpotIndex = data.points[0].pointIndex + 1;
    }
    });

    umapPlotDiv.on('plotly_unhover', function() {
    window.highlightedSpotIndex = -1;
    });
}

function highlightCellTypesOnUMAP(selectedCellTypes) {
    if (!Array.isArray(selectedCellTypes) || selectedCellTypes.length === 0) {
        reGenerateUMAP(window.clusterInfo, []); // fallback to default view
        return;
    }

    const umapPlotDiv = document.getElementById('umap-plot');
    umapPlotDiv.innerHTML = '<p>Rendering UMAP by cell type...</p>';

    const topCellTypes = window.spotClusterMembership.map((spot) => {
        const keys = Object.keys(spot).filter(k =>
            k.toLowerCase() !== "barcode" &&
            !k.toLowerCase().startsWith("cluster-")
        );
        const sorted = keys
            .map(k => ({ key: k, val: parseFloat(spot[k]) }))
            .sort((a, b) => b.val - a.val);
        return sorted[0]?.key || null;
    });

    // Color mapping: give each selected cell type a unique color
    const colorPalette = getColorScaleArray("allScale"); // or Viridis, Plasma...
    const typeToColor = {};
    selectedCellTypes.forEach((cellType, idx) => {
        typeToColor[cellType] = colorPalette[idx % colorPalette.length];
    });

    const pointColors = topCellTypes.map((cellType) =>
        selectedCellTypes.includes(cellType)
            ? typeToColor[cellType]
            : "lightgray"
    );

    const trace = {
        x: currentEmbedding.map(p => p[0]),
        y: currentEmbedding.map(p => p[1]),
        mode: "markers",
        marker: {
            size: 5,
            symbol: "x",
            color: pointColors
        },
        hoverinfo: "text",
        text: window.top3CellTypeTexts
    };

    umapPlotDiv.innerHTML = '';
    Plotly.newPlot("umap-plot", [trace], getUMAPLayout(), config);

    umapPlotDiv.on('plotly_hover', function (data) {
        if (data?.points?.length) {
            window.highlightedSpotIndex = data.points[0].pointIndex + 1;
        }
    });

    umapPlotDiv.on('plotly_unhover', function () {
        window.highlightedSpotIndex = -1;
    });
}


function highlightUMAPRow(allClusters, indexToHighlight) {
    indexToHighlight = indexToHighlight -1 ;
    if (!currentEmbedding || !allClusters) {
        console.error("UMAP data not found!");
        return;
    }

    const x = currentEmbedding.map((pt) => pt[0]);
    const y = currentEmbedding.map((pt) => pt[1]);

    const umapPlotDiv = document.getElementById('umap-plot');
    umapPlotDiv.innerHTML = '<p>Updating UMAP...</p>';

    let colorArray;

    if (window.mode === 'genes') {
        // Use already computed gene matrix and selected genes
        const selectedGenes = window.sketchOptions.selectedGenes || [];
        const geneMatrix = window.geneExpressionMatrix || [];
        const colorMap = getColorScaleArray(window.selectedGeneColorScale || 'Viridis');
        const allGeneNames = Object.keys(geneMatrix[0]);
        const selectedGeneIndices = selectedGenes.map(g => allGeneNames.indexOf(g)).filter(i => i !== -1);

        const avgExpressions = geneMatrix.map(row => {
            const vals = selectedGeneIndices.map(i => parseFloat(row[allGeneNames[i]]) || 0);
            return vals.reduce((sum, v) => sum + v, 0) / vals.length;
        });

        const maxScale = colorMap.length - 1;
        colorArray = avgExpressions.map(val => {
            const colorIndex = Math.min(Math.floor(val), maxScale);
            const baseColor = colorMap[colorIndex];
            return adjustColorIntensity(baseColor, window.geneColorIntensity || 1);
        });
    } else {
        // Use cluster coloring if enabled
        colorArray = (window.selectedClusterFeature === 'Cluster-UMAP')
            ? allClusters
            : Array(allClusters.length).fill('grey');
    }

    // Original trace with all points (including the one to highlight)
    const allPointsTrace = {
        x,
        y,
        mode: 'markers',
        marker: {
            size: 5,
            color: colorArray,
            symbol: 'x',
            colorscale: (window.mode !== 'genes' && window.selectedClusterFeature === 'Cluster-UMAP') ? 'Viridis' : undefined,
            colorbar: undefined,
        },
        text: window.top3CellTypeTexts,
        hoverinfo: 'text',
    };

    console.log("Highlight index:", indexToHighlight);
    console.log("Highlight text:", window.top3CellTypeTexts[indexToHighlight]);

    // Overlay a larger point on top to highlight
    const highlightedPointTrace = {
        x: [x[indexToHighlight]],
        y: [y[indexToHighlight]],
        mode: 'markers',
        marker: {
            size: 14,
            color: 'black',
            line: {
                width: 2,
                color: 'white'
            }
        },
        text: [window.top3CellTypeTexts[indexToHighlight]],
        hoverinfo: 'text',
    };

    umapPlotDiv.innerHTML = '';
    const newTraces = [allPointsTrace];
    Plotly.newPlot('umap-plot', [allPointsTrace, highlightedPointTrace], getUMAPLayout(), config);
    umapPlotDiv.on('plotly_hover', function(data) {
        let middleIndex = data?.points?.[0]?.pointIndex ?? -1;
        window.highlightedSpotIndex = middleIndex + 1;
        Plotly.react('umap-plot', newTraces, getUMAPLayout());
    });

    umapPlotDiv.on('plotly_unhover', function() {
        window.highlightedSpotIndex = -1;
        Plotly.relayout('umap-plot', { annotations: [] });
    });
}

function showImageChanged(e) {
    // console.log(e.target.checked)
    window.showImage = e.target.checked;
    document.getElementById("imageOpacityContainer").style.display = window.showImage ? "block" : "none";
    
    if(document.getElementById("showComposition").checked == false && document.getElementById("showGenes").checked == false){
        if (e.target.checked) {
            document.getElementById("imageOpacityContainer").style.display = "none";
            document.getElementById("expressionThresholdBtn").classList.add("disabled");
            document.getElementById("customClusterDropdownBtn").classList.add("disabled");
            document.getElementById("customCellTypeDropdownBtn").classList.add("disabled");
            document.getElementById("colorScaleDropdownBtn").classList.add("disabled");
            document.getElementById("clusterFeatureDropdown").classList.add("disabled");
            document.getElementById("infoBox").innerHTML = '';
            document.getElementById("composition-specific").classList.add("hidden")
        } else {
            if (window.mode == 'genes'){
                document.getElementById("showGenes").checked = true;
                document.getElementById("gene-specific").classList.remove("hidden");
            } else {
                document.getElementById("showComposition").checked = true;
                document.getElementById("composition-specific").classList.remove("hidden");
            }
            document.getElementById("expressionThresholdBtn").classList.remove("disabled");
            document.getElementById("customClusterDropdownBtn").classList.remove("disabled");
            document.getElementById("clusterFeatureDropdown").classList.remove("disabled");
            document.getElementById("customCellTypeDropdownBtn").classList.remove("disabled");
        }
    }
}

function showAllLevelsChanged(e) {
    // console.log(e.target.checked)
    window.showAllLevels = e.target.checked;
    window.showEmojiView = !e.target.checked;
    window.showCellEmojiView = !e.target.checked;
    if(e.target.checked) {
        document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
            radio.checked = false;
        });
        window.showCluster = false;
        document.getElementById('showCluster').checked = false;
        if (window.mode == 'genes') {
            document.getElementById("infoBox").innerHTML = '';
            document.getElementById("gene-specific").classList.add("hidden");
            document.getElementById("composition-specific").classList.remove("hidden");
            document.getElementById("colorScaleDropdownBtn").classList.remove("disabled");
            document.getElementById("showComposition").checked = true;
            document.getElementById("showGenes").checked = false;
            document.getElementById("showEmojiView").checked = false;
            modeChange("cellComposition");
        }
    }
}

function showCellEmojiViewChanged(e) {
    // console.log(e.target.checked)
    window.showCellEmojiView = e.target.checked;
    window.showAllLevels = !e.target.checked;
    window.showEmojiView = !e.target.checked;
    if(e.target.checked) {
        document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
            radio.checked = false;
        });
        window.showCluster = false;
        document.getElementById('showCluster').checked = false;
        if (window.mode == 'genes') {
            document.getElementById("infoBox").innerHTML = '';
            document.getElementById("gene-specific").classList.add("hidden");
            document.getElementById("composition-specific").classList.remove("hidden");
            document.getElementById("colorScaleDropdownBtn").classList.remove("disabled");
            document.getElementById("showComposition").checked = true;
            document.getElementById("showGenes").checked = false;
            document.getElementById("showEmojiView").checked = false;
            modeChange("cellComposition");
        }
    }
}

function showEmojiViewChanged(e) {
    // console.log(e.target.checked)
    window.showEmojiView = e.target.checked;
    window.showAllLevels = !e.target.checked;
    window.showCellEmojiView = !e.target.checked;
    if(e.target.checked) {
        document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
            radio.checked = false;
        });
        window.showCluster = false;
        document.getElementById('showCluster').checked = false;
        window.selectedClusterInLegend = null;
        document.getElementById("gene-specific").classList.remove("hidden");
        document.getElementById("composition-specific").classList.add("hidden");
        document.getElementById("showComposition").checked = false;
        document.getElementById("showGenes").checked = true;
        document.getElementById("showAllLevels").checked = false;
        document.getElementById("showCellEmojiView").checked = false;
        document.getElementById("colorScaleDropdownBtn").classList.add("disabled");
        modeChange("genes");
    }
}

function showClusterLevelsChanged(e) {
    if (!hasClusters) {
        alert("No Cluster column exists in the dataset")
        return;
    }
    // console.log(e.target.checked)
    const showAllLevelsCheckbox = document.getElementById("showAllLevels")
    const showCellEmojiViewCheckbox = document.getElementById("showCellEmojiView")
    const showEmojiViewCheckbox = document.getElementById("showEmojiView")
    if (e.target.checked) {
        window.showAllLevels = false;
        window.showEmojiView = false;
        window.showCellEmojiView = false;
        showAllLevelsCheckbox.checked = false;
        showCellEmojiViewCheckbox.checked = false;
        showEmojiViewCheckbox.checked = false;
        const radios = document.querySelectorAll("input[name='clusterType']");
        // Check if any radio is currently selected
        const anySelected = Array.from(radios).some(radio => radio.checked);
        // If none selected, select the first one
        if (!anySelected && radios.length > 0) {
            radios[0].checked = true;
        }
        const selectedClusterView = document.querySelector("input[name='clusterType']:checked").value;
        window.selectedClusterView = selectedClusterView;
        if(document.getElementById("showComposition").checked == false && document.getElementById("showGenes").checked == false){
            document.getElementById("showGenes").checked = true;
            document.getElementById("imageOpacityContainer").style.display = "block";
            document.getElementById("gene-specific").classList.remove("hidden");
            document.getElementById("expressionThresholdBtn").classList.remove("disabled");
            document.getElementById("customClusterDropdownBtn").classList.remove("disabled");
            document.getElementById("clusterFeatureDropdown").classList.remove("disabled");
            document.getElementById("customCellTypeDropdownBtn").classList.remove("disabled");
        }
    } else {
        // Disabling cluster view selection when checkbox is unchecked
        document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
            radio.checked = false;
        });
        if (window.whichDemo !== 'demo2' && window.whichDemo !== 'demo3' && window.whichDemo !== 'demo4' && window.whichDemo !== 'demo5' && window.whichDemo !== 'demo6' && window.whichDemo !== 'demo7' && window.whichDemo !== 'demo8' && window.whichDemo !== 'demo9'){
            showEmojiViewCheckbox.disabled = true;
            showCellEmojiViewCheckbox.disabled = true;
        }
        if (document.getElementById("plottingTab").classList.contains("active") && window.uploadedEmojiFile == false){
            window.showEmojiView = false;
            showEmojiViewCheckbox.disabled = true;
            window.showCellEmojiView = false;
            showCellEmojiViewCheckbox.disabled = true;
        } else if (document.getElementById("plottingTab").classList.contains("active") && window.uploadedEmojiFile == true){
            if (document.getElementById("showGenes").checked) {
                showEmojiViewCheckbox.disabled = true;
            } else {
                showEmojiViewCheckbox.disabled = false;
            }
        }
    }
    window.showCluster = e.target.checked;

}

function clusterViewSelectionChanged() {
    const selectedClusterView = document.querySelector("input[name='clusterType']:checked").value;
    // Storing the selected cluster view type globally
    window.selectedClusterView = selectedClusterView;
    window.showCluster = true;
    window.showEmojiView = false;
    window.showAllLevels = false;
    window.showCellEmojiView = false;
    document.getElementById('showCluster').checked = true;
    document.getElementById('showEmojiView').checked = false;
    document.getElementById('showCellEmojiView').checked = false;
    document.getElementById('showAllLevels').checked = false;
}

function normalizeName(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .trim();
}

function validateSVGFiles() {
    const missing = [];
    const filesToParse = [];
    expectedCellTypes.forEach(cellType => {
        const normalizedCellType = normalizeName(cellType);
        
        // Match against normalized file names
        const matchKey = Object.keys(uploadedSVGFiles).find(fileKey =>
            normalizeName(fileKey) === normalizedCellType
        );
    
        if (!matchKey) {
            missing.push(cellType);
        } else {
            filesToParse.push({ cellType, file: uploadedSVGFiles[matchKey] });
        }
    });

    if (missing.length > 0) {
        alert("Missing SVG files for: " + missing.join(", "));
        console.warn("Missing SVG files:", missing);
        // Reset file input
        const input = document.getElementById("input-2");
        if (input) input.value = "";

        // Clear stored files too
        uploadedSVGFiles = {};
        return; // stop here
    }
    filesToParse.forEach(({ cellType, file }) => {
        parseSVGFile(file, cellType);
    });
}

function parseSVGFile(file, cellType) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const svgText = e.target.result;
        const convertedSVGString = convertSVGShapesToPaths(svgText);
        const parser = new DOMParser();
        const doc = parser.parseFromString(convertedSVGString, "image/svg+xml");
        const svgElement = doc.querySelector("svg");

        if (!svgElement) return;

        svgElement.style.position = "absolute";
        svgElement.style.visibility = "hidden";
        svgElement.style.pointerEvents = "none";
        document.body.appendChild(svgElement);

        const viewBox = svgElement.getAttribute("viewBox") || "0 0 100 100";
        const [, , w, h] = viewBox.split(" ").map(parseFloat);
        const viewBoxSize = Math.max(w || 100, h || 100);

        const elements = Array.from(svgElement.querySelectorAll("path, text"));
        const vectorPaths = elements.map(el => {
            const tag = el.tagName.toLowerCase();
            const computed = window.getComputedStyle(el);

            if (tag === "path") {
                return {
                    type: "path",
                    d: el.getAttribute("d"),
                    stroke: el.getAttribute("stroke") || "black",
                    fill: el.getAttribute("fill") || computed.fill || "none",
                    strokeWidth: el.getAttribute("stroke-width") || computed.strokeWidth || "1",
                    linecap: el.getAttribute("stroke-linecap") || computed.strokeLinecap || "butt",
                };
            } else if (tag === "text") {
                return {
                    type: "text",
                    text: el.textContent,
                    x: parseFloat(el.getAttribute("x")) || 0,
                    y: parseFloat(el.getAttribute("y")) || 0,
                    fontSize: parseFloat(computed.fontSize) || 16,
                    fontFamily: computed.fontFamily || "sans-serif",
                    fill: el.getAttribute("fill") || "black",
                };
            }
            return null;
        }).filter(Boolean);

        svgElement.remove();

        window.cellTypeVectors[cellType] = {
            viewBoxSize,
            shapes: vectorPaths
        };
    };
    window.uploadedEmojiFile = true;
    reader.readAsText(file);
}

function getCellTypesFromCSV(valuesRows) {
    if (!Array.isArray(valuesRows) || valuesRows.length === 0) {
        console.warn("CSV data is empty or invalid");
        return [];
    }

    const headerRow = valuesRows[0];

    // Exclude 'barcode' and any columns starting with 'Cluster-'
    return headerRow.filter(col => {
        const lower = col.toLowerCase();
        return lower !== "barcode" && !lower.startsWith("cluster-");
    });
}

function positinosUploaded(e) {
    // console.log(e)
    const file = e.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const text = e.target.result;
            const rows = text.split('\n');
            positionsData = rows.map(row => row.split(','));

            // console.log(positionsData);
        };

        reader.readAsText(file);
        checkRequiredUploads();
        handleGeneFileUI();
    }
}

function valuesUploaded(e) {
    // console.log(e)
    const file = e.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const text = e.target.result;
            // Parse using PapaParse like the fetch version
            const parsed = Papa.parse(text.trim(), {
                header: false,
                skipEmptyLines: true,
            });

            const valuesRows = parsed.data;
            populateClusterFeatureDropdown(valuesRows);
            window.numberOfClusters = uniqueClusterCount(valuesRows);
            generateClusterLegend(window.numberOfClusters);
            valuesData = valuesRows;
            // console.log(valuesData);
        };

        reader.readAsText(file);
        window.uploadedEmojiFile = false;
        checkRequiredUploads();
        handleGeneFileUI();
    }
}

function genesUploaded(e) {
    // console.log(e)
    const file = e.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const text = e.target.result;
            const rows = text.split('\n');
            genesData = scaleData(rows.map(row => row.trim().split(',')));
            // console.log(genesData);
        };

        reader.readAsText(file);
        handleGeneFileUI();
    }
}

function umapUploaded(e) {
    // console.log(e)
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const text = e.target.result;
            const rows = text.split('\n');
            umapData = scaleData(rows.map(row => row.trim().split(',')));
            // console.log(umapData);
        };
        reader.readAsText(file);
        handleUMAPUI();
    }
}

function checkRequiredUploads() {
  const isFolderMode = document.getElementById("uploadFolderOption").checked;
  const plotButton = document.getElementById("plotbutton");

  if (isFolderMode) {
    const currentFiles = exampleFileMap?.[currentExampleId] || [];
    const lowercasedNames = currentFiles.map(f => f.name.toLowerCase());
    const hasPositions = lowercasedNames.includes("spotpositions.csv");
    const hasValues = lowercasedNames.includes("spotclustermembership.csv");

    if (!(hasPositions && hasValues)) {
      plotButton.disabled = true;
      alert(`Example "${currentExampleId}" is missing required files (spotpositions.csv and/or spotclustermembership.csv).`);
      return;
    }

    plotButton.disabled = false;
  } else {
    // Individual file mode
    const positionsUploaded = document.getElementById("positions").files.length > 0;
    const valuesUploaded = document.getElementById("values").files.length > 0;

    plotButton.disabled = !(positionsUploaded && valuesUploaded);
  }
}

function handleGeneFileUI(isFileMode = false) {
    let geneFileUploaded = '';
    let valueDataUploaded = '';
    if (isFileMode){
        geneFileUploaded = Array.isArray(genesData) && genesData.length > 0;
        valueDataUploaded = Array.isArray(valuesData) && valuesData.length > 0
    } else {
        geneFileUploaded = document.getElementById("genesUpload").files.length > 0;
        valueDataUploaded = document.getElementById("values").files.length > 0
    }
    const showGenesCheckbox = document.getElementById("showGenes");
    const showGenesLabel = document.querySelector("label[for='showGenes']");

    showGenesCheckbox.disabled = !geneFileUploaded;
    showGenesCheckbox.style.display = geneFileUploaded ? "inline-block" : "none";

    if (showGenesLabel) {
        showGenesLabel.style.display = geneFileUploaded ? "inline-block" : "none";
        document.getElementById("expressionThresholdWrapper").style.display = geneFileUploaded ? "inline-block" : "none";
    }

    if (geneFileUploaded) {
        if (showGenesCheckbox.checked) {
            document.getElementById("gene-specific").classList.remove("hidden");
            document.getElementById("composition-specific").classList.add("hidden");
        }
    } else {
        // If no gene file is uploaded, hide gene-specific and show composition
        document.getElementById("gene-specific").classList.add("hidden");
        document.getElementById("composition-specific").classList.remove("hidden");
    }
    if(geneFileUploaded && valueDataUploaded && !isFileMode){
        expectedCellTypes = getCellTypesFromCSV(valuesData);
        // console.log("Expected Cell Types:", expectedCellTypes);
        if (expectedCellTypes.length !== 0){
            document.getElementById("input-2").disabled = false;
        }
    }
    handleUMAPUI(isFileMode);
}

function setDefaultGeneModeIfNeeded() {
  const isFolderMode = document.getElementById("uploadFolderOption").checked;

  // Determine if gene file is uploaded
//   const geneFileUploaded = isFolderMode
//     ? Array.isArray(genesData) && genesData.length > 0
//     : document.getElementById("genesUpload")?.files?.length > 0;

  // Determine if image is uploaded
  const imageFileUploaded = isFolderMode
    ? typeof img !== "undefined" && img instanceof HTMLImageElement
    : document.getElementById("image")?.files?.length > 0;

  // Set composition mode by default
  window.mode = "cellComposition";
  dataColors = colorScales[0].colors;

  const showClusterCheckbox = document.getElementById('showCluster');
  if (!showClusterCheckbox.checked && window.showCluster === false) {
    showClusterCheckbox.checked = true;
    window.showCluster = true;

    // Reset conflicting views
    if (document.getElementById('showAllLevels').checked) {
      document.getElementById('showAllLevels').checked = false;
      window.showAllLevels = false;
    }

    if (document.getElementById('showEmojiView').checked) {
      document.getElementById('showEmojiView').checked = false;
      window.showEmojiView = false;
    }

    if (document.getElementById('showCellEmojiView').checked){
      document.getElementById('showCellEmojiView').checked = false;
      window.showCellEmojiView = false;
    }

    // Enable and initialize cluster type radios
    document.querySelectorAll("input[name='clusterType']").forEach(radio => {
      radio.disabled = false;
    });

    const radios = document.querySelectorAll("input[name='clusterType']");
    const anySelected = Array.from(radios).some(radio => radio.checked);
    if (!anySelected && radios.length > 0) {
      radios[0].checked = true;
    }

    const selectedClusterView = document.querySelector("input[name='clusterType']:checked")?.value;
    window.selectedClusterView = selectedClusterView;
  }

  // Set default checkboxes
  document.getElementById('showComposition').checked = true;
  document.getElementById("colorScaleDropdownBtn").classList.remove("disabled");
//   document.getElementById("expressionThresholdWrapper").classList.add("disabled");
  document.getElementById('showGenes').checked = false;

  // Update image UI only if image not available
  if (!imageFileUploaded) {
    handleImageUploadUI();
  }

  // Hide emoji UI if not uploaded
  if (window.uploadedEmojiFile === false) {
    window.showEmojiView = false;
    document.getElementById('showEmojiView').checked = false;
    document.getElementById('showEmojiView').style.display = 'none';
    window.showCellEmojiView = false;
    document.getElementById('showCellEmojiView').checked = false;
    document.getElementById('showCellEmojiView').disabled = true;
    const emojiLabel = document.querySelector("label[for='showEmojiView']");
    if (emojiLabel) emojiLabel.style.display = 'none';
  } else {
    document.getElementById('showEmojiView').style.display = 'block';
    document.getElementById('showCellEmojiView').disabled = false;
    const emojiLabel = document.querySelector("label[for='showEmojiView']");
    if (emojiLabel) emojiLabel.style.display = 'block';
  }
}


function handleUMAPUI(isFileMode = false) {
    let umapUploaded  = '';
    if (isFileMode){
        umapUploaded = Array.isArray(umapData) && umapData.length > 0;
    } else {
        umapUploaded = document.getElementById("umapUpload").files.length > 0;
    }
    const umapTab = document.getElementById("umapTab");

    if (umapUploaded) {
        umapTab.classList.remove("d-none");
        document.getElementById("canvasContainer").style.pointerEvents = "auto";
    } else {
        umapTab.classList.add("d-none");
    }
}

// window.handleImageUploadUI = function() {
//     // const container = document.getElementById('imageOpacityContainer');
//     const imageUploaded = document.getElementById("image").files.length > 0;
//     const showImageContainer = document.getElementById("showImageContainer");
//     const showImageCheckbox = document.getElementById("showImage");
//     const showImageLabel = document.querySelector("label[for='showImage']");
//     document.getElementById("imageOpacityContainer").style.display = "none";
//     if (imageUploaded) {
//         showImageContainer.style.display = "flex";
//         showImageCheckbox.disabled = false;
//         showImageCheckbox.style.display = "inline-block";
//         if (showImageLabel) showImageLabel.style.display = "inline-block";
//         // if (container) {
//         //     container.style.display = 'block';
//         // }
//     } else {
//         showImageCheckbox.checked = false;
//         showImageCheckbox.disabled = true;
//         showImageCheckbox.style.display = "none";
//         if (showImageLabel) showImageLabel.style.display = "none";
//         showImageContainer.style.display = "none";
//         window.showImage = false;
//         // if (container) {
//         //     container.style.display = 'none';
//         // }
//     }
// }
window.handleImageUploadUI = function () {
  const showImageContainer = document.getElementById("showImageContainer");
  const showImageCheckbox = document.getElementById("showImage");
  const showImageLabel = document.querySelector("label[for='showImage']");
  const imageOpacityContainer = document.getElementById("imageOpacityContainer");

  // Folder mode check
  const isFolderMode = document.getElementById("uploadFolderOption").checked;

  let imageAvailable = false;

  if (isFolderMode) {
    // Support both HTMLImageElement and p5.Image (used in p5.js)
    imageAvailable = (
      typeof img !== "undefined" &&
      img !== null &&
      (
        img instanceof HTMLImageElement ||
        (typeof img === "object" && "canvas" in img && "width" in img && "height" in img)
      )
    );
  } else {
    const imageInput = document.getElementById("image");
    imageAvailable = imageInput && imageInput.files.length > 0;
  }

  if (imageAvailable) {
    showImageContainer.style.display = "flex";
    showImageCheckbox.disabled = false;
    showImageCheckbox.style.display = "inline-block";
    // if (showImageLabel) showImageLabel.style.display = "inline-block";
    // if (imageOpacityContainer) imageOpacityContainer.style.display = "block";
  } else {
    showImageCheckbox.checked = false;
    showImageCheckbox.disabled = true;
    showImageCheckbox.style.display = "none";
    if (showImageLabel) showImageLabel.style.display = "none";
    showImageContainer.style.display = "none";
    if (imageOpacityContainer) imageOpacityContainer.style.display = "none";
    window.showImage = false;
  }
};


function getFreshColorArray(scaleName) {
    const scale = colorScales.find(scale => scale.value === scaleName);
    return [...scale.colors]; // shallow copy
}

function getColorScaleArray(scaleName) {
    if (scaleName === 'Viridis') {
      return [
        "#238A8D", "#1F968B", "#20A387", "#29AF7F", "#3CBB75",
        "#55C667", "#73D055", "#95D840", "#B8DE29", "#DCE319", "#FDE725"
      ];
    } else if (scaleName === 'Plasma') {
      return [
        "#5c01a6", "#7b02a8", "#9a179b", "#b83289", "#d24e72",
        "#e86c5c", "#f58c46", "#faa638", "#fdc328", "#f0f921"
      ];
    } else if (scaleName === 'Turbo') {
      return [
        "#3e1e3c", "#602c6d", "#864b9f", "#a86fcf", "#c994e5",
        "#e6bbf1", "#f7d1da", "#f9e3b5", "#f7f19a", "#fcfdbf"
      ];
    } else if (scaleName === 'allScale') {
        return [
        "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF",
        "#FF00FF", "#000000", "#808080", "#800080", "#1E2136"
      ];
    } else {
      return heatMapColors; // fallback
    }
  }

function adjustColorIntensity(hexColor, intensity) {
    if (!hexColor || typeof hexColor !== 'string') return hexColor;
  
    let r = parseInt(hexColor.substr(1,2), 16);
    let g = parseInt(hexColor.substr(3,2), 16);
    let b = parseInt(hexColor.substr(5,2), 16);
  
    r = Math.min(255, Math.max(0, Math.round(r * intensity)));
    g = Math.min(255, Math.max(0, Math.round(g * intensity)));
    b = Math.min(255, Math.max(0, Math.round(b * intensity)));
  
    const toHex = (c) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function updateSpotColorsIntensity() {
    if (!dataSpots) return;

    dataSpots.forEach(spot => {
        spot.values.forEach(v => {
            if (v.baseColor) {
                v.color = adjustColorIntensity(v.baseColor, window.geneColorIntensity);
            }
        });
    });
}


function populateGeneDropdown(dataHeaders) {
    const listContainer = document.getElementById('geneOptionsList');
    listContainer.innerHTML = ''; // clear previous

    const selectAll = document.getElementById('selectAllGenes');
    const previouslySelected = new Set(window.sketchOptions.selectedGenes || []);
    const hasPrevious = previouslySelected.size > 0;

    // Keep only the genes that exist in the new dataset
    const validGenes = dataHeaders.filter(gene => previouslySelected.has(gene));

    // Only select all if there's no valid prior selection or nothing was selected before
    const shouldSelectAll = !hasPrevious || validGenes.length === 0;

    const actuallySelected = shouldSelectAll ? [...dataHeaders] : [...validGenes];

    // Sort for consistent UI
    dataHeaders.sort().forEach((header, index) => {
        const geneId = `geneOption${index}`;
        const isChecked = actuallySelected.includes(header);

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="form-check mx-3">
                <input class="form-check-input gene-checkbox" type="checkbox" value="${header}" id="${geneId}" ${isChecked ? "checked" : ""}>
                <label class="form-check-label" for="${geneId}">${header}</label>
            </div>
        `;
        listContainer.appendChild(li);
    });

    selectAll.checked = actuallySelected.length === dataHeaders.length;

    window.sketchOptions.selectedGenes = actuallySelected;
}

window.generateVis = function () {
    dataSpots = []
    if (!positionsData || positionsData.length == 0) {
        alert("Position Data missing")
        return;
    }

    if (mode == "cellComposition") {
        const selectedScaleName = selectedScaleValue;
        dataColors = getFreshColorArray(selectedScaleName);

        if (!valuesData || valuesData.length === 0) {
            alert("Membership Data missing");
            haltProcess();
            return;
        }

        // Extract cell type column indices
        const headers = valuesData[0];
        const cellTypeIndices = headers
            .map((col, idx) => ({ col, idx }))
            .filter(({ col }) =>
                col.toLowerCase() !== "barcode" &&
                !col.toLowerCase().startsWith("cluster-")
            );

        dataHeaders = cellTypeIndices.map(({ col }) => col);
        hasClusters = Boolean(window.selectedClusterFeature);

        // Make sure we have enough colors
        const extraColorsNeeded = cellTypeIndices.length - dataColors.length;
        if (extraColorsNeeded > 0) {
            const baseSeed = {
                "ColorScale1": 42,
                "ColorScale2": 43,
                "ColorScale3": 44,
                "ColorScale4": 45,
                "ColorScale5": 46,
                "ColorScale6": 47
            }[selectedScaleName] || 50;

            for (let i = 0; i < extraColorsNeeded; i++) {
                dataColors.push(generateRandomColor(baseSeed + i));
            }
        }

        const clusterIdx = headers.findIndex(h => h === window.selectedClusterFeature);

        for (let i = 1; i < positionsData.length - 1; i++) {
            const spotCoords = positionsData[i];

            const spotValues = cellTypeIndices.map(({ col, idx }, j) => ({
                label: col,
                value: valuesData[i][idx],
                color: dataColors[j]
            }));

            const newSpot = new Spot(i, spotCoords[0], spotCoords[1], spotCoords[2], spotCoords[3], spotValues);
            
            const clusterColumns = headers
                .map((col, idx) => ({ col, idx }))
                .filter(({ col }) => col.toLowerCase().startsWith("cluster-"));

            const clusterData = {};
            
            clusterColumns.forEach(({ col, idx }) => {
            const val = valuesData[i][idx];
            if (val !== undefined && val !== null && val !== "") {
                clusterData[col] = parseFloat(val) || 0;
            }
            });
            newSpot.allClusterData = clusterData;

            let geneList = [];
            let clusterInfo = [];

            if (genesData && genesData[i]) {
                const geneRow = genesData[i];
                geneList = genesData[0].map((geneName, j) => ({
                    gene: geneName,
                    value: parseFloat(geneRow[j]) || 0
                }))
                .filter(g => g.value > 0)
                .sort((a, b) => b.value - a.value);
            }

            if (clusterIdx !== -1) {
                const cluster = valuesData[i][clusterIdx];
                newSpot.cluster = cluster;
                clusterInfo.push(cluster);
            }

            if (newSpot.values[0]) {
                newSpot.values[0].geneList = geneList;
                newSpot.values[0].clusterInfo = clusterInfo;
            }

            dataSpots.push(newSpot);
        }
    }

    else if (mode === "genes") {
        if (!genesData || genesData.length === 0) {
            alert("Genes Data missing");
            haltProcess();
            return;
        }

        dataHeaders = genesData[0];
        hasClusters = true;

        // Populate gene selection
        populateGeneDropdown(dataHeaders);

        let selectedGeneIndices = window.sketchOptions.selectedGenes
        .map(gene => dataHeaders.indexOf(gene))
        .filter(idx => idx !== -1);

        let geneMedian = 0;

        if (window.expressionThresholdFilter !== 'all') {
            let allExpressionValues = genesData.slice(1).map(row => {
                return selectedGeneIndices.map(idx => parseFloat(row[idx]) || 0)
                    .reduce((sum, val) => sum + val, 0) / selectedGeneIndices.length;
            });

            const sorted = allExpressionValues.slice().sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            geneMedian = sorted.length % 2 !== 0
                ? sorted[mid]
                : (sorted[mid - 1] + sorted[mid]) / 2;
        }

        for (let i = 1; i < positionsData.length - 1; i++) {
            const spotCoords = positionsData[i];
            const colorMap = getColorScaleArray(window.selectedGeneColorScale);
            const geneRow = genesData[i];

            let expressionValues = selectedGeneIndices.map(idx => parseFloat(geneRow[idx]) || 0);
            let avgExpression = expressionValues.reduce((a, b) => a + b, 0) / expressionValues.length;

            let expressionPass = true;
            if (window.expressionThresholdFilter === 'high') {
                expressionPass = avgExpression > geneMedian;
            } else if (window.expressionThresholdFilter === 'low') {
                expressionPass = avgExpression <= geneMedian;
            }

            // if (!expressionPass) continue; // Skip spot

            const colorIndex = Math.min(Math.floor(avgExpression), colorMap.length - 1);
            const baseColor = colorMap[colorIndex];

            // Generate sorted gene list (descending by expression value)
            const geneList = window.sketchOptions.selectedGenes
                .map((gene, j) => ({
                    gene,
                    value: expressionValues[j]
                }))
            .filter(g => g.value > 0)
            .sort((a, b) => b.value - a.value);
            // Determine cluster info from valuesData (if available)
            let clusterInfo = [];
            if (valuesData && valuesData[i] && window.selectedClusterFeature) {
                const clusterIndex = valuesData[0].findIndex(h => h === window.selectedClusterFeature);
                if (clusterIndex !== -1) {
                    const cluster = valuesData[i][clusterIndex];
                    clusterInfo.push(cluster);
                }
            }

            const spotValues = [{
                label: 'AvgExpression',
                value: avgExpression,
                baseColor: baseColor,
                color: adjustColorIntensity(baseColor, window.geneColorIntensity),
                geneList: geneList,
                clusterInfo: clusterInfo
            }];

            const newSpot = new Spot(i, spotCoords[0], spotCoords[1], spotCoords[2], spotCoords[3], spotValues);
            
            const headers = valuesData[0];

            const clusterColumns = headers.map((col, idx) => ({ col, idx })).filter(({ col }) => col.toLowerCase().startsWith("cluster-"));

            const clusterData = {};
            clusterColumns.forEach(({ col, idx }) => {
            const val = valuesData[i][idx];
            if (val !== undefined && val !== null && val !== "") {
                clusterData[col] = parseFloat(val) || 0;
            }
            });
            newSpot.allClusterData = clusterData;

            // Optionally attach cell composition info
            if (valuesData[i]) {

                // Get indices of cell type columns (exclude barcode and cluster-* columns)
                const cellTypeIndices = headers
                    .map((col, idx) => ({ col, idx }))
                    .filter(({ col }) =>
                        col.toLowerCase() !== "barcode" &&
                        !col.toLowerCase().startsWith("cluster-")
                    );

                const cellTypeValues = cellTypeIndices.map(({ col, idx }, j) => ({
                    label: col,
                    value: valuesData[i][idx],
                    color: dataColors[j] || "#999999"
                }));

                newSpot.cellCompositionValues = cellTypeValues;

                // Assign cluster from selected cluster feature
                const clusterIdx = headers.findIndex(h => h === window.selectedClusterFeature);
                if (clusterIdx !== -1) {
                    newSpot.cluster = valuesData[i][clusterIdx];
                }
            }
            newSpot.avgExpression = avgExpression;
            newSpot.geneMedian = geneMedian;
            newSpot.visible = expressionPass;

            dataSpots.push(newSpot);
        }
    }
    window.drawAtWill = true;
    setupCanvas(Math.floor(window.innerWidth * 0.74), window.innerHeight, dataSpots);
};

window.recomputeGeneExpressionStats = function () {
    const selectedGeneIndices = window.sketchOptions.selectedGenes
        .map(gene => dataHeaders.indexOf(gene))
        .filter(idx => idx !== -1);

    if (selectedGeneIndices.length === 0) {
        console.warn("No selected genes found in headers.");
        return;
    }

    // Recompute avgExpression for each spot
    const allExpressionValues = dataSpots.map(spot => {
        const geneRow = genesData[spot.index];
        const expressionValues = selectedGeneIndices.map(idx => parseFloat(geneRow[idx]) || 0);
        const avg = expressionValues.reduce((a, b) => a + b, 0) / expressionValues.length;
        spot.avgExpression = avg;
        return avg;
    });

    // Recompute median
    const sorted = allExpressionValues.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

    dataSpots.forEach(spot => {
        spot.geneMedian = median;
    });
};


function updateSpotColorsFromSelectedGenes() {
  if (!dataSpots || !genesData || genesData.length === 0) return;

  const colorMap = getColorScaleArray(window.selectedGeneColorScale);
  const selectedGenes = window.sketchOptions.selectedGenes || [];

  if (selectedGenes.length === 0) return;

  const selectedGeneIndices = selectedGenes.map(gene => dataHeaders.indexOf(gene));

  for (let i = 0; i < dataSpots.length; i++) {
    const spot = dataSpots[i];
    const geneRow = genesData[i + 1];

    // Compute expression and average
    const expressionValues = selectedGeneIndices.map(idx => parseFloat(geneRow[idx]) || 0);
    const avgExpression = expressionValues.reduce((a, b) => a + b, 0) / expressionValues.length;

    const colorIndex = Math.min(Math.floor(avgExpression), colorMap.length - 1);
    const baseColor = colorMap[colorIndex];

    // Build geneList similar to generateVis
    let geneList = selectedGenes.map((gene, j) => ({
      gene,
      value: expressionValues[j]
    }));

    if (geneList.length > 1) {
      geneList = geneList.filter(g => g.value > 0);
    }

    geneList.sort((a, b) => b.value - a.value);

    // Preserve existing clusterInfo if available
    const clusterInfo = spot.cluster !== undefined ? [spot.cluster] : [];

    // Update spot values (overwrite)
    spot.values = [{
      label: 'AvgExpression',
      value: avgExpression,
      baseColor: baseColor,
      color: adjustColorIntensity(baseColor, window.geneColorIntensity),
      geneList: geneList,
      clusterInfo: clusterInfo
    }];
  }
  if (window.expressionThresholdFilter === 'high' || window.expressionThresholdFilter === 'low') {
    filterGeneExpression();
  }
}

function seededRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function generateRandomColor(seed) {
    let color;
    let currentSeed = seed;
    do {
        const minBrightness = 50;
        const r = Math.floor(seededRandom(currentSeed++) * (256 - minBrightness) + minBrightness);
        const g = Math.floor(seededRandom(currentSeed++) * (256 - minBrightness) + minBrightness);
        const b = Math.floor(seededRandom(currentSeed++) * (256 - minBrightness) + minBrightness);
        color = `#${((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1)}`;
    } while (
      color.toUpperCase() === "#FFFFFF" ||
      color.toLowerCase() === "#ffffff" ||
      color.toLowerCase() === "#fff"
    );
  
    return color;
}

function modeChange(mode) {
    if (window.mode === mode) {
        console.log("mode unchanged skipping generateVis");
        return;
    }
    window.mode = mode;
    generateVis();
}

function showCompositionChanged(e) {
    if (e.target.checked) {
        document.getElementById("colorScaleDropdownBtn").classList.remove("disabled");
        document.getElementById("infoBox").innerHTML = '';
        document.getElementById("composition-specific").classList.remove("hidden")
        document.getElementById("gene-specific").classList.add("hidden")
        document.getElementById("showGenes").checked = false
        document.getElementById("showEmojiView").checked = false;
        document.getElementById("expressionThresholdBtn").classList.add("disabled");
        document.getElementById("customClusterDropdownBtn").classList.remove("disabled");
        document.getElementById("clusterFeatureDropdown").classList.remove("disabled");
        document.getElementById("customCellTypeDropdownBtn").classList.remove("disabled");
        modeChange("cellComposition")
        if (window.showCluster) {
            document.getElementById("showAllLevels").checked = false;
        } else {
            document.getElementById("showAllLevels").checked = false;
            window.showAllLevels = false;
            if (window.whichDemo !== 'demo1'){
                document.getElementById("showEmojiView").disabled = false;
                document.querySelector("label[for='showEmojiView']").classList.remove("disabled");
                window.showEmojiView = false;
                document.getElementById("showCellEmojiView").disabled = false;
                document.querySelector("label[for='showCellEmojiView']").classList.remove("disabled");
                window.showCellEmojiView = false;
            } else {
                document.getElementById("showEmojiView").disabled = true;
                document.querySelector("label[for='showEmojiView']").classList.add("disabled"); 
                document.getElementById("showCellEmojiView").disabled = true;
                document.querySelector("label[for='showCellEmojiView']").classList.add("disabled");
            }

            if (document.getElementById("plottingTab").classList.contains("active") && window.uploadedEmojiFile == false){
                window.showEmojiView = false;
                document.getElementById("showEmojiView").disabled = true;
                document.querySelector("label[for='showEmojiView']").classList.add("disabled"); 
            }
        }
        if(window.showImage){
            document.getElementById("imageOpacityContainer").style.display = "block";
        }
    } else {
        document.getElementById("infoBox").innerHTML = '';
        document.getElementById("composition-specific").classList.add("hidden")
        document.getElementById("showAllLevels").checked = false;
        document.getElementById("showCellEmojiView").checked = false;
        document.getElementById("showCluster").checked = false;
        window.showCluster = false;
        window.showCellEmojiView = false;
        document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
            radio.checked = false;
        });
        document.getElementById("showImage").checked = true;
        document.getElementById("showImage").dispatchEvent(new Event("change"));
    }
}

function showGenesChanged(e) {
    if (e.target.checked) {
        window.selectedClusterInLegend = null;
        document.getElementById("gene-specific").classList.remove("hidden");
        document.getElementById("composition-specific").classList.add("hidden");
        document.getElementById("showAllLevels").checked = false;
        document.getElementById("showCellEmojiView").checked = false;
        document.getElementById("showComposition").checked = false;
        document.getElementById("colorScaleDropdownBtn").classList.add("disabled");
        document.getElementById("expressionThresholdBtn").classList.remove("disabled");
        document.getElementById("customClusterDropdownBtn").classList.remove("disabled");
        document.getElementById("clusterFeatureDropdown").classList.remove("disabled");
        document.getElementById("customCellTypeDropdownBtn").classList.remove("disabled");
        if(window.showImage){
            document.getElementById("imageOpacityContainer").style.display = "block";
        }
        modeChange("genes");
    } else {
        document.getElementById("gene-specific").classList.add("hidden");
        document.getElementById("expressionThresholdBtn").classList.add("disabled");
        document.getElementById("showEmojiView").checked = false;
        window.showEmojiView = false;
        window.showCluster = false;
        document.getElementById("showCluster").checked = false;
        document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
            radio.checked = false;
        });
        document.getElementById("showImage").checked = true;
        document.getElementById("showImage").dispatchEvent(new Event("change"));
    }
}

function generteCanvasClicked() {
  document.getElementById("loadingOverlay").style.display = "flex";
  const isFolderMode = document.getElementById("uploadFolderOption").checked;
  const dropdownContainer = document.getElementById("displayExampleDropdown");
  const fileSection = document.getElementById('fileInputSection');
  const plotButton = document.getElementById('plotbutton');
  const selectUploadMethod = document.getElementById('selectUploadMethod');
  const uploadNewFilesButton = document.getElementById('uploadNewFilesButton');
  const folderUploadSection = document.getElementById('folderUploadSection');
  plotButton.disabled = true;
  document.getElementById('input-2').disabled = true;
  document.getElementById('svg-file-list').textContent = "";

  const canvasContainerID = document.getElementById("canvasContainer");
  if (canvasContainerID) {
    canvasContainerID.style.pointerEvents = "auto";
  }

  if (isFolderMode) {
    const fileList = uploadedFolderFiles || [];
    if (!fileList.length) {
      alert("Please upload a folder before clicking generate.");
      return;
    }

    const grouped = groupFilesByExampleRoot(fileList);
    if (Object.keys(grouped).length === 0) {
      alert("No valid examples found inside 'ExampleData' folder.");
      return;
    }

    Object.entries(grouped).forEach(([exampleId, files]) => {
      exampleFileMap[exampleId] = files;
    });

    populateExampleDropdown(Object.keys(grouped));
    dropdownContainer.style.display = "block";
    fileSection.style.display = 'none';
    selectUploadMethod.style.display = 'none';
    plotButton.style.display = 'none';
    uploadNewFilesButton.style.display = 'block';
    folderUploadSection.style.display = 'none';

    const firstExample = Object.keys(grouped).sort()[0];
    if (firstExample) {
      loadAndVisualizeExample(firstExample)
        .then(() => {
          setDefaultGeneModeIfNeeded();
          generateVis();
          document.getElementById("optionsContainer").style.display = "block";

          window.showDemoButton = "none";
          document.getElementById("loadingOverlay").style.display = "none";
          if (Array.isArray(umapData) && umapData.length > 0) {
                setTimeout(() => {
                showUMAP().catch((error) => console.error("Error in showUMAP:", error));
                }, 0);
            }
        })
        .catch(err => {
          console.error("Error loading initial example:", err);
        });
    }
  } else {
    dropdownContainer.style.display = "none";

    const positionsUploaded = document.getElementById("positions").files.length > 0;
    const valuesUploaded = document.getElementById("values").files.length > 0;

    if (!(positionsUploaded && valuesUploaded)) {
      alert("Please upload both Positions and Cell Proportions files.");
      return;
    }

    if (expectedCellTypes.length > Object.keys(uploadedSVGFiles).length && Object.keys(uploadedSVGFiles).length !== 0) {
      const cellCount = expectedCellTypes.length - Object.keys(uploadedSVGFiles).length;
      alert(`Expected "${cellCount}" more cell type SVG file${cellCount > 1 ? 's' : ''}.`);
      return;
    }

    setDefaultGeneModeIfNeeded();
    fileSection.style.display = 'none';
    selectUploadMethod.style.display = 'none';
    plotButton.style.display = 'none';
    uploadNewFilesButton.style.display = 'block';
    folderUploadSection.style.display = 'none';

    generateVis();
    document.getElementById("optionsContainer").style.display = "block";
    window.showDemoButton = "none";
    document.getElementById("loadingOverlay").style.display = "none";
    const umapFile = document.getElementById("umapUpload");
    if (umapFile && umapFile.files.length) {
      setTimeout(() => {
        showUMAP().catch((error) => console.error("Error in showUMAP:", error));
      }, 0);
    }
  }

}

function uploadNewFileClicked() {
    document.getElementById('selectUploadMethod').style.display = 'block';
    document.getElementById('uploadIndividualOption').checked = true ;
    document.getElementById('plotbutton').style.display = 'block';
    document.getElementById('plotbutton').disabled = true;
    document.getElementById('fileInputSection').style.display = 'block';
    document.getElementById('uploadNewFilesButton').style.display = 'none';
    const fileInputs = document.querySelectorAll('#fileInputSection input[type="file"]');
    fileInputs.forEach(input => {
        input.value = '';
    });
    document.querySelectorAll('#folderUploadSection input[type="file"]').forEach(input => {
        input.value = '';
    });
}

function resetAll() {
    window.drawAtWill = false;
    positionsData = []
    valuesData = []
    genesData = []
    dataSpots = []
    dataHeaders = []
    clearCanvas();
    document.getElementById("positions").value = null
    document.getElementById("values").value = null
    document.getElementById("genesUpload").value = null
    document.getElementById("image").value = null
}

function haltProcess() {
    window.drawAtWill = false;
    clearCanvas()
}

function scaleData(matrix) {
    // Separate headers and values
    const headers = matrix[0];
    const dataRows = matrix.slice(1); // only values

    const numCols = headers.length;
    const numRows = dataRows.length;

    const scaledMatrix = [];

    for (let col = 0; col < numCols; col++) {
        const column = dataRows.map(row => Math.log(0.01 + parseFloat(row[col])));

        const minVal = Math.min(...column);
        const maxVal = Math.max(...column);

        const scaledColumn = column.map(value => {
            const scaled = (value - minVal) / (maxVal - minVal) * 10;
            return Math.round(scaled);
        });

        scaledColumn.forEach((val, rowIndex) => {
            if (!scaledMatrix[rowIndex]) scaledMatrix[rowIndex] = [];
            scaledMatrix[rowIndex][col] = val;
        });
    }

    // Reattach the headers
    scaledMatrix.unshift(headers);

    return scaledMatrix;
}
class Spot {
    constructor(index, barcode, x, y, radius, values, cluster) {
        this.barcode = barcode;
        this.index = index;
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.radius = parseFloat(radius);
        this.scaledX = parseFloat(x); // set at drawing, helpful for tooltips
        this.scaledY = parseFloat(y); // set at drawing, helpful for tooltips
        this.scaledRadius = parseFloat(radius); // set at drawing, helpful for tooltips
        this.values = values;
        this.cluster = cluster;
    }

    getSummary() {
        let summary = ``;
        if (mode == "cellComposition") {
            this.values.forEach((value, i) => {
                summary += `<span class="legendColor" style="background-color:${value.color}"></span> ${dataHeaders[i]}: ${Number(value.value).toFixed(2)} <br/>`
            })

        } else {
            this.values.forEach((value, i) => {
                summary += `<span class="legendColor" style="background-color:${value.color}"></span> ${dataHeaders[i]}: ${value.value} <br/>`
            })
        }

        if (document.getElementById("umapTab").classList.contains("active")) {
            // if (document.getElementById("clusterDropdownContainer").style.display === "block") {
            //     console.log("I am here ")
            highlightUMAPRow(window.clusterInfo, this.index)
            // }
        }
        return summary;
    }

    getClusterInfoSummary() {
        let clusterSummary = ``;

        if (!window.spotClusterMembership || !Array.isArray(window.spotClusterMembership)) return '';

        const spotInfo = window.spotClusterMembership.find(s => s.barcode === this.barcode);
        if (!spotInfo) return '';

        const clusterKeys = Object.keys(spotInfo).filter(k => k.toLowerCase().startsWith('cluster-'));

        clusterSummary = clusterKeys
            .map(key => `${key}: ${spotInfo[key]}`)
            .join('<br>');

        return clusterSummary ? `${clusterSummary}` : '';

    }
}

const shapeSVGs = {
    1: `<svg width="20" height="20"><polygon points="${getTrianglePoints(10, 10, 8)}" stroke="black" fill="none"/></svg>`,
    2: `<svg width="20" height="20">
            <line x1="2" y1="2" x2="16" y2="16" stroke="black"/>
            <line x1="2" y1="16" x2="16" y2="2" stroke="black"/>
        </svg>`,
    3: `<svg width="20" height="20"><circle cx="10" cy="10" r="8" stroke="black" fill="none"/></svg>`,
    4: `<svg width="20" height="20">${getStarSVG(10, 10, 8, "black")}</svg>`,
    5: `<svg width="20" height="20">${drawHexagonSVG(10, 10, 8, "black")}</svg>`,
    6: `<svg width="20" height="20"><rect x="3" y="3" width="14" height="14" stroke="black" fill="none"/></svg>`,
    7: `<svg width="20" height="20"><polygon points="${getDiamondPoints(10, 10, 8)}" stroke="black" fill="none"/></svg>`,
    8: `<svg width="20" height="20">
            <line x1="10" y1="2" x2="10" y2="18" stroke="black"/>
            <line x1="2" y1="10" x2="18" y2="10" stroke="black"/>
        </svg>`,
    9: `<svg width="20" height="20"><line x1="2" y1="10" x2="18" y2="10" stroke="black"/></svg>`,
    10: `<svg width="20" height="20"><line x1="2" y1="16" x2="16" y2="2" stroke="black"/></svg>`,
    11: `<svg width="20" height="20"><polygon points="${getPentagonPoints(10, 10, 8)}" stroke="black" fill="none"/></svg>`,
    12: `<svg width="20" height="20"><polygon points="${getArrowPoints(10, 10, 8)}" stroke="black" fill="none"/></svg>`,
    13: `<svg width="20" height="20"><polygon points="${getChevronPoints(10, 10, 8)}" stroke="black" fill="none"/></svg>`,
    14: `<svg width="20" height="20">${getHashSVG(10, 10, 8, "black")}</svg>`,
    15: `<svg width="20" height="20">${getCrescentPath(10, 10, 6, "black")}</svg>`,
    16: `<svg width="20" height="20"><ellipse cx="10" cy="10" rx="8" ry="5" stroke="black" fill="none"/></svg>`,
    17: `<svg width="20" height="20">${getPieSlicePath(10, 10, 5, "black")}</svg>`,
    18: `<svg width="20" height="20">${getInfinitySVG(10, 10, 6, "black")}</svg>`,
    19: `<svg width="20" height="20">${getBowtieSVG(10, 10, 8, "black")}</svg>`,
    20: `<svg width="20" height="20">
            <circle cx="10" cy="10" r="8" stroke="black" fill="none"/>
            <circle cx="10" cy="10" r="4" stroke="black" fill="none"/>
        </svg>`,
    21: `<svg width="20" height="20"><polygon points="${getTrapezoidPoints(10, 10, 8)}" stroke="black" fill="none"/></svg>`,
    22: `<svg width="20" height="20">${getSpiralSVG(10, 10, 8, "black")}</svg>`,
    23: `<svg width="20" height="20">${getZigzagSVG(10, 10, 8, "black")}</svg>`,
    24: `<svg width="20" height="20"><line x1="2" y1="2" x2="16" y2="16" stroke="black"/></svg>`,
    25: `<svg width="20" height="20">${getCrossSVG(10, 10, 6, "black")}</svg>`,
    26: `<svg width="20" height="20"><polygon points="${getRhombusPoints(10, 10, 6)}" stroke="black" fill="none"/></svg>`,
    27: `<svg width="20" height="20">
            <rect x="5" y="3" width="10" height="4" stroke="black" fill="none"/>
            <rect x="7" y="7" width="6" height="10" stroke="black" fill="none"/>
        </svg>`,
    28: `<svg width="20" height="20">
            <line x1="3" y1="7" x2="17" y2="7" stroke="black"/>
            <line x1="3" y1="13" x2="17" y2="13" stroke="black"/>
        </svg>`,
    29: `<svg width="20" height="20">${getLightningSVG(10, 10, 8, "black")}</svg>`,
    30: `<svg width="20" height="20" stroke-weight="2">${getStarburstSVG(10, 10, 8, "black")}</svg>`,
};

function computeClusterCellTypeMatrix() {
 const spots = dataSpots || [];
  const clusterCellMap = {};

  spots.forEach(spot => {
    const cluster = spot.cluster;
    if (!clusterCellMap[cluster]) clusterCellMap[cluster] = {};

    const values = spot.cellCompositionValues || spot.values || [];
    values.forEach(({ label, value }) => {
      if (!label) return;
      const val = parseFloat(value) || 0;
      clusterCellMap[cluster][label] = (clusterCellMap[cluster][label] || 0) + val;
    });
  });

  // Normalize per cluster
  for (const cluster in clusterCellMap) {
    const total = Object.values(clusterCellMap[cluster]).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const label in clusterCellMap[cluster]) {
        clusterCellMap[cluster][label] /= total;
      }
    }
  }

  return clusterCellMap;
}

function generateClusterLegend(clusters) {
    // console.log("Clusters received:", clusters);
    const legendContainer = document.getElementById("clusterLegendContainer");
    legendContainer.innerHTML = "";

    // Add Title
    const title = document.createElement("h6");
    title.innerText = "Cluster";
    title.style.marginBottom = "5px";
    title.style.marginLeft = "6px";
    title.style.fontSize = "1rem";
    legendContainer.appendChild(title);

    const maxShapeCluster = 30;

    // Sort clusters
    clusters.sort((a, b) => a - b);

    clusters.forEach(clusterNumber => {
        const clusterItem = document.createElement("div");
        clusterItem.classList.add("cluster-item");
        clusterItem.style.display = "inline-block";
        clusterItem.style.textAlign = "center";
        clusterItem.style.margin = "5px";

        const shapeElement = document.createElement("span");
        const numberElement = document.createElement("span");

        // If the cluster number exceeds 30, loop it back for the shape
        // const loopedShapeNumber = ((clusterNumber - 1) % maxShapeCluster) + 1;
        const loopedShapeNumber = (clusterNumber % maxShapeCluster) || maxShapeCluster;

        if (clusterNumber <= maxShapeCluster) {
            // Display the original shape for clusters 1-30
            if (clusterNumber === 0) {
                shapeElement.innerHTML = shapeSVGs[11]; // Use shape 11 for cluster 0
            } else {
                shapeElement.innerHTML = shapeSVGs[clusterNumber] || "?";
            }
        } else {
            // Display only the number (1-30) instead of a shape for clusters >30
            shapeElement.innerText = loopedShapeNumber;
            shapeElement.style.fontSize = "1rem";
            // shapeElement.style.fontWeight = "bold";
            shapeElement.style.display = "block";
        }

        // Display the actual cluster number below
        numberElement.innerText = clusterNumber;
        numberElement.style.display = "block";
        numberElement.style.fontSize = "0.8rem";
        numberElement.style.fontWeight = "bold";

        clusterItem.appendChild(shapeElement);
        clusterItem.appendChild(numberElement);
        legendContainer.appendChild(clusterItem);

        clusterItem.dataset.cluster = clusterNumber; // store cluster number
        clusterItem.style.cursor = 'pointer';

        clusterItem.addEventListener('click', (e) => {
            const selectedCluster = parseInt(e.currentTarget.dataset.cluster, 10);
            if(!document.getElementById("umapTab").classList.contains("active")){
                highlightClusterOnCanvas(selectedCluster);
            }
        });
    });

    const dropdownMenu = document.getElementById("customClusterDropdownMenu");
    dropdownMenu.innerHTML = "";

    // Deselect All
    const deselectAllItem = document.createElement("li");
    deselectAllItem.textContent = "Deselect All";
    deselectAllItem.classList.add("dropdown-item", "text-dark", "fw-bold", "px-3");
    deselectAllItem.style.cursor = "pointer";
    dropdownMenu.appendChild(deselectAllItem);

    // Cluster checkboxes
    [...new Set(clusters)].sort((a, b) => a - b).forEach(cluster => {
        const listItem = document.createElement("li");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("form-check-input", "cluster-checkbox");
        checkbox.value = cluster;
        checkbox.id = `clusterCheck${cluster}`;
        checkbox.style.marginRight = "6px";

        const label = document.createElement("label");
        label.classList.add("form-check-label");
        label.setAttribute("for", checkbox.id);
        label.textContent = cluster;

        const wrapper = document.createElement("div");
        wrapper.classList.add("form-check", "dropdown-item", "ms-3", "d-flex", "align-items-center");
        wrapper.style.cursor = 'pointer';
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        listItem.appendChild(wrapper);
        dropdownMenu.appendChild(listItem);

        // Handle change event
        checkbox.addEventListener("change", () => {
            const selectedClusters = Array.from(document.querySelectorAll(".cluster-checkbox:checked"))
                .map(cb => parseInt(cb.value, 10));
            
            document.querySelectorAll(".celltype-checkbox").forEach(cb => cb.checked = false);
            window.selectedCellTypesFromDropdown = null;
            // if(!document.getElementById("umapTab").classList.contains("active")){
            //     highlightClusterOnCanvas(selectedClusters);
            // }
            highlightClusterOnCanvas(selectedClusters);
            if (document.getElementById("umapTab").classList.contains("active")) {
                reGenerateUMAP(window.clusterInfo, selectedClusters);
            }
        });
    });

    //  Handle Deselect All
    // deselectAllItem.addEventListener("click", () => {
    //     document.querySelectorAll(".cluster-checkbox").forEach(cb => cb.checked = false);
    //     if(!document.getElementById("umapTab").classList.contains("active")){
    //          highlightClusterOnCanvas([]);   
    //     }
    // });
    deselectAllItem.addEventListener("click", () => {
        document.querySelectorAll(".cluster-checkbox").forEach(cb => cb.checked = false);
        const selectedClusters = []; // everything deselected
        highlightClusterOnCanvas([]);
        if (document.getElementById("umapTab").classList.contains("active")) {
            reGenerateUMAP(window.clusterInfo, selectedClusters);
        }
    });
}

function highlightClusterOnCanvas(input) {
  const isFromLegend = typeof input === 'number' || input === null;
  const isFromDropdown = Array.isArray(input);

  if (isFromLegend) {
    // Legend: toggle single cluster selection
    if (window.selectedClusterInLegend === input) {
      window.selectedClusterInLegend = null;
    } else {
      window.selectedClusterInLegend = input;
    }

    // Clear dropdown selection
    window.selectedClusterFromDropdown = [];
  }

  if (isFromDropdown) {
    // Dropdown: set selected clusters
    window.selectedClusterFromDropdown = input;

    // Clear legend selection
    window.selectedClusterInLegend = null;
  }

}

function generateCellTypeDropdown(cellTypes) {
    const dropdownMenu = document.getElementById("customCellTypeDropdownMenu");
    dropdownMenu.innerHTML = "";

    // Deselect All
    const deselectAllItem = document.createElement("li");
    deselectAllItem.textContent = "Deselect All";
    deselectAllItem.classList.add("dropdown-item", "text-dark", "fw-bold", "px-3");
    deselectAllItem.style.cursor = "pointer";
    dropdownMenu.appendChild(deselectAllItem);

    // Individual cell type checkboxes
    cellTypes.forEach((cellType, index) => {
        const listItem = document.createElement("li");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("form-check-input", "celltype-checkbox");
        checkbox.value = cellType;
        checkbox.id = `celltypeCheck${index}`;
        checkbox.style.marginRight = "6px";

        const label = document.createElement("label");
        label.classList.add("form-check-label");
        label.setAttribute("for", checkbox.id);
        label.textContent = cellType;

        const wrapper = document.createElement("div");
        wrapper.classList.add("form-check", "dropdown-item", "ms-3", "d-flex", "align-items-center");
        wrapper.style.cursor = 'pointer';
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        listItem.appendChild(wrapper);
        dropdownMenu.appendChild(listItem);

        // Optional: Add your own `onchange` logic here
        checkbox.addEventListener("change", () => {
            document.querySelectorAll(".cluster-checkbox").forEach(cb => cb.checked = false);
            window.selectedClusterFromDropdown = [];
            window.selectedClusterInLegend = null;
            // highlightClusterOnCanvas([]);
            const selectedTypes = Array.from(document.querySelectorAll(".celltype-checkbox:checked"))
                .map(cb => cb.value);
            window.selectedCellTypesFromDropdown = selectedTypes;
            if (document.getElementById("umapTab").classList.contains("active")) {
                highlightCellTypesOnUMAP(selectedTypes);
            }
            // highlightCellTypesOnCanvas(selected); // optional trigger
        });
    });

    // Handle Deselect All
    deselectAllItem.addEventListener("click", () => {
        document.querySelectorAll(".celltype-checkbox").forEach(cb => cb.checked = false);
        window.selectedCellTypesFromDropdown = null;
    });
}

updateColorScalePreview();