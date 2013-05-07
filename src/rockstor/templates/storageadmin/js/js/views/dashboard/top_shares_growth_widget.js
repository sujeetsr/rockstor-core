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

TopSharesGrowthWidget = RockStorWidgetView.extend({
  
  initialize: function() {
    // call initialize of base
    this.constructor.__super__.initialize.apply(this, arguments);
    this.template = window.JST.dashboard_widgets_top_shares_growth;
    this.sysinfo = new SysInfo();
  },

  render: function() {
    $(this.el).html(this.template());
    var options = {
      yaxis: { max: 65, position: 'left' },
      xaxis: { max: 6 },
      grid: { show: false },
      legend: { show:false },
    };
    var data1 = [[0, 20], [1, 25], [3, 35], [4, 38], [5, 60]];
    var data2 = [[0, 10], [1, 35], [3, 45], [4, 48], [5, 55]];
    var series1 = [{
      data: data1,
      color: "#000000",
      lines: { lineWidth: 0.8 },
      shadowSize: 0
    }];
    series1.push({
      data: [ data1[data1.length - 1] ],
      points: {
        show: true,
        radius: 1,
        fillColor: '#ff0000'
      },
      color: '#ff0000'
    });
    $.plot(this.$("#chart_1"), series1, options );
    var series2 = [{
      data: data2,
      color: "#000000",
      lines: { lineWidth: 0.8 },
      shadowSize: 0
    }];
    series2.push({
      data: [ data2[data2.length - 1] ],
      points: {
        show: true,
        radius: 1,
        fillColor: '#ff0000'
      },
      color: '#ff0000'
    });
    $.plot(this.$("#chart_2"), series2, options );
    return this;
  },

});


