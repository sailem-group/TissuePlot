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
document.getElementById("uploadNewFilesButton").addEventListener("click", uploadNewFileClicked)
document.getElementById("showDemoButton").addEventListener("click", showDemo)
document.getElementById("plotbutton").addEventListener("click", generteCanvasClicked)
document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
    radio.addEventListener("change", clusterViewSelectionChanged);
});
// Listen for tab changes
document.querySelectorAll(".nav-link").forEach(tab => {
    tab.addEventListener("click", showOrHideOptions);
});

window.onload = async function () {
    await showDemo()
    document.getElementById("showCluster").click()
}

window.showUMAP = showUMAP;
window.selectedClusterView = "shapes";
window.showDemoButton = "clicked";

function showOrHideOptions() {
    const optionsContainer = document.getElementById("optionsContainer");
    const umapTab = document.getElementById("umapTab");
    const plottingTab = document.getElementById("plottingTab");
    if (umapTab.classList.contains("active")) {
        optionsContainer.style.display = "none";
    } else if (plottingTab.classList.contains("active")) {
        if (window.showDemoButton == "none"){
            if (window.getComputedStyle(document.getElementById("fileInputSection")).display == "block") {
                optionsContainer.style.display = "none"; 
            } else if (window.getComputedStyle(document.getElementById("uploadNewFilesButton")).display == "block") {
                optionsContainer.style.display = "block";
            }
        }else{
            optionsContainer.style.display = "none";
        }

    } else {
        console.log(window.showDemoButton)
        if (window.showDemoButton == "clicked"){
            optionsContainer.style.display = "block";
        } else {
            optionsContainer.style.display = "none";
        }
    }
}

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

    document.getElementById("heatmapGrad").appendChild(colorRectangle)
}

let positionsData = []
let valuesData = []
let genesData = []
let dataSpots = []
let dataHeaders = []

let hasClusters;
window.sketchOptions = {
    selectedGene: 0,
}
window.mode = "cellComposition" //cellComposition or genes
window.showImage = false;
window.showAllLevels = false;
window.showCluster = false;

const colorScales = [
    {
        name: "Color Scale 1",
        value: "ColorScale1",
        colors: ["#FF0000", "#FFA500", "#9DFF09", "#FBFB08", "#22FF9A", "#1297FF", "#0000FF", "#9700FF", "#FB009A"]
    },
    {
        name: "Color Scale 2",
        value: "ColorScale2",
        colors: ["#117733", "#88CCEE", "#882255", "#44AA99", "#999933", "#332288", "#DDCC77", "#AA4499", "#E41A1C"]
    },
    {
        name: "Color Scale 3",
        value: "ColorScale3",
        colors: ["#000000", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#F4A582"]
    },
    {
        name: "Color Scale 4",
        value: "ColorScale4",
        colors: ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#882255", "#88CCEE"]
    },
    {
        name: "Color Scale 5",
        value: "ColorScale5",
        colors: ["#44AA99", "#332288", "#117733", "#88CCEE", "#999933", "#AA4499", "#DDCC77", "#E41A1C", "#F0E442"]
    },
    {
        name: "Color Scale 6",
        value: "ColorScale6",
        colors: ["#CC79A7", "#0072B2", "#D55E00", "#E69F00", "#56B4E9", "#009E73", "#F4A582", "#88CCEE", "#882255"]
    },
];

let dataColors = colorScales[0].colors;

const dropdown = document.getElementById("colorScaleSelector");
dropdown.value = colorScales[0].value;

dropdown.addEventListener("change", (event) => {
    const selectedScale = colorScales.find(scale => scale.value === event.target.value);
    if (selectedScale) {
        console.log("Selected scale:", selectedScale);
        dataColors = selectedScale.colors
        showDemo()
    }
});

async function showDemo() {
    window.showDemoButton = "clicked"
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

    let genesCsv = await fetch('./TopExpressedGenes.csv')
    let genesRes = await genesCsv.text()
    const genesText = genesRes;
    const genesRows = genesText.split('\n');
    genesData = scaleData(genesRows.map(row => row.trim().split(',')));

    document.getElementById("optionsContainer").style.display = "block";

    generateVis()

    //triggering showUMAP in the background
    setTimeout(() => {
        showUMAP()
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

let currentEmbedding = null
let currentClusters = []

async function showUMAP() {
    try {
        const umapPlotDiv = document.getElementById('umap-plot');
        const clusterDropdownContainer = document.getElementById('clusterDropdownContainer');
        umapPlotDiv.innerHTML = '<p>UMAP is loading...</p>';
        umapPlotDiv.style.textAlign = 'center';

        const spotClusterMembership = transformFileData(valuesData);
        const topExpressedGenes = transformFileData(genesData);

        const clusters = spotClusterMembership.map((row) => parseInt(row.Cluster, 10));
        const uniqueClusters = [...new Set(clusters)]; 
        const geneNames = Object.keys(topExpressedGenes[0]);
        const geneExpressionData = topExpressedGenes.map((row) =>
            geneNames.map((gene) => parseFloat(row[gene])).filter((value) => !isNaN(value))
        );

        if (geneExpressionData.some((row) => row.length === 0)) {
            throw new Error('Some rows in gene expression data are empty.');
        }

        if (geneExpressionData.length !== clusters.length) {
            throw new Error('Mismatch between gene expression rows and cluster labels.');
        }

        const clusterDropdownMenu = document.getElementById('cluster-dropdown-menu');
        let selectedClusters = [];
        const MAX_SELECTIONS = 5; 

        // Use a Web Worker for UMAP computation
        const worker = new Worker('umapWorker.js');

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
                            color: 'grey'
                        },
                        text: clusters.map((cluster, index) => `Cluster: ${cluster}, Row: ${index}`),
                    };

                    const layout = {
                        xaxis: {
                            title: 'UMAP Dimension 1'
                        },
                        yaxis: {
                            title: 'UMAP Dimension 2'
                        },
                        height: 300,
                        width: 400,
                        margin: {
                            t: 5,
                            r: 5,
                        },
                    };

                    Plotly.newPlot('umap-plot', [trace], layout);

                    for (let i = 1; i <= uniqueClusters.length; i++) {
                        const listItem = document.createElement('li');
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = `cluster-${i}`;
                        checkbox.value = i;
                        checkbox.classList.add('form-check-input');
                        checkbox.style.marginRight = '5px';
            
                        const label = document.createElement('label');
                        label.htmlFor = `cluster-${i}`;
                        label.textContent = `${i}`;
                        label.classList.add('form-check-label')
            
                        const wrapperDiv = document.createElement('div');
                        wrapperDiv.classList.add('form-check', 'dropdown-item', 'ms-4');
                        wrapperDiv.style.cursor = 'pointer';
                        wrapperDiv.appendChild(checkbox);
                        wrapperDiv.appendChild(label);
                        listItem.appendChild(wrapperDiv);
            
                        clusterDropdownMenu.appendChild(listItem);
            
                        checkbox.addEventListener('change', (event) => {
                            if (event.target.checked) {
                              if (selectedClusters.length >= MAX_SELECTIONS) {
                                event.target.checked = false;
                                alert(`You can select up to ${MAX_SELECTIONS} clusters at a time.`);
                                return;
                              }
                              selectedClusters.push(parseInt(event.target.value));
                            } else {
                              selectedClusters = selectedClusters.filter(cluster => cluster !== parseInt(event.target.value));
                            }
                        
                            reGenerateUMAP(clusters, selectedClusters);
                          });
                    }

                    clusterDropdownContainer.style.display = 'block'
                    
                    resolve();

                } else {
                    umapPlotDiv.innerHTML = `<p style="color: red;">Error: ${error}</p>`;
                    reject(error);
                }

                worker.terminate(); // Terminating the worker after completion
            };

            // Handling worker errors
            worker.onerror = (error) => {
                umapPlotDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
                reject(error.message);
                worker.terminate();
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
        // Recreating the original UMAP plot
        const originalTrace = {
            x: currentEmbedding.map((point) => point[0]),
            y: currentEmbedding.map((point) => point[1]),
            mode: 'markers',
            marker: {
                size: 8,
                color: 'grey', 
            },
        };

        const originalLayout = {
            xaxis: {
                title: 'UMAP Dimension 1'
            },
            yaxis: {
                title: 'UMAP Dimension 2'
            },
            height: 300,
            width: 400,
            margin: {
                t: 5,
                r: 5,
            },
        };
        Plotly.newPlot('umap-plot', [originalTrace], originalLayout);
        return; 
    }

    const umapPlotDiv = document.getElementById('umap-plot');
    umapPlotDiv.innerHTML = '';
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
        text: allClusters.map((cluster, index) => {
            const selectedIndex = selectedClusters.indexOf(cluster)
            return selectedIndex !== -1 ? `Cluster: ${cluster}, Row: ${index}` : '';
        }),
    };

    const layout = {
        xaxis: {
            title: 'UMAP Dimension 1'
        },
        yaxis: {
            title: 'UMAP Dimension 2'
        },
        height: 300,
        width: 400,
        margin: {
            t: 5,
            r: 5,
        },
    };

    umapPlotDiv.innerHTML = '';
    Plotly.newPlot('umap-plot', [trace], layout);
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
        alert("No Cluster column exists in the dataset")
        return;
    }
    console.log(e.target.checked)
    const showAllLevelsCheckbox = document.getElementById("showAllLevels")
    if (e.target.checked) {
        window.showAllLevels = false;
        showAllLevelsCheckbox.checked = false;
        showAllLevelsCheckbox.disabled = true;
        // Enabling cluster view selection when checkbox is checked
        document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
            radio.disabled = false;
        });
    } else {
        showAllLevelsCheckbox.disabled = false;
        // Disabling cluster view selection when checkbox is unchecked
        document.querySelectorAll("input[name='clusterType']").forEach((radio) => {
            radio.disabled = true;
        });
    }
    window.showCluster = e.target.checked;

}

function clusterViewSelectionChanged() {
    const selectedClusterView = document.querySelector("input[name='clusterType']:checked").value;
    // Storing the selected cluster view type globally
    window.selectedClusterView = selectedClusterView;

    generateVis()
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

window.generateVis = function () {
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

        //populate gene selection with gene headers
        let geneOptions = ``
        dataHeaders.sort().forEach((header, i) => {
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
            if (valuesData[i] && valuesData[i].at(-1)) {
                newSpot.cluster = valuesData[i].at(-1);
            }
            dataSpots.push(newSpot)
        }
    }

    console.log(dataSpots)
    window.drawAtWill = true
    setupCanvas(Math.floor(window.innerWidth * 0.74), window.innerHeight, dataSpots)
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

function resetOptionsToDefault() {
    // Reset checkboxes
    document.getElementById("showImage").checked = false;
    document.getElementById("showCluster").checked = true;
    document.getElementById("showAllLevels").checked = false;

    // Reset radio buttons
    document.getElementById("shapeView").checked = true; // Set default to Shape view
    document.getElementById("numberView").checked = false;
    document.getElementById("showComposition").checked = true; // Default to Cell Proportions
    document.getElementById("showGenes").checked = false;
}

function generteCanvasClicked() {
    window.mode = "cellComposition"
    resetOptionsToDefault()
    document.getElementById("optionsContainer").style.display = "block";
    document.getElementById('fileInputSection').style.display = 'none';
    document.getElementById('uploadNewFilesButton').style.display = 'block';

    generateVis()
    console.log("Generated new canvas.")
    window.showDemoButton = "none"
    // triggering showUMAP in the background
    setTimeout(() => {
        showUMAP()
            .then(() => console.log("UMAP visualization completed."))
            .catch((error) => console.error("Error in showUMAP:", error));
    }, 0);
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
        /*        
        let summary = `<table border="1"><tr>`;
        if (mode == "cellComposition") {
            this.values.forEach((value, i) => {
                summary += `<td>${dataHeaders[i]}</td>`
            })
            summary += `</tr><tr>`
            this.values.forEach((value, i) => {
                summary += `<td class="legendColor" style="background-color:${value.color}">   </td>`
            })
            summary += `</tr><tr>`
            this.values.forEach((value, i) => {
                summary += `<td>${Number(value.value).toFixed(2)}</td>`
            })
           summary += `</tr>`
         */
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

        if (this.cluster) {
            //summary += `<i style="font-size: 16px" class="bi bi-${shapesToClusterMap[this.cluster]}"></i> <b>Cluster:</b> ${this.cluster} <br/>`
            //summary += `<img width="95%" and height="95%" src="cluster-legend.png"/> <br/>`
            summary += `<br/><b>Cluster</b><img width="95%" and height="95%" src="cluster-legend.png"/> <br/>`

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