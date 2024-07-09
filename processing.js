//document.getElementById("image").addEventListener("change", imageUploaded)
document.getElementById("positions").addEventListener("change", positinosUploaded)
document.getElementById("values").addEventListener("change", valuesUploaded)
document.getElementById("showImage").addEventListener("change", showImageChanged)
document.getElementById("showAllLevels").addEventListener("change", showAllLevelsChanged)

let positionsData = []
let valuesData = []
let dataSpots = []
let imageWidth;
let imageHeight;
window.showImage = false;
window.showAllLevels = false;

async function showDemo() {

    let valuesCsv = await fetch('./SpotClusterMembership.csv')
    let valuesRes = await valuesCsv.text()
    console.log(valuesRes);
    const valuesText = valuesRes;
    const valuesRows = valuesText.split('\n');
    valuesData = valuesRows.map(row => row.split(','));


    let positionsCsv = await fetch('./SpotPositions.csv')
    let positionsRes = await positionsCsv.text()
    console.log(positionsRes);
    const positionsText = positionsRes;
    const positionsRows = positionsText.split('\n');
    positionsData = positionsRows.map(row => row.split(','));


    generateVis()
}



function showImageChanged(e) {
    console.log(e.target.checked)
    window.showImage = e.target.checked;
}

function showAllLevelsChanged(e){
    console.log(e.target.checked)
    window.showAllLevels = e.target.checked;
}

function imageUploaded(e) {
    console.log(e)
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    const image = new Image();
    image.onload = function () {
        imageWidth = this.width
        imageHeight = this.height
    }
    image.src = URL.createObjectURL(file);
    /*let reader = new FileReader();
    reader.onload = function(e) {
      window.uploadedImage = e.target.result;
    };
    reader.readAsDataURL(file);*/

}

function positinosUploaded(e) {
    console.log(e)
    const file = e.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const text = e.target.result;
            const rows = text.split('\n');
            positionsData = rows.map(row => row.split(','));

            console.log(positionsData);
        };

        reader.readAsText(file);
    }
}


function valuesUploaded(e) {
    console.log(e)
    const file = e.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const text = e.target.result;
            const rows = text.split('\n');
            valuesData = rows.map(row => row.split(','));
            console.log(valuesData);
        };

        reader.readAsText(file);
    }
}

function generateVis() {
    for (let i = 1; i < positionsData.length - 1; i++) {
        let spotCoords = positionsData[i];
        let spotValues = valuesData[i];
        dataSpots.push(new Spot(spotCoords[0], spotCoords[1], spotCoords[2], spotCoords[3], spotValues[1], spotValues[2], spotValues[3], spotValues[4], spotValues[5], spotValues[6], spotValues[7], spotValues[8], spotValues[9]))
    }
    console.log(dataSpots)
    window.drawAtWill = true
    setupCanvas(1000, 1000, dataSpots)
}

class Spot {
    constructor(barcode, x, y, radius, x1, x2, x3, x4, x5, x6, x7, x8, x9) {
        this.barcode = barcode;
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.radius = parseFloat(radius);
        this.x1 = { value: parseFloat(x1), color: "#FF0000" }; //red
        this.x2 = { value: parseFloat(x2), color: "#FFA500" }; //orange
        this.x3 = { value: parseFloat(x3), color: "#90EE90" }; //light green
        this.x4 = { value: parseFloat(x4), color: "#00FF00" }; //green
        this.x5 = { value: parseFloat(x5), color: "#32CD32" }; //lime green..i guess
        this.x6 = { value: parseFloat(x6), color: "#87CEEB" }; //sky blue
        this.x7 = { value: parseFloat(x7), color: "#0000FF" }; //blue
        this.x8 = { value: parseFloat(x8), color: "#800080" }; //purple
        this.x9 = { value: parseFloat(x9), color: "#FFC0CB" }; //is that pink?
    }
}