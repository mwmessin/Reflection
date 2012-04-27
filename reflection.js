(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $(function() {
    return new ((function() {

      function _Class() {
        this.resize = __bind(this.resize, this);
        this.scrollSlide = __bind(this.scrollSlide, this);
        this.scrollClick = __bind(this.scrollClick, this);
        this.scroll = __bind(this.scroll, this);
        this.reflect = __bind(this.reflect, this);
        var keyMap, scrollKeys, scrollTop, state, _ref,
          _this = this;
        state = localStorage.getItem("state");
        this.editor = CodeMirror(document.body, {
          lineNumbers: true,
          autofocus: true,
          value: state || "#Reflection: Coffeescript editor",
          onCursorActivity: function() {
            return _this.editor.matchHighlight("CodeMirror-matchhighlight");
          },
          onChange: this.reflect
        });
        this.width = 80;
        this.height = Math.max($(window).height(), this.editor.lineCount());
        this.canvas = $("<canvas>").attr('id', 'scroll').attr("width", this.width).attr("height", this.height).appendTo(document.body);
        this.context = this.canvas[0].getContext("2d");
        this.frame = (_ref = this.context.createImageData(this.width, this.height), this.data = _ref.data, _ref);
        scrollTop = $(window).scrollTop();
        this.top = this.editor.coordsChar({
          x: null,
          y: scrollTop
        }).line;
        this.bottom = this.editor.coordsChar({
          x: null,
          y: scrollTop + $(window).height()
        }).line + 1;
        this.reflect();
        scrollKeys = {};
        keyMap = CodeMirror.keyMap["default"];
        keyMap["Shift-Ctrl-1"] = function() {
          return scrollKeys["1"] = $(window).scrollTop();
        };
        keyMap["Ctrl-1"] = function() {
          return $(window).scrollTop(scrollKeys["1"]);
        };
        CodeMirror.commands.save = function() {
          return _this.downloadAs("name.coffee");
        };
        CodeMirror.commands.open = function() {
          return _this.downloadAs("name.coffee");
        };
        this.dragging = null;
        $(window).scroll(this.scroll).resize(this.resize).mousedown(function(event) {
          return _this.dragging = true;
        }).mouseup(function(event) {
          return _this.dragging = false;
        }).mouseleave(function(event) {
          return _this.dragging = false;
        });
        this.canvas.mouseup(this.scrollClick).mousemove(this.scrollSlide);
        $(document.body).append("<footer><code>MWM</code></footer>");
      }

      _Class.prototype.reflect = function(editor, change) {
        var ch, col, end, line, linesChanged, t0, token, x, y;
        t0 = +(new Date);
        this.lines = this.editor.lineCount();
        if (!change) {
          x = col = 0;
          y = 0;
          end = this.lines;
        } else {
          x = col = change.from.ch;
          y = change.from.line;
          linesChanged = change.to.line + 1 - y;
          end = Math.max(this.lines, y + linesChanged + 1);
          if (linesChanged === change.text.length) end = y + linesChanged + 1;
        }
        while (y < end) {
          while (col < this.width) {
            line = this.editor.getLine(y);
            ch = line != null ? line.charAt(col) : void 0;
            if (ch && /\t/.test(ch)) {
              if ((this.top < y && y < this.bottom)) {
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
              if ((this.top < y && y < this.bottom)) {
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
        return console.log((+(new Date)) - t0 + "ms", 'reflect');
      };

      _Class.prototype.scroll = function() {
        var bottom, ch, col, end, height, scrollTop, t0, top, x, y, _ref;
        t0 = +(new Date);
        top = this.top;
        bottom = this.bottom;
        height = $(window).height();
        scrollTop = $(window).scrollTop();
        this.top = this.editor.coordsChar({
          x: null,
          y: scrollTop
        }).line;
        this.bottom = this.editor.coordsChar({
          x: null,
          y: scrollTop + height
        }).line + 1;
        y = Math.min(top, this.top);
        end = Math.max(bottom, this.bottom);
        while (y < end) {
          x = col = 0;
          while (x < this.width) {
            ch = (_ref = this.editor.getLine(y)) != null ? _ref.charAt(col) : void 0;
            if (ch && /\t/.test(ch)) {
              if ((this.top < y && y < this.bottom)) {
                this.setPixel(x, y, 200, 225, 255, 125);
                this.setPixel(x + 1, y, 200, 225, 255, 125);
              } else {
                this.setPixel(x, y, 0, 0, 0, 0);
                this.setPixel(x + 1, y, 0, 0, 0, 0);
              }
              ++x;
            } else if (!ch || /\s/.test(ch)) {
              if ((this.top < y && y < this.bottom)) {
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
        this.context.putImageData(this.frame, 0, 0);
        if (this.lines > height) {
          this.offset = -(this.top / this.lines * (this.lines - height)) | 0;
          $("#scroll").css('top', this.offset + 'px');
        }
        return console.log((+(new Date)) - t0 + "ms", 'scroll');
      };

      _Class.prototype.scrollClick = function(event) {
        var top, y;
        if (this.dragging) return;
        y = event.clientY - 20;
        if (this.lines > this.height) {
          top = y / this.height * $(".CodeMirror").height() | 0;
        } else {
          top = this.editor.charCoords({
            line: Math.max(0, y),
            ch: 0
          }).y;
        }
        return $(window).scrollTop(top);
      };

      _Class.prototype.scrollSlide = function(event) {
        var top, y;
        if (!this.dragging) return;
        y = event.clientY - 20;
        if (this.lines > this.height) {
          top = y / this.height * $(".CodeMirror").height() | 0;
        } else {
          top = this.editor.charCoords({
            line: Math.max(0, y),
            ch: 0
          }).y;
        }
        return $(window).scrollTop(top);
      };

      _Class.prototype.resize = function() {
        var _ref;
        if ($(window).height() > this.lines) {
          this.height = $(window).height();
          this.canvas = $("#scroll").attr("height", this.height);
          this.context = this.canvas[0].getContext("2d");
          this.frame = (_ref = this.context.createImageData(this.width, this.height), this.data = _ref.data, _ref);
        }
        return this.bottom = this.editor.coordsChar({
          x: null,
          y: $(window).scrollTop() + $(window).height()
        }).line + 1;
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

      _Class.prototype.setPixel = function(x, y, r, g, b, a) {
        var index;
        index = (x + y * this.width) * 4;
        this.data[index + 0] = r;
        this.data[index + 1] = g;
        this.data[index + 2] = b;
        return this.data[index + 3] = a;
      };

      return _Class;

    })());
  });

}).call(this);
