/* global d3 */
import {getRollupKeys} from "./utils";
import {isObject} from "./utils.js";

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
     * The default labels for the various elements of the chart
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

    let allCharts = [];
    let rollupKeys = [];

    /**
     * Declaring the custom events for the chart
     */
    let dispatch = d3.dispatch("update");


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
            console.log("DATA",data);

            let yExtent = d3.extent(d3.keys(data), function(d) {
                return timeParser(d).getFullYear();
            });

            rollupKeys = getRollupKeys(data,rollupKeys);
            console.log("ROLLUP-KEYS",rollupKeys);

            let getWeekSummary = function(days)
            {
                if (rollupKeys.length>=1)
                {
                    let smallData = days.map(function(d) { return data[d]; });
                    let pt = {};
                    rollupKeys.forEach(function(elt){
                        pt[elt] = d3.mean(smallData,function(d){ return +d[elt]; })
                    });
                    return pt;
                }
                return d3.mean(days,function(d){ return +data[d]; });
            };

            // build a summary of the data nested by year & week
            let byWeek = d3.nest()
                .key(function (d) { return new Date(d).getFullYear(); })
                .key(function (d) { return getWeek(new Date(d)); })
                .rollup(function(d){ return getWeekSummary(d);})
                .object(d3.keys(data));
            console.log("WEEK-SUMMARY",byWeek);

            // create the main chart for each year in the data
            let svgChart = d3.select(this)
                .selectAll("svg")
                .data(d3.range(yExtent[0], yExtent[1]+1))
                .enter().append("svg")
                .attr("font-family", "sans-serif")
                .attr("font-size", "14")
                .attr("width", width)
                .attr("height", height + (weeklySummary ? cellSize + summaryMargin : 0)  + paddingBottom);

            // save a reference to the chart
            allCharts.push(this);

            // group by years
            let chartGroup = svgChart.append("g")
                .attr("transform", "translate(" + (((width - cellSize * 53) / 2)+ 20) + "," + (height - cellSize * 7 - 1) + ")");

            // create the year labels
            chartGroup.append("text")
                .attr("transform", "translate(-26," + cellSize * 3.5 + ")rotate(-90)")
                .attr('class','label-year')
                .attr("fill", "#000")
                .attr("text-anchor", "middle")
                .text(function(d) { return d; });

            // create the day labels
            // @todo[vanch3d] move all text labels into the same g
            chartGroup.selectAll('label-day')
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
            let svgCard = chartGroup.append("g")
                .attr("fill", "#fff8")
                .attr("stroke", "#ccc")
                .selectAll("rect-day")
                .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
                .enter();

            svgCard.append("rect")
                .attr("width", cellSize)
                .attr("height", cellSize)
                .attr("class","rect-day")
                .attr("x", function(d) { return getWeek(d) * cellSize; })
                .attr("y", function(d) { return getDay(d) * cellSize; })
                .datum(timeFormatter)
                .append("title")
                .text(function() { return null });

            if (weeklySummary)
            {
                // create the weekly summary row of 'cards' for each week
                chartGroup.append("g")
                    .attr("fill", "#fff8")
                    .attr("stroke", "#ccc")
                    .selectAll("rect-week")
                    .data(function(d) {
                        let dx = d3.timeWeeks(new Date(d, 0, 1), new Date(d + 1, 0, 1));
                        return dx.map(function(e){ return {
                            date: e,
                            week: getWeek(e),
                            data: byWeek[d][getWeek(e)]
                        }; });
                    })
                    .enter().append("rect")
                    .attr("width", cellSize)
                    .attr("height", cellSize)
                    .attr("class","rect-week")
                    .attr("x", function(d) { return d.week * cellSize; })
                    .attr("y", function() { return 7 * cellSize + summaryMargin; });
            }

            // create a group for each month in the calendar
            let gMonth = chartGroup.append("g")
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

            updateHeatMap(this,rollupKeys[0]);
            updateWeekHeatMap(this,rollupKeys[0]);
        });

        // create a group for the legend widget
        // @todo[vanch3d] the selector for the legend needs to be customisable
        let svgLegend = d3.select("#legend")
            .append("svg")
            .attr("width", width)
            .attr("height", 40)
            .attr("font-family", "sans-serif")
            .attr("font-size", "14")
            .append("g");

        updateLegend();

        //dispatch.on("update.legend", function(attributes){
        //});

        dispatch.on("update.chart", function(attributes){
            allCharts.forEach(function(chart){
                updateHeatMap(chart,attributes.rollupKey);
                updateWeekHeatMap(chart,attributes.rollupKey)
            });
        });


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
     * Return the value at the given data point
     * If the data point is an object, the rollup key is used to select the value to convert.
     * If not, the data point is assumed to be a single value and converted to number
     * @param pt    The data point to retrieve the value from
     * @param key   The rollup key to extract the value from
     * @return {number} The converted value at the data point
     * @private
     */
    function _getData(pt,key)
    {
        if (isObject(pt))
        {
            if (rollupKeys.includes(key) && !isNaN(pt[key]))
                return +pt[key];
            return NaN;
        }
        return +pt;
    }

    /**
     * Update the chart's heat map
     * @param chart
     * @param key
     * @private
     */
    function updateHeatMap(chart,key){
        // @todo[vanch3d] Not the most elegant way of storing/accessing data. Alternative?
        let data = chart.__data__;

        let svgChart = d3.select(chart);
        svgChart.selectAll(".rect-day")
            .filter(function(d) {return d in data; })
            .attr("fill", function(d) {
                let val = _getData(data[d],key);
                return isNaN(val) ? null: color(val);
            })
            //.on("dblclick",function(){ console.log("node was double-clicked"); })
            .selectAll("title")
            .text(function(d) {
                let val = _getData(data[d],key);
                return isNaN(val) ? null: d + ": " + val; });
    }

    /**
     * Update the chart's weekly summary
     * @param chart
     * @param key
     * @private
     */
    function updateWeekHeatMap(chart,key){

        let svgChart = d3.select(chart);
        svgChart.selectAll(".rect-week")
            .filter(function(d) {
                return d.data; })
            .attr("fill", function(d) {
                //let y = new Date(d).getFullYear(),
                //    w = getWeek(d);
                return color(_getData(d.data,key));})
            .append("title")
            .text(function(d) {
                //let y = new Date(d).getFullYear(),
                //   w = getWeek(d);
                return "Week " + d.week + ": " + _getData(d.data,key).toFixed(2);
            });
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

    /**
     * Return the keys of all rollup keys used in the data nesting, [] if none
     * @return {Array}
     */
    calendar.rollupKeys = function() {
        return rollupKeys;
    };

    /**
     * Request the update of the chart with the specified rollup key (or null if none)
     * @param rollupKey
     */
    calendar.dispatchUpdate = function(rollupKey) {
        dispatch.call("update", null, {rollupKey});
    };

    return calendar;
}
