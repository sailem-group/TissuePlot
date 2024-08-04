document.getElementById("positions").addEventListener("change", positinosUploaded)
document.getElementById("values").addEventListener("change", valuesUploaded)
document.getElementById("showImage").addEventListener("change", showImageChanged)
document.getElementById("showAllLevels").addEventListener("change", showAllLevelsChanged)
document.getElementById("showCluster").addEventListener("change", showClusterLevelsChanged)


let positionsData = []
let valuesData = []
let dataSpots = []
let dataHeaders = []
let dataColors = ["#FF0000", "#FFA500", "#90EE90", "#00FF00", "#32CD32", "#87CEEB", "#0000FF", "#800080", "#FFC0CB"]
let imageWidth;
let imageHeight;
window.showImage = false;
window.showAllLevels = false;
window.showCluster = false;

async function showDemo() {

    let valuesCsv = await fetch('./SpotClusterMembership.csv')
    let valuesRes = await valuesCsv.text()
    console.log(valuesRes);
    const valuesText = valuesRes;
    const valuesRows = valuesText.split('\n');
    valuesData = valuesRows.map(row => row.trim().split(','));


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

function showAllLevelsChanged(e) {
    console.log(e.target.checked)
    window.showAllLevels = e.target.checked;
}

function showClusterLevelsChanged(e) {
    console.log(e.target.checked)
    const showAllLevelsCheckbox = document.getElementById("showAllLevels")
    if (e.target.checked) {
        window.showAllLevels = false;
        showAllLevelsCheckbox.checked = false;
        showAllLevelsCheckbox.disabled = true;
    } else {
        showAllLevelsCheckbox.disabled = false;
    }
    window.showCluster = e.target.checked;

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
            valuesData = rows.map(row => row.trim().split(','));
            console.log(valuesData);
        };

        reader.readAsText(file);
    }
}

function generateVis() {
    dataHeaders = valuesData[0].slice(1)
    console.log(dataHeaders)
    let sliceFactor = 0

    //basically to exclude the cluster values from the direct visualization
    if (dataHeaders[dataHeaders.length - 1].includes("Cluster")) {
        sliceFactor = 1
    }
    while (dataHeaders.length - sliceFactor > dataColors.length) {
        //we have the basic data colors in the array on top, when they are not enough we generate random colors and add them to the array to be used
        dataColors.push(generateRandomColor());
    }

    for (let i = 1; i < positionsData.length - 1; i++) {
        let spotCoords = positionsData[i];
        let spotValues = valuesData[i].slice(1, dataHeaders.length - sliceFactor).map((value, i) => {
            return {
                value: value,
                color: dataColors[i]
            }
        })

        const newSpot = new Spot(i, spotCoords[0], spotCoords[1], spotCoords[2], spotCoords[3], spotValues)
        if (sliceFactor) {
            newSpot.cluster = valuesData[i].at(-1)
        }
        dataSpots.push(newSpot)
    }
    console.log(dataSpots)
    window.drawAtWill = true
    setupCanvas(1000, 1000, dataSpots)
}

function generateRandomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`
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
        this.values.forEach((value, i) => {
            summary += `<span class="legendColor" style="background-color:${dataColors[i]}"></span> ${dataHeaders[i]}: ${value.value} <br/>`
        })
        return summary;
    }
}

