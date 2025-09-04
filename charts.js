function showBarChart(index, barcode, data, isCellComposition) {
  const chartContainer = document.getElementById("barChart");

  chartContainer.innerHTML = "";

  let labels, values, colors, originalName;
  
  if (isCellComposition) {
    labels = data.map(item => item.label);
    values = data.map(item => item.value);
    colors = data.map(item => item.color);
    originalName = data.map(item => item.originalLabel);
  } else {
    const clusterCounts = {};
    const clusterColors = {};

    data.forEach(item => {
      const clusterValue = item.value;
      const clusterColor = item.color;

      clusterCounts[clusterValue] = (clusterCounts[clusterValue] || 0) + 1;

      if (!clusterColors[clusterValue]) {
        clusterColors[clusterValue] = clusterColor;
      }
    });

    labels = Object.keys(clusterCounts).map(value => `${value}`);
    values = Object.values(clusterCounts);
    colors = Object.keys(clusterCounts).map(value => clusterColors[value]);
  }

  const total = values.reduce((acc, val) => acc + val, 0);
  const percentages = values.map(value => (value / total) * 100);
  let maxPercentage = ((Math.ceil(Math.max(...percentages) / 10) * 10) + 10) > 100 ? (Math.ceil(Math.max(...percentages) / 10) * 10) : (Math.ceil(Math.max(...percentages) / 10) * 10) + 10; // Round up to nearest 10

  const trace = {
    x: labels,
    y: percentages,
    type: "bar",
    marker: {
      color: colors,
    },
    // text: isCellComposition ? values.map((value, index) => `${labels[index]}: ${value.toFixed(2)}`) : values.map((value, index) => `${labels[index]}: ${value}`),
    text: percentages.map((value, index) => `${originalName[index]}: ${Math.round(value)}%`),
    hoverinfo: "text",
    textposition: "none",
  };

  const layout = {
    xaxis: {
      title: isCellComposition ? "Cell type" : "Clusters",
      type: 'category',
      tickangle: -45,
      tickfont: {
        size: 10,
      },
    },
    yaxis: {
      title: "Percentage (%)",
      range: [0, maxPercentage], // Y-axis always ranges from 0 to 100
      dtick: 10,
    },
    margin: {
      t: 5,
      l: 50,
      r: 20,
      b: 70,
    },
    hovermode: "closest",
    responsive: true,
  };

  const config = {'toImageButtonOptions': {'format': 'svg'}}
  Plotly.newPlot("barChart", [trace], layout, config);
}

function renderClusterStackedBarChart(spots) {
  const container = document.getElementById("overallCellTypeDistribution");
  container.innerHTML = '';

  const clusterCellMap = {};
  const cellTypesSet = new Set();

  spots.forEach(spot => {
    const cluster = spot.cluster;
    if (!clusterCellMap[cluster]) {
      clusterCellMap[cluster] = {};
    }

    const values = spot.cellCompositionValues || spot.values || [];
    values.forEach(({ label, value }) => {
      if (!label) return;
      cellTypesSet.add(label);
      if (!clusterCellMap[cluster][label]) {
        clusterCellMap[cluster][label] = 0;
      }
      clusterCellMap[cluster][label] += parseFloat(value) || 0;
    });
  });

  const clusters = Object.keys(clusterCellMap).sort((a, b) => parseInt(a) - parseInt(b));
  const cellTypes = Array.from(cellTypesSet);

  const traces = cellTypes.map(cellType => {
    const xValues = clusters.map(cluster => {
      const total = Object.values(clusterCellMap[cluster] || {}).reduce((a, b) => a + b, 0);
      const val = (clusterCellMap[cluster][cellType] || 0);
      return total > 0 ? (val / total).toFixed(3) : 0;
    });

    let color = "#999999";
    for (let s of spots) {
      const values = s.cellCompositionValues || s.values;
      const v = values?.find(v => v.label === cellType);
      if (v && v.color) {
        color = v.color;
        break;
      }
    }

    return {
      y: clusters,
      x: xValues,
      name: cellType,
      type: 'bar',
      orientation: 'h',
      marker: { color: color },
      hoverinfo: 'x+name'
    };
  });

  const layout = {
    barmode: 'stack',
    yaxis: {
      title: {
        text: 'Cluster',
        font: { size: 14 }
      },
      tickfont: { size: 11 }
    },
    xaxis: {
      title: {
        text: 'Proportion',
        font: { size: 14 }
      },
      range: [0, 1],
      tickformat: ".2f",
      tickfont: { size: 11 }
    },
    height: 250,
    margin: { t: 30, l: 40, r: 20, b: 40 },
    showlegend: false,
  };

  const config = {
    responsive: true,
    toImageButtonOptions: { format: 'svg' }
  };
  Plotly.newPlot(container, traces, layout, config);
}

function showOverallCellTypeDistribution(spots) {
  const chartContainer = document.getElementById("pieChart");
  chartContainer.innerHTML = "";

  const cellTypeMap = {};

  spots.forEach(spot => {
    const values = spot.cellCompositionValues || spot.values || [];
    values.forEach(({ label, value, color, originalLabel }) => {
      if (!label) return;

      if (!cellTypeMap[label]) {
        cellTypeMap[label] = {
          value: 0,
          color: color || "#999999",
          originalLabel: originalLabel || label
        };
      }

      cellTypeMap[label].value += parseFloat(value) || 0;
    });
  });

  const labels = Object.keys(cellTypeMap);
  const values = labels.map(label => cellTypeMap[label].value);
  const colors = labels.map(label => cellTypeMap[label].color);
  const originalNames = labels.map(label => cellTypeMap[label].originalLabel);

  const total = values.reduce((sum, val) => sum + val, 0);

  if (total === 0) {
    chartContainer.innerHTML = "<div style='text-align:center;color:#999;'>No data available for pie chart.</div>";
    return;
  }

  const trace = {
    type: "pie",
    labels: originalNames,
    values: values,
    marker: {
      colors: colors
    },
    textinfo: "text",
    hoverinfo: "label+percent",
    text: values.map(v => {
      const percent = (v / total) * 100;
      return percent >= 5 ? `${percent.toFixed(1)}%` : "";
    }),
    textfont: {
      size: 8
    }
  };

  const layout = {
    margin: { t: 20, l: 20, r: 10, b: 20 },
    showlegend: false,
    responsive: true,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    hoverlabel: {
      font: {
        size: 12,
      }
    }
  };

  const config = { toImageButtonOptions: { format: 'svg' } };

  Plotly.newPlot("pieChart", [trace], layout, config);
}

function showOverallClusterDistribution(spots) {
  const chartContainer = document.getElementById("clusterPieChart");
  chartContainer.innerHTML = "";

  const clusterCounts = {};
  const clusterColors = {};

  spots.forEach(spot => {
    const cluster = spot.cluster;
    if (!cluster) return;

    // Count the number of times each cluster appears
    clusterCounts[cluster] = (clusterCounts[cluster] || 0) + 1;

    // Try to get a representative color for the cluster (if available)
    if (!clusterColors[cluster]) {
      const values = spot.cellCompositionValues || spot.values || [];
      const first = values.find(v => v.color);
      if (first) {
        clusterColors[cluster] = first.color;
      } else {
        clusterColors[cluster] = "#999999"; // default fallback
      }
    }
  });

  const labels = Object.keys(clusterCounts).sort((a, b) => parseInt(a) - parseInt(b));
  const values = labels.map(cluster => clusterCounts[cluster]);
  const colors = labels.map(cluster => clusterColors[cluster]);

  const total = values.reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    chartContainer.innerHTML = "<div style='text-align:center;color:#999;'>No cluster data available.</div>";
    return;
  }

  const trace = {
    type: "pie",
    labels: labels.map(l => `Cluster ${l}`),
    values: values,
    textinfo: "text",
    hoverinfo: "label+percent",
    text: values.map(v => {
      const percent = (v / total) * 100;
      return percent >= 5 ? `${percent.toFixed(1)}%` : "";
    }),
    textfont: {
      size: 8
    }
  };

  const layout = {
    margin: { t: 20, l: 40, r: 0, b: 20 },
    showlegend: false,
    responsive: true,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    hoverlabel: {
      font: {
        size: 12,
      }
    }
  };

  const config = {
    toImageButtonOptions: { format: 'svg' }
  };

  Plotly.newPlot(chartContainer, [trace], layout, config);
}

function showGeneExpressionByClusterBarChart(spots) {
  const container = document.getElementById("geneClusterBarChart");
  container.innerHTML = "";

  const clusterExpression = {};
  const clusterCounts = {};

  spots.forEach(spot => {
    const cluster = spot.cluster;
    if (!cluster || !spot.visible || !spot.values?.[0]) return;
    const avgExpression = spot.values[0].value;

    if (!clusterExpression[cluster]) {
      clusterExpression[cluster] = 0;
      clusterCounts[cluster] = 0;
    }

    clusterExpression[cluster] += avgExpression;
    clusterCounts[cluster] += 1;
  });

  const clusters = Object.keys(clusterExpression).sort((a, b) => parseInt(a) - parseInt(b));
  const avgExpressions = clusters.map(c => clusterExpression[c] / clusterCounts[c]);

  const trace = {
    x: clusters,
    y: avgExpressions,
    type: 'bar',
    hoverinfo: 'text',
    text: avgExpressions.map(v => v.toFixed(2)),
    textposition: 'none',
    hovertext: clusters.map((c, i) => `Cluster ${c}, ${avgExpressions[i].toFixed(2)}`)
  };

  const layout = {
    xaxis: { title: window.selectedClusterFeature, tickfont: { size: 11 } },
    yaxis: { title: "Avg Expression", tickfont: { size: 11 } },
    margin: { t: 40, l: 40, r: 20, b: 30 },
    height: 200,
    responsive: true
  };

  const config = { toImageButtonOptions: { format: 'svg' } };

  Plotly.newPlot(container, [trace], layout, config);
}

function showGeneExpressionByCellTypeBarChart(spots) {
  const container = document.getElementById("geneCellTypeBarChart");
  container.innerHTML = "";

  const expressionSum = {};
  const weightSum = {};
  const colorMap = {};

  spots.forEach(spot => {
    if (!spot.cellCompositionValues || !spot.visible || !spot.values?.[0]) return;
    const avgExpression = spot.values[0].value;

    const total = spot.cellCompositionValues.reduce((sum, c) => sum + parseFloat(c.value), 0) || 1;

    spot.cellCompositionValues.forEach(cell => {
      const label = cell.label;
      const proportion = parseFloat(cell.value) / total;
      const weightedExpr = avgExpression * proportion;

      if (!expressionSum[label]) {
        expressionSum[label] = 0;
        weightSum[label] = 0;
      }

      expressionSum[label] += weightedExpr;
      weightSum[label] += proportion;

      if (!colorMap[label] && cell.color) {
        colorMap[label] = cell.color;
      }
    });
  });

  const labels = Object.keys(expressionSum);
  const avgExpressions = labels.map(label => expressionSum[label] / weightSum[label]);
  const colors = labels.map(label => colorMap[label] || '#888');

  const trace = {
    x: labels.map(label => label.substring(0, 10)),
    y: avgExpressions,
    type: 'bar',
    marker: { color: colors },
    hoverinfo: 'text',
    text: avgExpressions.map(v => v.toFixed(2)),
    textposition: 'none',
    hovertext: labels.map((label, i) => `${label}<br>Avg: ${avgExpressions[i].toFixed(2)}`)
  };

  const layout = {
    xaxis: { title: "Cell Type", tickangle: -45, tickfont: { size: 11 } },
    yaxis: { title: "Avg Expression", tickfont: { size: 11 } },
    margin: { t: 40, l: 40, r: 20, b: 80 },
    height: 200,
    responsive: true
  };

  const config = { toImageButtonOptions: { format: 'svg' } };

  Plotly.newPlot(container, [trace], layout, config);
}