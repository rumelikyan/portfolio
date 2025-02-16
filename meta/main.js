let data = [];
let commits = [];
const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 50, left: 70 };
let xScale, yScale, brushSelection = null;

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: +row.line,
        depth: +row.depth,
        length: +row.length,
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
        type: row.type // Ensure file type is included
    }));

    processCommits();
    displayStats();
    createScatterplot();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

function processCommits() {
    commits = d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
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

function displayStats() {
    const statsContainer = d3.select("#stats");
    statsContainer.html(""); // Clear previous content

    const dl = statsContainer.append("dl").attr("class", "stats");

    dl.append("dt").html("Total <abbr title='Lines of code'>LOC</abbr>");
    dl.append("dd").text(data.length);

    dl.append("dt").text("Total commits");
    dl.append("dd").text(commits.length);

    dl.append("dt").text("Number of files");
    dl.append("dd").text(d3.group(data, (d) => d.file).size);

    dl.append("dt").text("Maximum depth");
    dl.append("dd").text(d3.max(data, (d) => d.depth));

    dl.append("dt").text("Average line length");
    dl.append("dd").text(d3.mean(data, (d) => d.length).toFixed(2));
}


// Tooltip functions
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

// ** FIXED: Selection logic actually works now **
function isCommitSelected(commit) {
    if (!brushSelection) return false;
    const [[x0, y0], [x1, y1]] = brushSelection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function updateSelection() {
    const selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];

    // ** FIXED: Now turns selected commits RED **
    d3.selectAll('circle')
        .classed('selected', (d) => isCommitSelected(d));

    updateSelectionCount();
    updateLanguageBreakdown();
}

// ** FIXED: Commit count actually appears now **
function updateSelectionCount() {
    const selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
    document.getElementById('selection-count').textContent = 
        `${selectedCommits.length || 'No'} commits selected`;
}

// ** FIXED: Language breakdown actually updates now **
function updateLanguageBreakdown() {
    const selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }

    const lines = selectedCommits.flatMap((d) => d.lines);
    const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type);

    container.innerHTML = '';

    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);
        container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
    }
}

// Brushing function
function brushed(event) {
    brushSelection = event.selection;
    updateSelection();
}

// Scatterplot function
function createScatterplot() {
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    const dots = svg.append('g').attr('class', 'dots');

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    dots
        .selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7)
        .on('mouseenter', function (event, commit) {
            d3.select(event.currentTarget).style('fill-opacity', 1);
            updateTooltipContent(commit);
            updateTooltipPosition(event);
        })
        .on('mouseleave', function () {
            d3.select(this).style('fill-opacity', 0.7);
            updateTooltipContent({});
        });

    svg.append('g').call(d3.brush().on('start brush end', brushed));
    d3.select(svg.node()).selectAll('.dots, .overlay ~ *').raise();
}
