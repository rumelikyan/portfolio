let data = [];
let commits = [];
let filteredCommits = [];
let selectedCommits = [];
let commitProgress = 0;
let commitMaxTime;
let timeScale;

const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 50, left: 70 };
let xScale, yScale;

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  document.getElementById('timeSlider').addEventListener('input', updateTimeDisplay);
});

async function loadData() {
  data = await d3.csv('loc.csv', row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
    type: row.type
  }));
  processCommits();
  timeScale = d3.scaleTime()
    .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
    .range([0, 100]);
  commitMaxTime = timeScale.invert(commitProgress);
  filterCommitsByTime();
  updateStats();
  updateScatterplot(filteredCommits);
}

function processCommits() {
  commits = d3.groups(data, d => d.commit).map(([commit, lines]) => {
    let first = lines[0];
    let { author, date, time, timezone, datetime } = first;
    return {
      id: commit,
      url: 'https://github.com/YOUR_REPO/commit/' + commit,
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
      lines
    };
  });
}

function filterCommitsByTime() {
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
}

function updateTimeDisplay() {
  commitProgress = Number(document.getElementById('timeSlider').value);
  commitMaxTime = timeScale.invert(commitProgress);
  d3.select('#selectedTime').text(commitMaxTime.toLocaleString());
  filterCommitsByTime();
  updateScatterplot(filteredCommits);
  updateStats();
}

function updateStats() {
  const flat = filteredCommits.flatMap(commit => commit.lines);
  const statsContainer = d3.select("#stats").html("");
  const dl = statsContainer.append("dl").attr("class", "stats");
  dl.append("dt").html("Total <abbr title='Lines of code'>LOC</abbr>");
  dl.append("dd").text(flat.length);
  dl.append("dt").text("Total commits");
  dl.append("dd").text(filteredCommits.length);
  dl.append("dt").text("Number of files");
  dl.append("dd").text(d3.group(flat, d => d.file).size || 0);
  dl.append("dt").text("Maximum depth");
  dl.append("dd").text(d3.max(flat, d => d.depth) || 0);
  dl.append("dt").text("Average line length");
  dl.append("dd").text(flat.length ? d3.mean(flat, d => d.length).toFixed(2) : 0);
}

function updateScatterplot(filtered) {
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom
  };
  d3.select('svg').remove();
  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const gridlines = svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00');
  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);
  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  const [minLines, maxLines] = d3.extent(filtered, d => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines || 0, maxLines || 0])
    .range([2, 30]);

  const dots = svg.append('g').attr('class', 'dots');
  const sorted = d3.sort(filtered, d => -d.totalLines);
  dots.selectAll('circle')
    .data(sorted, d => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('style', d => `--r: ${rScale(d.totalLines)}`)
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', function(event, commit) {
      d3.select(event.currentTarget).classed('selected', true);
      updateTooltipContent(commit);
      updateTooltipPosition(event);
    })
    .on('mouseleave', function(event) {
      d3.select(event.currentTarget).classed('selected', false);
      updateTooltipContent({});
    });

  svg.append('g').call(d3.brush().on('start brush end', brushed));
  d3.select(svg.node()).selectAll('.dots, .overlay ~ *').raise();
}

function brushed(evt) {
  let brushSelection = evt.selection;
  selectedCommits = !brushSelection ? [] : commits.filter(commit => {
    let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
    let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
    let x = xScale(commit.datetime);
    let y = yScale(commit.hourFrac);
    return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
  });
  updateSelection();
}

function updateSelection() {
  d3.selectAll('circle').classed('selected', d => selectedCommits.includes(d));
  updateSelectionCount();
  updateLanguageBreakdown();
}

function updateSelectionCount() {
  document.getElementById('selection-count').textContent =
    `${selectedCommits.length || 'No'} commits selected`;
}

function updateLanguageBreakdown() {
  const container = document.getElementById('language-breakdown');
  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const lines = selectedCommits.flatMap(d => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);
  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `<dt>${language}</dt><dd>${count} lines (${formatted})</dd>`;
  }
}

function updateTooltipContent(commit) {
  const tooltip = document.getElementById('commit-tooltip');
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  if (!commit || Object.keys(commit).length === 0) {
    tooltip.hidden = true;
    return;
  }
  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
  tooltip.hidden = false;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
}
