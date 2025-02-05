//© Heba Sailem, heba.sailem@kcl.ac.uk
let canvasWidth = 800;
let canvasHeight = 600;
let spots = [];
window.drawAtWill = false;
let img;
let saveFlag = false
window.hoveredHex = null;
window.clickedHex = null;
let mouseOverCanvas = false; 
let infoBox = document.getElementById("infoBox")

document.getElementById("image").addEventListener("change", imageUploaded)

function imageUploaded(event) {
  const file = event.target.files[0];

  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();

    reader.onload = function (e) {
      // Create an image element using p5.js
      img = createImg(e.target.result, '');
      img.hide();
    };

    reader.readAsDataURL(file);
  } else {
    console.log('Not an image file!');
  }

}

// Zoom and pan variables
let zoomFactor = 1;
let panX = 0;
let panY = 0;

function saveSVG() {
  saveFlag = true
  window.drawAtWill = true;
}

function setup() {
  img = loadImage("./image.png")
  let myCanvas = createCanvas(canvasWidth, canvasHeight);
  myCanvas.parent("canvasContainer")

  setupCanvas(canvasWidth, canvasHeight, []);
}

function draw() {
  if (!window.drawAtWill) {
    return
  }
  background("#FFFFFF");
  translate(panX, panY);
  scale(zoomFactor);
  drawHexagonGrid(spots);
  let adjustedMouseX = (mouseX - panX) / zoomFactor;
  let adjustedMouseY = (mouseY - panY) / zoomFactor;
  if (mouseOverCanvas && window.mode == "cellComposition") {
    hoveredHex = getHoveredHexagon(adjustedMouseX, adjustedMouseY);
  }
  if (hoveredHex) {
    infoBox.innerHTML = `
            <h6 class="card-title">${hoveredHex.index} ${hoveredHex.barcode}</h6>
            <p class="card-text h6"><small> ${hoveredHex.getSummary()}</small></p>`
  } 
  // else{
  //   infoBox.innerHTML =''
  // }

  if (saveFlag) {
    save("tissue_plot");
    saveFlag = false  
  }

}

function clearCanvas() {
  clear()
}

function showBarChart(index, barcode, data, isCellComposition) {
  const modal = document.getElementById("chartModal");
  const modalDialog = modal.querySelector(".modal-dialog");
  // const modalTitle = document.getElementById("modalTitle");
  const closeModalButton = document.getElementById("closeModal");
  const chartContainer = document.getElementById("barChart");

  chartContainer.innerHTML = "";

  // modalTitle.innerText = `${index}: ${barcode}`;

  modal.style.display = "block";

  modal.addEventListener("click", function (e) {
    if (!modalDialog.contains(e.target)) {
      modal.style.display = "none";
      chartContainer.innerHTML = "";
    }
  });

  // Add a click event to close the modal
  closeModalButton.onclick = () => {
    modal.style.display = "none";
    chartContainer.innerHTML = "";
  };

  if (isCellComposition) {
    labels = data.map(item => item.label);
    values = data.map(item => item.value);
    colors = data.map(item => item.color);
  } else {
    const clusterCounts = {};
    const clusterColors = {};

    data.forEach(item => {
      const clusterValue = item.value;
      const clusterColor = item.color;

      clusterCounts[clusterValue] = (clusterCounts[clusterValue] || 0) + 1;

      if (!clusterColors[clusterValue]) {
        clusterColors[clusterValue] = clusterColor;
      }
    });

    labels = Object.keys(clusterCounts).map(value => `${value}`);
    values = Object.values(clusterCounts);
    colors = Object.keys(clusterCounts).map(value => clusterColors[value]);
  }


  const trace = {
    x: labels,
    y: values,
    type: "bar",
    marker: {
      color: colors,
    },
    text: isCellComposition ? values.map((value, index) => `${labels[index]}: ${value.toFixed(2)}`) : values.map((value, index) => `${labels[index]}: ${value}`),
    hoverinfo: "text",
    textposition: "none",
  };

  const layout = {
    xaxis: {
      title: isCellComposition ? "Cell type" : "Clusters",
    },
    yaxis: {
      title: "Values",
      range: [0, Math.max(...values) + 0.1],
    },
    margin: {
      t: 5,
      l: 50,
      r: 20,
      b: 40,
    },
    hovermode: "closest",
    responsive: true,
  };

  Plotly.newPlot("barChart", [trace], layout);
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

      const barChartData = clickedHex.values.map((value, index) => ({
        label: `X${index + 1}`,
        value: parseFloat(value.value) || 0,
        color: value.color,
      }));

      if (window.mode == "cellComposition") {
        showBarChart(clickedHex.index, clickedHex.barcode, barChartData, true);
      }
      // else {
      //   showBarChart(clickedHex.index, clickedHex.barcode, barChartData, false);
      // }
    }
  })

  drawHexagonGrid(spots);
}

function drawHexagonGrid(spots) {
  let minX = Math.min(...spots.map(spot => spot.x));
  let maxX = Math.max(...spots.map(spot => spot.x));
  let minY = Math.min(...spots.map(spot => spot.y));
  let maxY = Math.max(...spots.map(spot => spot.y));

  let dataWidth = maxX - minX;
  let dataHeight = maxY - minY;
  let scaleFactor = Math.min(canvasWidth / dataWidth, canvasHeight / dataHeight);

  let offsetX = (canvasWidth - dataWidth * scaleFactor) / 2;
  let offsetY = (canvasHeight - dataHeight * scaleFactor) / 2;

  //console.log(window.uploadedImage)
  // Draw the image behind the hexagons
  let imgX = (minX - minX) * scaleFactor + offsetX - 108;
  let imgY = (minY - minY) * scaleFactor + offsetY - 119;
  let imgWidth = dataWidth * scaleFactor + 220;
  let imgHeight = dataHeight * scaleFactor + 220;

  if (img && window.showImage) {
    image(img, imgX, imgY, imgWidth, imgHeight);
  }

  spots.forEach(spot => {
    let scaledX = (spot.x - minX) * scaleFactor + offsetX;
    let scaledY = (spot.y - minY) * scaleFactor + offsetY;
    spot.scaledX = scaledX
    spot.scaledY = scaledY
    spot.scaledRadius = (spot.radius + 40) * scaleFactor
    if (window.mode == "cellComposition") {
      const spotMembership = [...spot.values]
      let sortedSpotMembership = spotMembership.sort((a, b) => b.value - a.value);

      drawHexagon(scaledX, scaledY, (spot.radius + 40) * scaleFactor, sortedSpotMembership[0].color);
      if ((zoomFactor > 4.2 || window.showAllLevels) && !window.showCluster) {
        drawHexagon(scaledX, scaledY, (spot.radius + 25) * scaleFactor, sortedSpotMembership[1].color);
        drawHexagon(scaledX, scaledY, (spot.radius + 10) * scaleFactor, sortedSpotMembership[2].color);
      }
      if (window.showCluster) {
        const shapeRadius = (spot.radius - 30) * scaleFactor;
        switchCaseCluster(scaledX, scaledY, shapeRadius, spot, sortedSpotMembership[0].color)
      }
    } else {
      drawHexagon(scaledX, scaledY, (spot.radius + 40) * scaleFactor, spot.values[window.sketchOptions.selectedGene].color);
      if (window.showCluster) {
        const shapeRadius = (spot.radius - 30) * scaleFactor;
        switchCaseCluster(scaledX, scaledY, shapeRadius, spot, spot.values[0].color)
      }
    }
  });

}

function switchCaseCluster(scaledX, scaledY, shapeRadius, spot, colorValue) {
  if (window.selectedClusterView === "shapes") {
    switch (spot.cluster) {
      case "1":
        drawTriangle(scaledX, scaledY, shapeRadius)
        break;
      case "2":
        drawX(scaledX, scaledY, shapeRadius)
        break;
      case "3":
        drawCircle(scaledX, scaledY, shapeRadius)
        break;
      case "4":
        drawStar(scaledX, scaledY, shapeRadius)
        break;
      case "5":
        drawHexagon(scaledX, scaledY, shapeRadius, colorValue)
        break;
      case "6":
        drawSquare(scaledX, scaledY, shapeRadius)
        break;
      case "7":
        drawDiamond(scaledX, scaledY, shapeRadius)
        break;
      case "8":
        drawPlus(scaledX, scaledY, shapeRadius)
        break;
      case "9":
        drawMinus(scaledX, scaledY, shapeRadius)
        break;
      case "10":
        drawSlash(scaledX, scaledY, shapeRadius)
        break;
      case "11":
        drawPentagon(scaledX, scaledY, shapeRadius);
        break;
      case "12":
        drawArrow(scaledX, scaledY, shapeRadius);
        break;
      case "13":
        drawChevron(scaledX, scaledY, shapeRadius);
        break;
      case "14":
        drawHash(scaledX, scaledY, shapeRadius);
        break;
      case "15":
        drawCrescent(scaledX, scaledY, shapeRadius);
        break;
      case "16":
        drawEllipse(scaledX, scaledY, shapeRadius);
        break;
      case "17":
        drawPieSlice(scaledX, scaledY, shapeRadius);
        break;
      case "18":
        drawInfinity(scaledX, scaledY, shapeRadius);
        break;
      case "19":
        drawBowtie(scaledX, scaledY, shapeRadius);
        break;
      case "20":
        drawDoubleCircle(scaledX, scaledY, shapeRadius);
        break;
      case "21":
        drawTrapezoid(scaledX, scaledY, shapeRadius);
        break;
      case "22":
        drawSpiral(scaledX, scaledY, shapeRadius);
        break;
      case "23":
        drawZigzag(scaledX, scaledY, shapeRadius);
        break;
      case "24":
        drawBackSlash(scaledX, scaledY, shapeRadius);
        break;
      case "25":
        drawCross(scaledX, scaledY, shapeRadius);
        break;
      case "26":
        drawRhombus(scaledX, scaledY, shapeRadius);
        break;
      case "27":
        drawTShape(scaledX, scaledY, shapeRadius);
        break;
      case "28":
        drawBracket(scaledX, scaledY, shapeRadius);
        break;
      case "29":
        drawLightning(scaledX, scaledY, shapeRadius);
        break;
      case "30":
        drawStarburst(scaledX, scaledY, shapeRadius);
        break;
    }
  } else if (window.selectedClusterView === "numbers") {
    // Displaying the cluster number instead of a shape
    drawClusterNumber(scaledX, scaledY, shapeRadius, spot.cluster);
  }
}

function drawClusterNumber(x, y, radius, clusterNumber) {
  textAlign(CENTER, CENTER);
  textSize(radius * 3); 
  textStyle(NORMAL);
  strokeWeight(0.3);
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

function drawSquare(x, y, r) {
  rectMode(CENTER);
  rect(x, y, r * 2, r * 2);
}

function drawDiamond(x, y, r) {
  beginShape();
  vertex(x, y - r);
  vertex(x + r, y);
  vertex(x, y + r);
  vertex(x - r, y);
  endShape(CLOSE);
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

function drawChevron(x, y, radius) {
  beginShape();
  vertex(x - radius, y - radius * 0.6);
  vertex(x, y + radius * 0.8);
  vertex(x + radius, y - radius * 0.6);
  vertex(x, y - radius * 0.2);
  endShape(CLOSE);
}

function drawHash(x, y, radius) {
  beginShape();
  rect(x - radius / 8, y - radius / 2, radius * 2, radius / 6);
  rect(x - radius / 8, y + radius / 2 - radius / 12, radius * 2, radius / 6);
  rect(x - radius / 2, y - radius / 8, radius / 6, radius * 2);
  rect(x + radius / 2 - radius / 9, y - radius / 8, radius / 6, radius * 2);
  endShape(CLOSE);
}

function drawCrescent(x, y, radius) {
  beginShape();
  arc(x, y, radius * 2.2, radius * 2.2, PI / 4, (7 * PI) / 4, PIE);
  endShape(CLOSE);
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

function drawInfinity(x, y, radius) {
  beginShape();
  const ellipseWidth = radius * 1.2;
  const ellipseHeight = radius * 0.8;
  const spacing = radius * 0.6;
  ellipse(x - spacing, y, ellipseWidth, ellipseHeight);
  ellipse(x + spacing, y, ellipseWidth, ellipseHeight);
  endShape(CLOSE);
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

function drawZigzag(x, y, radius) {
  beginShape();
  vertex(x - radius, y);
  vertex(x - radius / 2, y - radius / 2);
  vertex(x, y);
  vertex(x + radius / 2, y - radius / 2);
  vertex(x + radius, y);
  endShape(CLOSE);
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

function drawRhombus(x, y, radius) {
  beginShape();
  vertex(x, y - radius);
  vertex(x + radius, y);
  vertex(x, y + radius);
  vertex(x - radius, y);
  endShape(CLOSE);
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

function drawHexagon(x, y, radius, color) {
  noFill();
  stroke(color);
  strokeWeight(0.9);

  beginShape();
  for (let i = 0; i < 6; i++) {
    let angle = TWO_PI / 6 * i + PI / 6;
    let vx = x + cos(angle) * radius;
    let vy = y + sin(angle) * radius;
    vertex(vx, vy);
  }
  endShape(CLOSE);

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