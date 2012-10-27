all:
	coffee -c *.coffee
	mv *.js js/
	#stylus 