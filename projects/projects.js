import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let query = '';
let selectedIndex = -1;

document.addEventListener("DOMContentLoaded", async () => {
    const projectsContainer = document.querySelector('.projects');
    const projectsTitle = document.querySelector('.projects-title');
    const pieChartContainer = document.querySelector("#projects-pie-plot");
    const legendContainer = document.querySelector(".legend");
    const searchInput = document.querySelector('.searchBar');

    if (!projectsContainer || !projectsTitle || !pieChartContainer || !legendContainer || !searchInput) {
        console.error("One or more necessary elements not found.");
        return;
    }

    const projects = await fetchJSON('../lib/projects.json');

    if (projects && projects.length > 0) {
        renderProjects(projects, projectsContainer);
        projectsTitle.textContent = `${projects.length} Projects`;
        renderPieChart(projects);
    } else {
        projectsTitle.textContent = "0 Projects";
        console.error("No projects found or error loading JSON.");
        return;
    }

    function renderPieChart(projectsGiven) {
        d3.select("#projects-pie-plot").selectAll("path").remove();
        d3.select(".legend").selectAll("li").remove();

        let rolledData = d3.rollups(
            projectsGiven,
            (v) => v.length,
            (d) => d.year
        );

        let data = rolledData.map(([year, count]) => ({
            value: count,
            label: year.toString()
        }));

        let sliceGenerator = d3.pie().value(d => d.value);
        let arcData = sliceGenerator(data);

        let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
        let colors = d3.scaleOrdinal(d3.schemeTableau10);

        let svg = d3.select("#projects-pie-plot");

        svg.selectAll("path")
            .data(arcData)
            .enter()
            .append("path")
            .attr("d", arcGenerator)
            .attr("fill", (d, idx) => colors(idx))
            .attr("class", (_, idx) => (idx === selectedIndex ? "selected" : ""))
            .on("mouseover", function () {
                svg.classed("has-hover", true);
            })
            .on("mouseout", function () {
                svg.classed("has-hover", false);
            })
            .on("click", function (_, idx) {
                selectedIndex = selectedIndex === idx ? -1 : idx;
                updateFilteredProjects(data);
            });

        let legend = d3.select('.legend');

        legend.selectAll("li")
            .data(data)
            .enter()
            .append("li")
            .attr("style", (d, idx) => `--color:${colors(idx)}`)
            .attr("class", (_, idx) => (idx === selectedIndex ? "selected" : ""))
            .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on("click", function (_, idx) {
                selectedIndex = selectedIndex === idx ? -1 : idx;
                updateFilteredProjects(data);
            });
    }

    function updateFilteredProjects(data) {
        let filteredProjects = projects.filter((project) => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
        });

        if (selectedIndex !== -1) {
            let selectedYear = data[selectedIndex].label;
            filteredProjects = filteredProjects.filter(project => project.year.toString() === selectedYear.toString());
        }

        renderProjects(filteredProjects, projectsContainer, 'h2');
        renderPieChart(filteredProjects);
    }

    searchInput.addEventListener('input', (event) => {
        query = event.target.value.toLowerCase();
        updateFilteredProjects(d3.rollups(projects, (v) => v.length, (d) => d.year).map(([year]) => ({ label: year.toString() })));
    });
});
