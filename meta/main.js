let data = [];
let commits = [];
let selectedCommits = [];
const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 50, left: 70 };
let xScale, yScale;

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupScrollytelling();
  renderItems(0);
  setupFileScrollytelling();
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
  updateStats(commits);
  updateScatterplot(commits);
  displayCommitFiles(commits);
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

/* === Commit Scrollytelling (Step 3) === */
let NUM_ITEMS = 100; // will update to commits.length
let ITEM_HEIGHT = 150; // height for commit narrative items
let VISIBLE_COUNT = 10;
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
let scrollContainer, spacer, itemsContainer;

function setupScrollytelling() {
  NUM_ITEMS = commits.length;
  totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
  scrollContainer = d3.select('#scroll-container');
  spacer = d3.select('#spacer');
  itemsContainer = d3.select('#items-container');
  spacer.style('height', `${totalHeight}px`);
  scrollContainer.on('scroll', () => {
    const scrollTop = scrollContainer.property('scrollTop');
    let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
    renderItems(startIndex);
  });
}

function renderItems(startIndex) {
  itemsContainer.selectAll('div').remove();
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);
  updateScatterplot(newCommitSlice);
  updateStats(newCommitSlice);
  displayCommitFiles(newCommitSlice);
  itemsContainer.selectAll('div')
    .data(newCommitSlice)
    .enter()
    .append('div')
    .attr('class', 'item')
    .style('position', 'absolute')
    .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`)
    .style('height', ITEM_HEIGHT + 'px')
    .html((commit, index) => {
      return `<p>
        On ${commit.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}, I made 
        <a href="${commit.url}" target="_blank">
          ${index > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
        </a>. I edited ${commit.totalLines} lines across ${d3.rollups(commit.lines, d => d.length, d => d.file).length} files. Then I looked over all I had made, and I saw that it was very good.
      </p>`;
    });
}

/* === File Sizes Scrollytelling (Step 4) === */
let fileGroups = [];
let FILE_NUM_ITEMS = 0;
let FILE_ITEM_HEIGHT = 30; // height for file narrative items
let FILE_VISIBLE_COUNT = 10;
let fileTotalHeight = 0;
let fileScrollContainer, fileSpacer, fileItemsContainer;

function setupFileScrollytelling() {
  // Group all lines by file from the full commit history
  const allLines = commits.flatMap(d => d.lines);
  fileGroups = d3.groups(allLines, d => d.file)
    .map(([name, lines]) => ({ name, lines }));
  fileGroups = d3.sort(fileGroups, d => -d.lines.length);
  FILE_NUM_ITEMS = fileGroups.length;
  fileTotalHeight = (FILE_NUM_ITEMS - 1) * FILE_ITEM_HEIGHT;
  fileScrollContainer = d3.select('#file-scroll-container');
  fileSpacer = d3.select('#file-spacer');
  fileItemsContainer = d3.select('#file-items-container');
  fileSpacer.style('height', `${fileTotalHeight}px`);
  fileScrollContainer.on('scroll', () => {
    const scrollTop = fileScrollContainer.property('scrollTop');
    let startIndex = Math.floor(scrollTop / FILE_ITEM_HEIGHT);
    startIndex = Math.max(0, Math.min(startIndex, FILE_NUM_ITEMS - FILE_VISIBLE_COUNT));
    renderFileItems(startIndex);
  });
  renderFileItems(0);
}

function renderFileItems(startIndex) {
  fileItemsContainer.selectAll('div').remove();
  const endIndex = Math.min(startIndex + FILE_VISIBLE_COUNT, FILE_NUM_ITEMS);
  let fileSlice = fileGroups.slice(startIndex, endIndex);
  // (Optional: update the unit visualization for file sizes here)
  fileItemsContainer.selectAll('div')
    .data(fileSlice)
    .enter()
    .append('div')
    .attr('class', 'file-item')
    .style('position', 'absolute')
    .style('top', (_, idx) => `${idx * FILE_ITEM_HEIGHT}px`)
    .style('height', FILE_ITEM_HEIGHT + 'px')
    .html(d => {
      return `<p>
        File <code>${d.name}</code> now has ${d.lines.length} lines.
      </p>`;
    });
}

/* === Existing Functions for Stats, Scatterplot, etc. === */
function updateStats(commitArray) {
  const flat = commitArray.flatMap(commit => commit.lines);
  const statsContainer = d3.select("#stats").html("");
  const dl = statsContainer.append("dl").attr("class", "stats");
  dl.append("dt").html("Total <abbr title='Lines of code'>LOC</abbr>");
  dl.append("dd").text(flat.length);
  dl.append("dt").text("Total commits");
  dl.append("dd").text(commitArray.length);
  dl.append("dt").text("Number of files");
  dl.append("dd").text(d3.group(flat, d => d.file).size || 0);
  dl.append("dt").text("Maximum depth");
  dl.append("dd").text(d3.max(flat, d => d.depth) || 0);
  dl.append("dt").text("Average line length");
  dl.append("dd").text(flat.length ? d3.mean(flat, d => d.length).toFixed(2) : 0);
}

function updateScatterplot(dataSubset) {
  if (!dataSubset.length) {
    d3.select('svg').remove();
    return;
  }
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
    .domain(d3.extent(dataSubset, d => d.datetime))
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
  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');
  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);
  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
  const [minLines, maxLines] = d3.extent(dataSubset, d => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines || 0, maxLines || 0])
    .range([2, 30]);
  const dots = svg.append('g').attr('class', 'dots');
  const sorted = d3.sort(dataSubset, d => -d.totalLines);
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

function displayCommitFiles(commitArray) {
  let lines = commitArray.flatMap(d => d.lines);
  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
  let files = d3.groups(lines, d => d.file).map(([name, lines]) => ({ name, lines }));
  files = d3.sort(files, d => -d.lines.length);
  d3.select('.files').selectAll('div').remove();
  let filesContainer = d3.select('.files')
    .selectAll('div')
    .data(files)
    .enter()
    .append('div');
  filesContainer.append('dt')
    .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
  filesContainer.append('dd')
    .selectAll('div')
    .data(d => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', d => fileTypeColors(d.type));
}
