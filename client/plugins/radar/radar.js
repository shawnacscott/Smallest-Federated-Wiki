(function() {
  window.plugins.radar = {
    bind: function(div, item) {},
    emit: function(div, item) {
      return wiki.getScript('/js/d3/d3.js', function() {
        return wiki.getScript('/js/d3/d3.time.js', function() {
          var angle, c, candidates, centerXPos, centerYPos, circleAxes, circleConstraint, colorSelector, comments, complete, d, data, dimension, each, fill, h, heightCircleConstraint, hours, k, keys, lastThumb, limit, limitsFromData, lineAxes, m, max, maxVal, merged, merging, minVal, o, parseText, percents, radialTicks, radius, radiusLength, rotate, rows, ruleColor, series, translate, value, viz, vizBody, vizPadding, w, who, widthCircleConstraint, _i, _j, _k, _l, _len, _len1, _m, _ref, _ref1, _ref2, _results;
          div.append(' <style>\n svg { font: 10px sans-serif; }\n</style>');
          limit = {};
          keys = [];
          max = -Infinity;
          value = function(obj) {
            if (obj == null) {
              return NaN;
            }
            switch (obj.constructor) {
              case Number:
                return obj;
              case String:
                return +obj;
              case Array:
                return value(obj[0]);
              case Object:
                return value(obj.value);
              case Function:
                return obj();
              default:
                return NaN;
            }
          };
          parseText = function(text) {
            var args, line, _i, _len, _ref;
            _ref = text.split("\n");
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              line = _ref[_i];
              if (args = line.match(/^([0-9.eE-]+) +([\w \/%(){},&-]+)$/)) {
                keys.push(args[2]);
                limit[args[2]] = +args[1];
              } else if (args = line.match(/^([0-9\.eE-]+)$/)) {
                max = +args[1];
              } else if (args = line.match(/^ *([\w \/%(){},&-]+)$/)) {
                keys.push(args[1]);
              }
            }
            return wiki.log('radar parseText', keys, limit, max);
          };
          limitsFromData = function(data) {
            var d, k, v, vv, _i, _len;
            limit = {};
            for (_i = 0, _len = data.length; _i < _len; _i++) {
              d = data[_i];
              for (k in d) {
                v = d[k];
                vv = value(v);
                if (!isNaN(vv)) {
                  wiki.log('limits from data keys', k, v, vv);
                  if (limit[k]) {
                    if (vv > limit[k]) {
                      limit[k] = vv;
                    }
                  } else {
                    limit[k] = vv;
                  }
                }
              }
            }
            return wiki.log('limits from data', limit);
          };
          candidates = $(".item:lt(" + ($('.item').index(div)) + ")");
          if ((who = candidates.filter(".radar-source")).size()) {
            data = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = who.length; _i < _len; _i++) {
                d = who[_i];
                _results.push(d.radarData());
              }
              return _results;
            })();
          } else if ((who = candidates.filter(".data")).size()) {
            rows = who.filter(function(d) {
              return $(this).data('item').data.length === 1;
            });
            if (rows.length > 0) {
              data = (function() {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = rows.length; _i < _len; _i++) {
                  d = rows[_i];
                  _results.push($(d).data('item').data[0]);
                }
                return _results;
              })();
            } else {
              data = who.last().data('item').data;
            }
          } else {
            throw "Can't find suitable data";
          }
          wiki.log('radar data', data);
          if ((item.text != null) && item.text.match(/\S/)) {
            parseText(item.text);
            if (_.isEmpty(limit)) {
              if (max === -Infinity) {
                limitsFromData(data);
              } else {
                if (_.isEmpty(keys)) {
                  limitsFromData(data);
                  keys = Object.keys(limit);
                }
                for (_i = 0, _len = keys.length; _i < _len; _i++) {
                  k = keys[_i];
                  limit[k] = max;
                }
              }
            }
          } else {
            limitsFromData(data);
            keys = Object.keys(limit);
          }
          wiki.log('radar limit', limit);
          complete = function(object) {
            var key, _j, _len1;
            for (_j = 0, _len1 = keys.length; _j < _len1; _j++) {
              key = keys[_j];
              if (object[key] == null) {
                return false;
              }
            }
            return true;
          };
          merged = [];
          merging = {};
          for (_j = 0, _len1 = data.length; _j < _len1; _j++) {
            each = data[_j];
            _.extend(merging, each);
            if (complete(merging)) {
              merged.push(merging);
              merging = {};
            }
          }
          data = merged;
          percents = function(obj) {
            var _k, _l, _len2, _len3, _ref, _results;
            for (_k = 0, _len2 = keys.length; _k < _len2; _k++) {
              k = keys[_k];
              if (obj[k] == null) {
                throw "Missing value for '" + k + "'";
              }
            }
            _ref = keys.concat(keys[0]);
            _results = [];
            for (_l = 0, _len3 = _ref.length; _l < _len3; _l++) {
              k = _ref[_l];
              _results.push(100.0 * value(obj[k]) / limit[k]);
            }
            return _results;
          };
          div.dblclick(function(e) {
            if (e.shiftKey) {
              return wiki.dialog("JSON for Radar plugin", $('<pre/>').text(JSON.stringify(item, null, 2)));
            } else {
              if (!((item.text != null) && item.text.match(/\S/))) {
                item.text = ((function() {
                  var _k, _len2, _results;
                  _results = [];
                  for (_k = 0, _len2 = keys.length; _k < _len2; _k++) {
                    k = keys[_k];
                    _results.push("" + limit[k] + " " + k);
                  }
                  return _results;
                })()).join("\n");
              }
              return wiki.textEditor(div, item);
            }
          });
          w = 400;
          h = 400;
          vizPadding = {
            top: 10,
            right: 0,
            bottom: 15,
            left: 0
          };
          dimension = keys.length;
          ruleColor = "#CCC";
          angle = function(i) {
            return (i / dimension) * 2 * Math.PI;
          };
          rotate = function(i) {
            return "rotate(" + ((i / dimension * 360) - 90) + ")";
          };
          translate = function(percent) {
            return "translate(" + (radius(maxVal * percent / 100)) + ")";
          };
          series = (function() {
            var _k, _len2, _results;
            _results = [];
            for (_k = 0, _len2 = data.length; _k < _len2; _k++) {
              d = data[_k];
              _results.push(percents(d));
            }
            return _results;
          })();
          wiki.log('radar series', series);
          comments = [];
          for (m = _k = 0, _ref = data.length - 1; 0 <= _ref ? _k <= _ref : _k >= _ref; m = 0 <= _ref ? ++_k : --_k) {
            for (d = _l = 0, _ref1 = dimension - 1; 0 <= _ref1 ? _l <= _ref1 : _l >= _ref1; d = 0 <= _ref1 ? ++_l : --_l) {
              if ((o = data[m][keys[d]]) != null) {
                if ((c = o.comment) != null) {
                  comments.push({
                    material: m,
                    dimension: d,
                    comment: c
                  });
                }
              }
            }
          }
          hours = (function() {
            _results = [];
            for (var _m = 0, _ref2 = dimension - 1; 0 <= _ref2 ? _m <= _ref2 : _m >= _ref2; 0 <= _ref2 ? _m++ : _m--){ _results.push(_m); }
            return _results;
          }).apply(this);
          minVal = 0;
          maxVal = 100;
          viz = d3.select(div.get(0)).append("svg:svg").attr("width", w).attr("height", h).attr("class", "vizSvg");
          vizBody = viz.append("svg:g").attr("id", "body");
          heightCircleConstraint = h - vizPadding.top - vizPadding.bottom;
          widthCircleConstraint = w - vizPadding.left - vizPadding.right;
          circleConstraint = d3.min([heightCircleConstraint, widthCircleConstraint]);
          radius = d3.scale.linear().domain([minVal, maxVal]).range([0, circleConstraint / 2]);
          radiusLength = radius(maxVal);
          centerXPos = widthCircleConstraint / 2 + vizPadding.left;
          centerYPos = heightCircleConstraint / 2 + vizPadding.top;
          vizBody.attr("transform", ("translate(" + centerXPos + "," + centerYPos + ")") + rotate(0));
          lastThumb = null;
          who.bind('thumb', function(e, thumb) {
            var index;
            if (thumb === lastThumb || -1 === (index = keys.indexOf(lastThumb = thumb))) {
              return;
            }
            return vizBody.transition().duration(750).attr("transform", ("translate(" + centerXPos + "," + centerYPos + ")") + rotate(-index));
          });
          radialTicks = radius.ticks(5);
          circleAxes = vizBody.selectAll(".circle-ticks").data(radialTicks).enter().append("svg:g").attr("class", "circle-ticks");
          circleAxes.append("svg:circle").attr("r", function(d, i) {
            return radius(d);
          }).attr("class", "circle").style("stroke", ruleColor).style("fill", "none");
          circleAxes.append("svg:text").attr("text-anchor", "end").style("stroke", ruleColor).attr("dy", function(d) {
            return -1 * radius(d);
          }).text(String);
          lineAxes = vizBody.selectAll(".line-ticks").data(hours).enter().append("svg:g").attr("transform", function(d, i) {
            return rotate(i) + translate(100);
          }).attr("class", "line-ticks");
          lineAxes.append("svg:line").attr("x2", -1 * radius(maxVal)).style("stroke", ruleColor).style("fill", "none");
          lineAxes.append("svg:text").text(function(d, i) {
            return keys[i];
          }).attr("text-anchor", "start").style("stroke", ruleColor).style("cursor", 'pointer').attr("transform", "rotate(180)").on("click", function(d, i) {
            return wiki.doInternalLink(keys[i], $(div).parents('.page'));
          });
          fill = d3.scale.category10();
          colorSelector = function(d, i) {
            return fill(i);
          };
          vizBody.selectAll(".series").data(series).enter().append("svg:g").attr("class", "series").append("svg:path").attr("class", "line").style("fill", colorSelector).style("stroke", colorSelector).style("stroke-width", 3).style("fill-opacity", .1).style("fill", colorSelector).attr("d", d3.svg.line.radial().radius(function(d) {
            return radius((d != null) && !isNaN(d) ? d : 0);
          }).angle(function(d, i) {
            return angle(i);
          })).append("svg:title").text(function(d, i) {
            return data[i]["Material name"];
          });
          return vizBody.selectAll(".comments").data(comments).enter().append("svg:g").attr("class", "comments").append("svg:text").style("font-size", "40px").style("fill", colorSelector).attr("text-anchor", "mid").attr("transform", function(d) {
            var percent;
            percent = series[d.material][d.dimension];
            return rotate(d.dimension) + translate(percent);
          }).text('*').append("svg:title").text(function(d) {
            return d.comment;
          });
        });
      });
    }
  };

}).call(this);
