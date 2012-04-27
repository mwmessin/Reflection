$ -> new class
	constructor: ->
		state = localStorage.getItem("state")
		
		@editor = CodeMirror(document.body,
			lineNumbers: true
			autofocus: true
			value: state or "#Reflection: Coffeescript editor"
			onCursorActivity: => @editor.matchHighlight "CodeMirror-matchhighlight"
			onChange: @reflect
		)
		
		@width = 80
		@height = Math.max($(window).height(), @editor.lineCount())
		
		@canvas = $("<canvas>")
		.attr('id', 'scroll')
		.attr("width", @width)
		.attr("height", @height)
		.appendTo(document.body)
		
		@context = @canvas[0].getContext("2d")
		@frame = {@data} = @context.createImageData(@width, @height)
		scrollTop = $(window).scrollTop()
		@top = @editor.coordsChar(x: null, y: scrollTop).line
		@bottom = @editor.coordsChar(x: null, y: scrollTop + $(window).height()).line + 1
		
		@reflect()
		
		scrollKeys = {}
		keyMap = CodeMirror.keyMap["default"]
		keyMap["Shift-Ctrl-1"] = -> scrollKeys["1"] = $(window).scrollTop()
		keyMap["Ctrl-1"] = -> $(window).scrollTop(scrollKeys["1"])
		
		CodeMirror.commands.save = => @downloadAs("name.coffee")
		CodeMirror.commands.open = => @downloadAs("name.coffee")
		
		@dragging = null
		
		$(window)
		.scroll(@scroll)
		.resize(@resize)
		.mousedown((event) => @dragging = true)
		.mouseup((event) => @dragging = false)
		.mouseleave((event) => @dragging = false)
		
		@canvas
		.mouseup(@scrollClick)
		.mousemove(@scrollSlide)
		
		$(document.body).append("<footer><code>MWM</code></footer>")
	
	reflect: (editor, change) =>
		t0 = (+new Date)
		
		@lines = @editor.lineCount()
		if not change
			x = col = 0
			y = 0
			end = @lines
		else
			x = col = change.from.ch
			y = change.from.line
			linesChanged = change.to.line + 1 - y
			end = Math.max(@lines, y + linesChanged + 1)
			end = y + linesChanged + 1 if linesChanged is change.text.length
		while y < end
			while col < @width
				line = @editor.getLine(y)
				ch = line?.charAt(col)
				if ch and /\t/.test(ch)
					if @top < y < @bottom
						@setPixel x, y, 200, 225, 255, 125
						@setPixel x + 1, y, 200, 225, 255, 125
					else
						@setPixel x, y, 0, 0, 0, 0
						@setPixel x + 1, y, 0, 0, 0, 0
					++x
				else if ch and not /\s/.test(ch)
					token = @editor.getTokenAt(line: y, ch: col + 1).className
					if token is "operator" or token is "keyword"
						@setPixel x, y, 0, 0, 255, @charAlpha(ch)
					else if token is "number"
						@setPixel x, y, 255, 0, 0, 255
					else if token is "punctuation"
						@setPixel x, y, 200, 200, 200, 255
					else if token is "string"
						@setPixel x, y, 136, 85, 0, @charAlpha(ch)
					else if token is "string-2"
						@setPixel x, y, 136, 0, 255, @charAlpha(ch)
					else if token is "comment"
						@setPixel x, y, 0, 128, 0, @charAlpha(ch)
					else if token is "variable"
						@setPixel x, y, 50, 50, 50, @charAlpha(ch)
					else
						@setPixel x, y, 0, 0, 0, 255
				else
					if @top < y < @bottom
						@setPixel x, y, 200, 225, 255, 125
					else
						@setPixel x, y, 0, 0, 0, 0
				++x
				++col
			col = x = 0
			++y
		@context.putImageData @frame, 0, 0
		localStorage.setItem("state", @editor.getValue())
		
		console.log (+new Date) - t0 + "ms", 'reflect'
	
	scroll: =>
		t0 = (+new Date)
		
		top = @top
		bottom = @bottom
		height = $(window).height()
		scrollTop = $(window).scrollTop()
		@top = @editor.coordsChar(x: null, y: scrollTop).line
		@bottom = @editor.coordsChar(x: null, y: scrollTop + height).line + 1
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
		if @lines > height
			@offset = -(@top / @lines * (@lines - height)) | 0
			$("#scroll").css('top', @offset + 'px') 
		
		console.log (+new Date) - t0 + "ms", 'scroll'
	
	scrollClick: (event) =>
		return if @dragging
		y = event.clientY - 20
		if @lines > @height
			top = y / @height * $(".CodeMirror").height() | 0
		else
			top = @editor.charCoords(
				line: Math.max(0, y)
				ch: 0
			).y
		$(window).scrollTop top
	
	scrollSlide: (event) =>
		return if not @dragging
		y = event.clientY - 20
		if @lines > @height
			top = y / @height * $(".CodeMirror").height() | 0
		else
			top = @editor.charCoords(
				line: Math.max(0, y)
				ch: 0
			).y
		$(window).scrollTop top
	
	resize: =>
		if ($(window).height() > @lines)
			@height = $(window).height()
			@canvas = $("#scroll").attr("height", @height)
			@context = @canvas[0].getContext("2d")
			@frame = {@data} = @context.createImageData(@width, @height)
		@bottom = @editor.coordsChar(x: null, y: $(window).scrollTop() + $(window).height()).line + 1
	
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
	