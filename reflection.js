(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $(function() {
    return new ((function() {

      function _Class() {
        this.scroll = __bind(this.scroll, this);
        this.reflect = __bind(this.reflect, this);
        var canvas, dragging, keyMap, scrollKeys, state, _ref,
          _this = this;
        state = localStorage.getItem("state");
        this.editor = CodeMirror(document.body, {
          lineNumbers: true,
          autofocus: true,
          value: state || "#Reflection ver 0.1",
          onCursorActivity: function() {
            return _this.editor.matchHighlight("CodeMirror-matchhighlight");
          },
          onChange: this.reflect
        });
        $("<canvas>").attr('id', 'scroll').appendTo(document.body);
        $(document.body).append("<footer><code>MWM</code></footer>");
        this.width = 80;
        this.height = $(window).height();
        canvas = $("#scroll").attr("width", this.width).attr("height", this.height);
        this.context = canvas[0].getContext("2d");
        this.frame = (_ref = this.context.createImageData(this.width, this.height), this.data = _ref.data, _ref);
        this.scrollTop = $(window).scrollTop();
        this.scrollBottom = this.scrollTop + this.height;
        this.reflect();
        this.editor.setCursor({
          line: this.editor.lineCount(),
          ch: 0
        });
        scrollKeys = {};
        keyMap = CodeMirror.keyMap["default"];
        keyMap["Ctrl-1"] = function() {
          return scrollKeys["1"] = $(window).scrollTop();
        };
        keyMap["1"] = function() {
          return $(window).scrollTop(scrollKeys["1"]);
        };
        keyMap["Ctrl-2"] = function() {
          return scrollKeys["2"] = $(window).scrollTop();
        };
        keyMap["2"] = function() {
          return $(window).scrollTop(scrollKeys["2"]);
        };
        keyMap["Ctrl-3"] = function() {
          return scrollKeys["3"] = $(window).scrollTop();
        };
        keyMap["3"] = function() {
          return $(window).scrollTop(scrollKeys["3"]);
        };
        keyMap["Ctrl-4"] = function() {
          return scrollKeys["4"] = $(window).scrollTop();
        };
        keyMap["4"] = function() {
          return $(window).scrollTop(scrollKeys["4"]);
        };
        CodeMirror.commands.save = function() {
          return _this.downloadAs("name.coffee");
        };
        dragging = null;
        $(window).scroll(this.scroll).mousedown(function(event) {
          return dragging = true;
        }).mouseup(function(event) {
          return dragging = false;
        }).mouseleave(function(event) {
          return dragging = false;
        });
        $("#scroll").click(function(event) {
          var top, y;
          y = event.clientY;
          top = _this.editor.charCoords({
            line: Math.max(0, y - 20),
            ch: 0
          }).y;
          return $(window).scrollTop(top);
        }).mousemove(function(event) {
          var top, y;
          if (dragging) {
            y = event.clientY;
            top = _this.editor.charCoords({
              line: Math.max(0, y - 20),
              ch: 0
            }).y;
            return $(window).scrollTop(top);
          }
        });
      }

      _Class.prototype.setPixel = function(x, y, r, g, b, a) {
        var index;
        index = (x + y * this.width) * 4;
        this.data[index + 0] = r;
        this.data[index + 1] = g;
        this.data[index + 2] = b;
        return this.data[index + 3] = a;
      };

      _Class.prototype.charAlpha = function(ch) {
        if (/[._'"\-]/.test(ch)) {
          return 150;
        } else if (/[flyg]/.test(ch)) {
          return 225;
        } else if (/[a-z]/.test(ch)) {
          return 200;
        } else {
          return 255;
        }
      };

      _Class.prototype.reflect = function(editor, change) {
        var ch, col, end, first, last, line, linesChanged, t0, token, x, y;
        t0 = +(new Date);
        x = col = 0;
        y = 0;
        end = this.height;
        first = this.editor.coordsChar({
          x: null,
          y: this.scrollTop
        }).line;
        last = this.editor.coordsChar({
          x: null,
          y: this.scrollBottom
        }).line + 1;
        if (change) {
          x = col = change.from.ch;
          y = change.from.line;
          linesChanged = change.to.line + 1 - y;
          end = Math.max(end, y + linesChanged + 1);
          if (linesChanged === change.text.length) end = y + linesChanged;
        }
        while (y < end) {
          while (col < this.width) {
            line = this.editor.getLine(y);
            ch = line != null ? line.charAt(col) : void 0;
            if (ch && /\t/.test(ch)) {
              if (y > first && y < last) {
                this.setPixel(x, y, 200, 225, 255, 125);
                this.setPixel(x + 1, y, 200, 225, 255, 125);
              } else {
                this.setPixel(x, y, 0, 0, 0, 0);
                this.setPixel(x + 1, y, 0, 0, 0, 0);
              }
              ++x;
            } else if (ch && !/\s/.test(ch)) {
              token = this.editor.getTokenAt({
                line: y,
                ch: col + 1
              }).className;
              if (token === "operator" || token === "keyword") {
                this.setPixel(x, y, 0, 0, 255, this.charAlpha(ch));
              } else if (token === "number") {
                this.setPixel(x, y, 255, 0, 0, 255);
              } else if (token === "punctuation") {
                this.setPixel(x, y, 200, 200, 200, 255);
              } else if (token === "string") {
                this.setPixel(x, y, 136, 85, 0, this.charAlpha(ch));
              } else if (token === "string-2") {
                this.setPixel(x, y, 136, 0, 255, this.charAlpha(ch));
              } else if (token === "comment") {
                this.setPixel(x, y, 0, 128, 0, this.charAlpha(ch));
              } else if (token === "variable") {
                this.setPixel(x, y, 50, 50, 50, this.charAlpha(ch));
              } else {
                this.setPixel(x, y, 0, 0, 0, 255);
              }
            } else {
              if (y > first && y < last) {
                this.setPixel(x, y, 200, 225, 255, 125);
              } else {
                this.setPixel(x, y, 0, 0, 0, 0);
              }
            }
            ++x;
            ++col;
          }
          col = x = 0;
          ++y;
        }
        this.context.putImageData(this.frame, 0, 0);
        localStorage.setItem("state", this.editor.getValue());
        return console.log((+(new Date)) - t0 + "ms");
      };

      _Class.prototype.scroll = function() {
        var ch, col, end, first, last, lines, x, y;
        this.scrollTop = $(window).scrollTop();
        this.scrollBottom = this.scrollTop + this.height;
        lines = this.editor.lineCount();
        end = Math.min(this.height, lines);
        first = this.editor.coordsChar({
          x: null,
          y: this.scrollTop
        }).line;
        last = this.editor.coordsChar({
          x: null,
          y: this.scrollBottom
        }).line + 1;
        y = 0;
        while (y < end) {
          x = col = 0;
          while (x < this.width) {
            ch = this.editor.getLine(y).charAt(col);
            if (ch && /\t/.test(ch)) {
              if (y > first && y < last) {
                this.setPixel(x, y, 200, 225, 255, 125);
                this.setPixel(x + 1, y, 200, 225, 255, 125);
              } else {
                this.setPixel(x, y, 0, 0, 0, 0);
                this.setPixel(x + 1, y, 0, 0, 0, 0);
              }
              ++x;
            } else if (!ch || /\s/.test(ch)) {
              if (y > first && y < last) {
                this.setPixel(x, y, 200, 225, 255, 125);
              } else {
                this.setPixel(x, y, 255, 255, 255, 125);
              }
            }
            ++x;
            ++col;
          }
          ++y;
        }
        return this.context.putImageData(this.frame, 0, 0);
      };

      _Class.prototype.downloadAs = function(name) {
        var raw;
        raw = this.editor.getValue();
        return window.webkitRequestFileSystem(window.TEMPORARY, 1024 * 1024, function(fs) {
          console.log('webkitRequestFileSystem');
          return fs.root.getFile(name, {
            create: true
          }, function(fileEntry) {
            return fileEntry.createWriter(function(fileWriter) {
              var builder;
              builder = new WebKitBlobBuilder();
              builder.append(raw);
              fileWriter.onwriteend = function() {
                return location.href = fileEntry.toURL();
              };
              return fileWriter.write(builder.getBlob());
            }, function() {});
          }, function() {});
        }, function(e) {
          return console.error(e);
        });
      };

      return _Class;

    })());
  });

}).call(this);
