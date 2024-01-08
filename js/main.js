
(function() {
    var expressed = "popA";
var attrArray = ["popA", "popB", "popC", "popD", "popE"];
var csvData;
var dropdown; 
var yScale; 
var chartWidth = window.innerWidth * 0.425,
chartHeight = 473,
leftPadding = 25,
rightPadding = 2,
topBottomPadding = 5,
chartInnerWidth = chartWidth - leftPadding - rightPadding,
chartInnerHeight = chartHeight - topBottomPadding * 2,
translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 110]);
    
    //begin script when window loads
window.onload = setMap();
    // Set up choropleth map
    function setMap() {
        
        //map frame dimensions
        var width = window.innerWidth * 0.5,
        height = 460;

        var chartWidth = window.innerWidth * 0.5,
        chartHeight = 460;
        // Define topBottomPadding here
        var topBottomPadding = 5;

        var chartInnerHeight = chartHeight - topBottomPadding * 2;

        // Create new SVG container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        // Create Albers equal area conic projection centered on state
        var projection = d3.geoRobinson()
            .scale(100) // Adjust as needed
            .translate([width / 2, height / 2]); // Center the map

        var path = d3.geoPath()
            .projection(projection);

        // Use Promise.all to parallelize asynchronous data loading
        var promises = [
            d3.csv("data/SovereigntyState.csv"), // Load attributes from CSV
            d3.json("data/SovereigntyState.topojson") // Load background spatial data
        ];

        Promise.all(promises).then(callback).catch(function(error) {
            console.error("Error in promises:", error);
         });;

        // Callback function after data loading
        function callback(data) {
            csvData = data[0];
            var stateData = data[1];

            var SovereigntyState = topojson.feature(stateData, stateData.objects.collection);
            SovereigntyState = joinData(SovereigntyState, csvData);
            

            // Create the color scale
            var colorScale = makeColorScale(csvData);

            
            var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");
            setGraticule(map, path);
                  //set bars for each province
        var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.NE_ID;
        })
        .attr("width", chartWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartWidth / csvData.length);
        })
        .attr("height", function(d){
            const heightValue = yScale(parseFloat(d[expressed]));
            return Math.max(0, heightValue); 
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed]));
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });

        //annotate bars with attribute value text
        var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.NE_ID;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed])) + 15;
        })
        .text(function(d){
            return d[expressed];
        });

        //create a text element for the chart title
        var chartTitle = chart.append("text")
        .attr("x", 20)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Numbers " + expressed[3] + " in each Sovereignty State");

        // Add enumeration units to the map
        setEnumerationUnits(SovereigntyState, map, path, colorScale);

            //add coordinated visualization to the map
        setChart(csvData, colorScale);
        createDropdown(csvData);

        }

        function setGraticule(map, path) {
            // ... GRATICULE BLOCKS FROM CHAPTER 8
            // Add graticule background
            var gratBackground = map.append("path")
                .datum(d3.geoGraticule().outline()) // Bind graticule background
                .attr("class", "gratBackground") // Assign class for styling
                .attr("d", path); // Project graticule

            // Add graticule lines
            var gratLines = map.selectAll(".gratLines")
                .data(d3.geoGraticule().lines()) // Bind graticule lines
                .enter()
                .append("path")
                .attr("class", "gratLines")
                .attr("d", path); // Project graticule lines
        }

        function joinData(SovereigntyState, csvData) {
            // Variables for data join
           

            // Loop through CSV to assign each set of CSV attribute values to GeoJSON satte
            for (var i = 0; i < csvData.length; i++) {
                var csvState = csvData[i]; // The current state
                var csvKey = csvState.NE_ID; // The CSV primary key

                // Loop through GeoJSON states to find the correct state
                for (var a = 0; a < SovereigntyState.features.length; a++) {
                    var geojsonProps = SovereigntyState.features[a].properties; // The current state GeoJSON properties
                    var geojsonKey = geojsonProps.NE_ID; // The GeoJSON primary key

                    // Where primary keys match, transfer CSV data to GeoJSON properties object
                    if (geojsonKey == csvKey) {
                        // Assign all attributes and values
                        attrArray.forEach(function(attr) {
                            var val = parseFloat(csvState[attr]); // Get CSV attribute value
                            geojsonProps[attr] = val; // Assign attribute and value to GeoJSON properties
                        });
                    }
                }
            }

            return SovereigntyState;
        }

        function setEnumerationUnits(SovereigntyState, map, path, colorScale) {
            // Add states to map
            var states = map.selectAll(".states")
                .data(SovereigntyState.features) // Access features of the GeoJSON collection
                .enter()
                .append("path")
                .attr("class", function (d) {
                    return "states " + d.properties.NE_ID;
                })
                .attr("d", path)        
                .style("fill", function(d){            
                var value = d.properties[expressed];            
                if(value) {                
                    return colorScale(value);           
                } else {                
                    return "#ccc";            
                }
                })
                .on("mouseover", function(event, d){
                    highlight(d.properties);
                })
                .on("mouseout", function(event, d){
                    dehighlight();
                })
                .on("mousemove", function(event, d){
                    moveLabel(event);
                });
        }
    }
    //function to create color scale generator
    function makeColorScale(data) {
        // Removed the 'require' statement for simple-statistics
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
            
        ];

        // Create color scale generator
        var colorScale = d3.scaleThreshold()
            .range(colorClasses);

        // Build array of all values of the expressed attribute
        var domainArray = [];
        for (var i = 0; i < data.length; i++) {
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        }

        // Cluster data using ckmeans clustering algorithm to create natural breaks
        var clusters = ss.ckmeans(domainArray, 5);
        // Reset domain array to cluster minimums
        domainArray = clusters.map(function (d) {
            return d3.min(d);
        });
        // Remove the first value from the domain array to create class breakpoints
        domainArray.shift();

        // Assign the array of the last 4 cluster minimums as the domain
        colorScale.domain(domainArray);

        return colorScale;
    }
//function to create coordinated bar chart
    function setChart(csvData, colorScale){
    //chart frame dimensions
   

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
    .attr("class", "chartBackground")
    .attr("width", chartInnerWidth)
    .attr("height", chartInnerHeight)
    .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    yScale = d3.scaleLinear()
    .range([chartInnerHeight, 0])  // Reverse the range
    .domain([0, d3.max(csvData, function(d) { return parseFloat(d[expressed]); })]);


    //set bars for each province
    var bars = chart.selectAll(".bar")
    .data(csvData)
    .enter()
    .append("rect")
    .sort(function(a, b){
        return b[expressed]-a[expressed]
    })

    .attr("class", function(d){
        return "bar " + d.NE_ID;
    })
    .attr("width", chartInnerWidth / csvData.length - 1)
    .on("mouseover", function(event, d){
        highlight(d);
    })
    .on("mouseout", function(event, d){
        dehighlight(d.properties);
    })
    .on("mousemove", moveLabel);
    

    //create a text element for the chart title
    var chartTitle = chart.append("text")
    .attr("x", 40)
    .attr("y", 40)
    .attr("class", "chartTitle")
    .text("Numbers " + expressed[3] + " in each state");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
    .scale(yScale);

    //place axis
    var axis = chart.append("g")
    .attr("class", "axis")
    .attr("transform", translate)
    .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
    .attr("class", "chartFrame")
    .attr("width", chartInnerWidth)
    .attr("height", chartInnerHeight)
    .attr("transform", translate);

    updateChart(bars, csvData.length, colorScale);
    
    }; //end of setChart()

    //function to create a dropdown menu for attribute selection
function createDropdown(){
    //add select element
    dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
}
function changeAttribute(attribute, csvData) {
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var states = d3.selectAll(".states")
        .transition()
        .duration(1000)
        .style("fill", function(d){            
            var value = d.properties[expressed];            
            if(value) {                
                return colorScale(value);           
            } else {                
                return "#ccc";            
            }    
    });
        //Sort, resize, and recolor bars
        var bars = d3.selectAll(".bar")
        //Sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);
    
     updateChart(bars, csvData.length, colorScale);
}

//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale) {
    // position bars
    bars.attr("x", function (d, i) {
        return i * (chartInnerWidth / n) + leftPadding;
    })
    // size/resize bars
    .attr("height", function (d, i) {
        var barHeight = Math.max(yScale(parseFloat(d[expressed])) - topBottomPadding, 0);
        return barHeight;
    })
    .attr("y", function (d, i) {
        var barHeight = yScale(parseFloat(d[expressed]));
        return chartInnerHeight - barHeight + topBottomPadding;
    })
    // color/recolor bars
    .style("fill", function (d) {
        var value = d[expressed];
        if (value) {
            return colorScale(value);
        } else {
            return "#ccc";
        }
    });

    var chartTitle = d3.select(".chartTitle")
        .text("Number of Variable " + expressed[3] + " in each state");
}

function highlight(props) {
    var neIdString = String(props.NE_ID).replace(/\s+/g, '').replace(/[^\w]/g, '');
    var classSelector = 'ne_' + neIdString;

    // Debugging: Log the class selector to the console
    console.log('Class Selector:', classSelector);
  
    // Select map elements
    var selectedMap = d3.selectAll("." + classSelector);
    
    // Debugging: Log the selected map elements to the console
    console.log('Selected Map Elements:', selectedMap.nodes());

    // Apply styles to the selected map elements
    selectedMap.style("stroke", "green")
        .style("stroke-width", "2");

   // Select bar elements
    var selectedBar = d3.selectAll(".bar." + classSelector);

    // Debugging: Log the selected bar elements to the console
    console.log('Selected Bar Elements:', selectedBar.nodes());

    // Highlight the corresponding bar in the chart
    selectedBar.style("fill", "green");

    // Call the setLabel function
    setLabel(props);
}

    // Dehighlight function
    function dehighlight(props) {
        if (props && props.NE_ID) {
            var neIdString = String(props.NE_ID).replace(/\s+/g, '').replace(/[^\w]/g, '');
            var classSelector = 'ne_' + neIdString;

            // Use the classSelector in the selector
            var selectedMap = d3.selectAll("." + classSelector)
                .style("stroke", null) // Revert to the default stroke
                .style("stroke-width", null);

            // Highlight the corresponding bar in the chart
            var selectedBar = d3.selectAll(".bar." + classSelector)
                .style("fill", function () {
                    var value = d3.select(this).attr("fill"); // Use the fill attribute
                    return value ? value : "#ccc";
                });
        }

        // Remove the infolabel
        d3.select(".infolabel").remove();

   
    function getStyle(element, styleName) {
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    }
}

//function to create dynamic label
function setLabel(props) {
    // Remove existing infolabel
    d3.select(".infolabel")
        .remove();

    // Label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    // Create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.NE_ID + "_label")
        .html(labelAttribute);

    var stateName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.NAME);
}

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

})();
