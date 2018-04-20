export default function() {

    let mondayWeek = true;
    let width = 960,
        height = 136,
        cellSize = 17;

    let color = d3.scaleQuantize()
        .domain([0, 5])
        .range(["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"]);

    let timeFormatter = d3.timeFormat("%Y-%m-%d");
    let timeParser = d3.timeParse("%Y-%m-%d");

    let getDay = function(d) {
        return (mondayWeek)? (d.getDay() + 6) % 7 : d.getDay();
    };

    let getWeek = function(d) {
        let ft = (mondayWeek)? d3.timeFormat("%W") : d3.timeFormat("%U");
        return ft(d);
    };

    function calendar(selection){

        function pathMonth(t0) {
            let t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
                d0 = +getDay(t0), w0 = +getWeek(t0),
                d1 = +getDay(t1), w1 = +getWeek(t1);
            return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
                + "H" + w0 * cellSize + "V" + 7 * cellSize
                + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
                + "H" + (w1 + 1) * cellSize + "V" + 0
                + "H" + (w0 + 1) * cellSize + "Z";
        }

        selection.each(function(data) {
            let yExtent = d3.extent(d3.keys(data), function(d) {
                return timeParser(d).getFullYear();
            });

            let svgChart = d3.select(this)
                .selectAll("svg")
                .data(d3.range(yExtent[0], yExtent[1]+1))
                .enter().append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

            svgChart.append("text")
                .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
                .attr('class','label-year')
                .attr("fill", "#000")
                .attr("text-anchor", "middle")
                .text(function(d) { return d; });

            let svgCard = svgChart.append("g")
                .attr("fill", "#fff8")
                .attr("stroke", "#ccc")
                .selectAll("rect")
                .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                .enter().append("rect")
                .attr("width", cellSize)
                .attr("height", cellSize)
                .attr("x", function(d) { return getWeek(d) * cellSize; })
                .attr("y", function(d) { return getDay(d) * cellSize; })
                .datum(timeFormatter);

            svgChart.append("g")
                .attr("fill", "none")
                .attr("stroke", "#000")
                .selectAll("path")
                .data(function(d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                .enter().append("path")
                .attr("d", pathMonth);

            let svgLegend = d3.select("#legend")
                .append("svg")
                .attr("width", width)
                .attr("height", 40)
                .append("g");

            updateHeatMap();
            updateLegend();

            function updateHeatMap(){
                svgCard.filter(function(d) { return d in data && !isNaN(data[d]); })
                    .attr("fill", function(d) { return color(data[d]);})
                    .append("title")
                    .text(function(d) { return d + ": " + JSON.stringify(data[d]); });

            }

            function updateLegend(){
                let legendX = 50; //x Position for legend
                let legendY = 10; //y position for legend

                svgLegend.selectAll('legend').remove();
                svgLegend.selectAll('legend')
                    .data(color.range())
                    .enter()
                    .append('rect')
                    .attr('width',11)
                    .attr('height',11)
                    .attr('x',function(d,i){ return legendX + i*13; })
                    .attr('y',legendY)
                    //.attr('title',function(d,i) {console.log(d,i);return "";})
                    .attr('fill',function(d){ return d; });

                svgLegend.append('text')
                    .attr('class','label-legend')
                    .attr("fill", "#000")
                    .attr('x', legendX - 35)
                    .attr('y',legendY + 10)
                    .text('Low');

                svgLegend.append('text')
                    .attr('class','label-legend')
                    .attr("fill", "#000")
                    .attr('x', legendX + color.range().length*13+5)
                    .attr('y',legendY + 10)
                    .text('High');
            }

        });

    }

    calendar.mondayWeek = function(value) {
        if (!arguments.length) return mondayWeek;
        mondayWeek = value;
        return calendar;
    };

    calendar.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return calendar;
    };

    calendar.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return calendar;
    };

    calendar.cellSize = function(value) {
        if (!arguments.length) return cellSize;
        cellSize = value;
        return calendar;
    };

    calendar.color = function(value) {
        if (!arguments.length) return color;
        color = value;
        return calendar;
    };

    return calendar;
}
