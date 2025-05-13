//© Heba Sailem, heba.sailem@kcl.ac.uk
document.getElementById("showImage").addEventListener("change", showImageChanged)
document.getElementById("showAllLevels").addEventListener("change", showAllLevelsChanged)
document.getElementById("showCellEmojiView").addEventListener("change", showCellEmojiViewChanged)
document.getElementById("showEmojiView").addEventListener("change", showEmojiViewChanged)
document.getElementById("showCluster").addEventListener("change", showClusterLevelsChanged)
// document.getElementById("selectGenes").addEventListener("change", geneSelected)
document.getElementById("showComposition").addEventListener("change", showCompositionChanged)
document.getElementById("showGenes").addEventListener("change", showGenesChanged)
document.getElementById("uploadNewFilesButton").addEventListener("click", uploadNewFileClicked)
document.getElementById("input-2").addEventListener("change", uploadCellTypeImages);
document.getElementById("demo1").addEventListener("click", () => showDemo('demo1'));
document.getElementById("demo2").addEventListener("click", () => showDemo('demo2'));
document.getElementById("demo3").addEventListener("click", () => showDemo('demo3'));
document.getElementById("demo4").addEventListener("click", () => showDemo('demo4'));
document.getElementById("demo5").addEventListener("click", () => showDemo('demo5'));
document.getElementById("plotbutton").addEventListener("click", generteCanvasClicked)
document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
    radio.addEventListener("change", clusterViewSelectionChanged);
});
// Listen for tab changes
document.querySelectorAll(".nav-link").forEach(tab => {
    tab.addEventListener("click", showOrHideOptions);
});

document.getElementById("closeSpotPopup").addEventListener("click", () => {
  document.getElementById("spotInfoPopup").style.display = "none";
});

document.getElementById('geneOptionsList').addEventListener('change', () => {
    const selectedGenes = Array.from(document.querySelectorAll('.gene-checkbox:checked')).map(cb => cb.value);
    window.sketchOptions.selectedGenes = selectedGenes;
    if (selectedGenes.length === 0) {
        alert("Please select at least one gene.");
        return;
    }
    if (window.mode === 'genes') {
        updateSpotColorsFromSelectedGenes();
    }
});

document.getElementById('selectAllGenes').addEventListener('change', function () {
    const checkboxes = document.querySelectorAll('.gene-checkbox');
    if (this.checked) {
        // Selecting all
        checkboxes.forEach(cb => cb.checked = true);
    } else {
        // Deselecting all, but keeping the first one checked
        checkboxes.forEach((cb, idx) => cb.checked = idx === 0);
    }

    // Updating selected genes globally
    const selectedGenes = Array.from(document.querySelectorAll('.gene-checkbox:checked')).map(cb => cb.value);
    window.sketchOptions.selectedGenes = selectedGenes;

    // Redrawing canvas based on new selection
    if (window.mode === 'genes') {
        updateSpotColorsFromSelectedGenes();
    }
});

document.getElementById('geneSearchInput').addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const geneItems = document.querySelectorAll('#geneOptionsList .form-check');

    geneItems.forEach(item => {
        const label = item.querySelector('label');
        const geneName = label.textContent.toLowerCase();
        item.style.display = geneName.includes(query) ? '' : 'none';
    });
});

const btn = document.getElementById("toggleImageOpacityBtn");
const icon = document.getElementById("toggleIcon");
const panel = document.getElementById("imageOpacityCont");

const collapse = new bootstrap.Collapse(panel, { toggle: false });

btn.addEventListener("click", () => {
panel.classList.contains("show") ? collapse.hide() : collapse.show();
});

panel.addEventListener("shown.bs.collapse", () => icon.textContent = "−");
panel.addEventListener("hidden.bs.collapse", () => icon.textContent = "+");

const opacitySlider = document.getElementById("imageOpacity");
const opacityValueDisplay = document.getElementById("opacityValue");
opacitySlider.addEventListener("input", () => {
    const value = parseInt(opacitySlider.value);
    opacityValueDisplay.textContent = `${value}`;
  });

document.addEventListener("DOMContentLoaded", function () {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  });

function registerFileUpload(inputId, uploadHandler) {
    document.getElementById(inputId).addEventListener("change", function (e) {
        uploadHandler(e);
        // checkFileUploads();
    });
}
registerFileUpload("positions", positinosUploaded);
registerFileUpload("values", valuesUploaded);
registerFileUpload("genesUpload", genesUploaded);
registerFileUpload("umapUpload", umapUploaded);

function toggleCheckboxVisibility(checkboxId, show) {
    const checkbox = document.getElementById(checkboxId);
    const label = document.querySelector(`label[for='${checkboxId}']`);
    checkbox.disabled = !show;
    checkbox.style.display = show ? "inline-block" : "none";
    if (label) label.style.display = show ? "inline-block" : "none";
}

function clearAllUploadInputs() {
    const fileInputs = document.querySelectorAll('#fileInputSection input[type="file"]');
    fileInputs.forEach(input => {
      input.value = ""; // reset file input
    });
  
    // Also clear uploaded SVG tracking if needed
    if (typeof uploadedSVGFiles !== "undefined") {
      uploadedSVGFiles = {};
    }
  
    // Clear display (e.g., uploaded file names)
    const svgList = document.getElementById("svg-file-list");
    if (svgList) svgList.textContent = "";
  }

window.selectedClusterInLegend = null;
window.selectedUMAPClusters = [];
window.currentUMAPWorker = null;
window.numberOfClusters = [];
window.clusterMap = [];
window.cellTypeVectors = {};
window.spotClusterMembership = 'none';
window.selectedGeneColorScale = 'Viridis';
window.geneColorIntensity = 1; 

window.cellTypeToEmojiMap = {
    "B/Plasma cells": "Plasma.svg",
    "Endothelial cells": "Endothelial_cell.svg",
    "Fibro1 (EIF4A3, STAR)": "fibroblast1.svg",
    "Fibro2 (RBP1, DCN)": "fibroblast2.svg",
    "Fibro3 (RAMP1, CFD)": "fibroblast3.svg",
    "Fibro4 (CCL2)": "fibroblast4.svg",
    "Fibro5 (FN1, COL3A1)": "fibroblast5.svg",
    "Macrophages": "Macrophage.svg",
    "Mesothelial cells": "Mesothelial_cell.svg",
    "Myofibroblasts": "Myofibroblast.svg",
    "T cells": "t-cell.svg",
    "Tumour cells": "Cancer_cell.svg"
};

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
            console.log('Gene color scale changed to', selectedScale);
            updateColorScalePreview();
            if (window.mode === 'genes') {
                generateVis(); // re-render canvas when color scale changes
            }
        }
    });
});

document.getElementById("colorIntensitySlider").addEventListener("input", (e) => {
    window.geneColorIntensity = parseFloat(e.target.value);
    document.getElementById("intensityValue").innerText = `${window.geneColorIntensity.toFixed(1)}`;
    
    if (window.mode === 'genes') {
        updateSpotColorsIntensity();
    }
    updateColorScalePreview();
});

window.showUMAP = showUMAP;
window.selectedClusterView = "shapes";
window.showDemoButton = "clicked";
window.whichDemo = 'demo5';
window.uploadedEmojiFile = false;

let uploadedSVGFiles = {};
let expectedCellTypes = [];

function updateUploadedFileListUI() {
    const listContainer = document.getElementById("svg-file-list");
    listContainer.innerHTML = "";

    const uploadedNames = Object.values(uploadedSVGFiles).map(file => file.name.replace(/:/g, "/")); // full original names

    listContainer.textContent = uploadedNames.join(", ");
}

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
    if (umapTab.classList.contains("active") && document.getElementById("umapUpload").files.length) {
        optionsContainer.style.display = "block";

    } else {
        if (plottingTab.classList.contains("active")) {
            if (window.showDemoButton === "none") {
                if (window.getComputedStyle(document.getElementById("fileInputSection")).display === "block") {
                    optionsContainer.style.display = "none";
                } else if (window.getComputedStyle(document.getElementById("uploadNewFilesButton")).display === "block") {
                    optionsContainer.style.display = "block";
                }
            } else {
                optionsContainer.style.display = "none";
            }

        } else {
            // console.log(window.showDemoButton)
            if (window.showDemoButton === "clicked") {
                optionsContainer.style.display = "block";
            } else {
                optionsContainer.style.display = "none";
            }
        }
    }

    // Disabling mouse interactions on the canvas when optionsContainer is hidden
    if (optionsContainer.style.display === "none") {
        canvasContainerID.style.pointerEvents = "none";
    } else {
        canvasContainerID.style.pointerEvents = "auto";
    }
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

    var xmax = 120;
    var ymax = 20;

    var colorRectangle = document.createElement("canvas");
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

let positionsData = []
let valuesData = []
let genesData = []
let umapData = []
let dataSpots = []
let dataHeaders = []

let hasClusters;
window.sketchOptions = {
    selectedGene: 0,
}
window.mode = "cellComposition" //cellComposition or genes
window.showImage = false;
window.showAllLevels = false;
window.showEmojiView = false;
window.showCellEmojiView = false;
window.showCluster = false;

let currentEmbedding = null
let currentClusters = []
window.clusterInfo = null

const colorScales = [{
        name: "Color Scale 1",
        value: "ColorScale1",
        colors: ["#FF0000", "#FFA500", "#9DFF09", "#FBFB08", "#22FF9A", "#1297FF", "#0000FF", "#9700FF", "#FB009A", "#FF6EC7", "#00FFEA", "#FF4500", "#00BFFF", "#FFD700", "#8A2BE2"]
    },
    {
        name: "Color Scale 2",
        value: "ColorScale2",
        colors: ["#117733", "#661100", "#882255", "#44AA99", "#999933", "#332288", "#DDCC77", "#AA4499", "#E41A1C", "#3F88C5", "#C8553D", "#6A4C93", "#A2C523", "#E4572E", "#1A8FE3"]

    },
    {
        name: "Color Scale 3",
        value: "ColorScale3",
        colors: ["#636363", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#F4A582", "#999999", "#00CC99", "#B76E79", "#4D4DFF", "#FFA07A", "#33A02C"]
    },
    {
        name: "Color Scale 4",
        value: "ColorScale4",
        colors: ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#882255", "#B07AA1", "#0F4C81", "#FF6F61", "#28AFB0", "#5F0F40", "#7CB518", "#DC6BAD"]

    },
    {
        name: "Color Scale 5",
        value: "ColorScale5",
        colors: ["#44AA99", "#332288", "#117733", "#999933", "#9999DD", "#E41A1C", "#F0E442", "#C94C4C", "#3D348B", "#F6AE2D", "#33658A", "#7DCE82", "#ED6A5A", "#D90368", "#00A676"]

    },
    {
        name: "Color Scale 6",
        value: "ColorScale6",
        colors: ["#CC79A7", "#0072B2", "#D55E00", "#E69F00", "#56B4E9", "#009E73", "#F4A582", "#882255", "#004488", "#A6761D", "#0A9396", "#F28482", "#5C3C92", "#6B4226", "#CE4257"]

    },
];

let dataColors = colorScales[0].colors;

const dropdown = document.getElementById("colorScaleSelector");
dropdown.value = colorScales[0].value;

dropdown.addEventListener("change", (event) => {
    const selectedScale = colorScales.find(scale => scale.value === event.target.value);
    if (selectedScale) {
        // console.log("Selected scale:", selectedScale);
        dataColors = selectedScale.colors;
        generateVis();
    }
});

function uniqueClusterCount(valuesRows) {
    const headers = valuesRows[0]; // no split needed

    const clusterIndex = headers.findIndex(header => header.trim() === 'Cluster');

    if (clusterIndex === -1) {
        console.error("Cluster column not found in CSV");
        return [];
    }

    let clusters = valuesRows.slice(1)
        .map(row => row[clusterIndex])
        .map(value => parseInt(value, 10))
        .filter(value => !isNaN(value));

    let uniqueClusters = [...new Set(clusters)].sort((a, b) => a - b);
    if (uniqueClusters[0] === 0) {
        uniqueClusters = uniqueClusters.map(value => value + 1);
    }
    return uniqueClusters;
}

function setSlidersForDemo(demo) {
  const presets = {
    demo5: { x: 1.26, offsetX: -37, offsetY: -168 },
    demo1: { x: 1.22, offsetX: -37, offsetY: -168 },
    demo2: { x: 1.78, offsetX: -646, offsetY: -997 },
    demo3: { x: 1.65, offsetX: -275, offsetY: -263 },
    demo4: { x: 1.28, offsetX: 74, offsetY: -545 }
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

        if(window.mode === 'genes'){
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
        positionsFile = './SpotPositions.csv';
        valuesFile = './SpotClusterMembership.csv';
        genesFile = './TopExpressedGenes.csv';
    } else if (demoValue === 'demo2') {
        positionsFile = './exampleData/p5/SpotPositions_Transformed_SP5.csv';
        valuesFile = './exampleData/p5/SpotClusterMembership_SP5.csv';
        genesFile = './exampleData/p5/TopExpressedGenes_SP5.csv';
    } else if (demoValue === 'demo3') {
        positionsFile = './exampleData/p6/SpotPositions_SP6_matched.csv';
        valuesFile = './exampleData/p6/SpotClusterMembership_SP6.csv';
        genesFile = './exampleData/p6/TopExpressedGenes_SP6.csv';
    } else if (demoValue === 'demo4') {
        positionsFile = './exampleData/p7/SpotPositions_SP7_matched.csv';
        valuesFile = './exampleData/p7/SpotClusterMembership_SP7.csv';
        genesFile = './exampleData/p7/TopExpressedGenes_SP7.csv';
    } else if (demoValue === 'demo5') {
        positionsFile = './exampleData/p8/SpotPositions_SP8_matched.csv';
        valuesFile = './exampleData/p8/SpotClusterMembership_SP8.csv';
        genesFile = './exampleData/p8/TopExpressedGenes_SP8.csv';
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
    window.numberOfClusters = uniqueClusterCount(valuesRows);
    generateClusterLegend(window.numberOfClusters);
    valuesData = valuesRows;

    let genesCsv = await fetch(genesFile)
    let genesRes = await genesCsv.text()
    const genesText = genesRes;
    const genesRows = genesText.split('\n');
    genesData = scaleData(genesRows.map(row => row.trim().split(',')));

    document.getElementById("optionsContainer").style.display = "block";
    let defaultScaleValue = 'ColorScale1';
    if (['demo2', 'demo3', 'demo4', 'demo5'].includes(demoValue)) {
        defaultScaleValue = 'ColorScale4';
    }

    dropdown.value = defaultScaleValue; // updates UI
    const selectedScale = colorScales.find(scale => scale.value === defaultScaleValue);
    if (selectedScale) {
        dataColors = selectedScale.colors;
    }
    // generateVis();
    if (!options.skipGenerateVis) {
        generateVis();
    }

    document.getElementById("loadingOverlay").style.display = "none";

    showOrHideOptions();

    //triggering showUMAP in the background
    setTimeout(() => {
        showUMAP(1)
            .then(() => console.log("UMAP visualization completed."))
            .catch((error) => console.error("Error in showUMAP:", error));
    }, 0);
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
        margin: { t: 5, r: 5 },
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
        const clusterDropdownContainer = document.getElementById('clusterDropdownContainer');
        umapPlotDiv.innerHTML = '<p>UMAP is loading...</p>';
        umapPlotDiv.style.textAlign = 'center';
        let topExpressedGenes = [];
        if (showdemoCall) {
            topExpressedGenes = transformFileData(genesData);
        } else {
            topExpressedGenes = transformFileData(umapData);
        }
        window.spotClusterMembership = transformFileData(valuesData);
        const clusters = window.spotClusterMembership.map((row) => parseInt(row.Cluster, 10));
        window.clusterInfo = clusters;
        window.top3CellTypeTexts = window.spotClusterMembership.map((spot, index) => {
            const cluster = clusters[index];
            const top3 = Object.entries(spot)
                .filter(([key]) => key !== "Cluster" && key !== "barcode")
                .map(([key, val]) => ({ key, val: parseFloat(val) }))
                .sort((a, b) => b.val - a.val)
                .slice(0, 3);
        
            const cellTypesText = top3
                .map(cell => `${cell.key}: ${parseFloat(cell.val * 100).toFixed(2)}%`)
                .join('<br>');
        
            return `Cluster: ${cluster}<br><b>Top Cell Types:</b><br>${cellTypesText}`;
        });
        const geneNames = Object.keys(topExpressedGenes[0]);
        // const geneExpressionData = topExpressedGenes.map((row) =>
        //     geneNames.map((gene) => parseFloat(row[gene])).filter((value) => !isNaN(value))
        // );

        const numGenes = geneNames.length;
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

        const clusterDropdownMenu = document.getElementById('cluster-dropdown-menu');
        clusterDropdownMenu.innerHTML = '';
        let selectedClusters = [];
        const MAX_SELECTIONS = 5;

        // Use a Web Worker for UMAP computation
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
                            size: 8,
                            color: 'grey',
                            // opacity: 0.5,
                        },
                        hoverinfo: 'text',
                        text: window.top3CellTypeTexts         
                    };

                    window.geneExpressionMatrix = topExpressedGenes;
                    const selectedGenes = window.sketchOptions.selectedGenes || [];
                    if (window.mode === 'genes' && selectedGenes.length > 0) {
                        reGenerateUMAP(clusters, []);
                    } else {
                        Plotly.newPlot('umap-plot', [trace], getUMAPLayout());
                    }
                    const uniqueClusters = [...new Set(clusters)].sort((a, b) => a - b);
                    const deselectItem = document.createElement('li');
                    const deselectAllBtn = document.createElement('div');
                    deselectAllBtn.textContent = 'Deselect All';
                    deselectAllBtn.style.cursor = 'pointer';
                    deselectAllBtn.classList.add('dropdown-item', 'text-danger', 'fw-bold');
                    deselectAllBtn.addEventListener('click', () => {
                        const allCheckboxes = clusterDropdownMenu.querySelectorAll('input[type="checkbox"]');
                        const isAnySelected = Array.from(allCheckboxes).some(cb => cb.checked);
                    
                        if (!isAnySelected) return; // Nothing to do if none are selected
                    
                        selectedClusters = [];
                    
                        allCheckboxes.forEach(cb => {
                            cb.checked = false;
                            cb.disabled = false;
                        });
                    
                        reGenerateUMAP(clusters, selectedClusters);
                        highlightClustersOnCanvasUMAP(selectedClusters);
                    });

                    deselectItem.appendChild(deselectAllBtn);
                    clusterDropdownMenu.appendChild(deselectItem);
                    for (const clusterId of uniqueClusters) {
                        const listItem = document.createElement('li');
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = `cluster-${clusterId}`;
                        checkbox.value = clusterId;
                        checkbox.classList.add('form-check-input');
                        checkbox.style.marginRight = '5px';

                        const label = document.createElement('label');
                        label.htmlFor = `cluster-${clusterId}`;
                        label.textContent = `${clusterId}`;
                        label.classList.add('form-check-label');

                        const wrapperDiv = document.createElement('div');
                        wrapperDiv.classList.add('form-check', 'dropdown-item', 'ms-4');
                        wrapperDiv.style.cursor = 'pointer';
                        wrapperDiv.appendChild(checkbox);
                        wrapperDiv.appendChild(label);
                        listItem.appendChild(wrapperDiv);

                        clusterDropdownMenu.appendChild(listItem);

                        checkbox.addEventListener('change', (event) => {
                            const selectedValue = parseInt(event.target.value);
                    
                            if (event.target.checked) {
                                selectedClusters.push(selectedValue);
                            } else {
                                selectedClusters = selectedClusters.filter(cluster => cluster !== selectedValue);
                            }
                    
                            // Update all checkboxes based on MAX_SELECTIONS
                            const allCheckboxes = clusterDropdownMenu.querySelectorAll('input[type="checkbox"]');
                            allCheckboxes.forEach(cb => {
                                if (!cb.checked) {
                                    cb.disabled = selectedClusters.length >= MAX_SELECTIONS;
                                }
                            });
                    
                            // Update UMAP plot
                            reGenerateUMAP(clusters, selectedClusters);
                    
                            // Update canvas highlight
                            highlightClustersOnCanvasUMAP(selectedClusters);
                        });
                    }

                    clusterDropdownContainer.style.display = 'block'

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
                marker: {
                    size: 8,
                    color: 'grey',
                    // opacity: 0.5,
                },
                hoverinfo: 'text',
                text: window.top3CellTypeTexts
            };
            Plotly.newPlot('umap-plot', [originalTrace], getUMAPLayout());
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
                    size: 8,
                    color: geneColors,
                },
                hoverinfo: 'text',
                text: avgExpressions.map((val, i) =>
                    `${window.top3CellTypeTexts[i]}`
                )
            };

            Plotly.newPlot('umap-plot', [trace], getUMAPLayout());
        }
        return;
    }    

    const umapPlotDiv = document.getElementById('umap-plot');
    // umapPlotDiv.innerHTML = '';
    umapPlotDiv.innerHTML = '<p>Re-generating UMAP...</p>';

    const colors = ['red', 'green', 'yellow', 'orange', 'purple'];

    const trace = {
        x: currentEmbedding.map((point) => point[0]),
        y: currentEmbedding.map((point) => point[1]),
        mode: 'markers',
        marker: {
            size: 8,
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
    Plotly.newPlot('umap-plot', [trace], getUMAPLayout());
}

function highlightUMAPRow(allClusters, indexToHighlight) {
    if (!currentEmbedding || !allClusters) {
        console.error("UMAP data not found!");
        return;
    }

    const umapPlotDiv = document.getElementById('umap-plot');
    umapPlotDiv.innerHTML = '<p>Updating UMAP...</p>';

    const x = currentEmbedding.map((pt) => pt[0]);
    const y = currentEmbedding.map((pt) => pt[1]);

    let allPointsTrace, highlightedPointTrace;

    if (window.mode === 'genes') {
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
        const geneColors = avgExpressions.map(val => {
            const colorIndex = Math.min(Math.floor(val), maxScale);
            const baseColor = colorMap[colorIndex];
            return adjustColorIntensity(baseColor, window.geneColorIntensity || 1);
        });

        allPointsTrace = {
            x: x.filter((_, i) => i !== indexToHighlight),
            y: y.filter((_, i) => i !== indexToHighlight),
            mode: 'markers',
            marker: {
                size: 8,
                color: geneColors.filter((_, i) => i !== indexToHighlight),
                // opacity: 0.5,
            },
            text: window.top3CellTypeTexts.filter((_, i) => i !== indexToHighlight),
            hoverinfo: 'text',
        };

        highlightedPointTrace = {
            x: [x[indexToHighlight]],
            y: [y[indexToHighlight]],
            mode: 'markers',
            marker: {
                size: 14,
                color: 'black',
                line: { width: 2, color: 'white' },
            },
            text: [window.top3CellTypeTexts[indexToHighlight]],
            hoverinfo: 'text',
        };
    } else {
        // fallback to cellComposition
        allPointsTrace = {
            x: x.filter((_, i) => i !== indexToHighlight),
            y: y.filter((_, i) => i !== indexToHighlight),
            mode: 'markers',
            marker: {
                size: 8,
                color: 'gray',
                // opacity: 0.5,
            },
            text: window.top3CellTypeTexts.filter((_, i) => i !== indexToHighlight),
            hoverinfo: 'text',
        };

        highlightedPointTrace = {
            x: [x[indexToHighlight]],
            y: [y[indexToHighlight]],
            mode: 'markers',
            marker: {
                size: 14,
                color: 'brown',
                layer: 'above traces',
            },
            text: [window.top3CellTypeTexts[indexToHighlight]],
            hoverinfo: 'text',
        };
    }

    umapPlotDiv.innerHTML = '';
    Plotly.newPlot('umap-plot', [allPointsTrace, highlightedPointTrace], getUMAPLayout());
}


function showImageChanged(e) {
    // console.log(e.target.checked)
    window.showImage = e.target.checked;
    document.getElementById("imageOpacityContainer").style.display = window.showImage ? "block" : "none";
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
    } else {
        // Disabling cluster view selection when checkbox is unchecked
        document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
            radio.checked = false;
        });
        if (window.whichDemo !== 'demo2' && window.whichDemo !== 'demo3' && window.whichDemo !== 'demo4' && window.whichDemo !== 'demo5'){
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

    // Remove "Barcode" and "Cluster" (case-insensitive match)
    return headerRow.filter(col =>
        col.toLowerCase() !== "barcode" && col.toLowerCase() !== "cluster"
    );
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
    const positionsUploaded = document.getElementById("positions").files.length > 0;
    const valuesUploaded = document.getElementById("values").files.length > 0;

    document.getElementById("plotbutton").disabled = !(positionsUploaded && valuesUploaded);
}

function handleGeneFileUI() {
    const geneFileUploaded = document.getElementById("genesUpload").files.length > 0;
    const showGenesCheckbox = document.getElementById("showGenes");
    const showGenesLabel = document.querySelector("label[for='showGenes']");

    showGenesCheckbox.disabled = !geneFileUploaded;
    showGenesCheckbox.style.display = geneFileUploaded ? "inline-block" : "none";

    if (showGenesLabel) {
        showGenesLabel.style.display = geneFileUploaded ? "inline-block" : "none";
    }

    if (geneFileUploaded) {
        if (showGenesCheckbox.checked) {
            document.getElementById("gene-specific").classList.add("hidden");
            document.getElementById("composition-specific").classList.remove("hidden");
        }
    } else {
        // If no gene file is uploaded, hide gene-specific and show composition
        document.getElementById("gene-specific").classList.add("hidden");
        document.getElementById("composition-specific").classList.remove("hidden");
    }
    if(geneFileUploaded && document.getElementById("values").files.length > 0){
        expectedCellTypes = getCellTypesFromCSV(valuesData);
        // console.log("Expected Cell Types:", expectedCellTypes);
        if (expectedCellTypes.length !== 0){
            document.getElementById("input-2").disabled = false;
        }
    }
    handleUMAPUI();
}

function setDefaultGeneModeIfNeeded() {
    const geneFileUploaded = document.getElementById("genesUpload").files.length > 0;
    const imageFileUploaded = document.getElementById("image").files.length > 0;
    // if (!geneFileUploaded) {
    window.mode = "cellComposition";
    dataColors = colorScales[0].colors;
    const showClusterCheckbox = document.getElementById('showCluster');
    if (!showClusterCheckbox.checked && window.showCluster === false) {
        showClusterCheckbox.checked = true;
        window.showCluster = true;
        if(document.getElementById('showAllLevels').checked){
            document.getElementById('showAllLevels').checked = false;
            window.showAllLevels = false;
        }
        if(document.getElementById('showEmojiView').checked){
            document.getElementById('showEmojiView').checked = false;
            window.showEmojiView = false;
        }
        document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
            radio.disabled = false;
        });
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

    document.getElementById('showComposition').checked = true;
    document.getElementById('showGenes').checked = false;
    // }
    if(!imageFileUploaded) {
        handleImageUploadUI();
    }
    if(window.uploadedEmojiFile == false){
        window.showEmojiView = false;
        document.getElementById('showEmojiView').checked = false;
        document.getElementById('showEmojiView').style.display = 'none';
        document.querySelector("label[for='showEmojiView']").style.display = 'none';
    }
}

function handleUMAPUI() {
    const umapUploaded = document.getElementById("umapUpload").files.length > 0;
    const umapTab = document.getElementById("umapTab");

    if (umapUploaded) {
        umapTab.classList.remove("d-none");
        document.getElementById("canvasContainer").style.pointerEvents = "auto";
    } else {
        umapTab.classList.add("d-none");
    }
}

window.handleImageUploadUI = function() {
    // const container = document.getElementById('imageOpacityContainer');
    const imageUploaded = document.getElementById("image").files.length > 0;
    const showImageContainer = document.getElementById("showImageContainer");
    const showImageCheckbox = document.getElementById("showImage");
    const showImageLabel = document.querySelector("label[for='showImage']");
    document.getElementById("imageOpacityContainer").style.display = "none";
    if (imageUploaded) {
        showImageContainer.style.display = "flex";
        showImageCheckbox.disabled = false;
        showImageCheckbox.style.display = "inline-block";
        if (showImageLabel) showImageLabel.style.display = "inline-block";
        // if (container) {
        //     container.style.display = 'block';
        // }
    } else {
        showImageCheckbox.checked = false;
        showImageCheckbox.disabled = true;
        showImageCheckbox.style.display = "none";
        if (showImageLabel) showImageLabel.style.display = "none";
        showImageContainer.style.display = "none";
        window.showImage = false;
        if (container) {
            container.style.display = 'none';
        }
    }
}

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

    dataHeaders.sort().forEach((header, index) => {
        const geneId = `geneOption${index}`;
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="form-check mx-3">
                <input class="form-check-input gene-checkbox" type="checkbox" value="${header}" id="${geneId}">
                <label class="form-check-label" for="${geneId}">${header}</label>
            </div>
        `;
        listContainer.appendChild(li);
    });
    const selectAll = document.getElementById('selectAllGenes');
    selectAll.checked = true;
    selectAll.dispatchEvent(new Event('change'));
}

window.generateVis = function () {
    dataSpots = []
    if (!positionsData || positionsData.length == 0) {
        alert("Position Data missing")
        return;
    }

    if (mode == "cellComposition") {
        const selectedScaleName = dropdown.value;
        dataColors = getFreshColorArray(selectedScaleName);

        if (!valuesData || valuesData.length == 0) {
            alert("Membership Data missing")
            haltProcess();
            return;
        }
        dataHeaders = valuesData[0].slice(1)
        // console.log(dataHeaders)
        let sliceFactor = 0;
        hasClusters = false;

        //basically to exclude the cluster values from the direct visualization
        if (dataHeaders.at(-1).includes("Cluster")) {
            sliceFactor = 1;
            hasClusters = true;
        }
        
        let extraColorsNeeded = (dataHeaders.length - sliceFactor) - dataColors.length;

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
                // Use baseSeed + i to ensure unique color
                dataColors.push(generateRandomColor(baseSeed + i));
            }
        }
        for (let i = 1; i < positionsData.length - 1; i++) {
            let spotCoords = positionsData[i];
            let spotValues = valuesData[i].slice(1, valuesData[i].length - sliceFactor).map((value, i) => {
                return {
                    label: dataHeaders[i],
                    value: value,
                    color: dataColors[i]
                }
            })

            // const newSpot = new Spot(i, spotCoords[0], spotCoords[1], spotCoords[2], spotCoords[3], spotValues)
            // if (hasClusters) {
            //     newSpot.cluster = valuesData[i].at(-1);
            // }
            // dataSpots.push(newSpot);

            const newSpot = new Spot(i, spotCoords[0], spotCoords[1], spotCoords[2], spotCoords[3], spotValues);

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

            if (hasClusters) {
                const cluster = valuesData[i].at(-1);
                newSpot.cluster = cluster;
                clusterInfo.push(cluster);
            }

            if (newSpot.values[0]) {
                newSpot.values[0].geneList = geneList;
                newSpot.values[0].clusterInfo = clusterInfo;
            }

            dataSpots.push(newSpot);
        }

    } else if (mode === "genes") {
        if (!genesData || genesData.length === 0) {
            alert("Genes Data missing");
            haltProcess();
            return;
        }

        dataHeaders = genesData[0];
        hasClusters = true;

        // Populate gene selection
        populateGeneDropdown(dataHeaders);

        // Select all genes initially
        const allGenes = dataHeaders.slice().sort();
        window.sketchOptions.selectedGenes = allGenes;

        const selectedGeneIndices = window.sketchOptions.selectedGenes.map(gene => dataHeaders.indexOf(gene));

        for (let i = 1; i < positionsData.length - 1; i++) {
            const spotCoords = positionsData[i];
            const colorMap = getColorScaleArray(window.selectedGeneColorScale);
            const geneRow = genesData[i];

            const expressionValues = selectedGeneIndices.map(idx => parseFloat(geneRow[idx]) || 0);
            const avgExpression = expressionValues.reduce((a, b) => a + b, 0) / expressionValues.length;

            const colorIndex = Math.min(Math.floor(avgExpression), colorMap.length - 1);
            const baseColor = colorMap[colorIndex];

            // NEW: Generate sorted gene list (descending by expression value)
            const geneList = window.sketchOptions.selectedGenes
                .map((gene, j) => ({
                    gene,
                    value: expressionValues[j]
                }))
            .filter(g => g.value > 0)
            .sort((a, b) => b.value - a.value);
            // NEW: Determine cluster info from valuesData (if available)
            let clusterInfo = [];
            if (valuesData && valuesData[i]) {
                const cluster = valuesData[i].at(-1);
                if (valuesData[0].at(-1).includes("Cluster")) {
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

            // Optionally attach cell composition info
            if (valuesData[i]) {
            const sliceFactor = valuesData[0].at(-1).includes("Cluster") ? 1 : 0;
            const cellTypeHeaders = valuesData[0].slice(1, valuesData[0].length - sliceFactor);
            const cellTypeValues = valuesData[i]
                .slice(1, valuesData[i].length - sliceFactor)
                .map((value, j) => ({
                label: cellTypeHeaders[j],
                value: value,
                color: dataColors[j] || "#999999"
                }));
            newSpot.cellCompositionValues = cellTypeValues;
            if (sliceFactor === 1) {
                newSpot.cluster = valuesData[i].at(-1);
            }
            }

            dataSpots.push(newSpot);
        }
    }
    window.drawAtWill = true;
    setupCanvas(Math.floor(window.innerWidth * 0.74), window.innerHeight, dataSpots);
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
        document.getElementById("infoBox").innerHTML = '';
        document.getElementById("composition-specific").classList.remove("hidden")
        document.getElementById("gene-specific").classList.add("hidden")
        document.getElementById("showGenes").checked = false
        document.getElementById("showEmojiView").checked = false;
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
    } else {
        document.getElementById("infoBox").innerHTML = '';
        document.getElementById("composition-specific").classList.add("hidden")
    }
}

function showGenesChanged(e) {
    if (e.target.checked) {
        window.selectedClusterInLegend = null;
        document.getElementById("gene-specific").classList.remove("hidden");
        document.getElementById("composition-specific").classList.add("hidden");
        document.getElementById("showAllLevels").checked = false;
        document.getElementById("showEmojiView").checked = false;
        document.getElementById("showComposition").checked = false
        modeChange("genes");
    } else {
        document.getElementById("gene-specific").classList.add("hidden");
    }
}

function generteCanvasClicked() {
    if(expectedCellTypes.length > Object.keys(uploadedSVGFiles).length && Object.keys(uploadedSVGFiles).length !== 0){
        const cellCount = expectedCellTypes.length - Object.keys(uploadedSVGFiles).length;
        alert(`Expected "${cellCount}" more number of cell type SVG file${cellCount > 1 ? 's' : ''}.`);
        return;
    }
    document.getElementById('plotbutton').disabled = true;
    document.getElementById('input-2').disabled = true;
    document.getElementById('svg-file-list').textContent = "";

    const canvasContainerID = document.getElementById("canvasContainer");
    if (canvasContainerID) {
        canvasContainerID.style.pointerEvents = "auto";
    }

    setDefaultGeneModeIfNeeded();
    document.getElementById("optionsContainer").style.display = "block";
    document.getElementById('fileInputSection').style.display = 'none';
    document.getElementById('uploadNewFilesButton').style.display = 'block';
    
    generateVis();
    console.log("Generated new canvas.")
    window.showDemoButton = "none"

    if (document.getElementById("umapUpload").files.length) {
        // triggering showUMAP in the background
        setTimeout(() => {
            showUMAP()
                .then(() => console.log("UMAP visualization completed."))
                .catch((error) => console.error("Error in showUMAP:", error));
        }, 0);
    }
}

function uploadNewFileClicked() {
    document.getElementById('fileInputSection').style.display = 'block';
    document.getElementById('uploadNewFilesButton').style.display = 'none';
    const fileInputs = document.querySelectorAll('#fileInputSection input[type="file"]');
    fileInputs.forEach(input => {
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
    clearCanvas()
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
    //scale data for the heatmap, each column should be scaled to values 0-10

    let numRows = matrix.length;
    let numCols = matrix[0].length;

    let scaledMatrix = [];
    let headers = JSON.parse(JSON.stringify(matrix[0]))

    matrix = matrix.slice(1)

    for (let col = 0; col < numCols; col++) {
        // Extract the current column
        let column = matrix.map((row, i) => Math.log(0.01 + parseFloat(row[col])));

        // Find the min and max values in the current column
        let minVal = Math.min(...column);
        let maxVal = Math.max(...column);

        // Scale the column values
        let scaledColumn = column.map(value => {
            // Scale to range 0-10
            let scaledValue = ((value - minVal) / (maxVal - minVal)) * 10;
            return Math.round(scaledValue); // Round to the nearest integer
        });

        // Insert the scaled values into the scaledMatrix
        scaledColumn.forEach((val, rowIndex) => {
            if (!scaledMatrix[rowIndex]) scaledMatrix[rowIndex] = [];
            scaledMatrix[rowIndex][col] = val;
        });
    }

    scaledMatrix.unshift(headers)

    // console.log(scaledMatrix)

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
            if (document.getElementById("clusterDropdownContainer").style.display === "block") {
                highlightUMAPRow(window.clusterInfo, this.index)
            }
        }
        return summary;
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
        const loopedShapeNumber = ((clusterNumber - 1) % maxShapeCluster) + 1;

        if (clusterNumber <= maxShapeCluster) {
            // Display the original shape for clusters 1-30
            shapeElement.innerHTML = shapeSVGs[clusterNumber] || "?";
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
}

function highlightClusterOnCanvas(clusterNumber) {
    // Toggle off if same cluster is clicked again
    if (window.selectedClusterInLegend === clusterNumber) {
        window.selectedClusterInLegend = null;
    } else {
        window.selectedClusterInLegend = clusterNumber;
    }
}

function highlightClustersOnCanvasUMAP(clusterArray) {
    if (!Array.isArray(clusterArray)) return;

    // If all clusters are selected or none, clear filter
    if (clusterArray.length === 0) {
        window.selectedUMAPClusters = [];
    } else {
        window.selectedUMAPClusters = clusterArray.map(Number);
    }
}

const heatMapColors = [
    "#238A8D",
    "#1F968B",
    "#20A387",
    "#29AF7F",
    "#3CBB75",
    "#55C667",
    "#73D055",
    "#95D840",
    "#B8DE29",
    "#DCE319",
    "#FDE725"
]

updateColorScalePreview();