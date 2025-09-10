//© Heba Sailem, heba.sailem@kcl.ac.uk
let canvasWidth = 800;
let canvasHeight = 600;
let spots = [];
let img;
let saveFlag = false
let mouseOverCanvas = false;
let zoomFactor = 1;
let panX = 0;
let panY = 0;
let lastClickedSpot = null;

window.drawAtWill = false;
window.hoveredHex = null;
window.clickedHex = null;
window.highlightedCanvasHexIndex = -1;

const infoBox = document.getElementById("infoBox");
const markerGeneCache = {};

document.getElementById("image").addEventListener("change", function (e) {
  imageUploaded(e);
  // checkFileUploads();
  handleImageUploadUI();
})

function imageUploaded(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function (e) {
      loadImage(e.target.result, (loadedImg) => {
        img = loadedImg;
      });
    };
    reader.readAsDataURL(file);
  } else {
    console.log('Not an image file!');
  }
}

window.loadImageForDemo = function(demoName) {
  const demoPathMap = {
    demo1: "demoData/mouse/tissue_image.png",
    demo2: "demoData/p5/tissue_image.png",
    demo3: "demoData/p6/tissue_image.png",
    demo4: "demoData/p7/tissue_image.png",
    demo5: "demoData/p8/tissue_image.png",
    demo6: "demoData/p1/tissue_image.png",
    demo7: "demoData/p2/tissue_image.png",
    demo8: "demoData/p3/tissue_image.png",
    demo9: "demoData/p4/tissue_image.png"
  };
  let path = demoPathMap[demoName];
  if (path) img = loadImage(path, () => {});
};

function setup() {
  let myCanvas = createCanvas(canvasWidth, canvasHeight);
  myCanvas.parent("canvasContainer");
  
  ["stretchX", "stretchY", "offsetX", "offsetY"].forEach(id => {
    let slider = document.getElementById(id);
    let label = document.getElementById(id + "Value");
    slider.addEventListener("input", () => {
      label.textContent = slider.value;
      window.drawAtWill = true; // Forcing to redraw
    });
  });

  loadImageForDemo(window.whichDemo);
  setupCanvas(canvasWidth, canvasHeight, []);
}

function draw() {
  if (!window.drawAtWill) return;

  background("#FFFFFF");
  translate(panX, panY);
  scale(zoomFactor);
  drawHexagonGrid(spots);

  let adjustedMouseX = (mouseX - panX) / zoomFactor;
  let adjustedMouseY = (mouseY - panY) / zoomFactor;

  const isDemoTab = document.getElementById("demoTab").classList.contains("active");
  const isUMAPTab = document.getElementById("umapTab").classList.contains("active");
  const isPlottingTab = document.getElementById("plottingTab").classList.contains("active");

  if (mouseOverCanvas && (isUMAPTab || (isDemoTab && window.mode === "cellComposition") || isPlottingTab)) {
    hoveredHex = getHoveredHexagon(adjustedMouseX, adjustedMouseY);
  } else {
    hoveredHex = null;
  }

  if (hoveredHex) {
    infoBox.innerHTML = `
            <h6 class="card-title">${hoveredHex.barcode}</h6>
            <p class="card-text h6"><small> ${hoveredHex.getSummary()}</small></p>`

    clusterTypeInfo.innerHTML = `<p class="card-text h6"><small> ${hoveredHex.getClusterInfoSummary()}</small></p>`
  }

  if (saveFlag) exportSVG();
}

function saveSVG() {
  saveFlag = true
  window.drawAtWill = true;
}

function exportSVG() {
  let svgElements = drawHexagonGrid(spots, true, []);

  // Calculating the correct viewBox for zoom & pan
  let viewBoxX = -panX / zoomFactor;
  let viewBoxY = -panY / zoomFactor;
  let viewBoxWidth = canvasWidth / zoomFactor;
  let viewBoxHeight = canvasHeight / zoomFactor;

  let svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" preserveAspectRatio="xMidYMid meet">`;
  let svgFooter = `</svg>`;
  let fullSVG = svgHeader + svgElements.join("\n") + svgFooter;
  let blob = new Blob([fullSVG], {
    type: "image/svg+xml"
  });
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tissue_plot.svg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  saveFlag = false
}

function clearCanvas() {
  clear()
}

function setupCanvas(width, height, newSpots) {
  spots = []
  canvasWidth = width;
  canvasHeight = height;
  resizeCanvas(canvasWidth, canvasHeight);
  spots = newSpots;

  // Reset zoom and pan when setting up a new canvas
  zoomFactor = 1;
  panX = 0;
  panY = 0;

  const canvasEl = document.getElementById("canvasContainer")?.querySelector("canvas");

  if (!canvasEl) {
    console.warn("Canvas not found inside #canvasContainer at setupCanvas()");
    return;
  }

  document.getElementById("canvasContainer").querySelector("canvas").addEventListener("mouseleave", () => {
    hoveredHex = null
    mouseOverCanvas = false
  })

  document.getElementById("canvasContainer").querySelector("canvas").addEventListener("mouseout",
    () => {
      hoveredHex = null
      mouseOverCanvas = false
    }
  )

  document.getElementById("canvasContainer").querySelector("canvas").addEventListener("mouseover", (e) => {
    mouseOverCanvas = true
  })

  document.getElementById("canvasContainer").querySelector("canvas").addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();

    const adjustedMouseX = (e.clientX - rect.left - panX) / zoomFactor;
    const adjustedMouseY = (e.clientY - rect.top - panY) / zoomFactor;

    const clickedHex = getHoveredHexagon(adjustedMouseX, adjustedMouseY);

    if (clickedHex) {
      let barChartData;
      if (window.mode == "cellComposition") {
        barChartData = clickedHex.values.map((value, index) => ({
          label: value.label && value.label.length > 3 ? value.label.substring(0, 10) : value.label,
          value: parseFloat(value.value) || 0,
          color: value.color,
          originalLabel : value.label,
        }));
      // showBarChart(clickedHex.index, clickedHex.barcode, barChartData, true);
      }
      else {
        barChartData = clickedHex.cellCompositionValues.map((cellCompositionValues, index) => ({
          label: cellCompositionValues.label && cellCompositionValues.label.length > 3 ? cellCompositionValues.label.substring(0, 10) : cellCompositionValues.label,
          value: parseFloat(cellCompositionValues.value) || 0,
          color: cellCompositionValues.color,
          originalLabel : cellCompositionValues.label,
        }));
      }

      // showBarChart(clickedHex.index, clickedHex.barcode, barChartData, true);
      showSpotInfo(clickedHex,spots, clickedHex.index, clickedHex.barcode, barChartData, true);
    }
  })

  drawHexagonGrid(spots);
}

async function showSpotInfo(clickedHex, allSpots, index, barcode, barChartData, BooleanVal) {
  const popup = document.getElementById("spotInfoPopup");
  const clusterEl = document.getElementById("popupCluster");
  const clusterName = document.getElementById("SelectedClusterType");
  const geneContent = document.getElementById("popupGeneContent");

  const selectedCluster = clickedHex.cluster || "N/A";
  clusterEl.textContent = selectedCluster;
  clusterName.textContent = window.selectedClusterFeature;

  // If same spot clicked again, just return (no need to do anything again)
  if (lastClickedSpot === clickedHex) {
    popup.style.display = "block";
    return;
  }

  // Save current clicked spot for future comparison
  lastClickedSpot = clickedHex;

  geneContent.innerHTML = `<div class="text-muted px-2 py-1">Loading marker genes...</div>`;
  popup.style.display = "block";
  popup.offsetWidth;

  showBarChart(index, barcode, barChartData, BooleanVal);
  renderClusterStackedBarChart(allSpots);
  showOverallCellTypeDistribution(allSpots);
  showOverallClusterDistribution(allSpots);
  if (window.mode === "genes") {
    window.updateSelectedGeneLabel();
    document.getElementById("stackGeneClusterInfo").style.display = 'block';
    document.getElementById("stackGeneCellInfo").style.display = 'block';
    showGeneExpressionByClusterBarChart(allSpots);
    showGeneExpressionByCellTypeBarChart(allSpots);
  } else {
    const container1 = document.getElementById("geneClusterBarChart");
    container1.innerHTML = '';
    const container2 = document.getElementById("geneCellTypeBarChart");
    container2.innerHTML = '';
    document.getElementById("stackGeneClusterInfo").style.display = 'none';
    document.getElementById("stackGeneCellInfo").style.display = 'none';
  }

  await new Promise(requestAnimationFrame);

  // If marker genes are already cached for this cluster, use them
  let markerGenes = markerGeneCache[selectedCluster];
  if (!markerGenes) {
    markerGenes = await detectMarkersInCluster(allSpots, selectedCluster);
    markerGeneCache[selectedCluster] = markerGenes;
  }

  window.currentPopupMarkerGenes = markerGenes.map(g => g.gene);

  const expressionValues = markerGenes.map(g => parseFloat(g.selectedMean));
  const minVal = Math.min(...expressionValues);
  const maxVal = Math.max(...expressionValues);

  const colorScale = d3.scaleSequential()
    .domain([minVal, maxVal])
    .interpolator(d3.interpolateViridis);

  const isClickable = window.mode !== "cellComposition";
  const showSelectAll = markerGenes.length > 1;
  const selectAllStyle = isClickable ? 'cursor:pointer;' : 'cursor:default; pointer-events:none;';
  const selectAllButton = showSelectAll
    ? `<span class="popup-markergene-item badge bg-light text-dark m-1 p-1" data-select-all="true" style="${selectAllStyle}">
        Select All
      </span>`
    : '';

  const geneItems = markerGenes.map(g => {
    const baseClass = 'popup-gene-item badge m-1 p-1';
    const style = `
      background-color: ${colorScale(parseFloat(g.selectedMean))};
      color: white;
      ${isClickable ? 'cursor:pointer;' : 'cursor:default; pointer-events:none;'}
    `;
    return `<span class="${baseClass}" data-gene="${g.gene}" style="${style}">
      <span class="popup-gene-label">${g.gene}</span>
    </span>`;
  }).join('');

  geneContent.innerHTML = selectAllButton + geneItems;
}

const worker = new Worker('markerWorker.js');

function detectMarkersInCluster(allSpots, selectedCluster) {
  return new Promise((resolve) => {
    worker.postMessage({ allSpots, selectedCluster });
    // worker.postMessage({ allSpots, selectedCluster ,mode: 'single'});

    worker.onmessage = function(e) {
      const { markerGenes } = e.data;
      resolve(markerGenes);
    };
    // worker.postMessage({
    //   allSpots,
    //   mode: 'all'
    // });

    // worker.onmessage = function(e) {
    //   const { csv } = e.data;
    //   if (csv) {
    //     // Save or download CSV
    //     const blob = new Blob([csv], { type: 'text/csv' });
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = 'marker_genes_all_clusters.csv';
    //     a.click();
    //     URL.revokeObjectURL(url);
    //   }
    //   resolve(csv)
    // };
  });
}

function drawHexagonGrid(spots, saveFlag = false, svgElements = []) {
  const normalize = str => str?.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '');

  let minX = spots.reduce((min, spot) => Math.min(min, spot.x), Infinity);
  let maxX = spots.reduce((max, spot) => Math.max(max, spot.x), -Infinity);
  let minY = spots.reduce((min, spot) => Math.min(min, spot.y), Infinity);
  let maxY = spots.reduce((max, spot) => Math.max(max, spot.y), -Infinity);

  let RESIZE_canvas = 1000;
  let dataWidth = maxX - minX;
  let dataHeight = maxY - minY;
  let aspectRatio = dataHeight / dataWidth;
  let scaleFactor = Math.min(RESIZE_canvas / dataWidth, RESIZE_canvas / dataHeight);
  let offsetX = (RESIZE_canvas - dataWidth * scaleFactor) / 2;
  let offsetY = (RESIZE_canvas - dataHeight * scaleFactor) / 2;

  window.dataWidth = dataWidth;
  window.dataHeight = dataHeight;
  window.aspectRatio = aspectRatio;

  if (img && window.showImage) {
    let stretchFactorX, stretchFactorY, manualOffsetX, manualOffsetY;
    if (window.showDemoButton == 'clicked') {
      switch (window.whichDemo) {
        case "demo1":
          [stretchFactorX, stretchFactorY, manualOffsetX, manualOffsetY] = [1.22, 1.23, -37, -168];
          break;
        case "demo2":
          [stretchFactorX, stretchFactorY, manualOffsetX, manualOffsetY] = [1.78, 1.5, -646, -997];
          break;
        case "demo3":
          [stretchFactorX, stretchFactorY, manualOffsetX, manualOffsetY] = [1.65, 2, -275, -263];
          break;
        case "demo4":
          [stretchFactorX, stretchFactorY, manualOffsetX, manualOffsetY] = [1.28, 1.29, 74, -545];
          break;
        case "demo5":
          [stretchFactorX, stretchFactorY, manualOffsetX, manualOffsetY] = [1.27, 1.26, -37, -168];
          break;
        case "demo6":
          [stretchFactorX, stretchFactorY, manualOffsetX, manualOffsetY] = [1.26, 1.27, -37, -168];
          break;
        case "demo7":
          [stretchFactorX, stretchFactorY, manualOffsetX, manualOffsetY] = [1.92, 1.54, 679, 502];
          break;
        case "demo8":
          [stretchFactorX, stretchFactorY, manualOffsetX, manualOffsetY] = [1.44, 1.96, -406, -168];
          break;
        case "demo9":
          [stretchFactorX, stretchFactorY, manualOffsetX, manualOffsetY] = [1.35, 1.41, -108, -48];
          break;
      }
    } else {
      stretchFactorX = parseFloat(document.getElementById("stretchX")?.value) || 1.5;
      stretchFactorY = parseFloat(document.getElementById("stretchY")?.value) || 1.5;
      manualOffsetX = parseInt(document.getElementById("offsetX")?.value) || 0;
      manualOffsetY = parseInt(document.getElementById("offsetY")?.value) || 0;
    }
    let imgWidth = dataWidth * stretchFactorX;
    let imgHeight = dataHeight * stretchFactorY;
    let imgX = minX - (imgWidth - dataWidth) / 2 + manualOffsetX;
    let imgY = minY - (imgHeight - dataHeight) / 2 + manualOffsetY;

    let scaledImgX = (imgX - minX) * scaleFactor + offsetX;
    let scaledImgY = (imgY - minY) * scaleFactor + offsetY;
    let scaledImgWidth = imgWidth * scaleFactor;
    let scaledImgHeight = imgHeight * scaleFactor;

    if (saveFlag) {
      let imgDataURL = img.canvas.toDataURL("image/png");
      svgElements.push(`<image href="${imgDataURL}" x="${scaledImgX}" y="${scaledImgY}" width="${scaledImgWidth}" height="${scaledImgHeight}" preserveAspectRatio="none"/>`);
      if (!document.getElementById("showComposition").checked == false && !document.getElementById("showGenes").checked) {
        return svgElements;
      }
    } else {
      let opacityPercent = parseInt(document.getElementById("imageOpacity")?.value) || 100;
      let alpha = Math.round((opacityPercent / 100) * 255);
      tint(255, alpha);
      image(img, scaledImgX, scaledImgY, scaledImgWidth, scaledImgHeight);
      noTint();

      if(!document.getElementById("showComposition").checked && !document.getElementById("showGenes").checked){
        return;
      }
    }
  }

  spots.forEach(spot => {
    if (spot.visible === false) return;

    const {
      index, cluster, x, y, radius, values, cellCompositionValues
    } = spot;

    let scaledX = (x - minX) * scaleFactor + offsetX;
    let scaledY = (y - minY) * scaleFactor + offsetY;
    let scaledRadius = (radius + 40) * scaleFactor;

    spot.scaledX = scaledX;
    spot.scaledY = scaledY;
    spot.scaledRadius = scaledRadius;

    const isHighlighted = index === window.highlightedSpotIndex;
    const spotCluster = parseInt(cluster);
    const isLegendFilterActive = window.selectedClusterInLegend !== null;
    const isDropdownFilterActive = Array.isArray(window.selectedClusterFromDropdown) && window.selectedClusterFromDropdown.length > 0;
    const isUMAPFilterActive = Array.isArray(window.selectedUMAPClusters) && window.selectedUMAPClusters.length > 0;
    const isCellTypeFilterActive = Array.isArray(window.selectedCellTypesFromDropdown) && window.selectedCellTypesFromDropdown.length > 0;

    const cellTypesInSpot = window.mode === "cellComposition" ? values : cellCompositionValues || [];

    const passesCellTypeFilter = !isCellTypeFilterActive ||
      cellTypesInSpot.some(v => window.selectedCellTypesFromDropdown.includes(v.label));

    if (
      (isLegendFilterActive && spotCluster !== window.selectedClusterInLegend) ||
      (isDropdownFilterActive && !window.selectedClusterFromDropdown.includes(spotCluster)) ||
      (isUMAPFilterActive && !window.selectedUMAPClusters.includes(spotCluster)) ||
      !passesCellTypeFilter
    ) {
      return;
    }

    if (window.mode === "cellComposition") {
      if (isCellTypeFilterActive && Array.isArray(values)) {
        const sorted = values.slice().sort((a, b) => b.value - a.value);
        const topCellType = sorted[0]?.label;
        const topNormalized = normalize(topCellType);
        const selectedNormalized = window.selectedCellTypesFromDropdown.map(normalize);
        if (!selectedNormalized.includes(topNormalized)) return;
      }

      const sortedSpotMembership = [...values].sort((a, b) => b.value - a.value);

      if (saveFlag) {
        svgElements.push(drawHexagonSVG(scaledX, scaledY, scaledRadius, sortedSpotMembership[0].color));

        if (window.showAllLevels) {
          if (sortedSpotMembership[1]?.value > 0.1) svgElements.push(drawHexagonSVG(scaledX, scaledY, (radius + 25) * scaleFactor, sortedSpotMembership[1].color));
          if (sortedSpotMembership[2]?.value > 0.1) svgElements.push(drawHexagonSVG(scaledX, scaledY, (radius + 10) * scaleFactor, sortedSpotMembership[2].color));
        } else if (window.showCellEmojiView) {
          const emojiImage = window.cellTypeVectors[sortedSpotMembership[0].label];
          if (emojiImage) {
            svgElements.push(drawCellTypeVectorSVG(emojiImage, scaledX, scaledY, scaledRadius * 1.5));
          } else {
            textAlign(CENTER, CENTER);
            textSize(10);
            text("?", scaledX, scaledY);
          }
        }
      } else {
        if (isHighlighted) drawHexagon(scaledX, scaledY, (radius + 48) * scaleFactor, 'black', 4);
        drawHexagon(scaledX, scaledY, scaledRadius, sortedSpotMembership[0].color);
        strokeWeight(1);

        if (window.showAllLevels) {
          if (sortedSpotMembership[1]?.value > 0.1) drawHexagon(scaledX, scaledY, (radius + 25) * scaleFactor, sortedSpotMembership[1].color);
          if (sortedSpotMembership[2]?.value > 0.1) drawHexagon(scaledX, scaledY, (radius + 10) * scaleFactor, sortedSpotMembership[2].color);
        } else if (window.showCellEmojiView) {
          const emojiImage = window.cellTypeVectors[sortedSpotMembership[0].label];
          if (emojiImage) {
            drawCellTypeVectors(emojiImage, scaledX, scaledY, scaledRadius * 1.5);
          } else {
            textAlign(CENTER, CENTER);
            textSize(10);
            text("?", scaledX, scaledY);
          }
        }
      }

      if (window.showCluster) {
        const shapeRadius = ['demo6', 'demo7', 'demo8', 'demo9'].includes(window.whichDemo)
          ? (radius - (window.selectedClusterView === "numbers" ? 80 : 50)) * scaleFactor
          : (radius - 30) * scaleFactor;

        if (saveFlag) {
          svgElements.push(drawClusterSVG(scaledX, scaledY, shapeRadius, spot, sortedSpotMembership[0].color));
        } else {
          switchCaseCluster(scaledX, scaledY, shapeRadius, spot, sortedSpotMembership[0].color);
        }
      }

    } else {
      if (isCellTypeFilterActive && Array.isArray(cellCompositionValues)) {
        const sorted = cellCompositionValues.slice().sort((a, b) => b.value - a.value);
        const topNormalized = normalize(sorted[0]?.label);
        const selectedNormalized = window.selectedCellTypesFromDropdown.map(normalize);
        if (!selectedNormalized.includes(topNormalized)) return;
      }

      const geneColor = window.sketchOptions.selectedGene
        ? (spot.values.find(v => v.label === window.sketchOptions.selectedGene)?.color || '#cccccc')
        : (spot.values[0]?.color || '#cccccc');

      if (saveFlag) {
        svgElements.push(drawHexagonSVG(scaledX, scaledY, scaledRadius, geneColor));
        if (window.showEmojiView) {
          const emojiImage = window.cellTypeVectors[cellCompositionValues?.slice().sort((a, b) => b.value - a.value)[0].label];
          if (emojiImage) svgElements.push(drawCellTypeVectorSVG(emojiImage, scaledX, scaledY, scaledRadius * 1.5));
        }
      } else {
        if (isHighlighted) drawHexagon(scaledX, scaledY, (radius + 48) * scaleFactor, 'black', 4);
        drawHexagon(scaledX, scaledY, scaledRadius, geneColor);

        if (window.showEmojiView) {
          const emojiImage = window.cellTypeVectors[cellCompositionValues?.slice().sort((a, b) => b.value - a.value)[0].label];
          if (emojiImage) drawCellTypeVectors(emojiImage, scaledX, scaledY, scaledRadius * 1.5);
        }
      }

      if (window.showCluster) {
        const shapeRadius = ['demo6', 'demo7', 'demo8', 'demo9'].includes(window.whichDemo)
          ? (radius - (window.selectedClusterView === "numbers" ? 80 : 50)) * scaleFactor
          : (radius - 30) * scaleFactor;

        if (saveFlag) {
          svgElements.push(drawClusterSVG(scaledX, scaledY, shapeRadius, spot, geneColor));
        } else {
          switchCaseCluster(scaledX, scaledY, shapeRadius, spot, geneColor);
        }
      }
    }
  });
  
  if (saveFlag) return svgElements;
}

function switchCaseCluster(scaledX, scaledY, shapeRadius, spot, colorValue) {
  const clusterView = window.selectedClusterView;
  const clusterStr = spot.cluster?.toString();
  const clusterNum = parseInt(clusterStr, 10);
  const maxShapeCluster = 30;

  if (clusterView === "shapes") {
    // If in range 1–30 or 0 (special case)
    const isShapeCluster = (clusterNum >= 1 && clusterNum <= maxShapeCluster) || clusterNum === 0;

    if (isShapeCluster) {
      const clusterKey = clusterStr === "0" ? "11" : clusterStr;

      const shapeDrawMap = {
        "1": drawTriangle,
        "2": drawX,
        "3": drawCircle,
        "4": drawStar,
        "5": () => drawHexagon(scaledX, scaledY, shapeRadius, colorValue),
        "6": drawSquare,
        "7": drawDiamond,
        "8": drawPlus,
        "9": drawMinus,
        "10": drawSlash,
        "11": drawPentagon,
        "12": drawArrow,
        "13": drawChevron,
        "14": drawHash,
        "15": drawCrescent,
        "16": drawEllipse,
        "17": drawPieSlice,
        "18": drawInfinity,
        "19": drawBowtie,
        "20": drawDoubleCircle,
        "21": drawTrapezoid,
        "22": drawSpiral,
        "23": drawZigzag,
        "24": drawBackSlash,
        "25": drawCross,
        "26": drawRhombus,
        "27": drawTShape,
        "28": drawBracket,
        "29": drawLightning,
        "30": drawStarburst
      };

      const drawFn = shapeDrawMap[clusterKey];
      if (drawFn) {
        typeof drawFn === 'function' ? drawFn(scaledX, scaledY, shapeRadius) : drawFn();
      }
    } else {
      const loopedCluster = ((clusterNum - 1) % maxShapeCluster) + 1;
      drawClusterNumber(scaledX, scaledY, shapeRadius, loopedCluster, colorValue);
    }

  } else if (clusterView === "numbers") {
    drawClusterNumber(scaledX, scaledY, shapeRadius, spot.cluster, colorValue);
  }
}

function drawCellTypeVectors(vectorData, x, y, size) {
  const { shapes, viewBoxSize } = vectorData;
  push();
  translate(x - size / 2, y - size / 2);
  scale(size / viewBoxSize);
  shapes.forEach(shape => {
    if (!shape || !shape.type) return;
    try {
      const hasTransform = !!shape.transform;
      if (hasTransform) drawingContext.save();

      if (shape.type === "path" && shape.d) {
        if (!shape._cachedPath2D) {
          shape._cachedPath2D = new Path2D(shape.d);
        }
        if (shape.fill && shape.fill !== "none") {
          drawingContext.fillStyle = shape.fill;
          drawingContext.fill(shape._cachedPath2D);
        }
        drawingContext.strokeStyle = shape.stroke || "grey";
        drawingContext.lineWidth = parseFloat(shape.strokeWidth || 1);
        drawingContext.stroke(shape._cachedPath2D);
      } else if (shape.type === "text" && shape.text) {
        drawingContext.fillStyle = "grey";
        drawingContext.font = `${shape.fontSize || 16}px ${shape.fontFamily || "sans-serif"}`;
        drawingContext.textAlign = "left";
        drawingContext.textBaseline = "alphabetic";
        drawingContext.fillText(shape.text, shape.x || 0, shape.y || 0);
      }
      if (hasTransform) drawingContext.restore();
    } catch (err) {
      console.warn("Error rendering shape:", err);
    }
  });

  pop();
}

function drawCellTypeVectorSVG(vectorData, x, y, size) {
  const { shapes, viewBoxSize } = vectorData;
  const scale = size / viewBoxSize;
  const offsetX = x - size / 2;
  const offsetY = y - size / 2;

  const svgElements = shapes.map(shape => {
    if (!shape || !shape.type) return "";

    try {
      if (shape.type === "path" && shape.d) {
        const fill = shape.fill && shape.fill !== "none" ? `fill="${shape.fill}"` : `fill="none"`;
        const stroke = `stroke="${shape.stroke || "grey"}"`;
        const strokeWidth = `stroke-width="${shape.strokeWidth || 1}"`;

        // return `<path d="${shape.d}" ${fill} ${stroke} ${strokeWidth}" transform="translate(${offsetX},${offsetY}) scale(${scale})" />`;
        return `<path d="${shape.d}" ${fill} ${stroke} ${strokeWidth} transform="translate(${offsetX},${offsetY}) scale(${scale})"/>`;

      } else if (shape.type === "text" && shape.text) {
        const xPos = (shape.x || 0) * scale + offsetX;
        const yPos = (shape.y || 0) * scale + offsetY;
        const fontSize = (shape.fontSize || 16) * scale;
        const fontFamily = shape.fontFamily || "sans-serif";

        return `<text x="${xPos}" y="${yPos}" font-size="${fontSize}" font-family="${fontFamily}" fill="${shape.fill || "grey"}">${shape.text}</text>`;
      }
    } catch (err) {
      console.warn("Error generating SVG shape:", err);
    }

    return "";
  });

  return `<g>${svgElements.join("\n")}</g>`;
}


function drawClusterSVG(x, y, radius, spot, color) {
  if (window.selectedClusterView === "shapes") {
    const clusterNumber = parseInt(spot.cluster, 10);
    const maxShapeCluster = 30;

    if (clusterNumber >= 1 && clusterNumber <= maxShapeCluster) {
      switch (spot.cluster) {
        case "1":
          return `<polygon points="${getTrianglePoints(x, y, radius)}"  fill="none" stroke="${color}" />`;
        case "2":
          return `<g>
                          <line x1="${x - radius}" y1="${y - radius}" x2="${x + radius}" y2="${y + radius}" fill="none" stroke="${color}"/>
                          <line x1="${x - radius}" y1="${y + radius}" x2="${x + radius}" y2="${y - radius}" fill="none" stroke="${color}"/>
                      </g>`;
        case "3":
          return `<circle cx="${x}" cy="${y}" r="${radius}"  fill="none" stroke="${color}"/>`;
        case "4":
          return getStarSVG(x, y, radius, color);
        case "5":
          return drawHexagonSVG(x, y, radius, color);
        case "6":
          return `<rect x="${x - radius}" y="${y - radius}" width="${radius * 2}" height="${radius * 2}"  fill="none" stroke="${color}"/>`;
        case "7":
          return `<polygon points="${getDiamondPoints(x, y, radius)}"  fill="none" stroke="${color}"/>`;
        case "8":
          return `<g>
                          <line x1="${x - radius}" y1="${y}" x2="${x + radius}" y2="${y}" fill="none" stroke="${color}"/>
                          <line x1="${x}" y1="${y - radius}" x2="${x}" y2="${y + radius}" fill="none" stroke="${color}"/>
                      </g>`;
        case "9":
          return `<line x1="${x - radius}" y1="${y}" x2="${x + radius}" y2="${y}" fill="none" stroke="${color}"/>`;
        case "10":
          return `<line x1="${x - radius}" y1="${y + radius}" x2="${x + radius}" y2="${y - radius}" fill="none" stroke="${color}"/>`;
        case "11":
          return `<polygon points="${getPentagonPoints(x, y, radius)}"  fill="none" stroke="${color}"/>`;
        case "12":
          return `<polygon points="${getArrowPoints(x, y, radius)}"  fill="none" stroke="${color}"/>`;
        case "13":
          return `<polygon points="${getChevronPoints(x, y, radius)}"  fill="none" stroke="${color}"/>`;
        case "14":
          return getHashSVG(x, y, radius, color);
        case "15":
          return getCrescentPath(x, y, radius, color)
        case "16":
          return `<ellipse cx="${x}" cy="${y}" rx="${radius * 1.25}" ry="${radius * 0.75}" fill="none" stroke="${color}" />`;
        case "17":
          return getPieSlicePath(x, y, radius, color);
        case "18":
          return getInfinitySVG(x, y, radius, color);
        case "19":
          return getBowtieSVG(x, y, radius, color);
        case "20":
          return `<g>
                          <circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${color}" />
                          <circle cx="${x}" cy="${y}" r="${radius * 0.5}" fill="none" stroke="${color}" />
                      </g>`;
        case "21":
          return `<polygon points="${getTrapezoidPoints(x, y, radius)}" fill="none" stroke="${color}" />`;
        case "22":
          return getSpiralSVG(x, y, radius, color);
        case "23":
          return getZigzagSVG(x, y, radius, color);
        case "24":
          return `<line x1="${x - radius}" y1="${y - radius}" x2="${x + radius}" y2="${y + radius}" fill="none" stroke="${color}" />`;
        case "25":
          return getCrossSVG(x, y, radius, color);
        case "26":
          return `<polygon points="${getRhombusPoints(x, y, radius)}" fill="none" stroke="${color}" />`;
        case "27":
          return `<g>
                          <rect x="${x - radius * 0.6}" y="${y - radius}" width="${radius * 1.2}" height="${radius * 0.4}" fill="none" stroke="${color}" />
                          <rect x="${x - radius * 0.2}" y="${y - radius * 0.6}" width="${radius * 0.4}" height="${radius * 1.5}" fill="none" stroke="${color}" />
                      </g>`;
        case "28":
          return `<g>
                          <line x1="${x - radius}" y1="${y - radius / 3}" x2="${x + radius}" y2="${y - radius / 3}" fill="none" stroke="${color}" />
                          <line x1="${x - radius}" y1="${y + radius / 3}" x2="${x + radius}" y2="${y + radius / 3}" fill="none" stroke="${color}" />
                      </g>`;
        case "29":
          return getLightningSVG(x, y, radius, color);
        case "30":
          return getStarburstSVG(x, y, radius, color);
      }
    } else {
      // If cluster number is greater than 30, loop it back to numbers 1-30
      const loopedClusterNumber = ((clusterNumber - 1) % maxShapeCluster) + 1;
      return `<text x="${x}" y="${y}" dy="${radius * 0.9}" font-size="${radius * 3}" font-family="Arial" stroke="none" text-anchor="middle" fill="${color}">${loopedClusterNumber}</text>`;
    }
  } else if (window.selectedClusterView === "numbers") {

    return `<text x="${x}" y="${y}" dy="${radius * 0.9}" font-size="${radius * 3}" font-family="Arial" stroke="none" text-anchor="middle" fill="${color}">${spot.cluster}</text>`;
  }
}


function drawClusterNumber(x, y, radius, clusterNumber, color) {
  textAlign(CENTER, CENTER);
  textSize(radius * 3);
  textStyle(NORMAL);
  strokeWeight(0.2);
  noStroke();
  fill(color);
  text(clusterNumber, x, y);
}

function drawTriangle(x, y, r) {
  let h = r * sqrt(3) / 2;
  beginShape();
  vertex(x, y - r);
  vertex(x - h, y + r / 2);
  vertex(x + h, y + r / 2);
  endShape(CLOSE);
}

function getTrianglePoints(x, y, r) {
  let h = r * Math.sqrt(3) / 2;
  return `${x},${y - r} ${x - h},${y + r / 2} ${x + h},${y + r / 2}`;
}

function drawX(x, y, r) {
  line(x - r, y - r, x + r, y + r);
  line(x - r, y + r, x + r, y - r);
}

function drawCircle(x, y, r) {
  ellipse(x, y, r * 2);
}

function drawStar(x, y, r) {
  let angle = TWO_PI / 5;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * r;
    let sy = y + sin(a) * r;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * r / 2;
    sy = y + sin(a + halfAngle) * r / 2;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function getStarSVG(x, y, r, color) {
  let angle = (2 * Math.PI) / 5;
  let halfAngle = angle / 2;
  let points = [];

  for (let a = 0; a < (2 * Math.PI); a += angle) {
    let sx = x + Math.cos(a) * r;
    let sy = y + Math.sin(a) * r;
    points.push(`${sx},${sy}`);
    sx = x + Math.cos(a + halfAngle) * r / 2;
    sy = y + Math.sin(a + halfAngle) * r / 2;
    points.push(`${sx},${sy}`);
  }

  return `<polygon points="${points.join(" ")}" fill="none" stroke="${color}" />`;
}

function drawSquare(x, y, r, color='none', strokeWeightValue = 0.9) {
  noFill();
  if (color != 'none') stroke(color);
  strokeWeight(strokeWeightValue);
  beginShape();
  rectMode(CENTER);
  rect(x, y, r * 2, r * 2);
  endShape(CLOSE);
}

function drawDiamond(x, y, r) {
  beginShape();
  vertex(x, y - r);
  vertex(x + r, y);
  vertex(x, y + r);
  vertex(x - r, y);
  endShape(CLOSE);
}

function getDiamondPoints(x, y, r) {
  return `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`;
}

function drawPlus(x, y, r) {
  line(x - r, y, x + r, y);
  line(x, y - r, x, y + r);
}

function drawMinus(x, y, r) {
  line(x - r, y, x + r, y);
}

function drawSlash(x, y, r) {
  line(x - r, y + r, x + r, y - r);
}

function drawPentagon(x, y, radius) {
  beginShape();
  for (let i = 0; i < 5; i++) {
    const angle = (TWO_PI / 5) * i - HALF_PI;
    const px = x + radius * cos(angle);
    const py = y + radius * sin(angle);
    vertex(px, py);
  }
  endShape(CLOSE);
}

function getPentagonPoints(x, y, radius) {
  let points = [];
  for (let i = 0; i < 5; i++) {
    let angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    let px = x + radius * Math.cos(angle);
    let py = y + radius * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  return points.join(" ");
}

function drawArrow(x, y, radius) {
  beginShape();
  vertex(x - radius, y - radius / 2);
  vertex(x, y - radius);
  vertex(x + radius, y - radius / 2);
  vertex(x + radius / 2, y);
  vertex(x + radius, y + radius / 2);
  vertex(x, y + radius);
  vertex(x - radius, y + radius / 2);
  vertex(x - radius / 2, y);
  endShape(CLOSE);
}

function getArrowPoints(x, y, radius) {
  return `${x - radius},${y - radius / 2} 
          ${x},${y - radius} 
          ${x + radius},${y - radius / 2} 
          ${x + radius / 2},${y} 
          ${x + radius},${y + radius / 2} 
          ${x},${y + radius} 
          ${x - radius},${y + radius / 2} 
          ${x - radius / 2},${y}`;
}

function drawChevron(x, y, radius) {
  beginShape();
  vertex(x - radius, y - radius * 0.6);
  vertex(x, y + radius * 0.8);
  vertex(x + radius, y - radius * 0.6);
  vertex(x, y - radius * 0.2);
  endShape(CLOSE);
}

function getChevronPoints(x, y, radius) {
  return `${x - radius},${y - radius * 0.6}
          ${x},${y + radius * 0.8}
          ${x + radius},${y - radius * 0.6}
          ${x},${y - radius * 0.2}`;
}

function drawHash(x, y, radius) {
  beginShape();
  rect(x - radius / 8, y - radius / 2, radius * 2, radius / 6);
  rect(x - radius / 8, y + radius / 2 - radius / 12, radius * 2, radius / 6);
  rect(x - radius / 2, y - radius / 8, radius / 6, radius * 2);
  rect(x + radius / 2 - radius / 9, y - radius / 8, radius / 6, radius * 2);
  endShape(CLOSE);
}

function getHashSVG(x, y, radius, color) {
  return `<g>
            <rect x="${x - radius * 0.95}" y="${y - radius * 0.6}" width="${radius * 1.8}" height="${radius * 0.15}" fill="none" stroke="${color} "/>
            <rect x="${x - radius *0.95 }" y="${y + radius * 0.35}" width="${radius * 1.8}" height="${radius * 0.15}" fill="none" stroke="${color}"/>

            <rect x="${x - radius * 0.6}" y="${y - radius * 0.95 }" width="${radius * 0.15}" height="${radius * 1.8}" fill="none" stroke="${color}"/>
            <rect x="${x + radius * 0.35}" y="${y - radius * 0.95}" width="${radius * 0.15}" height="${radius * 1.8}" fill="none" stroke="${color}"/>
          </g>`;
}

function drawCrescent(x, y, radius) {
  beginShape();
  arc(x, y, radius * 2.2, radius * 2.2, PI / 4, (7 * PI) / 4, PIE);
  endShape(CLOSE);
}

function getCrescentPath(x, y, radius, color) {
  let outerRadius = radius * 1.2; // Slightly larger outer circle
  let innerRadius = radius * 0.7; // Inner cutout
  let startAngle = Math.PI / 4; // Start of arc
  let endAngle = (7 * Math.PI) / 4; // End of arc

  let x1 = x + Math.cos(startAngle) * outerRadius;
  let y1 = y + Math.sin(startAngle) * outerRadius;
  let x2 = x + Math.cos(endAngle) * outerRadius;
  let y2 = y + Math.sin(endAngle) * outerRadius;

  let cutX = x + Math.cos((startAngle + endAngle) / 2) * (innerRadius * 0.2);
  let cutY = y + Math.sin((startAngle + endAngle) / 2) * (innerRadius * 0.2);

  return `<path d="M ${x1},${y1} 
                  A ${outerRadius},${outerRadius} 0 1,1 ${x2},${y2}
                  L ${cutX},${cutY} 
                  Z" fill="none" stroke="${color}"/>`;
}

function drawEllipse(x, y, radius) {
  beginShape();
  ellipse(x, y, radius * 2.5, radius);
  endShape(CLOSE);
}

function drawPieSlice(x, y, radius) {
  beginShape();
  arc(x, y, radius * 3.5, radius * 2.5, 2, PI / 4, PIE);
  endShape(CLOSE);
}

function getPieSlicePath(x, y, radius, color) {
  let outerRadiusX = radius * 1.8;
  let outerRadiusY = radius * 1.35;
  let innerRadius = radius * 0.5;

  let startAngle = 2;
  let endAngle = Math.PI / 4;

  // Outer ellipse arc points
  let x1 = x + Math.cos(startAngle) * outerRadiusX;
  let y1 = y + Math.sin(startAngle) * outerRadiusY;
  let x2 = x + Math.cos(endAngle) * outerRadiusX;
  let y2 = y + Math.sin(endAngle) * outerRadiusY;

  let cutX = x + Math.cos((startAngle - endAngle) / 2) * (innerRadius * 0.2);
  let cutY = y + Math.sin((startAngle - endAngle) / 2) * (innerRadius * 0.2);

  return `<path d="M ${x1},${y1} 
                  A ${outerRadiusX},${outerRadiusY} 0 1,1 ${x2},${y2}
                  L ${cutX},${cutY} 
                  Z" fill="none" stroke="${color}"/>`;
}

function drawInfinity(x, y, radius) {
  beginShape();
  const ellipseWidth = radius * 1.2;
  const ellipseHeight = radius * 0.8;
  const spacing = radius * 0.6;
  ellipse(x - spacing, y, ellipseWidth, ellipseHeight);
  ellipse(x + spacing, y, ellipseWidth, ellipseHeight);
  endShape(CLOSE);
}

function getInfinitySVG(x, y, radius, color) {
  return `<g>
              <ellipse cx="${x - radius * 0.81}" cy="${y}" rx="${radius * 0.7}" ry="${radius * 0.5}" fill="none" stroke="${color}"/>

              <ellipse cx="${x + radius * 0.81}" cy="${y}" rx="${radius * 0.7}" ry="${radius * 0.5}" fill="none" stroke="${color}"/>
          </g>`;
}

function drawBowtie(x, y, radius) {
  beginShape();
  vertex(x - radius * 1.2, y - radius * 0.6);
  vertex(x, y);
  vertex(x - radius * 1.2, y + radius * 0.6);
  vertex(x + radius * 1.2, y + radius * 0.6);
  vertex(x, y);
  vertex(x + radius * 1.2, y - radius * 0.6);
  endShape(CLOSE);
}

function getBowtieSVG(x, y, radius, color) {
  return `<polygon points="
          ${x - radius * 1.2},${y - radius * 0.6} 
          ${x},${y} 
          ${x - radius * 1.2},${y + radius * 0.6} 
          ${x + radius * 1.2},${y + radius * 0.6} 
          ${x},${y} 
          ${x + radius * 1.2},${y - radius * 0.6}" 
           fill="none" stroke="${color}" />`;
}

function drawDoubleCircle(x, y, radius) {
  beginShape();
  ellipse(x, y, radius * 2, radius * 2);
  ellipse(x, y, radius, radius);
  endShape(CLOSE);
}

function drawTrapezoid(x, y, radius) {
  beginShape();
  vertex(x - radius * 1.2, y + radius * 0.6);
  vertex(x - radius * 0.6, y - radius * 0.6);
  vertex(x + radius * 0.6, y - radius * 0.6);
  vertex(x + radius * 1.2, y + radius * 0.6);
  endShape(CLOSE);
}

function getTrapezoidPoints(x, y, radius) {
  return `${x - radius * 1.2},${y + radius * 0.6}
          ${x - radius * 0.6},${y - radius * 0.6}
          ${x + radius * 0.6},${y - radius * 0.6}
          ${x + radius * 1.2},${y + radius * 0.6}`;
}

function drawSpiral(x, y, radius) {
  beginShape();
  const numLoops = 3;
  const points = 100;
  const angleStep = (TWO_PI * numLoops) / points;
  const maxRadius = radius;
  for (let i = 0; i <= points; i++) {
    const angle = i * angleStep;
    const r = (maxRadius * i) / points;
    const px = x + r * cos(angle);
    const py = y + r * sin(angle);
    vertex(px, py);
  }
  endShape(CLOSE);
}

function getSpiralSVG(x, y, radius, color) {
  let points = [];
  const numLoops = 3;
  const steps = 100;
  const angleStep = ((2 * Math.PI) * numLoops) / steps;
  const maxRadius = radius;
  for (let i = 0; i <= steps; i++) {
    const angle = i * angleStep;
    const r = (maxRadius * i) / steps;
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    points.push(`${px},${py}`);
  }

  return `<polyline points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="0.7"/>`;
}


function drawZigzag(x, y, radius) {
  beginShape();
  vertex(x - radius, y);
  vertex(x - radius / 2, y - radius / 2);
  vertex(x, y);
  vertex(x + radius / 2, y - radius / 2);
  vertex(x + radius, y);
  endShape(CLOSE);
}

function getZigzagSVG(x, y, radius, color) {
  return `<polyline points="
              ${x - radius},${y} 
              ${x - radius / 2},${y - radius / 2} 
              ${x},${y} 
              ${x + radius / 2},${y - radius / 2} 
              ${x + radius},${y}" 
              fill="none" stroke="${color}" />`;
}


function drawBackSlash(x, y, radius) {
  beginShape();
  line(x - radius, y - radius, x + radius, y + radius);
  endShape(CLOSE);
}

function drawCross(x, y, radius) {
  beginShape();
  rect(x - radius / 9, y - radius / 9, radius / 2, radius * 3);
  rect(x - radius / 9, y - radius / 9, radius * 3, radius / 2);
  endShape(CLOSE);
}

function getCrossSVG(x, y, radius, color) {
  return `<g>
            <!-- Vertical Rectangle -->
            <rect x="${x - radius / 4}" y="${y - radius * 1.5}" 
                  width="${radius / 2}" height="${radius * 3}" 
                  fill="none" stroke="${color}" stroke-width="1"/>

            <!-- Horizontal Rectangle -->
            <rect x="${x - radius * 1.5}" y="${y - radius / 4}" 
                  width="${radius * 3}" height="${radius / 2}" 
                  fill="none" stroke="${color}" stroke-width="1"/>
          </g>`;
}

function drawRhombus(x, y, radius) {
  let offsetX = radius * 0.6;
  let offsetY = radius * 0.5;

  beginShape();
  vertex(x - radius + offsetX / 2, y - offsetY);
  vertex(x + radius + offsetX / 2, y - offsetY);
  vertex(x + radius - offsetX + offsetX / 2, y + offsetY);
  vertex(x - radius - offsetX + offsetX / 2, y + offsetY);
  endShape(CLOSE);
}

function getRhombusPoints(x, y, radius) {
  let offsetX = radius * 0.6;
  let offsetY = radius * 0.5;
  return `${x - radius + offsetX / 2},${y - offsetY} 
          ${x + radius + offsetX / 2},${y - offsetY} 
          ${x + radius - offsetX + offsetX / 2},${y + offsetY} 
          ${x - radius - offsetX + offsetX / 2},${y + offsetY}`;
}

function drawTShape(x, y, radius) {
  beginShape();
  rect(x, y - radius * 0.8, radius * 1.2, radius * 0.4);
  rect(x, y, radius * 0.4, radius * 1.5);
  endShape(CLOSE);
}

function drawBracket(x, y, radius) {
  beginShape();
  vertex(x - radius, y - radius / 3);
  vertex(x + radius, y - radius / 3);
  endShape();

  beginShape();
  vertex(x - radius, y + radius / 3);
  vertex(x + radius, y + radius / 3);
  endShape();
}

function drawLightning(x, y, radius) {
  beginShape();
  vertex(x - radius / 3, y - radius);
  vertex(x, y - radius / 3);
  vertex(x - radius / 3, y);
  vertex(x, y + radius / 3);
  vertex(x - radius / 3, y + radius);
  vertex(x + radius / 3, y + radius / 3);
  vertex(x, y);
  vertex(x + radius / 3, y - radius / 3);
  vertex(x - radius / 3, y - radius);
  endShape(CLOSE);
}

function getLightningSVG(x, y, radius, color) {
  return `<polygon points="
          ${x - radius / 3},${y - radius} 
          ${x},${y - radius / 3} 
          ${x - radius / 3},${y} 
          ${x},${y + radius / 3} 
          ${x - radius / 3},${y + radius} 
          ${x + radius / 3},${y + radius / 3} 
          ${x},${y} 
          ${x + radius / 3},${y - radius / 3} 
          ${x - radius / 3},${y - radius}" 
           fill="none" stroke="${color}"/>`;
}

function drawStarburst(x, y, radius) {
  beginShape();
  for (let i = 0; i < 12; i++) {
    const angle = (TWO_PI / 12) * i;
    const x1 = x + radius * cos(angle);
    const y1 = y + radius * sin(angle);
    line(x, y, x1, y1);
  }
  endShape(CLOSE);
}

function getStarburstSVG(x, y, radius, color) {
  let lines = [];
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i;
    const x1 = x + radius * Math.cos(angle);
    const y1 = y + radius * Math.sin(angle);
    lines.push(`<line x1="${x}" y1="${y}" x2="${x1}" y2="${y1}" fill="none" stroke="${color}"/>`);
  }
  return `<g>${lines.join("\n")}</g>`;
}

function drawHexagon(x, y, radius, color, strokeWeightValue = 0.9) {
  noFill();
  stroke(color);
  strokeWeight(strokeWeightValue);

  beginShape();
  for (let i = 0; i < 6; i++) {
    let angle = TWO_PI / 6 * i + PI / 6;
    let vx = x + cos(angle) * radius;
    let vy = y + sin(angle) * radius;
    vertex(vx, vy);
  }
  endShape(CLOSE);

}

function drawHexagonSVG(x, y, radius, color) {
  let points = []
  for (let i = 0; i < 6; i++) {
    let angle = (2 * Math.PI) / 6 * i + Math.PI / 6;
    let vx = x + Math.cos(angle) * radius;
    let vy = y + Math.sin(angle) * radius;
    //vertex(vx, vy);
    points.push(`${vx},${vy}`);
  }
  return `<polygon points="${points.join(" ")}"  fill="none" stroke="${color}" stoke-weight="0.9"/>`;
}

function mouseWheel(event) {

  if (event.target.closest(".controls")) {
    return; // Ignore scroll events on the controls div
  }

  if (!event.target.className.includes("p5Canvas")) {
    return;
  }

  event.preventDefault();
  let zoomAmount = -event.delta * 0.001;
  let newZoomFactor = zoomFactor + zoomAmount;

  // Constrain the zoom level
  newZoomFactor = constrain(newZoomFactor, 0.1, 10);

  // Calculate the new offsets based on mouse position in world coordinates
  let worldMouseX = (mouseX - panX) / zoomFactor;
  let worldMouseY = (mouseY - panY) / zoomFactor;

  panX -= worldMouseX * (newZoomFactor - zoomFactor);
  panY -= worldMouseY * (newZoomFactor - zoomFactor);

  zoomFactor = newZoomFactor;
}

function mouseDragged(event) {
  if (!event.target.className.includes("p5Canvas")) {
    return;
  }
  event.preventDefault();

  panX += movedX;
  panY += movedY;
}

function isMouseOverHexagon(x, y, radius) {
  let d = dist(mouseX, mouseY, x, y);
  return d < radius;
}

function pointInHexagon(px, py, hx, hy, size) {
  for (let i = 0; i < 6; i++) {
    let angle1 = PI / 3 * i;
    let angle2 = PI / 3 * (i + 1);
    let x1 = hx + cos(angle1) * size;
    let y1 = hy + sin(angle1) * size;
    let x2 = hx + cos(angle2) * size;
    let y2 = hy + sin(angle2) * size;
    if (pointInTriangle(px, py, hx, hy, x1, y1, x2, y2)) {
      return true;
    }
  }
  return false;
}

function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  let d1, d2, d3;
  let has_neg, has_pos;

  d1 = sign(px, py, x1, y1, x2, y2);
  d2 = sign(px, py, x2, y2, x3, y3);
  d3 = sign(px, py, x3, y3, x1, y1);

  has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

  return !(has_neg && has_pos);
}

function sign(px, py, x1, y1, x2, y2) {
  return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
}

function getHoveredHexagon(mouseX, mouseY) {
  for (let hex of spots) {
    if (pointInHexagon(mouseX, mouseY, hex.scaledX, hex.scaledY, hex.scaledRadius)) {
      return hex
    }
  }
  return null;
}