//Set dimensions of svg
var w=1000;
var h=1000;

//Node colors for species and era
var species=["#9370DB","#00FFFF","#F5DEB3"]
var outline=["#3300CC","#CC0000"]

//Date formatting for tooltip
var formatDate=d3.utcFormat("%B %e, %Y");

// Define the div for the node tooltip
var tooltip=d3.select("#network")
            .append("div")	
            .attr("class","tooltip")
            .attr("id","node-tooltip")
            .style("opacity",0)
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("text-align","left")
            .style("padding", "5px")
            .style("position","absolute")
            .style("pointer-events","none")
            .style("z-index", "999");
            
// Define the div for the edge tooltip
var edge_tooltip=d3.select("#network")
            .append("div")	
            .attr("class","tooltip")
            .attr("id","edge-tooltip")
            .style("opacity",0)
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("text-align","center")
            .style("padding", "5px")
            .style("position","absolute")
            .style("pointer-events","none")
            .style("z-index", "999");

d3.json("drwho.json").then(function(drwho) {
    drwho.nodes.forEach(function(d) {
        d['First Appearance']=new Date(d['First Appearance']);
        d['Last Appearance']=new Date(d['Last Appearance']);
    });
    
    //Create svg for network graph
    var svg=d3.select("#network")
              .append("svg")
              .attr("width",w)
              .attr("height",h);
    
    //Initialize a simple force layout, using the nodes and edges in dataset
    var force=d3.forceSimulation(drwho.nodes)
                .force("charge", d3.forceManyBody().strength(-500))
                .force("link", d3.forceLink(drwho.edges))
                .force("center", d3.forceCenter().x(w/2).y(h/2));
                
    //Create edges
    var edges=svg.append("g")
                 .attr("id","edges")
                 .selectAll("line")
                 .data(drwho.edges)
                 .enter()
                 .append("line")
                 .attr("class","edge")
                 .style("stroke","black")
                 .style("stroke-width",function(d) {return d.weight/4;})
                 .on("mouseover",function(d) {
                     edge_tooltip.style("opacity",1)
                                 .style("left",(d3.event.pageX)+"px")
                                 .style("top",(d3.event.pageY)+"px")
                                 .html("<u>Connection</u><br>"+d.source.Character+" and "+d.target.Character+"<br><u>Shared Episodes</u><br>"+d.weight);
                 })
                 .on("mouseout", function() {edge_tooltip.style("opacity",0);});
                
    //Create nodes
    var nodes=svg.append("g")
                 .attr("id","nodes")
                 .selectAll("circle")
                 .data(drwho.nodes)
                 .enter()
                 .append("a")
                 .attr("xlink:href", function(d) {return "https://tardis.fandom.com/wiki/"+d.WikiLink;})
                 .attr("target", "_blank")
                 .append("circle")
                 .attr("class","node")
                 .attr("r",function(d) {return Math.sqrt(d.EpisodeCount)*1.5;})
                 .style("stroke",function(d) {
                     if (d.Era=="New") {return outline[0];}
                     else if (d.Era=="Classic") {return outline[1];}
                     else {return "black";}
                    })
                 .style("stroke-width",2)
                 .style("fill",function(d) {
                     if (d.Species=="Time Lord") {return species[0];}
                     else if (d.Species=="Human") {return species[1];}
                     else {return species[2];}
                    })
                 .on("mouseover",function(d) {
                     var tooltip_text="<span style='font-weight:bold; font-size:20px'>"+d.Character+"</span><br><i>Species: </i>"+d.Species+"<br><i>Era: </i>"+d.Era;
                     if (d['Main Actor']!="N/A") {tooltip_text=tooltip_text+"<br><i>Main Actor: </i>"+d['Main Actor']};
                     if (d['Other Actors']) {
                         var others=d['Other Actors'].split("|");
                         if (others.length==1) {tooltip_text=tooltip_text+"<br><i>Other Actor: </i>";}
                         else {tooltip_text=tooltip_text+"<br><i>Other Actors: </i>";}
                         for (var i=0; i<others.length; i++) {
                            tooltip_text=tooltip_text+others[i];
                            if (i<others.length-1) {tooltip_text=tooltip_text+"<br>";}
                         }
                         };
                     tooltip_text=tooltip_text+"<br><i>First Appearance: </i>"+formatDate(d['First Appearance'])+"<br><i>Last Appearance: </i>"+formatDate(d['Last Appearance'])+"<br><i>Total Episodes: </i>"+d.EpisodeCount;
                     tooltip.style("opacity",1)
                            .style("left",(d3.event.pageX+5)+"px")
                            .style("top",(d3.event.pageY+5)+"px")
                            .html(tooltip_text);
                 })
                 .on("mouseout",function() {
                     tooltip.style("opacity",0);
                 })
                 //Fix so you can drag even after simulation is done
                 .call(d3.drag()
                    .on("start",dragStart)
                    .on("drag",dragging)
                    .on("end",dragEnd)
                  );
    //Define dragging behavior
    function dragStart(d) {
        if (!d3.event.active) force.alphaTarget(0.3).restart();
        d.fx=d.x;
        d.fy=d.y;
    }

    function dragging(d) {
        d.fx=d3.event.x;
        d.fy=d3.event.y;
    };
    
    function dragEnd(d) {
        if (!d3.event.active) force.alphaTarget(0);
        d.fx=null;
        d.fy=null;
    };
    //Super basic tooltip (will update to div later)
    //nodes.append("title")
    //     .text(function(d) {return d.Character;});
         
    //Every time the simulation "ticks", this will be called
    force.on("tick", function() {
        edges.attr("x1", function(d) {return d.source.x;})
             .attr("y1", function(d) {return d.source.y;})
             .attr("x2", function(d) {return d.target.x;})
             .attr("y2", function(d) {return d.target.y;});

        nodes.attr("cx", function(d) {return d.x;})
             .attr("cy", function(d) {return d.y;});
    });
    
    //Add zoom
})

//Legend dimensions
var lw=300;
var lh=250;
var padding=10;

//Create legend with color codes
var legend=d3.select("#legend")
             .append("svg")
             .attr("width",lw)
             .attr("height",lh);

//Add rect to make border around legend svg
legend.append("rect")
      .attr("stroke","black")
      .attr("fill","none")
      .attr("x",padding)
      .attr("y",padding)
      .attr("width",lw-2*padding)
      .attr("height",lh-2*padding);
//Main Header
legend.append("text")
      .text("Guide to Node Color Schemes")
      .attr("x",lw/2)
      .attr("y",30)
      .attr("text-anchor","middle")
      .attr("dominant-baseline","central")
      .style("font-weight","bold")
      .style("text-decoration","underline");
          
//Add species colors
//Species Header
legend.append("text")
      .text("Species")
          .attr("x",(lw/2-padding)/2+padding)
          .attr("y",60)
          .attr("text-anchor","middle")
          .attr("dominant-baseline","central")
          .style("font-weight","bold");
legend.append("circle")
      .attr("cx",50)
      .attr("cy",100)
      .attr("r",20)
      .attr("fill",species[0]); //Time Lord
legend.append("circle")
      .attr("cx",50)
      .attr("cy",150)
      .attr("r",20)
      .attr("fill",species[1]); //Human
legend.append("circle")
      .attr("cx",50)
      .attr("cy",200)
      .attr("r",20)
      .attr("fill",species[2]); //Other
//Add species text
legend.append("text")
      .text("Time Lord")
      .attr("x",80)
      .attr("y",100)
      .attr("text-anchor","left")
      .attr("dominant-baseline","central")
legend.append("text")
      .text("Human")
      .attr("x",80)
      .attr("y",150)
      .attr("text-anchor","left")
      .attr("dominant-baseline","central")
legend.append("text")
      .text("Other")
      .attr("x",80)
      .attr("y",200)
      .attr("text-anchor","left")
      .attr("dominant-baseline","central")
      
//Add era colors
//Era Header
legend.append("text")
      .text("Series Era")
          .attr("x",(lw/2)+(lw/2-padding)/2+padding)
          .attr("y",60)
          .attr("text-anchor","middle")
          .attr("dominant-baseline","central")
          .style("font-weight","bold");
legend.append("circle")
      .attr("cx",200)
      .attr("cy",100)
      .attr("r",20)
      .style("stroke",outline[1])
      .style("stroke-width",2)
      .style("fill","none"); //Classic
legend.append("circle")
      .attr("cx",200)
      .attr("cy",150)
      .attr("r",20)
      .style("stroke",outline[0])
      .style("stroke-width",2)
      .style("fill","none"); //New
//Add era text
legend.append("text")
      .text("Classic")
      .attr("x",230)
      .attr("y",100)
      .attr("text-anchor","left")
      .attr("dominant-baseline","central")
legend.append("text")
      .text("New")
      .attr("x",230)
      .attr("y",150)
      .attr("text-anchor","left")
      .attr("dominant-baseline","central")