let canvasWidth = 800;
let canvasHeight = 600;
let spots = [];
window.drawAtWill = false;
let img;


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

  if (window.showImage) {
    image(img, imgX, imgY, imgWidth, imgHeight);
  }



  spots.forEach(spot => {
    let scaledX = (spot.x - minX) * scaleFactor + offsetX;
    let scaledY = (spot.y - minY) * scaleFactor + offsetY;
    spot.scaledX = scaledX
    spot.scaledY = scaledY
    const spotMembership = [spot.x1, spot.x2, spot.x3, spot.x4, spot.x5, spot.x6, spot.x7, spot.x8, spot.x9]
    let sortedSpotMembership = spotMembership.sort((a, b) => b.value - a.value);

    drawHexagon(scaledX, scaledY, (spot.radius + 40) * scaleFactor, sortedSpotMembership[0].color, true);
    if (zoomFactor > 4.2 || window.showAllLevels) {
      drawHexagon(scaledX, scaledY, (spot.radius + 30) * scaleFactor, sortedSpotMembership[1].color);
      drawHexagon(scaledX, scaledY, (spot.radius + 18) * scaleFactor, sortedSpotMembership[2].color);
    }
  });

  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    spots.forEach(spot => {
      if (isMouseOverHexagon(spot.scaledX, spot.scaledY, spot.radius)) {
        displayTooltip(mouseX, mouseY, spot);
      }
    })
  }
}

function drawHexagon(x, y, radius, color, withOverlay = false) {
  noFill();
  stroke(color);
  strokeWeight(0.7);

  beginShape();
  for (let i = 0; i < 6; i++) {
    let angle = TWO_PI / 6 * i + PI / 6;
    let vx = x + cos(angle) * radius;
    let vy = y + sin(angle) * radius;
    vertex(vx, vy);

    if (withOverlay) {
      push()
      fill(142)
      stroke(142);
      ellipse(vx, vy, radius * 0.12, radius * 0.12);
      pop()
    }
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
  for (let i = 0; i < 6; i++) {
    let angle = TWO_PI / 6 * i;
    let x_i = x + cos(angle) * radius;
    let y_i = y + sin(angle) * radius;
    let nextAngle = TWO_PI / 6 * (i + 1);
    let x_next = x + cos(nextAngle) * radius;
    let y_next = y + sin(nextAngle) * radius;
    if (pointInTriangle(mouseX, mouseY, x, y, x_i, y_i, x_next, y_next)) {
      return true;
    }
  }
  return false;
}

function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  let d1 = sign(px, py, x1, y1, x2, y2);
  let d2 = sign(px, py, x2, y2, x3, y3);
  let d3 = sign(px, py, x3, y3, x1, y1);
  let hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  let hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

function sign(px, py, x1, y1, x2, y2) {
  return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
}

function displayTooltip(x, y, spot) {
  const tooltipText = `
  x1: ${parseFloat(spot.x1.value).toFixed(3)} \n
  x2: ${parseFloat(spot.x2.value).toFixed(3)} \n
  x3: ${parseFloat(spot.x3.value).toFixed(3)} \n
  x4: ${parseFloat(spot.x4.value).toFixed(3)} \n
  x5: ${parseFloat(spot.x5.value).toFixed(3)} \n
  x6: ${parseFloat(spot.x6.value).toFixed(3)} \n
  x7: ${parseFloat(spot.x7.value).toFixed(3)} \n
  x8: ${parseFloat(spot.x8.value).toFixed(3)} \n
  x9: ${parseFloat(spot.x9.value).toFixed(3)}`
  let tooltipWidth = textWidth(tooltipText) * 2;
  let tooltipHeight = 280;

  // Adjust tooltip position if it goes out of canvas
  if (x + tooltipWidth > width) {
    x -= tooltipWidth;
  }
  if (y + tooltipHeight > height) {
    y -= tooltipHeight;
  }

  fill(0);
  rect(x, y, tooltipWidth, tooltipHeight);
  fill(255);
  stroke(255);
  textAlign(CENTER, CENTER);
  text(tooltipText, x + tooltipWidth / 2, y + tooltipHeight / 2);
}



