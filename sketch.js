//© Heba Sailem, heba.sailem@kcl.ac.uk

let canvasWidth = 800;
let canvasHeight = 600;
let spots = [];
window.drawAtWill = false;
let img;
window.hoveredHex = null;
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
  if (mouseOverCanvas) {
    hoveredHex = getHoveredHexagon(adjustedMouseX, adjustedMouseY);
  }
  // console.log(hoveredHex)
  if (hoveredHex) {
    infoBox.innerHTML = `
            <h6 class="card-title">Spot ${hoveredHex.index} ${hoveredHex.barcode}</h6>
            <p class="card-text h6"><small> ${hoveredHex.getSummary()}</small></p>`
  }
}

function clearCanvas() {
  clear()
}

function setupCanvas(width, height, newSpots) {
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

  // Draw the hexagon grid
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
  let imgX = (minX - minX) * scaleFactor + offsetX;
  let imgY = (minY - minY) * scaleFactor + offsetY;
  let imgWidth = dataWidth * scaleFactor;
  let imgHeight = dataHeight * scaleFactor;

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
        drawHexagon(scaledX, scaledY, (spot.radius + 30) * scaleFactor, sortedSpotMembership[1].color);
        drawHexagon(scaledX, scaledY, (spot.radius + 18) * scaleFactor, sortedSpotMembership[2].color);
      }
      if (window.showCluster) {
        const shapeRadius = (spot.radius - 30) * scaleFactor;
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
            drawHexagon(scaledX, scaledY, shapeRadius, sortedSpotMembership[0].color)
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
        }
      }
    } else {
      drawHexagon(scaledX, scaledY, (spot.radius + 40) * scaleFactor, spot.values[window.sketchOptions.selectedGene || 0].color);

    }
  });


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



function drawHexagon(x, y, radius, color) {
  noFill();
  stroke(color);
  strokeWeight(0.7);

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
      return hex;
    }
  }
  return null;
}



