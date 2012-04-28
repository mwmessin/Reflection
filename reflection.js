(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $(function() {
    return $.get("reflection.coffee", function(reflection) {
      return new ((function() {

        function _Class() {
          this.resize = __bind(this.resize, this);
          this.scroll = __bind(this.scroll, this);
          this.reflect = __bind(this.reflect, this);
          var i, keyMap, scrollKeys, scrollTop, state, _fn, _ref,
            _this = this;
          state = localStorage.getItem("state");
          this.editor = CodeMirror(document.body, {
            lineNumbers: true,
            autofocus: true,
            value: state || reflection,
            onCursorActivity: function() {
              return _this.editor.matchHighlight("CodeMirror-matchhighlight");
            },
            onChange: this.reflect
          });
          this.width = 80;
          this.windowHeight = $(window).height();
          this.height = Math.max(this.windowHeight, this.editor.lineCount());
          this.canvas = $("<canvas>").attr('id', 'scroll').attr("width", this.width).attr("height", this.height).appendTo(".CodeMirror");
          this.context = this.canvas[0].getContext("2d");
          this.frame = (_ref = this.context.createImageData(this.width, this.height), this.data = _ref.data, _ref);
          scrollTop = $(window).scrollTop();
          this.top = this.editor.coordsChar({
            x: null,
            y: scrollTop
          }).line;
          this.bottom = this.editor.coordsChar({
            x: null,
            y: scrollTop + this.windowHeight
          }).line + 1;
          this.reflect();
          scrollKeys = [];
          keyMap = CodeMirror.keyMap["default"];
          _fn = function(i) {
            keyMap["Shift-Ctrl-" + i] = function() {
              console.log(i + ": " + $(window).scrollTop());
              return scrollKeys[i] = $(window).scrollTop();
            };
            return keyMap["Ctrl-" + i] = function() {
              console.log(i + "> " + scrollKeys[i]);
              return $(window).scrollTop(scrollKeys[i]);
            };
          };
          for (i = 0; i <= 9; i++) {
            _fn(i);
          }
          keyMap["Cmd-D"] = "download";
          keyMap["Shift-Cmd-N"] = "findNext";
          keyMap["Shift-Cmd-P"] = "findPrev";
          keyMap["Shift-Cmd-R"] = "replace";
          keyMap["Shift-Cmd-/"] = function() {
            return console.log(keyMap);
          };
          CodeMirror.commands.save = function() {
            return localStorage.setItem("state", _this.editor.getValue());
          };
          CodeMirror.commands.download = function() {
            return _this.downloadAs("name.coffee");
          };
          this.dragging = false;
          this.down = false;
          $(window).scroll(this.scroll).resize(this.resize).mousedown(function() {
            return _this.down = true;
          }).mousemove(function() {
            if (_this.down) return _this.dragging = true;
          }).mouseleave(function() {
            return _this.down = _this.dragging = false;
          }).mouseup(function() {
            return _this.down = _this.dragging = false;
          });
          this.canvas.mouseup(function(_arg) {
            var clientY;
            clientY = _arg.clientY;
            if (!_this.dragging) return _this.scrollTo(clientY);
          }).mousemove(function(_arg) {
            var clientY;
            clientY = _arg.clientY;
            if (_this.dragging) return _this.scrollTo(clientY);
          });
          $(document.body).append("<footer><code>MWM</code></footer>");
        }

        _Class.prototype.reflect = function(editor, change) {
          var ch, col, end, line, linesChanged, t0, token, x, y;
          t0 = +(new Date);
          this.lines = this.editor.lineCount();
          this.codeHeight = $(".CodeMirror").height();
          if (!change) {
            x = col = 0;
            y = 0;
            end = this.lines;
          } else {
            x = col = change.from.ch;
            y = change.from.line;
            linesChanged = change.to.line + 1 - y;
            if (linesChanged === change.text.length) {
              end = y + linesChanged + 1;
            } else {
              end = Math.max(this.lines, y + linesChanged + 1);
            }
          }
          while (y < end) {
            line = this.editor.getLine(y);
            while (col < this.width) {
              ch = line != null ? line.charAt(col) : void 0;
              if (ch) {
                if (/\t/.test(ch)) {
                  if ((this.top < y && y < this.bottom)) {
                    this.setPixel(x, y, 200, 225, 255, 125);
                    this.setPixel(x + 1, y, 200, 225, 255, 125);
                  } else {
                    this.setPixel(x, y, 0, 0, 0, 0);
                    this.setPixel(x + 1, y, 0, 0, 0, 0);
                  }
                  ++x;
                } else if (/\s/.test(ch)) {
                  if ((this.top < y && y < this.bottom)) {
                    this.setPixel(x, y, 200, 225, 255, 125);
                  } else {
                    this.setPixel(x, y, 0, 0, 0, 0);
                  }
                } else {
                  token = this.editor.getTokenAt({
                    line: y,
                    ch: col + 1
                  }).className;
                  switch (token) {
                    case "operator":
                    case "keyword":
                      this.setPixel(x, y, 0, 0, 255, this.charAlpha(ch));
                      break;
                    case "number":
                      this.setPixel(x, y, 255, 0, 0, 255);
                      break;
                    case "punctuation":
                      this.setPixel(x, y, 150, 150, 150, 255);
                      break;
                    case "string":
                      this.setPixel(x, y, 136, 85, 0, this.charAlpha(ch));
                      break;
                    case "string-2":
                      this.setPixel(x, y, 136, 0, 255, this.charAlpha(ch));
                      break;
                    case "comment":
                      this.setPixel(x, y, 0, 128, 0, this.charAlpha(ch));
                      break;
                    case "variable":
                      this.setPixel(x, y, 50, 50, 50, this.charAlpha(ch));
                      break;
                    case "atom":
                      this.setPixel(x, y, 50, 25, 150, this.charAlpha(ch));
                      break;
                    default:
                      this.setPixel(x, y, 0, 0, 0, 255);
                  }
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
          return console.log((+(new Date)) - t0 + "ms", 'reflect');
        };

        _Class.prototype.scroll = function() {
          var bottom, ch, col, end, heightLines, t0, top, x, y, _ref;
          t0 = +(new Date);
          top = this.top;
          bottom = this.bottom;
          this.scrollTop = $(window).scrollTop();
          this.top = this.editor.coordsChar({
            x: null,
            y: this.scrollTop
          }).line;
          this.bottom = this.editor.coordsChar({
            x: null,
            y: this.scrollTop + this.windowHeight
          }).line + 1;
          heightLines = this.bottom - this.top;
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
          if (this.lines > this.windowHeight) {
            this.offset = -(this.top / (this.lines - heightLines) * (this.lines - this.windowHeight)) | 0;
            return $("#scroll").css('top', this.offset + 'px');
          }
        };

        _Class.prototype.scrollTo = function(y) {
          var top;
          y -= 20;
          if (this.lines > this.windowHeight) {
            top = y / this.windowHeight * this.codeHeight | 0;
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
          this.windowHeight = $(window).height();
          if (this.windowHeight > this.lines) {
            this.height = this.windowHeight;
            this.canvas = $("#scroll").attr("height", this.height);
            this.context = this.canvas[0].getContext("2d");
            this.frame = (_ref = this.context.createImageData(this.width, this.height), this.data = _ref.data, _ref);
          }
          return this.bottom = this.editor.coordsChar({
            x: null,
            y: this.scrollTop + this.windowHeight
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
  });

}).call(this);
