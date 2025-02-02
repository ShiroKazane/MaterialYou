function benchmarkSelectors(cssString) {
  function extractSelectors(cssString) {
    cssString = cssString.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove comments

    // Remove nested brackets
    let result = '';
    let depth = 0;
    for (let char of cssString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
      } else if (depth === 0) {
        result += char;
      }
    }
    cssString = result;

    let selectors = cssString
      .split(/,(?![^(]*\))|[\n\r]+/) // Split by commas or newline
      .map(s => s.trim().replace(/::(?:before|after)/, '')) // Trim pseudo-elements
      .filter(Boolean); // Remove empty strings

    return selectors;
  }

  const benchmarkSelector = selector => {
    const start = performance.now();
    let matches = 0;
    for (let i = 0; i < 1000; i++) {
      matches = document.querySelectorAll(selector).length;
    }
    return [(performance.now() - start) / 1000, matches];
  };

  // Generate CSV content
  const csvContent = extractSelectors(cssString)
    .map(selector => {
      try {
        const [time, matches] = benchmarkSelector(selector);
        let performanceRating = 'Fast';
        if (time > 0.5) performanceRating = 'Slow';
        else if (time > 0.2) performanceRating = 'Medium';
        return { selector, time, matches, performanceRating };
      } catch (error) {
        console.error(`Error benchmarking "${selector}": ${error.message}`);
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.time - a.time)
    .map(
      ({ selector, time, matches }) =>
        `"${selector}",${time.toFixed(6)},${matches}`
    )
    .join('\n')
    .replace(/^/, 'Selector,Time (ms),Matches,Performance\n');

  downloadCSV(csvContent, 'benchmark_results.csv');
}

// Download CSV file
function downloadCSV(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
