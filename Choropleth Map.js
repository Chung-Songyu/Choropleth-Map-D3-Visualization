const height = 615;
const width = 950;

const svg = d3.select("#container")
              .append("svg")
              .attr("id", "map")
              .attr("height", height)
              .attr("width", width);
const tooltip = d3.select("#container")
                  .append("div")
                  .attr("id", "tooltip")
                  .attr("class", "hidden");

const legendPadding = {
  left: 20,
  right: 20
};
let legendColorsT = [0.2];
while(legendColorsT[legendColorsT.length-1]<1) {
  legendColorsT.push(Number((legendColorsT[legendColorsT.length-1] + 0.05).toFixed(2)));
}
const legendCellHeight = 20;
const legendCellWidth = 35;
const legendSvgHeight = 50;
const legendSvgWidth = legendCellWidth * legendColorsT.length + legendPadding.left + legendPadding.right;
const legend = d3.select("#container")
                 .append("svg")
                 .attr("id", "legend-svg")
                 .attr("height", legendSvgHeight)
                 .attr("width", legendSvgWidth);
legend.append("g")
      .attr("id", "legend")
      .selectAll("rect")
      .data(legendColorsT)
      .enter()
      .append("rect")
      .attr("height", legendCellHeight)
      .attr("width", legendCellWidth)
      .attr("x", (d, i) => legendPadding.left + i * legendCellWidth)
      .style("fill", (d) => d3.interpolatePurples(d));

const dataUrl = ["https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json", "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"];
const promises = [];
dataUrl.forEach((url) => {
  promises.push(d3.json(url));
});

const run = async () => {
  const response = await Promise.all(promises);
  const dataset = response[0];
  const edupercent = [d3.min(dataset, d => d.bachelorsOrHigher), d3.max(dataset, d => d.bachelorsOrHigher)];

  const legendDomain = [];
  for(i=0; i<=legendColorsT.length; i++) {
    legendDomain.push(Number((edupercent[0] + i * (edupercent[1] - edupercent[0]) / legendColorsT.length).toFixed(1)));
  }
  const legendRange = [];
  for(i=0; i<=legendColorsT.length; i++) {
    legendRange.push(i * legendCellWidth);
  }
  const legendXScale = d3.scaleOrdinal()
                         .domain(legendDomain)
                         .range(legendRange);
  const legendXAxis = d3.axisBottom(legendXScale);
  legend.append("g")
        .attr("transform", "translate(" + legendPadding.left + ", " + legendCellHeight + ")")
        .attr("id", "legend-x-axis")
        .call(legendXAxis);

  const map = response[1];
  const counties = topojson.feature(map, map.objects.counties).features;
  const path = d3.geoPath();

  const county = (id) => {
    const datasetObj = dataset.find(({fips}) => fips === id);
    const countyFill = (datasetObj.bachelorsOrHigher - edupercent[0]) / (edupercent[1] - edupercent[0]) * 0.8 + 0.2;
    return [countyFill, datasetObj.bachelorsOrHigher, datasetObj.area_name, datasetObj.state];
  }; // countyFill sets color range as d3.interpolatePurples(0.2) to d3.interpolatePurples(1)

  svg.append("g")
     .selectAll(".county")
     .data(counties)
     .enter()
     .append("path")
     .attr("d", path)
     .attr("class", "county")
     .style("fill", d => d3.interpolatePurples(county(d.id)[0]))
     .attr("data-fips", d => d.id)
     .attr("data-education", d => county(d.id)[1])
     .on("mouseover", function(d, i) {
        d3.select("#tooltip").classed("hidden", false);
        d3.select(this).classed("selected", true);
        let coordinates = d3.pointer(event);
        tooltip.style("top", coordinates[1] - 40 + "px")
               .style("left", coordinates[0] + 10 + "px")
               .text(county(i.id)[2] + ", " + county(i.id)[3] + ": " + county(i.id)[1] + "%")
               .attr("data-education", county(i.id)[1]);
     })
     .on("mouseout", function(d, i) {
        d3.select("#tooltip").classed("hidden", true);
        d3.select(this).classed("selected", false);
     });
};
run();
