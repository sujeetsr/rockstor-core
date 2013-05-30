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

RecipeWidget = RockStorWidgetView.extend({

  events: {
    'click .start-recipe' : 'start',
    'click .stop-recipe' : 'stop',
    'click .resize-widget': 'resize',
    'click .close-widget': 'close',

  },

  initialize: function() {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.template = window.JST.dashboard_widgets_recipe;
    this.top_shares_template = window.JST.dashboard_widgets_top_shares;
    this.displayName = this.options.displayName;
    this.timestamp = 0;
    // periodically check status while polling for data is 
    // going on. this interval controls the frequence
    this.scInterval = 0; 
    //this.nfsData = [[[1,10],[2,10], [3,10], [4,10], [5,10], [6,10],
      //[7,10], [8,10], [9,10], [10,10]]];
    this.nfsData = [0,0,0,0,0,0,0,0,0,0];

		this.graphOptions = {
			lines: { show: true },
			points: { show: true },
			xaxis: {
        min: 0,
        max: 10,
				tickDecimals: 0,
				tickSize: 1
			},
      yaxis: {
        min: 0,
        max: 100
      }
		};
    /*
    this.nfsMetricsAll = [
      { name: 'Reads/sec', min: 20, max: 30 },
      { name: 'Writes/sec', min: 50, max: 60 },
      { name: 'Lookups/sec', min: 20, max: 30 },
      { name: 'Bytes read/sec', min: 500000, max: 600000 },
      { name: 'Bytes written/sec', min: 700000, max: 800000 }
    ]; 
    */
  },

  render: function() {
    this.constructor.__super__.render.apply(this, arguments);
    var _this = this;
    $(this.el).html(this.template({ 
      module_name: this.module_name,
      displayName: this.displayName
    }));
    var series = [[]];
    for (i=0; i<10; i++) {
      series[0].push([i, this.nfsData[i]]);
    }
    //$.plot(this.$('#nfsgraph'), this.makeSeries(this.nfsData), this.graphOptions);
    return this;
  },

  start: function(event) {
    var _this = this;
    if (!_.isUndefined(event)) {
      event.preventDefault();
    }
    $.ajax({
      url: '/api/recipes/nfs/start',
      type: 'POST',
      data: {},
      dataType: "json",
      success: function(data, textStatus, jqXHR) {
        logger.debug('started recipe');
        _this.$('#recipestatus').html('Recipe started - getting status');
        _this.waitTillRunning(data.recipe_uri);
      },
      error: function(jqXHR, textStatus, error) {
        logger.debug(error);
      }
    });

  },

  waitTillRunning: function(recipe_uri) {
    var _this = this;
    logger.debug('polling till running');
    this.statusIntervalId = window.setInterval(function() {
      return function() { 
        $.ajax({
          url: recipe_uri + '?status',
          type: 'GET',
          dataType: "json",
          success: function(data, textStatus, jqXHR) {
            if (data.recipe_status == 'running') {
              _this.$('#recipestatus').html('Recipe running - getting data');
              // stop polling for status
              window.clearInterval(_this.statusIntervalId);
              // TODO show message - "recipe started, polling for data"
              // start polling for Data
              logger.debug('recipe running');
              _this.pollForData(recipe_uri);
            } else {

            }
          },
          error: function(jqXHR, textStatus, error) {
            window.clearInterval(_this.statusIntervalId);
            logger.debug(error);
            // TODO show error message on widget
          }
        });
      }
    }(), 5000)

  },

  pollForData: function(recipe_uri) {
    var _this = this;
    logger.debug('starting polling for data');
    this.dataIntervalId = window.setInterval(function() {
      return function() { 
        $.ajax({
          url: recipe_uri + '?t=' + this.timestamp,
          type: 'GET',
          success: function(data, textStatus, jqXHR) {
            _this.$('#recipestatus').html('Recipe running ');
            window.clearInterval(_this.dataIntervalId);
            /*
            logger.debug('received data ');
            logger.debug(data);
             
            _this.nfsData = _this.nfsData.slice(1);
            _this.nfsData.push(data.value);
            $.plot('#nfsgraph', _this.makeSeries(_this.nfsData), _this.graphOptions);
            */
            // TODO update timestamp from data
            // _this.timestamp = new timestamp from data
            
            /* Draw graph */
            _this.showNfsIO(recipe_uri);
            _this.showTopShares(recipe_uri);
            
          },
          error: function(jqXHR, textStatus, error) {
            window.clearInterval(_this.dataIntervalId);
            logger.debug(error);
            // TODO show error message on widget
          }
        });
      
      
      }
    }(), 2000)

  },

  stop: function(event) {
    if (!_.isUndefined(event)) {
      event.preventDefault();
    }
    if (!_.isUndefined(this.dataIntervalId) && !_.isNull(this.dataIntervalId)) {
      window.clearInterval(this.dataIntervalId);
      this.$('#recipestatus').html('Recipe stopped ');
    }

  },

  makeSeries: function(data) {
    var series = [[]];
    for (i=0; i<10; i++) {
      series[0].push([i,data[i]]);
    }
    return series;
  },

  showNfsIO: function(recipe_uri) {
    // create context
    var context = cubism.context()
    .step(1e3)
    .size(600);
    
    // create horizon
    var horizon = context.horizon()
    .colors(['#08519c', '#bae4b3'])
    .height(60);

    // axis
    d3.select(this.el).select("#nfs-graph").selectAll(".axis")
    .data(["top", "bottom"])
    .enter().append("div")
    .attr("class", function(d) { return d + " axis"; })
    .each(function(d) { 
      d3.select(this).call(context.axis().ticks(12).orient(d)); 
    });

    d3.select(this.el).select("#nfs-graph").append("div")
    .attr("class", "rule")
    .call(context.rule());
    
    var nfsContext = context.nfs(recipe_uri);
    var nfsMetricRead = nfsContext.metric('Reads/sec');
    var nfsMetricWrites = nfsContext.metric('Writes/sec');
    var nfsMetricLookups = nfsContext.metric('Lookups/sec');
    var nfsMetricReadBytes = nfsContext.metric('Bytes read/sec');
    var nfsMetricWriteBytes = nfsContext.metric('Bytes written/sec');

    d3.select(this.el).select("#nfs-graph").selectAll(".horizon")
    .data([nfsMetricRead, nfsMetricWrites, nfsMetricLookups,
    nfsMetricReadBytes, nfsMetricWriteBytes])
    .enter().insert("div", ".bottom")
    .attr("class", "horizon")
    .call(horizon);

    context.on("focus", function(i) {
      d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
    });


  },

  showTopShares: function(recipe_uri) {
    var _this = this;
    this.topSharesIntervalId = window.setInterval(function() {
      return function() { 
        $.ajax({
          url: recipe_uri + '?top_shares',
          type: 'GET',
          dataType: "json",
          success: function(data, textStatus, jqXHR) {
            _this.$('#nfs-shares').html(_this.top_shares_template({
              sharelist: data
            }));
          },
          error: function(jqXHR, textStatus, error) {
            window.clearInterval(_this.topSharesIntervalId);
            logger.debug(error);
            // TODO show error message on widget
          }
        });
      }
    }(), 5000);


  }


});

cubism.context.prototype.nfs = function(recipe_uri) {
  var source = {},
      context = this;

  source.metric = function(nfsMetric) {
    return context.metric(function(start, stop, step, callback) {
      $.ajax({
        url: recipe_uri + '?t=' + this.timestamp,
        type: 'GET',
        success: function(data, textStatus, jqXHR) {
          callback(null, data);

        },
        error: function(jqXHR, textStatus, error) {
          window.clearInterval(_this.dataIntervalId);
          logger.debug(error);
          // TODO show error message on widget
        }
      });
      /*
      d3.json(host + "/1.0/metric"
          + "?expression=" + encodeURIComponent(expression)
          + "&start=" + cubism_cubeFormatDate(start)
          + "&stop=" + cubism_cubeFormatDate(stop)
          + "&step=" + step, function(data) {
        if (!data) return callback(new Error("unable to load data"));
        callback(null, data.map(function(d) { return d.value; }));
      });
    */
    }, nfsMetric);
  };

  source.toString = function() {
    return nfsMetric;
  };

  return source;
};

RockStorWidgets.available_widgets.push({ 
  name: 'nfs_recipe', 
  displayName: 'NFS Usage', 
  view: 'RecipeWidget',
  description: 'NFS Usage',
  defaultWidget: false,
  rows: 2,
  cols: 3,
  category: 'Storage'
});

