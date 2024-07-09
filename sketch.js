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
  let myCanvas=createCanvas(canvasWidth, canvasHeight);
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

    const spotMembership = [spot.x1, spot.x2, spot.x3, spot.x4, spot.x5, spot.x6, spot.x7, spot.x8, spot.x9]
    let sortedSpotMembership = spotMembership.sort((a, b) => b.value - a.value);

    drawHexagon(scaledX, scaledY, (spot.radius + 40) * scaleFactor, sortedSpotMembership[0].color);
    if(zoomFactor>4.2 || window.showAllLevels){
      drawHexagon(scaledX, scaledY, (spot.radius + 30) * scaleFactor, sortedSpotMembership[1].color);
      drawHexagon(scaledX, scaledY, (spot.radius + 15) * scaleFactor, sortedSpotMembership[2].color);  
    }
  });
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

