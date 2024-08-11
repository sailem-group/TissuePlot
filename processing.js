//© Heba Sailem, heba.sailem@kcl.ac.uk
document.getElementById("positions").addEventListener("change", positinosUploaded)
document.getElementById("values").addEventListener("change", valuesUploaded)
document.getElementById("showImage").addEventListener("change", showImageChanged)
document.getElementById("showAllLevels").addEventListener("change", showAllLevelsChanged)
document.getElementById("showCluster").addEventListener("change", showClusterLevelsChanged)
document.getElementById("genesUpload").addEventListener("change", genesUploaded)
document.getElementById("selectGenes").addEventListener("change", geneSelected)
document.getElementById("showComposition").addEventListener("change", showCompositionChanged)
document.getElementById("showGenes").addEventListener("change", showGenesChanged)


function createGeneHeatmapGradient() {
    var xmax = 120;
    var ymax = 20;

    var colorRectangle = document.createElement("canvas");
    colorRectangle.width = xmax;
    colorRectangle.height = ymax;
    var ctx = colorRectangle.getContext("2d");

    // create gradient
    var grd = ctx.createLinearGradient(0, 0, xmax, 0);
    var colorGrad = [...heatMapColors];
    var numColor = colorGrad.length;
    for (var j = 0; j < numColor; j++) {
        grd.addColorStop(j / numColor, colorGrad[j]);
        grd.addColorStop((j + 1) / numColor - 0.01, colorGrad[j]);
    }
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, xmax, ymax);

    document.getElementById("heatmapGrad").appendChild(colorRectangle) //i guess
}


let positionsData = []
let valuesData = []
let genesData = []
let dataSpots = []
let dataHeaders = []
let dataColors = ["#FF0000", "#FFA500", "#90EE90", "#00FF00", "#32CD32", "#87CEEB", "#0000FF", "#800080", "#FFC0CB"]
let hasClusters;
window.sketchOptions = {
    selectedGene: 0,
}
window.mode = "cellComposition" //cellComposition or genes
window.showImage = false;
window.showAllLevels = false;
window.showCluster = false;

async function showDemo() {

    let positionsCsv = await fetch('./SpotPositions.csv')
    let positionsRes = await positionsCsv.text()
    console.log(positionsRes);
    const positionsText = positionsRes;
    const positionsRows = positionsText.split('\n');
    positionsData = positionsRows.map(row => row.split(','));

    let valuesCsv = await fetch('./SpotClusterMembership.csv')
    let valuesRes = await valuesCsv.text()
    console.log(valuesRes);
    const valuesText = valuesRes;
    const valuesRows = valuesText.split('\n');
    valuesData = valuesRows.map(row => row.trim().split(','));

    let genesCsv = await fetch('./AcutalTopExpressedGenes.csv')
    let genesRes = await genesCsv.text()
    const genesText = genesRes;
    const genesRows = genesText.split('\n');
    genesData = scaleData(genesRows.map(row => row.trim().split(',')));


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
    if (!hasClusters) {
        alert("No Clusters column exists in the dataset")
        return;
    }
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

function genesUploaded(e) {
    console.log(e)
    const file = e.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const text = e.target.result;
            const rows = text.split('\n');
            genesData = scaleData(rows.map(row => row.trim().split(',')));
            console.log(genesData);
        };

        reader.readAsText(file);
    }
}


function generateVis() {
    dataSpots = []
    if (!positionsData || positionsData.length == 0) {
        alert("Position Data missing")
        return;
    }
    if (mode == "cellComposition") {
        if (!valuesData || valuesData.length == 0) {
            alert("Membership Data missing")
            haltProcess()
            return;
        }
        dataHeaders = valuesData[0].slice(1)
        console.log(dataHeaders)
        let sliceFactor = 0
        hasClusters = false

        //basically to exclude the cluster values from the direct visualization
        if (dataHeaders.at(-1).includes("Cluster")) {
            sliceFactor = 1
            hasClusters = true
        }
        while (dataHeaders.length - sliceFactor > dataColors.length) {
            //we have the basic data colors in the array on top, when they are not enough we generate random colors and add them to the array to be used
            dataColors.push(generateRandomColor());
        }
        for (let i = 1; i < positionsData.length - 1; i++) {
            let spotCoords = positionsData[i];
            let spotValues = valuesData[i].slice(1, valuesData[i].length - sliceFactor).map((value, i) => {
                return {
                    value: value,
                    color: dataColors[i]
                }
            })

            const newSpot = new Spot(i, spotCoords[0], spotCoords[1], spotCoords[2], spotCoords[3], spotValues)
            if (hasClusters) {
                newSpot.cluster = valuesData[i].at(-1)
            }
            dataSpots.push(newSpot)
        }
    } else {
        if (!genesData || genesData.length == 0) {
            alert("Genes Data missing")
            haltProcess()
            return;
        }
        dataHeaders = genesData[0]
        console.log(dataHeaders)

        //populate gene selection with gene headers..i guess
        let geneOptions = ``
        dataHeaders.forEach((header, i) => {
            geneOptions += `<option value="${i}">${header}</option>`
        })
        document.getElementById("selectGenes").innerHTML = geneOptions;
        for (let i = 1; i < positionsData.length - 1; i++) {
            let spotCoords = positionsData[i];
            let spotValues = genesData[i].map((value, i) => {
                return {
                    value: value,
                    color: heatMapColors[parseInt(value)]
                }
            })

            const newSpot = new Spot(i, spotCoords[0], spotCoords[1], spotCoords[2], spotCoords[3], spotValues)
            dataSpots.push(newSpot)
        }
    }

    console.log(dataSpots)
    window.drawAtWill = true
    setupCanvas(1000, 1000, dataSpots)
}

function generateRandomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`
}

function geneSelected(e) {
    console.log(e.target.value)
    window.sketchOptions.selectedGene = e.target.value;
}

function modeChange(mode) {
    if (window.mode == mode) {
        return;
    }
    window.mode = mode
    generateVis()
    //resetAll()
}

function showCompositionChanged(e) {
    if (e.target.checked) {
        document.getElementById("composition-specific").classList.remove("hidden")
        document.getElementById("gene-specific").classList.add("hidden")
        document.getElementById("showGenes").checked = false
        modeChange("cellComposition")
    } else {
        document.getElementById("composition-specific").classList.add("hidden")
    }
}

function showGenesChanged(e) {
    if (e.target.checked) {
        document.getElementById("gene-specific").classList.remove("hidden")
        document.getElementById("composition-specific").classList.add("hidden")
        document.getElementById("showComposition").checked = false
        modeChange("genes")
    } else {
        document.getElementById("gene-specific").classList.add("hidden")
    }
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

    console.log(scaledMatrix)

    return scaledMatrix;
}

const shapesToClusterMap = {
    "1": "triangle",
    "2": "x",
    "3": "circle",
    "4": "star",
    "5": "hexagon",
    "6": "square",
    "7": "diamond",
    "8": "plus",
    "9": "dash",
    "10": "slash-lg",
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
                summary += `<span class="legendColor" style="background-color:${value.color}"></span> ${dataHeaders[i]}: ${value.value} <br/>`
            })
        } else {
            this.values.forEach((value, i) => {
                summary += `<span class="legendColor" style="background-color:${value.color}"></span> ${dataHeaders[i]}: ${value.value} <br/>`
            })
        }

        if (this.cluster) {
            summary += `<i style="font-size: 16px" class="bi bi-${shapesToClusterMap[this.cluster]}"></i> Cluster: ${this.cluster} <br/>`
        }
        return summary;
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

createGeneHeatmapGradient()
