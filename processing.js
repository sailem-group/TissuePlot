//© Heba Sailem, heba.sailem@kcl.ac.uk
document.getElementById("positions").addEventListener("change", function (e) {
    positinosUploaded(e);
    checkFileUploads();
})
document.getElementById("values").addEventListener("change", function (e) {
    valuesUploaded(e), checkFileUploads();
})
document.getElementById("showImage").addEventListener("change", showImageChanged)
document.getElementById("showAllLevels").addEventListener("change", showAllLevelsChanged)
document.getElementById("showCluster").addEventListener("change", showClusterLevelsChanged)
document.getElementById("genesUpload").addEventListener("change", function (e) {
    genesUploaded(e);
    checkFileUploads();
})
document.getElementById("umapUpload").addEventListener("change", function (e) {
    umapUploaded(e);
    checkFileUploads();
})
document.getElementById("selectGenes").addEventListener("change", geneSelected)
document.getElementById("showComposition").addEventListener("change", showCompositionChanged)
document.getElementById("showGenes").addEventListener("change", showGenesChanged)
document.getElementById("uploadNewFilesButton").addEventListener("click", uploadNewFileClicked)
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

window.currentUMAPWorker = null;
window.numberOfClusters = [];

window.onload = async function () {
    await showDemo('demo1')
    document.getElementById("showCluster").click()
}

window.showUMAP = showUMAP;
window.selectedClusterView = "shapes";
window.showDemoButton = "clicked";
window.whichDemo = 'demo1';

function showOrHideOptions() {
    const optionsContainer = document.getElementById("optionsContainer");
    const umapTab = document.getElementById("umapTab");
    const plottingTab = document.getElementById("plottingTab");
    const canvasContainerID = document.getElementById("canvasContainer");
    print
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
            console.log(window.showDemoButton)
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
window.showCluster = false;

const colorScales = [{
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

// function uniqueClusterCount(valuesRows) {
//     const headers = valuesRows[0].split(',');
//     console.log("headers")
//     console.log(headers)
//     const clusterIndex = headers.findIndex(header => header.trim() === 'Cluster');

//     if (clusterIndex === -1) {
//         console.error("Cluster column not found in CSV");
//     } else {
//         let clusters = valuesRows.slice(1)
//             .map(row => row.split(',')[clusterIndex])
//             .map(value => parseInt(value, 10))
//             .filter(value => !isNaN(value));

//         let uniqueClusters = [...new Set(clusters)].sort((a, b) => a - b);
//         if (uniqueClusters[0] === 0) {
//             uniqueClusters = uniqueClusters.map(value => value + 1);
//         }
//         return uniqueClusters;
//     }
// }

function uniqueClusterCount(valuesRows) {
    const headers = valuesRows[0]; // no split needed
    console.log("headers");
    console.log(headers);

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

async function showDemo(demoValue = 'demo1') {
    document.getElementById("loadingOverlay").style.display = "flex";

    window.whichDemo = demoValue;
    loadImageForDemo(demoValue);
    document.getElementById("umapTab").classList.remove("d-none");
    window.showDemoButton = "clicked"

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
    console.log(positionsRes);
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

    generateVis()

    document.getElementById("loadingOverlay").style.display = "none";

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

let currentEmbedding = null
let currentClusters = []
window.clusterInfo = null

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
        const spotClusterMembership = transformFileData(valuesData);
        let topExpressedGenes = [];
        if (showdemoCall) {
            topExpressedGenes = transformFileData(genesData);
        } else {
            topExpressedGenes = transformFileData(umapData);
        }
        const clusters = spotClusterMembership.map((row) => parseInt(row.Cluster, 10));
        window.clusterInfo = clusters;
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
                            opacity: 0.5,
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
        // Recreating the original UMAP plot
        const originalTrace = {
            x: currentEmbedding.map((point) => point[0]),
            y: currentEmbedding.map((point) => point[1]),
            mode: 'markers',
            marker: {
                size: 8,
                color: 'grey',
                opacity: 0.5,
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

function highlightUMAPRow(allClusters, indexToHighlight) {
    if (!currentEmbedding || !allClusters) {
        console.error("UMAP data not found!");
        return;
    }

    const umapPlotDiv = document.getElementById('umap-plot');
    umapPlotDiv.innerHTML = '<p>Updating UMAP...</p>';

    const allPointsTrace = {
        x: currentEmbedding.filter((_, index) => index !== indexToHighlight).map((point) => point[0]),
        y: currentEmbedding.filter((_, index) => index !== indexToHighlight).map((point) => point[1]),
        mode: 'markers',
        marker: {
            size: 8,
            color: 'gray',
            opacity: 0.5,
        },
        text: allClusters.filter((_, index) => index !== indexToHighlight)
            .map((cluster, index) => `Cluster: ${cluster}, Row: ${index}`),
        name: ''
    };

    const highlightedPointTrace = {
        x: [currentEmbedding[indexToHighlight][0]],
        y: [currentEmbedding[indexToHighlight][1]],
        mode: 'markers',
        marker: {
            size: 14,
            color: 'brown',
            layer: 'above traces',
        },
        text: [`Cluster: ${allClusters[indexToHighlight]}, Row: ${indexToHighlight}`],
        name: ''
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
            r: 5
        },
        showlegend: false,
    };

    umapPlotDiv.innerHTML = '';
    Plotly.newPlot('umap-plot', [allPointsTrace, highlightedPointTrace], layout);
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
        if (!document.getElementById("showGenes").checked) {
            showAllLevelsCheckbox.disabled = false;
        }
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
            window.numberOfClusters = uniqueClusterCount(rows)
            generateClusterLegend(window.numberOfClusters);
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

function umapUploaded(e) {
    console.log(e)
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const text = e.target.result;
            const rows = text.split('\n');
            umapData = scaleData(rows.map(row => row.trim().split(',')));
            console.log(umapData);
        };
        reader.readAsText(file);
    }
}

function checkFileUploads() {
    const positionsUploaded = document.getElementById("positions").files.length > 0;
    const valuesUploaded = document.getElementById("values").files.length > 0;

    // Enable/Disable the "Generate" button based on file uploads
    document.getElementById("plotbutton").disabled = !(positionsUploaded && valuesUploaded);

    // Reset and disable gene-related UI if no gene file is uploaded
    if (!document.getElementById("genesUpload").files.length) {
        resetGeneSelection();
    }
    if (document.getElementById("umapUpload").files.length) {
        document.getElementById("umapTab").classList.remove("d-none");
        document.getElementById("canvasContainer").style.pointerEvents = "auto";
    } else {
        document.getElementById("umapTab").classList.add("d-none");
    }
}

function checkGeneFile() {
    const geneFileUploaded = document.getElementById("genesUpload").files.length > 0;
    document.getElementById("showGenes").disabled = !geneFileUploaded;
    // document.getElementById("gene-specific").classList.toggle("hidden", !geneFileUploaded);
}

function resetGeneSelection() {
    showOrHideOptions()
    const showGenesCheckbox = document.getElementById("showGenes");
    const showGenesLabel = document.querySelector("label[for='showGenes']");
    showGenesCheckbox.checked = false;
    showGenesCheckbox.disabled = true;
    showGenesCheckbox.style.display = "none";
    if (showGenesLabel) {
        showGenesLabel.style.display = "none";
    }
    // document.getElementById("gene-specific").classList.add("hidden");
    document.getElementById("selectGenes").innerHTML = "";
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
        if (window.showCluster) {
            document.getElementById("showAllLevels").checked = false;
            document.getElementById("showAllLevels").disabled = true;
        } else {
            // document.getElementById("showAllLevels").checked = false;
            document.getElementById("showAllLevels").disabled = false;
        }
    } else {
        document.getElementById("composition-specific").classList.add("hidden")
    }
}

function showGenesChanged(e) {
    if (e.target.checked) {
        document.getElementById("gene-specific").classList.remove("hidden")
        document.getElementById("composition-specific").classList.add("hidden")
        document.getElementById("showAllLevels").checked = false;
        document.getElementById("showAllLevels").disabled = true;
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
    const canvasContainerID = document.getElementById("canvasContainer");
    if (canvasContainerID) {
        canvasContainerID.style.pointerEvents = "auto";
    }
    window.mode = "cellComposition"
    resetOptionsToDefault()
    document.getElementById("optionsContainer").style.display = "block";
    document.getElementById('fileInputSection').style.display = 'none';
    document.getElementById('uploadNewFilesButton').style.display = 'block';

    generateVis()
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

        // if (this.cluster) {
        //     //summary += `<i style="font-size: 16px" class="bi bi-${shapesToClusterMap[this.cluster]}"></i> <b>Cluster:</b> ${this.cluster} <br/>`
        //     //summary += `<img width="95%" and height="95%" src="cluster-legend.png"/> <br/>`
        //     summary += `<br/><b>Cluster</b><img width="95%" and height="95%" src="cluster-legend.png"/> <br/>`

        // }
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
    console.log("Clusters received:", clusters);
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
    });
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