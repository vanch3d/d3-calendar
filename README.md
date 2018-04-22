# d3-calendar

A d3-module (version 4) implementation of the heatmap calendar.

The module is based on the original [Calendar View](https://bl.ocks.org/mbostock/4063318) 
as a starting point and on many of the other implementations for code 
improvements and refactoring (
    see [DKirwan's](https://github.com/DKirwan/calendar-heatmap),
    [g1eb's](https://github.com/g1eb/calendar-heatmap) and 
    [KathyZ's](http://bl.ocks.org/KathyZ/c2d4694c953419e0509b)
).

The module has been created on the basis of Mike Bostock's [guidelines](https://bost.ocks.org/mike/d3-plugin/) 
and [skeleton project](https://bost.ocks.org/mike/d3-plugin/d3-plugin.zip) 

## Installing

If you use NPM, `npm install d3-calendar`. Otherwise, download the [latest release](https://github.com/vanch3d/d3-calendar/releases/latest). 

## Usage

Make sure to include both d3 (version 4, not included) and the module, in this order.
```html
<script src="d3.min.js"></script>
<script src="/dist/d3-calendar.min.js"></script>
```

The HTML code only needs 2 placeholders: one for the calendar itself 
(e.g. `<div id="chart">`), one for the legend (`<div id="chart">`).
```html
<div id="chart"></div>
<div id="legend"></div>
```

Create your data, nesting it by date:

```javascript
let byDay = d3.nest()
    .key(function (d) { return formatYear(d.date); })
    .rollup(function () { return d.value || NaN;
    })
    .object(myData);
```

Finally, create the graph and associate it with both the placeholder 
and the nested dataset

```javascript
let chart = d3.calendar()
    .mondayWeek(true);
d3.select('#chart')
    .datum(byDay)
    .call(chart);
```

Check the [examples](https://github.com/vanch3d/d3-calendar/tree/master/examples) 
for mode detailed instructions.

## API Reference

<a href="#d3_calendar" name="d3_calendar">#</a> d3.<b>calendar</b>()

Constructs a new calendar graph

<a href="#calendar_width" name="calendar_width">#</a> calendar.<b>width</b>([number])

If `number` is specified, sets the width of the chart and returns the chart instance (for chaining).
If `number` is not specified, returns the current width. Default is `960`.

<a href="#calendar_height" name="calendar_height">#</a> calendar.<b>height</b>([number])

If `number` is specified, sets the height of the chart and returns the chart instance (for chaining).
If `number` is not specified, returns the current height. Default is `136`.

<a href="#calendar_cellSize" name="calendar_cellSize">#</a> calendar.<b>cellSize</b>([number])

If `number` is specified, sets the dimension of the day cards (the rectangle showing the heat value) 
and returns the chart instance (for chaining).
If `number` is not specified, returns the current dimension. Default is `17`.

<a href="#calendar_weeklySummary" name="calendar_weeklySummary">#</a> calendar.<b>weeklySummary</b>([boolean])

If `boolean` is specified, sets whether the weekly summary should be displayed 
and returns the chart instance (for chaining).
If `boolean` is not specified, returns the current status. Default is `false`.

<a href="#calendar_mondayWeek" name="calendar_mondayWeek">#</a> calendar.<b>mondayWeek</b>([boolean])

If `boolean` is specified, sets whether the week starts on a Monday (`true`)or a Sunday
(`false`)and returns the chart instance (for chaining).
If `boolean` is not specified, returns the current status. Default is `true`.

<a href="#calendar_color" name="calendar_color">#</a> calendar.<b>color</b>([scale])

If `scale` is specified, sets the color scale used for the heatmap and 
returns the chart instance (for chaining).
If `scale` is not specified, returns the current scale. 

The scale needs to define both the quantitative input [domain](https://github.com/d3/d3-scale#continuous_domain) 
(i.e. the extent of the values to be graphed) and the discrete [range](https://github.com/d3/d3-scale#quantize_range) 
of the colors to be used. Default is defined as follow, using the 
[d3.scaleQuantize](https://github.com/d3/d3-scale#scaleQuantize) scale:

```javascript
d3.scaleQuantize()
    .domain([0, 5])
    .range(["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"]);
```

<a href="#calendar_labels" name="calendar_labels">#</a> calendar.<b>labels</b>([array])

If `array` is specified, sets the labels for the different elements of the graph 
and returns the chart instance (for chaining).
If `array` is not specified, returns the current labels. 
Default is defined as follow:

```javascript
defaultLabels = {
    day: ["M","T","W","T","F","S","S"],
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    legend: ["Low","High"]
};
```

New values are merged with the default using JavaScript's `Object.assign()` so 
subsets of the labels can be redefined, leaving others untouched, e.g.: 
```javascript
calendar.labels({
    day: ["L","M","M","J","V","S","D"]
});
```

Note that the `day` labels are always given starting from Monday, regardless
of the status of the [mondayWeek()](#calendar_mondayWeek).



## Thanks
