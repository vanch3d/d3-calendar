export default function() {

    /**
     * Specify whether the week start on Monday (true) or on Sunday (false)
     * @type {boolean}
     */
    let mondayWeek = true;

    /**
     * Specify whether the weekly summary is displayed on the chart
     * @type {boolean}
     */
    let weeklySummary = false;

    /**
     * The default labels for the different elements of the chart
     * @type {{day: string[], month: string[], legend: string[]}}
     */
    let defaultLabels = {
        day: ["M","T","W","T","F","S","S"],
        month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        legend: ["Low","High"]
    };

    /**
     * The current labels
     * @type {{day: string[], month: string[], legend: string[]}}
     */
    let labels = Object.assign({},defaultLabels);

    let width = 960,
        height = 136,
        cellSize = 17,
        summaryMargin = 4,
        paddingBottom = 20;

    /**
     * The default color scale used for the chart
     */
    let color = d3.scaleQuantize()
        .domain([0, 5])
        .range(["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"]);

    let timeFormatter = d3.timeFormat("%Y-%m-%d");
    let timeParser = d3.timeParse("%Y-%m-%d");

    /**
     * Return the week day of a given date, taking into account Monday/Sunday start
     * @param {Date} d
     * @return {number}
     */
    let getDay = function(d) {
        return (mondayWeek)? (d.getDay() + 6) % 7 : d.getDay();
    };

    /**
     * Return the week number of a given date, taking into account Monday/Sunday start
     * @param {Date} d
     * @return {string}
     */
    let getWeek = function(d) {
        let ft = (mondayWeek)? d3.timeFormat("%W") : d3.timeFormat("%U");
        return ft(d);
    };

    /**
     * Return a list of day's label, taking into account Monday/Sunday start
     * @return {string[]}
     */
    let getWeekDays = function(){
        let ret = labels.day.slice();
        if (!mondayWeek)
            ret.unshift(ret.pop());
        return ret;
    };

    /**
     * Generate the calendar chart and insert it into the DOM selection
     * @param selection
     */
    function calendar(selection){

        /**
         * Generate the border in the chart of a month defined by a specific date
         * @param {Date} t0
         * @return {string} The SVG path instruction
         */
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

            // build a summary of the data nested by year & week
            let byWeek = d3.nest()
                .key(function (d) {
                    return new Date(d).getFullYear();
                })
                .key(function (d) {
                    return getWeek(new Date(d));
                })
                .rollup(function (l) {
                    return d3.mean(l,function(e){ return data[e]})
                })
                .object(d3.keys(data));

            // create the main chart for each year in the data
            let svgChart = d3.select(this)
                .selectAll("svg")
                .data(d3.range(yExtent[0], yExtent[1]+1))
                .enter().append("svg")
                .attr("font-family", "sans-serif")
                .attr("font-size", "14")
                .attr("width", width)
                .attr("height", height + (weeklySummary ? cellSize + summaryMargin : 0)  + paddingBottom)
                .append("g")
                .attr("transform", "translate(" + (((width - cellSize * 53) / 2)+ 20) + "," + (height - cellSize * 7 - 1) + ")");

            // create the year labels
            svgChart.append("text")
                .attr("transform", "translate(-26," + cellSize * 3.5 + ")rotate(-90)")
                .attr('class','label-year')
                .attr("fill", "#000")
                .attr("text-anchor", "middle")
                .text(function(d) { return d; });

            // create the day labels
            // @todo[vanch3d] move all text labels into the same g
            svgChart.selectAll('label-day')
                .data(getWeekDays())
                .enter().append('g')
                .attr('transform', function (d, i) {
                    return 'translate(-10,' + cellSize*(i+1) + ')';
                })
                .append('text')
                .attr('class', 'label-day')
                .attr("fill","#aaa")
                .style('text-anchor', 'middle')
                .attr('dy', '-.25em')
                .text(function (d) { return d; });

            // create the 'card' for each day in the calendar
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

            let weekCard = null;
            if (weeklySummary)
            {
                // create the weekly summary row of 'cards' for each week
                weekCard = svgChart.append("g")
                    .attr("fill", "#fff8")
                    .attr("stroke", "#ccc")
                    .selectAll("rect")
                    .data(function(d) { return d3.timeWeeks(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                    .enter().append("rect")
                    .attr("width", cellSize)
                    .attr("height", cellSize)
                    .attr("x", function(d) { return getWeek(d) * cellSize; })
                    .attr("y", function(d) { return 7 * cellSize + summaryMargin; });
            }

            // create a group for each month in the calendar
            let gMonth = svgChart.append("g")
                .selectAll("path")
                .data(function(d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                .enter();

            // create a border for the months
            gMonth.append("path")
                .attr("fill", "none")
                .attr("stroke", "#000")
                .attr("d", pathMonth);

            // create the month labels
            gMonth.append('text')
                .attr('class', 'label-month')
                .style('text-anchor', 'end')
                .attr("fill","#aaa")
                .attr("y", -5)
                .attr("x",function(d){ return (+getWeek(d) + 3) * cellSize; })
                .text(function (d,i) { return labels.month[i] });


            updateHeatMap();

            /**
             * Update the content of the calendar heatmap based on the data
             */
            function updateHeatMap(){
                svgCard.filter(function(d) { return d in data && !isNaN(data[d]); })
                    .attr("fill", function(d) { return color(data[d]);})
                    .append("title")
                    .text(function(d) { return d + ": " + JSON.stringify(data[d]); });

                if (weekCard)
                {
                    weekCard
                        .filter(function(d) {
                            let y = new Date(d).getFullYear(),
                                w = getWeek(d);
                            return y in byWeek && !isNaN(byWeek[y][w]);
                        })
                        .attr("fill", function(d) {
                            let y = new Date(d).getFullYear(),
                                w = getWeek(d);
                            return color(byWeek[y][w]);})
                        .append("title")
                        .text(function(d) {
                            let y = new Date(d).getFullYear(),
                                w = getWeek(d);
                            return "Week " + w + ": " + (byWeek[y][w]).toFixed(2);
                        });
                }



            }


        });

        // create a group for the legend widget
        // @todo[vanch3d] the DOM selector needs to be customisable
        let svgLegend = d3.select("#legend")
            .append("svg")
            .attr("width", width)
            .attr("height", 40)
            .attr("font-family", "sans-serif")
            .attr("font-size", "14")
            .append("g");

        updateLegend();

        /**
         * Update the content of the legend based on the data range
         */
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
                .text(labels.legend[0]);

            svgLegend.append('text')
                .attr('class','label-legend')
                .attr("fill", "#000")
                .attr('x', legendX + color.range().length*13+5)
                .attr('y',legendY + 10)
                .text(labels.legend[1]);
        }

    }

    /**
     * Set/Get whether the weekly summary is generated
     * @param {boolean} value
     * @return {*}
     */
    calendar.weeklySummary = function(value) {
        if (!arguments.length) return weeklySummary;
        weeklySummary = value;
        return calendar;
    };

    /**
     * Set/Get whether the week starts on a Monday or Sunday
     * @param {boolean} value
     * @return {*}
     */
    calendar.mondayWeek = function(value) {
        if (!arguments.length) return mondayWeek;
        mondayWeek = value;
        return calendar;
    };

    /**
     * Set/Get the width of the chart
     * @param {number} value
     * @return {*}
     */
    calendar.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return calendar;
    };

    /**
     * Set/Get the height of the chart
     * @param {number} value
     * @return {*}
     */
    calendar.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return calendar;
    };

    /**
     * Set/Get the dimension of each day 'card'
     * @param {number} value
     * @return {*}
     */
    calendar.cellSize = function(value) {
        if (!arguments.length) return cellSize;
        cellSize = value;
        return calendar;
    };

    /**
     * Set/Get the color scale for the chart
     * @param {d3.scaleQuantize} value
     * @return {*}
     */
    calendar.color = function(value) {
        if (!arguments.length) return color;
        color = value;
        return calendar;
    };

    /**
     * Set/Get the labels for the different elements of the chart
     * @param {Object} value
     * @return {*}
     */
    calendar.labels = function(value) {
        if (!arguments.length) return labels;
        labels = Object.assign({},defaultLabels,value);
        return calendar;
    };

    return calendar;
}
