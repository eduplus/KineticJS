(function() {
    // CONSTANTS
    var STAGE = 'Stage',
        STRING = 'string',
        PX = 'px',
        MOUSEOUT = 'mouseout',
        MOUSELEAVE = 'mouseleave',
        MOUSEOUT = 'mouseout',
        MOUSEOVER = 'mouseover',
        MOUSEENTER = 'mouseenter',
        MOUSEMOVE = 'mousemove',
        MOUSEDOWN = 'mousedown',
        MOUSEUP = 'mouseup',
        CLICK = 'click',
        DBL_CLICK = 'dblclick',
        TOUCHSTART = 'touchstart'
        TOUCHEND = 'touchend'
        TAP = 'tap',
        DBL_TAP = 'dbltap',
        TOUCHMOVE = 'touchmove',
        DIV = 'div',
        RELATIVE = 'relative',
        INLINE_BLOCK = 'inline-block',
        KINETICJS_CONTENT = 'kineticjs-content',
        SPACE = ' ',
        CONTAINER = 'container',
        EVENTS = [MOUSEDOWN, MOUSEMOVE, MOUSEUP, MOUSEOUT, TOUCHSTART, TOUCHMOVE, TOUCHEND],
        
    // cached variables
    eventsLength = EVENTS.length;

    function addEvent(ctx, eventName) {
      ctx.content.addEventListener(eventName, function(evt) {
        ctx['_' + eventName](evt);
      }, false);
    }
    
    /**
     * Stage constructor.  A stage is used to contain multiple layers
     * @constructor
     * @augments Kinetic.Container
     * @param {Object} config
     * @param {String|DomElement} config.container Container id or DOM element
     * {{NodeParams}}
     * {{ContainerParams}}
     */
    Kinetic.Stage = function(config) {
        this._initStage(config);
    };

    Kinetic.Stage.prototype = {
        _initStage: function(config) {
            this.createAttrs();
            // call super constructor
            Kinetic.Container.call(this, config);
            this.nodeType = STAGE;
            this.dblClickWindow = 400;
            this._id = Kinetic.Global.idCounter++;
            this._buildDOM();
            this._bindContentEvents();
            Kinetic.Global.stages.push(this);
        },
        /**
         * set container dom element which contains the stage wrapper div element
         * @name setContainer
         * @methodOf Kinetic.Stage.prototype
         * @param {DomElement} container can pass in a dom element or id string
         */
        setContainer: function(container) {
            if( typeof container === STRING) {
                container = document.getElementById(container);
            }
            this.setAttr(CONTAINER, container);
        },
        draw: function() {
            // clear children layers
            var children = this.getChildren(), 
                len = children.length,
                n, layer;
            
            for(n = 0; n < len; n++) {
                layer = children[n];
                if (layer.getClearBeforeDraw()) {
                    layer.getCanvas().clear();
                    layer.getHitCanvas().clear();
                }
            }
          
            Kinetic.Node.prototype.draw.call(this);
        },
        /**
         * draw layer scene graphs
         * @name draw
         * @methodOf Kinetic.Stage.prototype
         */

        /**
         * draw layer hit graphs
         * @name drawHit
         * @methodOf Kinetic.Stage.prototype
         */

        /**
         * set height
         * @name setHeight
         * @methodOf Kinetic.Stage.prototype
         * @param {Number} height
         */
        setHeight: function(height) {
            Kinetic.Node.prototype.setHeight.call(this, height);
            this._resizeDOM();
        },
        /**
         * set width
         * @name setWidth
         * @methodOf Kinetic.Stage.prototype
         * @param {Number} width
         */
        setWidth: function(width) {
            Kinetic.Node.prototype.setWidth.call(this, width);
            this._resizeDOM();
        },
        /**
         * clear all layers
         * @name clear
         * @methodOf Kinetic.Stage.prototype
         */
        clear: function() {
            var layers = this.children,
                len = layers.length,
                n;
                
            for(n = 0; n < len; n++) {
                layers[n].clear();
            }
        },
        /**
         * remove stage
         */
        remove: function() {
            var content = this.content;
            Kinetic.Node.prototype.remove.call(this);

            if(content && Kinetic.Type._isInDocument(content)) {
                this.getContainer().removeChild(content);
            }
        },
        /**
         * get mouse position for desktop apps
         * @name getMousePosition
         * @methodOf Kinetic.Stage.prototype
         */
        getMousePosition: function() {
            return this.mousePos;
        },
        /**
         * get touch position for mobile apps
         * @name getTouchPosition
         * @methodOf Kinetic.Stage.prototype
         */
        getTouchPosition: function() {
            return this.touchPos;
        },
        /**
         * get pointer position which can be a touc position or mouse position
         * @name getPointerPosition
         * @methodOf Kinetic.Stage.prototype
         */
        getPointerPosition: function() {
            return this.getTouchPosition() || this.getMousePosition();
        },
        getStage: function() {
            return this;
        },
        /**
         * get stage content div element which has the
         *  the class name "kineticjs-content"
         * @name getContent
         * @methodOf Kinetic.Stage.prototype
         */
        getContent: function() {
            return this.content;
        },
        /**
         * Creates a composite data URL and requires a callback because the composite is generated asynchronously.
         * @name toDataURL
         * @methodOf Kinetic.Stage.prototype
         * @param {Object} config
         * @param {Function} config.callback function executed when the composite has completed
         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
         *  "image/png" is the default
         * @param {Number} [config.x] x position of canvas section
         * @param {Number} [config.y] y position of canvas section
         * @param {Number} [config.width] width of canvas section
         * @param {Number} [config.height] height of canvas section
         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
         *  is very high quality
         */
        toDataURL: function(config) {
            var config = config || {},
                mimeType = config.mimeType || null, 
                quality = config.quality || null, 
                x = config.x || 0, 
                y = config.y || 0, 
                canvas = new Kinetic.SceneCanvas({
                    width: config.width || this.getWidth(), 
                    height: config.height || this.getHeight(),
                    pixelRatio: 1
                }), 
                context = canvas.getContext(), 
                layers = this.children;

            if(x || y) {
                context.translate(-1 * x, -1 * y);
            }

            function drawLayer(n) {
                var layer = layers[n],
                    layerUrl = layer.toDataURL(),
                    imageObj = new Image();
                    
                imageObj.onload = function() {
                    context.drawImage(imageObj, 0, 0);

                    if(n < layers.length - 1) {
                        drawLayer(n + 1);
                    }
                    else {
                        config.callback(canvas.toDataURL(mimeType, quality));
                    }
                };
                imageObj.src = layerUrl;
            }
            drawLayer(0);
        },
        /**
         * converts stage into an image.
         * @name toImage
         * @methodOf Kinetic.Stage.prototype
         * @param {Object} config
         * @param {Function} config.callback function executed when the composite has completed
         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
         *  "image/png" is the default
         * @param {Number} [config.x] x position of canvas section
         * @param {Number} [config.y] y position of canvas section
         * @param {Number} [config.width] width of canvas section
         * @param {Number} [config.height] height of canvas section
         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
         *  is very high quality
         */
        toImage: function(config) {
            var cb = config.callback;

            config.callback = function(dataUrl) {
                Kinetic.Type._getImage(dataUrl, function(img) {
                    cb(img);
                });
            };
            this.toDataURL(config);
        },
        /**
         * get intersection object that contains shape and pixel data
         * @name getIntersection
         * @methodOf Kinetic.Stage.prototype
         * @param {Object} pos point object
         */
        getIntersection: function() {
            var pos = Kinetic.Type._getXY(Array.prototype.slice.call(arguments)),
                layers = this.getChildren(),
                len = layers.length,
                end = len - 1,
                n, obj;

            for(n = end; n >= 0; n--) {
                obj = layers[n].getIntersection(pos);
                if (obj) {
                    return obj;
                }
            }

            return null;
        },
        _resizeDOM: function() {
            if(this.content) {
                var width = this.getWidth(),
                    height = this.getHeight(),
                    layers = this.getChildren(),
                    len = layers.length,
                    n;

                // set content dimensions
                this.content.style.width = width + PX;
                this.content.style.height = height + PX;

                this.bufferCanvas.setSize(width, height, 1);
                this.hitCanvas.setSize(width, height);
                
                // set pointer defined layer dimensions
                for(n = 0; n < len; n++) {
                    layer = layers[n];
                    layer.getCanvas().setSize(width, height);
                    layer.hitCanvas.setSize(width, height);
                    layer.draw();
                }
            }
        },
        /**
         * add layer to stage
         * @param {Kinetic.Layer} layer
         */
        add: function(layer) {
            Kinetic.Container.prototype.add.call(this, layer);
            layer.canvas.setSize(this.attrs.width, this.attrs.height);
            layer.hitCanvas.setSize(this.attrs.width, this.attrs.height);

            // draw layer and append canvas to container
            layer.draw();
            this.content.appendChild(layer.canvas.element);
            
            // chainable
            return this;
        },
        getParent: function() {
            return null;
        },
        getLayer: function() {
            return null;
        },
        /**
         * get layers
         * @name getLayers
         * @methodOf Kinetic.Stage.prototype
         */
         getLayers: function() {
             return this.getChildren();
         },
        _setPointerPosition: function(evt) {
            if(!evt) {
                evt = window.event;
            }
            this._setMousePosition(evt);
            this._setTouchPosition(evt);
        },
        /**
         * begin listening for events by adding event handlers
         * to the container
         */
        _bindContentEvents: function() {
            var that = this,
                n;

            for (n = 0; n < eventsLength; n++) {
              addEvent(this, EVENTS[n]);
            }
        },
        _mouseout: function(evt) {
            this._setPointerPosition(evt);
            var go = Kinetic.Global,
                targetShape = this.targetShape;
                
            if(targetShape && !go.isDragging()) {
                targetShape._handleEvent(MOUSEOUT, evt);
                targetShape._handleEvent(MOUSELEAVE, evt);
                this.targetShape = null;
            }
            this.mousePos = undefined;
        },
        _mousemove: function(evt) {
            this._setPointerPosition(evt);
            var go = Kinetic.Global,
                dd = Kinetic.DD,
                obj = this.getIntersection(this.getPointerPosition()),
                shape;

            if(obj) {
                shape = obj.shape;
                if(shape) {
                    if(!go.isDragging() && obj.pixel[3] === 255 && (!this.targetShape || this.targetShape._id !== shape._id)) {
                        if(this.targetShape) {
                            this.targetShape._handleEvent(MOUSEOUT, evt, shape);
                            this.targetShape._handleEvent(MOUSELEAVE, evt, shape);
                        }
                        shape._handleEvent(MOUSEOVER, evt, this.targetShape);
                        shape._handleEvent(MOUSEENTER, evt, this.targetShape);
                        this.targetShape = shape;
                    }
                    else {
                        shape._handleEvent(MOUSEMOVE, evt);
                    }
                }
            }
            /*
             * if no shape was detected, clear target shape and try
             * to run mouseout from previous target shape
             */
            else if(this.targetShape && !go.isDragging()) {
                this.targetShape._handleEvent(MOUSEOUT, evt);
                this.targetShape._handleEvent(MOUSELEAVE, evt);
                this.targetShape = null;
            }

            if(dd) {
                dd._drag(evt);
            }
        },
        _mousedown: function(evt) {
            this._setPointerPosition(evt);
        	var go = Kinetic.Global,
        	    obj = this.getIntersection(this.getPointerPosition()), 
        	    shape;

            if(obj && obj.shape) {
                shape = obj.shape;
                this.clickStart = true;
                this.clickStartShape = shape;
                shape._handleEvent(MOUSEDOWN, evt);
            }

            //init stage drag and drop
            if(this.isDraggable() && !go.isDragReady()) {
                this.startDrag(evt);
            }
        },
        _mouseup: function(evt) {
            this._setPointerPosition(evt);
            var that = this, 
                go = Kinetic.Global, 
                obj = this.getIntersection(this.getPointerPosition()),
                shape;
                
            if(obj && obj.shape) {
                shape = obj.shape;
                shape._handleEvent(MOUSEUP, evt);

                // detect if click or double click occurred
                if(this.clickStart) {
                    /*
                     * if dragging and dropping, or if click doesn't map to 
                     * the correct shape, don't fire click or dbl click event
                     */
                    if(!go.isDragging() && shape._id === this.clickStartShape._id) {
                        shape._handleEvent(CLICK, evt);

                        if(this.inDoubleClickWindow) {
                            shape._handleEvent(DBL_CLICK, evt);
                        }
                        this.inDoubleClickWindow = true;
                        setTimeout(function() {
                            that.inDoubleClickWindow = false;
                        }, this.dblClickWindow);
                    }
                }
            }
            this.clickStart = false;
        },
        _touchstart: function(evt) {
          this._setPointerPosition(evt);
        	var go = Kinetic.Global,
        	    obj = this.getIntersection(this.getPointerPosition()), 
        	    shape;
            
            evt.preventDefault();

            if(obj && obj.shape) {
                shape = obj.shape;
                this.tapStart = true;
                this.tapStartShape = shape;
                shape._handleEvent(TOUCHSTART, evt);
            }

            //init stage drag and drop
            if(this.isDraggable() && !go.isDragReady()) {
                this.startDrag(evt);
            }
        },
        _touchend: function(evt) {
            this._setPointerPosition(evt);
            var that = this, 
                go = Kinetic.Global, 
                obj = this.getIntersection(this.getPointerPosition()),
                shape;

            if(obj && obj.shape) {
                shape = obj.shape;
                shape._handleEvent(TOUCHEND, evt);

                // detect if tap or double tap occurred
                if(this.tapStart) {
                    /*
                     * if dragging and dropping, don't fire tap or dbltap
                     * event
                     */
                    if(!go.isDragging() && shape._id === this.tapStartShape._id) {
                        shape._handleEvent(TAP, evt);

                        if(this.inDoubleClickWindow) {
                            shape._handleEvent(DBL_TAP, evt);
                        }
                        this.inDoubleClickWindow = true;
                        setTimeout(function() {
                            that.inDoubleClickWindow = false;
                        }, this.dblClickWindow);
                    }
                }
            }

            this.tapStart = false;
        },
        _touchmove: function(evt) {
            this._setPointerPosition(evt);
            var dd = Kinetic.DD,
                obj = this.getIntersection(this.getPointerPosition()),
                shape;
            
            evt.preventDefault();
            
            if(obj && obj.shape) {
                shape = obj.shape;
                shape._handleEvent(TOUCHMOVE, evt);
            }

            // start drag and drop
            if(dd) {
                dd._drag(evt);
            }
        },
        /**
         * set mouse positon for desktop apps
         * @param {Event} evt
         */
        _setMousePosition: function(evt) {
            var mouseX = evt.clientX - this._getContentPosition().left,
                mouseY = evt.clientY - this._getContentPosition().top;
                
            this.mousePos = {
                x: mouseX,
                y: mouseY
            };
        },
        /**
         * set touch position for mobile apps
         * @param {Event} evt
         */
        _setTouchPosition: function(evt) {
            var touch, touchX, touchY;
            
            if(evt.touches !== undefined && evt.touches.length === 1) {
                // one finger
                touch = evt.touches[0];
                
                // get the information for finger #1
                touchX = touch.clientX - this._getContentPosition().left;
                touchY = touch.clientY - this._getContentPosition().top;

                this.touchPos = {
                    x: touchX,
                    y: touchY
                };
            }
        },
        /**
         * get container position
         */
        _getContentPosition: function() {
            var rect = this.content.getBoundingClientRect();
            return {
                top: rect.top,
                left: rect.left
            };
        },
        /**
         * build dom
         */
        _buildDOM: function() {
            // content
            this.content = document.createElement(DIV);
            this.content.style.position = RELATIVE;
            this.content.style.display = INLINE_BLOCK;
            this.content.className = KINETICJS_CONTENT;
            this.attrs.container.appendChild(this.content);

            this.bufferCanvas = new Kinetic.SceneCanvas();
            this.hitCanvas = new Kinetic.HitCanvas();

            this._resizeDOM();
        },
        /**
         * bind event listener to container DOM element
         * @param {String} typesStr
         * @param {function} handler
         */
        _onContent: function(typesStr, handler) {
            var types = typesStr.split(SPACE),
                len = types.length,
                n, baseEvent;
                
            for(n = 0; n < len; n++) {
                baseEvent = types[n];
                this.content.addEventListener(baseEvent, handler, false);
            }
        }
    };
    Kinetic.Global.extend(Kinetic.Stage, Kinetic.Container);

    // add getters and setters
    Kinetic.Node.addGetter(Kinetic.Stage, 'container');

    /**
     * get container DOM element
     * @name getContainer
     * @methodOf Kinetic.Stage.prototype
     */
})();
