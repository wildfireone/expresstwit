(function(d3) {
  'use strict';

  console.log(dataset);


  var width = 360;
  var height = 360;
  var radius = Math.min(width, height) / 2;

  var color = d3.scale.category20b();

  var svg = d3.select('#chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + (width / 2) +
      ',' + (height / 2) + ')');

  var arc = d3.svg.arc()
    .outerRadius(radius);

  var pie = d3.layout.pie()
    .value(function(d) { return d.count; })
    .sort(null);

  var path = svg.selectAll('path')
    .data(pie(dataset))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', function(d, i) {
      return color(d.data.label);
    });

    var text = svg.selectAll('path')
      .data(pie(dataset))
      .enter()
      .append('text')
      .attr('d', arc)
      .attr("text-anchor", "middle")                          //center the text on it's origin
      .text(function(d, i) { return d.data.label; });

})(window.d3);