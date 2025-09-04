let uploadedSVGFiles = {};
let expectedCellTypes = [];
let positionsData = []
let valuesData = []
let genesData = []
let umapData = []
let dataSpots = []
let dataHeaders = []
let hasClusters;
let currentEmbedding = null
let currentClusters = []
let isFolderMode = false

let uploadedFolderFiles = [];
let exampleFileMap = {};
let currentExampleId = null;

const config = {'toImageButtonOptions': {'format': 'svg'}}
const colorScales = [
    {
        name: "Color Scale 1",
        value: "ColorScale1",
        colors: ["#FF0000", "#FFA500", "#9DFF09", "#FBFB08", "#22FF9A", "#1297FF", "#0000FF", "#9700FF", "#FB009A", "#FF6EC7", "#00FFEA", "#FF4500", "#00BFFF", "#FFD700", "#8A2BE2"]
    },
    {
        name: "Color Scale 2",
        value: "ColorScale2",
        colors: ["#117733", "#661100", "#882255", "#44AA99", "#999933", "#332288", "#DDCC77", "#AA4499", "#E41A1C", "#3F88C5", "#C8553D", "#6A4C93", "#A2C523", "#E4572E", "#1A8FE3"]

    },
    {
        name: "Color Scale 3",
        value: "ColorScale3",
        colors: ["#636363", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#F4A582", "#999999", "#00CC99", "#B76E79", "#4D4DFF", "#FFA07A", "#33A02C"]
    },
    {
        name: "Color Scale 4",
        value: "ColorScale4",
        colors: ["#E69F00", "#FF6F61", "#B07AA1", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#882255", "#009E73", "#0F4C81", "#56B4E9", "#28AFB0", "#5F0F40", "#7CB518", "#DC6BAD"]

    },
    {
        name: "Color Scale 5",
        value: "ColorScale5",
        colors: ["#44AA99", "#332288", "#117733", "#999933", "#9999DD", "#E41A1C", "#F0E442", "#C94C4C", "#3D348B", "#F6AE2D", "#33658A", "#7DCE82", "#ED6A5A", "#D90368", "#00A676"]

    },
    {
        name: "Color Scale 6",
        value: "ColorScale6",
        colors: ["#CC79A7", "#0072B2", "#D55E00", "#E69F00", "#56B4E9", "#009E73", "#F4A582", "#882255", "#004488", "#A6761D", "#0A9396", "#F28482", "#5C3C92", "#6B4226", "#CE4257"]

    },
];
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

let dataColors = colorScales[0].colors;
let selectedScaleValue = "ColorScale1";

window.selectedClusterInLegend = null;
window.selectedClusterFromDropdown = null;
window.selectedCellTypesFromDropdown = [];
window.selectedUMAPClusters = [];
window.currentUMAPWorker = null;
window.numberOfClusters = [];
window.clusterMap = [];
window.cellTypeVectors = {};
window.spotClusterMembership = 'none';
window.selectedGeneColorScale = 'Viridis';
window.geneColorIntensity = 1;
window.selectedClusterFeature = 'Cluster-GE'; 
window.currentPopupMarkerGenes = null;
window.cellTypeToEmojiMap = {
    "B/Plasma cells": "Plasma.svg",
    "Endothelial cells": "Endothelial_cell.svg",
    "Fibro1 (EIF4A3, STAR)": "fibroblast1.svg",
    "Fibro2 (RBP1, DCN)": "fibroblast2.svg",
    "Fibro3 (RAMP1, CFD)": "fibroblast3.svg",
    "Fibro4 (CCL2)": "fibroblast4.svg",
    "Fibro5 (FN1, COL3A1)": "fibroblast5.svg",
    "Macrophages": "Macrophage.svg",
    "Mesothelial cells": "Mesothelial_cell.svg",
    "Myofibroblasts": "Myofibroblast.svg",
    "T cells": "t-cell.svg",
    "Tumour cells": "Cancer_cell.svg"
};
window.selectedClusterView = "shapes";
window.showDemoButton = "clicked";
window.whichDemo = 'demo5';
window.uploadedEmojiFile = false;
window.sketchOptions = {
    selectedGene: 0,
}
window.mode = "cellComposition"
window.showImage = false;
window.showAllLevels = false;
window.showEmojiView = false;
window.showCellEmojiView = false;
window.showCluster = false;
window.lastRenderedDemo = null;
window.expressionThresholdFilter = 'all';
window.clusterInfo = null;
window.showContours = true;