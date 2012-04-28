$ -> $.get "reflection.coffee", (reflection) -> new class
	constructor: ->
		state = localStorage.getItem("state")
		
		@editor = CodeMirror(document.body,
			lineNumbers: true
			autofocus: true
			value: state or reflection
			onCursorActivity: => @editor.matchHighlight "CodeMirror-matchhighlight"
			onChange: @reflect
		)
		
		@width = 80
		@windowHeight = $(window).height()
		@height = Math.max(@windowHeight, @editor.lineCount())
		
		@canvas = $("<canvas>")
		.attr('id', 'scroll')
		.attr("width", @width)
		.attr("height", @height)
		.appendTo(".CodeMirror")
		
		@context = @canvas[0].getContext("2d")
		@frame = {@data} = @context.createImageData(@width, @height)
		scrollTop = $(window).scrollTop()
		@top = @editor.coordsChar(x: null, y: scrollTop).line
		@bottom = @editor.coordsChar(x: null, y: scrollTop + @windowHeight).line + 1
		
		@reflect()
		
		scrollKeys = {}
		keyMap = CodeMirror.keyMap["default"]
		keyMap["Shift-Ctrl-1"] = ->
			console.log "1: " + $(window).scrollTop()
			scrollKeys["1"] = $(window).scrollTop()
		keyMap["Ctrl-1"] = ->
			console.log "1> " + scrollKeys["1"]
			$(window).scrollTop(scrollKeys["1"])
		
		CodeMirror.commands.save = => @downloadAs("name.coffee")
		CodeMirror.commands.open = => @downloadAs("name.coffee")
		
		@dragging = false
		@down = false
		
		$(window)
		.scroll(@scroll)
		.resize(@resize)
		.mousedown( => @down = true)
		.mousemove( => @dragging = true if @down)
		.mouseleave( => @down = @dragging = false)
		.mouseup( => @down = @dragging = false)
		
		@canvas
		.mouseup(({clientY}) => if not @dragging then @scrollTo(clientY))
		.mousemove(({clientY}) => if @dragging then @scrollTo(clientY))
		
		$(document.body).append("<footer><code>MWM</code></footer>")
	
	reflect: (editor, change) =>
		t0 = (+new Date)
		
		@lines = @editor.lineCount()
		@codeHeight = $(".CodeMirror").height()
		if not change
			x = col = 0
			y = 0
			end = @lines
		else
			x = col = change.from.ch
			y = change.from.line
			linesChanged = change.to.line + 1 - y
			if linesChanged is change.text.length
				end = y + linesChanged + 1 
			else
				end = Math.max(@lines, y + linesChanged + 1)
		while y < end
			line = @editor.getLine(y)
			while col < @width
				ch = line?.charAt(col)
				if ch
					if /\t/.test(ch)
						if @top < y < @bottom
							@setPixel x, y, 200, 225, 255, 125
							@setPixel x + 1, y, 200, 225, 255, 125
						else
							@setPixel x, y, 0, 0, 0, 0
							@setPixel x + 1, y, 0, 0, 0, 0
						++x
					else if /\s/.test(ch)
						if @top < y < @bottom
							@setPixel x, y, 200, 225, 255, 125
						else
							@setPixel x, y, 0, 0, 0, 0
					else
						token = @editor.getTokenAt(line: y, ch: col + 1).className
						switch token
							when "operator", "keyword" then @setPixel x, y, 0, 0, 255, @charAlpha(ch)
							when "number" then @setPixel x, y, 255, 0, 0, 255
							when "punctuation" then @setPixel x, y, 150, 150, 150, 255
							when "string" then @setPixel x, y, 136, 85, 0, @charAlpha(ch)
							when "string-2" then @setPixel x, y, 136, 0, 255, @charAlpha(ch)
							when "comment" then @setPixel x, y, 0, 128, 0, @charAlpha(ch)
							when "variable" then @setPixel x, y, 50, 50, 50, @charAlpha(ch)
							when "atom" then @setPixel x, y, 50, 25, 150, @charAlpha(ch)
							else @setPixel x, y, 0, 0, 0, 255
				else
					if @top < y < @bottom
						@setPixel x, y, 200, 225, 255, 125
					else
						@setPixel x, y, 0, 0, 0, 0
				++x
				++col
			col = x = 0
			++y
		@context.putImageData(@frame, 0, 0)
		localStorage.setItem("state", @editor.getValue())
		
		console.log (+new Date) - t0 + "ms", 'reflect'
	
	scroll: =>
		t0 = (+new Date)
		
		top = @top
		bottom = @bottom
		@scrollTop = $(window).scrollTop()
		@top = @editor.coordsChar(x: null, y: @scrollTop).line
		@bottom = @editor.coordsChar(x: null, y: @scrollTop + @windowHeight).line + 1
		heightLines = @bottom - @top
		y = Math.min(top, @top)
		end = Math.max(bottom, @bottom)
		while y < end
			x = col = 0
			while x < @width
				ch = @editor.getLine(y)?.charAt(col)
				if ch and /\t/.test(ch)
					if @top < y < @bottom
						@setPixel x, y, 200, 225, 255, 125
						@setPixel x + 1, y, 200, 225, 255, 125
					else
						@setPixel x, y, 0, 0, 0, 0
						@setPixel x + 1, y, 0, 0, 0, 0
					++x
				else if not ch or /\s/.test(ch)
					if @top < y < @bottom
						@setPixel x, y, 200, 225, 255, 125
					else
						@setPixel x, y, 255, 255, 255, 125
				++x
				++col
			++y
		@context.putImageData @frame, 0, 0
		if @lines > @windowHeight
			@offset = -(@top / (@lines - heightLines) * (@lines - @windowHeight)) | 0
			$("#scroll").css('top', @offset + 'px') 
		
		#console.log (+new Date) - t0 + "ms", 'scroll'
	
	scrollTo: (y) ->
		y -= 20
		if @lines > @windowHeight
			top = y / @windowHeight * @codeHeight | 0
		else
			top = @editor.charCoords(
				line: Math.max(0, y)
				ch: 0
			).y
		$(window).scrollTop(top)
	
	resize: =>
		@windowHeight = $(window).height()
		if (@windowHeight > @lines)
			@height = @windowHeight
			@canvas = $("#scroll").attr("height", @height)
			@context = @canvas[0].getContext("2d")
			@frame = {@data} = @context.createImageData(@width, @height)
		@bottom = @editor.coordsChar(x: null, y: @scrollTop + @windowHeight).line + 1
	
	downloadAs: (name) ->
		raw = @editor.getValue()
		window.webkitRequestFileSystem(window.TEMPORARY, 1024 * 1024, (fs) ->
			console.log('webkitRequestFileSystem')
			fs.root.getFile(name, {create: true}, (fileEntry) ->
				fileEntry.createWriter((fileWriter) ->
					builder = new WebKitBlobBuilder()
					builder.append(raw)
					fileWriter.onwriteend = -> location.href = fileEntry.toURL()
					fileWriter.write(builder.getBlob())
				, ->)
			, ->)
		, (e) -> console.error(e))
	
	charAlpha: (ch) ->
		if /[._'"\-]/.test(ch)
			150
		else if /[flyg]/.test(ch)
			225
		else if /[a-z]/.test(ch)
			200
		else
			255
	
	setPixel: (x, y, r, g, b, a) ->
		index = (x + y * @width) * 4
		@data[index + 0] = r
		@data[index + 1] = g
		@data[index + 2] = b
		@data[index + 3] = a
	