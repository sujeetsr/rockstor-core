/*
 *
 * @licstart  The following is the entire license notice for the 
 * JavaScript code in this page.
 * 
 * Copyright (c) 2012-2013 RockStor, Inc. <http://rockstor.com>
 * This file is part of RockStor.
 * 
 * RockStor is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation; either version 2 of the License,
 * or (at your option) any later version.
 * 
 * RockStor is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * 
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 * 
 */

NfsShareClientDistribView = Backbone.View.extend({
  initialize: function() {
    this.probe = this.options.probe;
    this.template = window.JST.probes_nfs_share_client_distrib;
    this.nfsAttrs = ["num_read", "num_write", "num_lookup"];

    this.m = [20, 100, 20, 20]; 
    this.w = 400 - this.m[1] - this.m[3],
    this.h = 400 - this.m[0] - this.m[2];

    this.d3tree = d3.layout.tree().size([this.h, this.w]);

    this.diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

    this.fullTree = null;
    this.prevTree = null;
    this.currentTree = null;
    this.selectedNode = null;
    this.selectedAttr = "num_read";
    this.ts = null;
    this.tsN = null;


    this.numTop = 5; // no of top children to select;
    this.treeType = "client";
    this.clientTree = null;
    this.shareTree = null;
    
  },

  render: function() {
    
    $(this.el).html(this.template({probe: this.probe}));
    var _this = this;

    this.$("input:radio[name=selectedAttr]").click(function() {
      var value = $(this).val();
      _this.$("#selectedAttrName").html(value);
      _this.selectedAttr = value;
    });

    this.$("input:radio[name=selectedRoot]").click(function() {
      var value = $(this).val();
      _this.$("#treeType").html(value);
    });
    
    this.vis = d3.select(this.el).select("#nfs-share-client-graph").append("svg:svg")
    .attr("width", this.w + this.m[1] + this.m[3])
    .attr("height", this.h + this.m[0] + this.m[2])
    .append("svg:g")
    .attr("transform", "translate(" + this.m[3] + "," + this.m[0] + ")");

    var data = this.generateData();
    //var filteredData = this.filterData(data, "client", "num_read", this.numTop);
    //console.log(filteredData);
    this.root = this.createTree(data, "client", this.nfsAttrs);
    console.log(this.root);
    this.displayTree(this.root);

    /*
    this.renderIntervalId = window.setInterval(function() {
      var dataUrl = _this.probe.dataUrl();
      if (!_.isNull(_this.tsN)) {
        console.log(_this.tsN);
        var t1Date = new Date(_this.tsN);
        console.log(t1Date);
        var t2Date = new Date(_this.tsN + 1000*5); // 5 sec later
        console.log(t2Date);
        var t2 = t2Date.toISOString();
        var t1 = t1Date.toISOString();
        dataUrl = dataUrl + "?t1=" + t1 + "&t2=" + t2;
      } 
      console.log("dataUrl is " + dataUrl); 
      $.ajax({
        url: dataUrl,
        type: "GET",
        dataType: "json",
        success: function(data, textStatus, jqXHR) {
          console.log("data length is " + data.length);
          console.log("ts is "  + _this.tsN);
          if (data.length > 0 && _.isNull(_this.tsN)) {
            console.log("got data length > 0");
            console.log(data[0]);
            _this.tsN = (new Date(data[0].ts)).getTime();
          }
          _this.fullTree = _this.generateTree(data, "client");
          _this.sortTree(_this.fullTree, _this.selectedAttr);
          _this.currentTree = _this.getTopN(_this.fullTree, 5);
          console.log("current tree is ");
          console.log(_this.currentTree);
          _.each(_this.currentTree.children, function(d) {
            _this.toggleAll(d);
          });
          //_this.currentTree.children.forEach(_this.toggleAll);
          _this.toggleCopy(_this.prevTree, _this.currentTree);
          _this.displayTree(_this.currentTree);
          if (_.isNull(_this.selectedNode)) {
            _this.selectedNode = _this.currentTree;
          } else {
            _this.setSelectedNode(_this.selectedNode.name);
          }
          _this.updateDetail(_this.selectedNode, _this.selectedAttr);
          _this.prevTree = _this.currentTree;
          if (!_.isNull(_this.tsN)) {
            _this.tsN = _this.tsN + 1000*5;
          }
        },
        error: function(request, status, error) {
          logger.debug(error);
        }
      });

    }, 5000);

    */



    
/* // partition layout
    var x = d3.scale.linear().range([0, this.w]),
    y = d3.scale.linear().range([0, this.h]);

    
    this.vis = d3.select(this.el).select("#nfs-share-client-graph")
    .append("svg:svg")
    .attr("width", this.w)
    .attr("height", this.h);

    var partition = d3.layout.partition()
    .value(function(d) { return d.num_read; });

    var g = this.vis.selectAll("g")
    .data(partition.nodes(this.root))
    .enter().append("svg:g")
    .attr("transform", function(d) { 
      return "translate(" + x(d.y) + "," + y(d.x) + ")"; 
    })
    .on("click", _this.click);
    
    this.kx = this.w / this.root.dx; 
    this.ky = this.h / 1;

    g.append("svg:rect")
    .attr("width", _this.root.dy * _this.kx)
    .attr("height", function(d) { return d.dx * _this.ky; })
    .attr("class", function(d) { return d.children ? "parent" : "child"; });

    g.append("svg:text")
    .attr("transform", function(d) {
      return "translate(8," + d.dx * _this.ky / 2 + ")";
    })
    .attr("dy", ".35em")
    .style("opacity", function(d) { return d.dx * _this.ky > 12 ? 1 : 0; })
    .text(function(d) { return d.name; })

    d3.select(window)
    .on("click", function() { _this.click(_this.root); });
    
*/

    return this;
  },

  click: function(d) {
    if (!d.children) return;

    kx = (d.y ? w - 40 : w) / (1 - d.y);
    ky = h / d.dx;
    x.domain([d.y, 1]).range([d.y ? 40 : 0, w]);
    y.domain([d.x, d.x + d.dx]);

    var t = g.transition()
    .duration(d3.event.altKey ? 7500 : 750)
    .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; });

    t.select("rect")
    .attr("width", d.dy * kx)
    .attr("height", function(d) { return d.dx * ky; });

    t.select("text")
    .attr("transform", transform)
    .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; });

    d3.event.stopPropagation();
  },

  transform: function(d) {
    return "translate(8," + d.dx * ky / 2 + ")";
  },

  cleanup: function() {
    if (!_.isUndefined(this.renderIntervalId) && 
    !_.isNull(this.renderIntervalId)) {
      window.clearInterval(this.renderIntervalId);
    }
  },

  /////
  createTree: function(data, treeType, attrList) {
    var _this = this;
    var root = null;
    if (treeType == "client") {
      root = this.createNode("root", null, attrList);
      _.each(data, function(d) {
        // get client node
        var client = _this.findOrCreateNodeWithName(
        root.children, d.client, "client", d, attrList)
        // get share node
        var share = _this.findOrCreateNodeWithName(
        client.children, d.share, "share", d, attrList);
        // update attributes - there may be multiple data points
        // for each client or share, so add the attr values
        _.each(attrList, function(attr) {
          share[attr] = share[attr] + d[attr];
          client[attr] = client[attr] + d[attr];
        });
      });
    }
    // update attributes for root 
    _.each(root.children, function(c) {
      _.each(attrList, function(attr) {
        root[attr] = root[attr] + c[attr];
      });
    });
    
    return root;
  },

  findNodeWithName: function(nodeList, name) {
    return _.find(nodeList, function(node) {
      return node.name == name;
    });
  },

  findOrCreateNodeWithName: function(nodeList, name, nodeType, d, attrList) {
    var node = this.findNodeWithName(nodeList, name);
    if (_.isUndefined(node)) {
      node = this.createNode(nodeType, d, attrList);
    }
    nodeList.push(node);
    return node;
  },

  filterData: function(data, treeType, selAttr, n) {
    var list = [];
    _.each(data, function(d) {
      // find corresp obj in list (share or client)
      var e = _.find(list, function(el) {
        return el[treeType] == d[treeType];
      });
      if (_.isUndefined(e)) {
        e = {};
        e[treeType] = d[treeType];
        e[selAttr] = 0;
        list.push(e);
      }
      // add attr value 
      e[selAttr] = e[selAttr] + d[selAttr];
    });
    list = (_.sortBy(list, function(e) { 
      return e[selAttr]; 
    })).reverse().slice(0,n);
    return _.filter(data, function(d) {
      return _.find(list, function(e) {
        return e[treeType] == d[treeType];
      });
    });
  },

  generateData: function() {
    var data = [];
    for (i=0; i<3; i++) {
      var ipRandom = '10.0.0.' + (1 + Math.floor(Math.random()*10));
      var shareRandom = 'share_' + (1 + Math.floor(Math.random()*9));
      data.push({
        share: shareRandom,
        client: ipRandom,
        num_read: 5 + Math.floor(Math.random() * 5),
        num_write: 1 + Math.floor(Math.random() * 5),
        num_lookup: 1 + Math.floor(Math.random() * 5),
      });
    }
    return data;
  },

  createNode: function(nodeType, d, attrList) {
    var node = {};
    if (!d) d = {};
    if (nodeType == "root") {
      node.id = "root";
      node.type = "root";
      node.name = "";
      node.children = [];
    } else if (nodeType == "client") {
      node.type = "client";
      node.id = d.client;
      node.name = d.client;
      node.children = [];
    } else if (nodeType == "share") {
      node.type = "share";
      node.id = d.client + "_" + d.share;
      node.name = d.share;
    } 
    _.each(attrList, function(attr) {
      node[attr] = 0;
    });
    return node;
  },
  ///// end new
  
  
  generateTree: function(data, treeType) {
    var root = null;
    var _this = this;
    if (treeType == 'client') {
      root = this.createRoot(treeType, this.nfsAttrs);
      _.each(data, function(d) {
        var c = _.find(root.children, function(x) {
          return x.clientName == d.client; 
        });
        if (_.isUndefined(c)) {
          c = _this.createNode("client", d, _this.nfsAttrs);
          root.children.push(c);
        }
        var s = _.find(c.children, function(x) {
          return x.shareName == d.share;
        });
        if (_.isUndefined(s)) {
          //s = {
            //clientName: c.name,
            //shareName: d.share,
            //label: d.share,
            //name: c.name + "_" + d.share,
            //displayName: d.share,
            //type: 'share',
          //}
          s = _this.createNode("share", d, _this.nfsAttrs, c);
          c.children.push(s);
        }
        _.each(_this.nfsAttrs, function(attr) {
          // copy attributes from data
          s[attr] = s[attr] + d[attr];
          // accumulate attributes
          c[attr] = c[attr] + d[attr];
        });
      });
      _.each(root.children, function(node) {
        _.each(this.nfsAttrs, function(attr) {
          root[attr] = root[attr] + node[attr];
        })
      });
    }
    return root;
  },

  getSum: function(root) {
    var sum = 0;
    if (!root.children) {
      sum = root.num_read;
    } else {
      _.each(root.children, function(node) {
        sum = sum + getSum(node);
      });
    }
    return sum;
  },

  // sorts children of root by attr
  sortTree: function(root, attr) {
    newChildren = _.sortBy(root.children, function(node) {
      return node[attr];
    }).reverse();
    root.children = newChildren;
  },

  // creates new root with n of oldroots children
  getTopN: function(root, n) {
    var newRoot = this.copyRoot(root, this.nfsAttrs);
    if (root.children.length > 0) {
      for (i=0; i<n; i++) {
        newRoot.children[i] = root.children[i];
        if (i == root.children.length-1) break;
      }
    }
    return newRoot;
  },

  findNode: function(root, name) {
    var n = null;
    if (root.name == name) {
      n = root;
    } else if (root.children) {
      for (var i=0; i<root.children.length; i++) {
        n = this.findNode(root.children[i], name);
        if (!_.isNull(n)) break;
      }
    } 
    return n;
  },

  createRoot: function(treeType, nfsAttrs) {
    var root = {};
    if (treeType == 'client') {
      root.name = 'clients';
      root.displayName = 'All clients';
      root.treeType = treeType;
      root.type = 'root';
      root.label = 'clients';
      root.children = [];
      _.each(nfsAttrs, function(attr) {
        root[attr] = 0;
      });
    }
    return root;
  },

  // copies attrs from old root, does not copy children
  copyRoot: function(oldRoot, nfsAttrs) {
    var newRoot = {}; 
    newRoot.name = oldRoot.name;
    newRoot.displayName = oldRoot.displayName;
    newRoot.treeType = oldRoot.treeType;
    newRoot.label = oldRoot.label;
    newRoot.type = oldRoot.type;
    newRoot.children = [];
    _.each(nfsAttrs, function(attr) {
      newRoot[attr] = oldRoot[attr];
    });
    return newRoot;
  },

  displayTree: function(json) { 
    var root = json;
    root.x0 = this.h / 2;
    root.y0 = 0;
    this.update(root);
  },

  update: function(source) {
    var duration = d3.event && d3.event.altKey ? 5000 : 500;
    var _this = this;

    // Compute the new tree layout.
    var nodes = this.d3tree.nodes(source).reverse();
    var clientNodes = nodes.filter(function(d,i) {
      return d.type == "client";
    });
    console.log(clientNodes);
    var shareNodes = nodes.filter(function(d,i) {
      return d.type == "share";
    });
    
    var clientNode = this.vis.selectAll("g.clientNode")
    .data(clientNodes, function(d,i) {
      return d.id;
    });
    
    clientNode.enter().append("svg:g")
    .attr("class", "clientNode")
    .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
    .append("svg:image")
    .attr("xlink:href", "/img/computer.png")
    .attr("width", "22")
    .attr("height", "22");
    
    var shareNode = this.vis.selectAll("g.shareNode")
    .data(shareNodes, function(d,i) {
      return d.id;
    });
    
    shareNode.enter().append("svg:g")
    .attr("class", "shareNode")
    .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
    .append("svg:circle")
    .attr("r", 1e-6)
    .style("fill", "lightsteelblue");
    

    //nodeEnter.append("svg:circle")
    //.attr("r", 1e-6)
    //.style("fill", function(d) { 
    //  if (!_.isNull(_this.selectedNode) && 
    //  _this.selectedNode.name == d.name) {
    //    return "#DEFAA5"
    //  } else {
    //    return d._children ? "lightsteelblue" : "#fff"; 
    //  }
    //})
    //.on("click", function(d) { 
    //  _this.setSelectedNode(d.name);
    //});

//
//    nodeEnter.append("svg:text")
//    .attr("class","nodeLabel")
//    .attr("x", 20)
//    .attr("dy", ".35em")
//    .attr("text-anchor", "start")
//    .text(function(d) { 
//      if (d.children) {
//        return "- " + d.name;
//      } else if (d._children) {
//        return "+ " + d.name;
//      } else {
//        return d.name;
//      }
//    })
//    .style("fill-opacity", 1e-6)
//    .on("click", function(d) { _this.toggle(d); _this.update(d); });
//
//    nodeEnter.append("svg:text")
//    .attr("class","nodeValue")
//    .attr("x", 20)
//    .attr("dy", "1.1em")
//    .attr("text-anchor", "start")
//    .text(function(d) { 
//      return _this.selectedAttr + ": " + d[_this.selectedAttr];
//    })
//    .style("fill-opacity", 1);
//

    // Transition nodes to their new position.
    var clientNodeUpdate = clientNode.transition()
    .duration(duration)
    .attr("transform", function(d) { 
      return "translate(" + d.y + "," + d.x + ")"; 
    });

    var shareNodeUpdate = shareNode.transition()
    .duration(duration)
    .attr("transform", function(d) { 
      return "translate(" + d.y + "," + d.x + ")"; 
    });

    shareNodeUpdate.select("circle")
    .attr("r", 10);

//    nodeUpdate.select("text.nodeLabel")
//    .style("fill-opacity", 1)
//    .text(function(d) { 
//      if (d.children) {
//        return "- " + d.name;
//      } else if (d._children) {
//        return "+ " + d.name;
//      } else {
//        return d.name;
//      }
//    })
//
//    nodeUpdate.select("text.nodeValue")
//    .text(function(d) { 
//      return _this.selectedAttr + ": " + d[_this.selectedAttr];
//    })
//
//    // Transition exiting nodes to the parent's new position.
//    var nodeExit = node.exit().transition()
//    .duration(duration)
//    .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
//    .remove();
//
//    nodeExit.select("circle")
//    .attr("r", 1e-6);
//
//    nodeExit.select("text")
//    .style("fill-opacity", 1e-6);
//
//    // Update the links…
//    var link = this.vis.selectAll("path.link")
//    .data(_this.d3tree.links(nodes), function(d) { return d.target.name; });
//
//    // Enter any new links at the parent's previous position.
//    link.enter().insert("svg:path", "g")
//    .attr("class", "link")
//    .attr("d", function(d) {
//      var o = {x: source.x0, y: source.y0};
//      return _this.diagonal({source: o, target: o});
//    })
//    .transition()
//    .duration(duration)
//    .attr("d", _this.diagonal);
//
//    // Transition links to their new position.
//    link.transition()
//    .duration(duration)
//    .attr("d", _this.diagonal);
//
//    // Transition exiting nodes to the parent's new position.
//    link.exit().transition()
//    .duration(duration)
//    .attr("d", function(d) {
//      var o = {x: source.x, y: source.y};
//      return _this.diagonal({source: o, target: o});
//    })
//    .remove();
//
//    // Stash the old positions for transition.
//    nodes.forEach(function(d) {
//      d.x0 = d.x;
//      d.y0 = d.y;
//    });
  },

  // Toggle children.
  toggle: function(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
  },

  toggleAll: function(d) {
    var _this = this;
    if (d.children) {
      _.each(d.children, function(dd) {
        _this.toggleAll(dd);
      });
      //d.children.forEach(_this.toggleAll);
      this.toggle(d);
    }
  },

  toggleCopy: function(oTree, nTree) {
    var _this = this;
    // sets children or _children of nTree acc to oTree
    if (!_.isNull(oTree) && !_.isNull(nTree)) {
      this.toggleIfDifferent(oTree, nTree);
      o = oTree.children || oTree._children;
      n = nTree.children || nTree._children;
      _.chain(n).each(function(nn) {
        var on = _.find(o, function(x) { return x.name == nn.name; });
        if (on) {
          _this.toggleIfDifferent(on, nn);
        }
      });
    }
  },

  toggleIfDifferent: function(oldNode, newNode) {
    // toggles newNode if oldNode and newNode are in a different toggled state
    if ( (oldNode.children && newNode._children) || 
    (oldNode._children && newNode.children)) {
      this.toggle(newNode);
    }
  },

  updateDetail: function(node, attr) {
    var str = "";
    if (node.type == "client") {
      str = str + "Client : " + node.name + "<br>"
      +  "Share: All shares" + "<br>";
    } else if (node.type == "share") {
      str = str + "Client : " + node.clientName + "<br>"
      +  "Share: " + node.name + "<br>";
    } else if (node.type == "root") {
      str = str + "Client : All clients <br>"
      +  "Share: All shares <br>";

    }
    _.each(this.nfsAttrs, function(a) {
      str = str + a + ": " + node[a] + "<br>";
    });
    $("#selected-node-detail").html(str);
  },

  setSelectedNode: function(name) {
    newSelectedNode = this.findNode(this.fullTree, name);
    if (_.isNull(newSelectedNode)) {
      // TODO set attrs of selectedNode to 0

    } else {
      this.selectedNode = newSelectedNode;
    }
    this.updateDetail(this.selectedNode, this.selectedAttr);
  },
  

});

RockStorProbeMap.push({
  name: 'nfs-share-client-distrib',
  view: 'NfsShareClientDistribView',
  description: 'NFS Share and Client Distribution',
});


