// === markerWorker.js === (Web Worker script with flatten fix and relaxed thresholds)

importScripts('https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js');

self.onmessage = function(e) {
  const { allSpots, selectedCluster } = e.data;

  // Group expression values by cluster and gene
  const geneExpressionByCluster = {};

  allSpots.forEach(s => {
    const clusterId = s.cluster;
    if (!geneExpressionByCluster[clusterId]) geneExpressionByCluster[clusterId] = {};

    const rawGeneList = s.values[0]?.geneList || {};
    const genes = Object.values(rawGeneList).flat();

    genes.forEach(g => {
      if (!g?.gene || typeof g.value !== 'number') return;

      if (!geneExpressionByCluster[clusterId][g.gene]) {
        geneExpressionByCluster[clusterId][g.gene] = [];
      }
      geneExpressionByCluster[clusterId][g.gene].push(g.value);
    });
  });

  // Compute marker genes for selected cluster
  const selectedGenes = geneExpressionByCluster[selectedCluster] || {};
  const markerGenes = [];

  Object.keys(selectedGenes).forEach(gene => {
    const selectedVals = selectedGenes[gene];
    let otherVals = [];

    Object.entries(geneExpressionByCluster).forEach(([clusterId, geneMap]) => {
      if (clusterId === selectedCluster) return;
      if (geneMap[gene]) {
        otherVals = otherVals.concat(geneMap[gene]);
      }
    });

    if (selectedVals.length > 1 && otherVals.length > 1) {
    const selectedMean = jStat.mean(selectedVals);
    const otherMean = jStat.mean(otherVals);
    const foldChange = otherMean === 0 ? Infinity : selectedMean / otherMean;

    // Manual Welch’s t-test implementation
    const var1 = Math.pow(jStat.stdev(selectedVals, true), 2);
    const var2 = Math.pow(jStat.stdev(otherVals, true), 2);
    const n1 = selectedVals.length;
    const n2 = otherVals.length;

    const tStat = (selectedMean - otherMean) / Math.sqrt(var1 / n1 + var2 / n2);

    const dfNumerator = Math.pow(var1 / n1 + var2 / n2, 2);
    const dfDenominator = (Math.pow(var1 / n1, 2) / (n1 - 1)) + (Math.pow(var2 / n2, 2) / (n2 - 1));
    const df = dfNumerator / dfDenominator;

    const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));

    // console.log({ gene, selectedMean, otherMean, foldChange, pValue });

    // if (foldChange >= 1.5 && selectedMean > 0.5 && pValue < 0.1) {
    if (foldChange >= 1.0 && selectedMean >= 0.5) {
        markerGenes.push({
            gene,
            foldChange: foldChange.toFixed(2),
            pValue: pValue.toExponential(2),
            selectedMean: selectedMean.toFixed(2),
            otherMean: otherMean.toFixed(2)
            });
        }
    }

  });

  // markerGenes.sort((a, b) => b.foldChange - a.foldChange);
  markerGenes.sort((a, b) => parseFloat(b.selectedMean) - parseFloat(a.selectedMean));
  self.postMessage({ markerGenes });
} 


// importScripts('https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js');

// self.onmessage = function(e) {
//   const { allSpots, selectedCluster, mode } = e.data;

//   // Group expression values by cluster and gene
//   const geneExpressionByCluster = {};

//   allSpots.forEach(s => {
//     const clusterId = s.cluster;
//     if (!geneExpressionByCluster[clusterId]) geneExpressionByCluster[clusterId] = {};

//     const rawGeneList = s.values[0]?.geneList || {};
//     const genes = Object.values(rawGeneList).flat();

//     genes.forEach(g => {
//       if (!g?.gene || typeof g.value !== 'number') return;

//       if (!geneExpressionByCluster[clusterId][g.gene]) {
//         geneExpressionByCluster[clusterId][g.gene] = [];
//       }
//       geneExpressionByCluster[clusterId][g.gene].push(g.value);
//     });
//   });

//   // If in single-cluster mode
//   if (mode === 'single') {
//     const markerGenes = computeMarkerGenes(selectedCluster, geneExpressionByCluster);
//     self.postMessage({ markerGenes });
//   }

//   // If in all-cluster mode
//   if (mode === 'all') {
//     const csvData = computeAllClusterMarkers(geneExpressionByCluster);
//     self.postMessage({ csv: csvData });
//   }
// };

// // =======================
// // Compute marker genes for one cluster
// function computeMarkerGenes(selectedCluster, geneExpressionByCluster) {
//   const selectedGenes = geneExpressionByCluster[selectedCluster] || {};
//   const markerGenes = [];

//   Object.keys(selectedGenes).forEach(gene => {
//     const selectedVals = selectedGenes[gene];
//     let otherVals = [];

//     Object.entries(geneExpressionByCluster).forEach(([clusterId, geneMap]) => {
//       if (clusterId === selectedCluster) return;
//       if (geneMap[gene]) {
//         otherVals = otherVals.concat(geneMap[gene]);
//       }
//     });

//     if (selectedVals.length > 1 && otherVals.length > 1) {
//       const selectedMean = jStat.mean(selectedVals);
//       const otherMean = jStat.mean(otherVals);
//       const foldChange = otherMean === 0 ? Infinity : selectedMean / otherMean;

//       const var1 = Math.pow(jStat.stdev(selectedVals, true), 2);
//       const var2 = Math.pow(jStat.stdev(otherVals, true), 2);
//       const n1 = selectedVals.length;
//       const n2 = otherVals.length;

//       const tStat = (selectedMean - otherMean) / Math.sqrt(var1 / n1 + var2 / n2);
//       const dfNumerator = Math.pow(var1 / n1 + var2 / n2, 2);
//       const dfDenominator = (Math.pow(var1 / n1, 2) / (n1 - 1)) + (Math.pow(var2 / n2, 2) / (n2 - 1));
//       const df = dfNumerator / dfDenominator;
//       const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));

//       if (foldChange >= 1.0 && selectedMean >= 0.5) {
//         markerGenes.push({
//           gene,
//           foldChange: foldChange.toFixed(2),
//           pValue: pValue.toExponential(2),
//           selectedMean: selectedMean.toFixed(2),
//           otherMean: otherMean.toFixed(2)
//         });
//       }
//     }
//   });

//   markerGenes.sort((a, b) => parseFloat(b.selectedMean) - parseFloat(a.selectedMean));
//   console.log(markerGenes)
//   console.log("Total marker genes:", markerGenes.length);

//   return markerGenes;
// }

// // =======================
// // Compute all cluster markers for CSV output
// function computeAllClusterMarkers(geneExpressionByCluster) {
//   const thresholds = [1, 1.2, 1.5, 2];
//   const minMean = 0.5;
//   const clusters = Object.keys(geneExpressionByCluster).sort();
//   const csvRows = [['Cluster', 'Genes-1', 'Genes-1.2', 'Genes-1.5', 'Genes-2']];

//   clusters.forEach(clusterId => {
//     const allGenes = computeMarkerGenes(clusterId, geneExpressionByCluster);

//     const geneSets = thresholds.map(threshold => {
//       return allGenes
//         .filter(g => parseFloat(g.foldChange) >= threshold && parseFloat(g.selectedMean) >= minMean)
//         .map(g => g.gene)
//         .join(';'); // Semicolon-separated list
//     });

//     csvRows.push([clusterId, ...geneSets]);
//   });

//   // Convert to CSV string
//   return csvRows.map(row => row.join(',')).join('\n');
// }
