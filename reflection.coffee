$ -> new class
	constructor: ->
		state = localStorage.getItem("state")
		
		@editor = CodeMirror(document.body,
			lineNumbers: true
			autofocus: true
			value: state or "#Reflection ver 0.1"
			onCursorActivity: => @editor.matchHighlight "CodeMirror-matchhighlight"
			onChange: @reflect
		)
		
		$("<canvas>").attr('id', 'scroll').appendTo(document.body)
		
		$(document.body).append("<footer><code>MWM</code></footer>")
		
		@width = 80
		@height = $(window).height()
		canvas = $("#scroll").attr("width", @width).attr("height", @height)
		@context = canvas[0].getContext("2d")
		@frame = {@data} = @context.createImageData(@width, @height)
		@scrollTop = $(window).scrollTop()
		@scrollBottom = @scrollTop + @height
		@reflect()
		
		@editor.setCursor({line: @editor.lineCount(), ch: 0})
		
		scrollKeys = {}
		keyMap = CodeMirror.keyMap["default"]
		keyMap["Ctrl-1"] = -> scrollKeys["1"] = $(window).scrollTop()
		keyMap["1"] = -> $(window).scrollTop(scrollKeys["1"])
		keyMap["Ctrl-2"] = -> scrollKeys["2"] = $(window).scrollTop()
		keyMap["2"] = -> $(window).scrollTop(scrollKeys["2"])
		keyMap["Ctrl-3"] = -> scrollKeys["3"] = $(window).scrollTop()
		keyMap["3"] = -> $(window).scrollTop(scrollKeys["3"])
		keyMap["Ctrl-4"] = -> scrollKeys["4"] = $(window).scrollTop()
		keyMap["4"] = -> $(window).scrollTop(scrollKeys["4"])
		
		CodeMirror.commands.save = => @downloadAs("name.coffee")
		
		dragging = null
		
		$(window)
		.scroll(@scroll)
		.mousedown((event) -> dragging = true)
		.mouseup((event) -> dragging = false)
		.mouseleave((event) -> dragging = false)
		
		$("#scroll")
		.click((event) =>
			y = event.clientY
			top = @editor.charCoords(
				line: Math.max(0, y - 20)
				ch: 0
			).y
			$(window).scrollTop top
		)
		.mousemove (event) =>
			if dragging
				y = event.clientY
				top = @editor.charCoords(
					line: Math.max(0, y - 20)
					ch: 0
				).y
				$(window).scrollTop top
	
	setPixel: (x, y, r, g, b, a) ->
		index = (x + y * @width) * 4
		@data[index + 0] = r
		@data[index + 1] = g
		@data[index + 2] = b
		@data[index + 3] = a
	
	charAlpha: (ch) ->
		if /[._'"\-]/.test(ch)
			150
		else if /[flyg]/.test(ch)
			225
		else if /[a-z]/.test(ch)
			200
		else
			255
	
	reflect: (editor, change) =>
		t0 = (+new Date)
		x = col = 0
		y = 0
		end = @height
		first = @editor.coordsChar(x: null, y: @scrollTop).line
		last = @editor.coordsChar(x: null, y: @scrollBottom).line + 1
		if change
			x = col = change.from.ch
			y = change.from.line
			linesChanged = change.to.line + 1 - y
			end = Math.max(end, y + linesChanged + 1)
			end = y + linesChanged if linesChanged is change.text.length
		while y < end
			while col < @width
				line = @editor.getLine(y)
				ch = line?.charAt(col)
				if ch and /\t/.test(ch)
					if y > first and y < last
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
					if y > first and y < last
						@setPixel x, y, 200, 225, 255, 125
					else
						@setPixel x, y, 0, 0, 0, 0
				++x
				++col
			col = x = 0
			++y
		@context.putImageData @frame, 0, 0
		localStorage.setItem("state", @editor.getValue())
		console.log (+new Date) - t0 + "ms"
	
	scroll: =>
		@scrollTop = $(window).scrollTop()
		@scrollBottom = @scrollTop + @height
		lines = @editor.lineCount()
		end = Math.min(@height, lines)
		first = @editor.coordsChar(x: null, y: @scrollTop).line
		last = @editor.coordsChar(x: null, y: @scrollBottom).line + 1
		y = 0
		while y < end
			x = col = 0
			while x < @width
				ch = @editor.getLine(y).charAt(col)
				if ch and /\t/.test(ch)
					if y > first and y < last
						@setPixel x, y, 200, 225, 255, 125
						@setPixel x + 1, y, 200, 225, 255, 125
					else
						@setPixel x, y, 0, 0, 0, 0
						@setPixel x + 1, y, 0, 0, 0, 0
					++x
				else if not ch or /\s/.test(ch)
					if y > first and y < last
						@setPixel x, y, 200, 225, 255, 125
					else
						@setPixel x, y, 255, 255, 255, 125
				++x
				++col
			++y
		@context.putImageData @frame, 0, 0
		#if lines > @height
			#offset = -(first / lines * (lines - @height)) | 0
			#$("#scroll").css('top', offset + 'px') 
	
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
	