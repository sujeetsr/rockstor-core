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

CpuHistoryWidget = RockStorWidgetView.extend({
  
  initialize: function() {
    // call initialize of base
    this.constructor.__super__.initialize.apply(this, arguments);
    this.template = window.JST.dashboard_widgets_cpu_history;
    this.sysinfo = new SysInfo();
  },

  render: function() {
    $(this.el).html(this.template());
    var placeholder = this.$("#cpu-history-graph");
    var data = [ [[1, 10], [2, 20], [3, 15], [4, 20], [5, 60] ] ];
    var plot = $.plot(placeholder, data, {
      series: {
        lines: {
          show: true
        },
        shadowSize: 0
      },
      xaxis: {
        zoomRange: [1, 100],
      },
      yaxis: {
        zoomRange: [1, 100],
      },
      zoom: {
        interactive: true
      },
    });
    return this;
  },

});

