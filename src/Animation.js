(function() {
    /**
     * Animation constructor.  A stage is used to contain multiple layers and handle
     * @constructor
     * @param {Function} func function executed on each animation frame
     * @param {Kinetic.Layer|Array} [layers] layer(s) to be redrawn.&nbsp; Can be a layer, an array of layers, or null.  Not specifying a node will result in no redraw.
     */
    Kinetic.Animation = function(func, layers) {
        this.func = func;
        this.setLayers(layers);
        this.id = Kinetic.Animation.animIdCounter++;
        this.frame = {
            time: 0,
            timeDiff: 0,
            lastTime: new Date().getTime()
        };
    };
    /*
     * Animation methods
     */
    Kinetic.Animation.prototype = {
        /**
         * set layers to be redrawn on each animation frame
         * @name setLayers
         * @methodOf Kinetic.Animation.prototype
         * @param {Kinetic.Layer|Array} [layers] layer(s) to be redrawn.&nbsp; Can be a layer, an array of layers, or null.  Not specifying a node will result in no redraw.
         */
        setLayers: function(layers) {
            var lays = []; 
            // if passing in no layers
            if (!layers) {
                lays = null;
            }
            // if passing in an array of Layers
            else if (Kinetic.Type._isArray(layers)) {
                lays = layers;
            }
            // if passing in a Layer
            else {
                lays = [layers];
            }

            this.layers = lays;
        },
        /**
         * get layers
         * @name getLayers
         * @methodOf Kinetic.Animation.prototype
         */
        getLayers: function() {
            return this.layers;
        },
        /**
         * add layer.  Returns true if the layer was added, and false if it was not
         * @name addLayer
         * @methodOf Kinetic.Animation.prototype
         * @param {Kinetic.Layer} layer
         */
        addLayer: function(layer) {
            var layers = this.layers,
                len, n;

            if (layers) {
                len = layers.length;

                // don't add the layer if it already exists
                for (n = 0; n < len; n++) {
                    if (layers[n]._id === layer._id) {
                        return false; 
                    } 
                } 
            }
            else {
                this.layers = [];
            }

            this.layers.push(layer);
            return true;
        },
        /**
         * determine if animation is running or not.  returns true or false
         * @name isRunning
         * @methodOf Kinetic.Animation.prototype
         */
        isRunning: function() {
            var a = Kinetic.Animation, animations = a.animations;
            for(var n = 0; n < animations.length; n++) {
                if(animations[n].id === this.id) {
                    return true;
                }
            }
            return false;
        },
        /**
         * start animation
         * @name start
         * @methodOf Kinetic.Animation.prototype
         */
        start: function() {
            this.stop();
            this.frame.timeDiff = 0;
            this.frame.lastTime = new Date().getTime();
            Kinetic.Animation._addAnimation(this);
        },
        /**
         * stop animation
         * @name stop
         * @methodOf Kinetic.Animation.prototype
         */
        stop: function() {
            Kinetic.Animation._removeAnimation(this);
        },
        _updateFrameObject: function(time) {
            this.frame.timeDiff = time - this.frame.lastTime;
            this.frame.lastTime = time;
            this.frame.time += this.frame.timeDiff;
            this.frame.frameRate = 1000 / this.frame.timeDiff;
        }
    };
    Kinetic.Animation.animations = [];
    Kinetic.Animation.animIdCounter = 0;
    Kinetic.Animation.animRunning = false;



    Kinetic.Animation._addAnimation = function(anim) {
        this.animations.push(anim);
        this._handleAnimation();
    };
    Kinetic.Animation._removeAnimation = function(anim) {
        var id = anim.id, animations = this.animations, len = animations.length;
        for(var n = 0; n < len; n++) {
            if(animations[n].id === id) {
                this.animations.splice(n, 1);
                break;
            }
        }
    };

    Kinetic.Animation._runFrames = function() {
        var layerHash = {}, 
            animations = this.animations,
            len = animations.length,
            anim, layers, func, n, i, layersLen, layer, key;
        /*
         * loop through all animations and execute animation
         *  function.  if the animation object has specified node,
         *  we can add the node to the nodes hash to eliminate
         *  drawing the same node multiple times.  The node property
         *  can be the stage itself or a layer
         */
        /*
         * WARNING: don't cache animations.length because it could change while
         * the for loop is running, causing a JS error
         */
        for(n = 0; n < len; n++) {
            anim = animations[n];
            layers = anim.layers; 
            func = anim.func;

            anim._updateFrameObject(new Date().getTime());

            if (layers) {
                layersLen = layers.length;

                for (i=0; i<layersLen; i++) {
                    layer = layers[i]
                    if(layer._id !== undefined) {
                        layerHash[layer._id] = layer;
                    }
                    // if animation object has a function, execute it
                    if(func) {
                        func.call(anim, anim.frame);
                    }
                }
            }
        }

        for(key in layerHash) {
            layerHash[key].draw();
        }
    };
    Kinetic.Animation._animationLoop = function() {
        var that = this;
        if(this.animations.length > 0) {
            this._runFrames();
            Kinetic.Animation.requestAnimFrame(function() {
                that._animationLoop();
            });
        }
        else {
            this.animRunning = false;
        }
    };
    Kinetic.Animation._handleAnimation = function() {
        var that = this;
        if(!this.animRunning) {
            this.animRunning = true;
            that._animationLoop();
        }
    };
    RAF = (function() {
        return window.requestAnimationFrame 
            || window.webkitRequestAnimationFrame 
            || window.mozRequestAnimationFrame 
            || window.oRequestAnimationFrame 
            || window.msRequestAnimationFrame 
            || Kinetic.Animation.fixedRequestAnimFrame;
    })();

    function FRAF(callback) {
        window.setTimeout(callback, 1000 / 60);
    }

    Kinetic.Animation.requestAnimFrame = function(callback) {
        var raf = Kinetic.DD && Kinetic.DD.isDragging ? FRAF : RAF;
        raf(callback);
    };
    
    var moveTo = Kinetic.Node.prototype.moveTo;
    Kinetic.Node.prototype.moveTo = function(container) {
    	moveTo.call(this, container);
    };

})();
