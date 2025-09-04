// Import UMAP.js into the Web Worker
importScripts('https://cdn.jsdelivr.net/npm/umap-js');

importScripts('https://cdnjs.cloudflare.com/ajax/libs/seedrandom/3.0.5/seedrandom.min.js');

const UMAPGlobal = self.UMAP || undefined;
const UMAPConstructor = UMAPGlobal.UMAP || undefined;

self.onmessage = async function (e) {
    const { geneExpressionData, clusters, randomSeed } = e.data;

    try {
        // Initialize UMAP with a random seed
        Math.seedrandom(randomSeed);
        const umap = new UMAPConstructor({ random: Math.random });

        // Perform UMAP fitting
        const embedding = umap.fit(geneExpressionData);

        // Post the result back to the main thread
        self.postMessage({ success: true, embedding, clusters });
    } catch (error) {
        // Send error back to the main thread
        self.postMessage({ success: false, error: error.message });
    }
};