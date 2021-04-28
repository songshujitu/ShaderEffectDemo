function _loadImage(url,crossOrigin, callback) {
    var image = new Image();
    if (crossOrigin) {
        image.crossOrigin = crossOrigin;
    }

    var retries = 0;
    var maxRetries = 5;
    var retryTimeout;
    var retryRequests = true;
    image.onload = function () {
        callback(null, image);
    };

    image.onerror = function () {
        if (retryTimeout) return;

        if (retryRequests && ++retries <= maxRetries) {
            var retryDelay = Math.pow(2, retries) * 100;
            console.log("Error loading Texture from: '"+ url + "' - Retrying in " + retryDelay + "ms...");
            var idx = url.indexOf('?');
            var separator = idx >= 0 ? '&' : '?';

            retryTimeout = setTimeout(function () {
                image.src = url + separator + 'retry=' + Date.now();
                retryTimeout = null;
            }, retryDelay);
        } else {
            callback("Error loading Texture from: '" + url + "'");
        }
    };

    image.src = url;
}

function Plane(frame) {

    var width = frame.width || 1.0
    var height = frame.height || 1.0
    var widthSegments = frame.widthSegments || 1
    var heightSegments = frame.heightSegments || 1

    var buffdatas = []
    var normals = []
    var uvs = []


    var ix, iz

    frame.pivot = frame.pivot || {x:0.0,y:0.0};
    var halfWidth = width * frame.pivot.x
    var halfHeight = height * frame.pivot.y
    var gridX = widthSegments
    var gridZ = heightSegments

    var gridX1 = gridX + 1
    var gridZ1 = gridZ + 1

    var segWidth = width / gridX
    var segHeight = height / gridZ

    var x,y

    for (iz = 0; iz < gridZ1; iz++) {
        for (ix = 0; ix < gridX1; ix++) {

            x = ix * segWidth - halfWidth
            y = iz * segHeight - halfHeight

            buffdatas.push(x)
            buffdatas.push(-y)
            buffdatas.push(0)

            buffdatas.push(0)
            buffdatas.push(0)
            buffdatas.push(1)

            buffdatas.push(ix / gridX)
            buffdatas.push(1 - iz / gridZ)
        }
    }

    let indices = createIndices(gridX,gridZ)


    return [buffdatas,indices]
}


function createIndices(gridX,gridZ) {
    var indices = [], gridX1 = gridX + 1, gridZ1 = gridZ + 1
    let a, b, c, d, iz, ix

    for (iz = 0; iz < gridZ; iz++) {
        for (ix = 0; ix < gridX; ix++) {

            a = ix + gridX1 * iz
            b = ix + gridX1 * (iz + 1)
            c = (ix + 1) + gridX1 * (iz + 1)
            d = (ix + 1) + gridX1 * iz

            indices.push(a)
            indices.push(b)
            indices.push(c)
            indices.push(c)
            indices.push(d)
            indices.push(a)
        }
    }

    return indices
}
function TextureData(gl,pixels){
    var __pixels = pixels || null;
    var tex = gl.createTexture();
    var __channel = 0;
    return  {
        channel:function(_pixels,_channel,repeat){
            __pixels = _pixels;
            __channel = _channel;
            gl.activeTexture(gl.TEXTURE0 + __channel);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            if(repeat === true || repeat === 'repeat'){
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            }else{
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, _pixels.width, _pixels.height, 0, gl.RGBA,  gl.UNSIGNED_BYTE, _pixels.buffer);
            gl.bindTexture(gl.TEXTURE_2D, null);
        },
        rawchannel:function(_pixels,_channel,repeat){
            __pixels = _pixels;
            __channel = _channel;
            gl.activeTexture(gl.TEXTURE0 + __channel);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
           // gl.generateMipmap(gl.TEXTURE_2D);
            if(repeat === true || repeat === 'repeat'){
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            }else{
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,_pixels);
            gl.bindTexture(gl.TEXTURE_2D, null);
        },
        bind: function(){
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.activeTexture(gl.TEXTURE0 + __channel);
        },
        unbind: function() {
            __pixels = null;
            __channel = 0;
            gl.deleteTexture(tex);
            gl.bindTexture(gl.TEXTURE_2D, 0);
        },
        size:function() {
            return [ __pixels.width, __pixels.height];
        }
    }
}

function compileShader(gl, type, src) {
    var shader = gl.createShader(type)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var errLog = gl.getShaderInfoLog(shader)
        console.log(errLog)
        gl.deleteShader(shader);
    }
    return shader
}

function  createpixels(width,height,data){
    var buffer = new Uint8Array(data)

    return {
        buffer:buffer,
        width:width,
        height:height
    }
}
var defaultpixels = createpixels(1,1,[
    0,  0, 0,255,
])

function  shaderPrograme(gl,vs,fs){

    var vertSource =  vs
    var fragSource =  fs

    var vshader = compileShader(gl, gl.VERTEX_SHADER, vertSource)
    var fshader = compileShader(gl,gl.FRAGMENT_SHADER, fragSource)


    var program = gl.createProgram()
    gl.attachShader(program, vshader)
    gl.attachShader(program, fshader)
    gl.linkProgram(program)

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {

        var errLog = gl.getProgramInfoLog(program)
        gl.deleteProgram(program);
        throw new Error(errLog, 'Error linking program: ' + errLog)
    }




    return {
        program:program
    }
}



const Events   = ({
    attach:function(target) {
        let ev = Events;
        target.on = ev.on;
        target.off = ev.off;
        target.fire = ev.fire;
        target.once = ev.once;
        target.hasEvent = ev.hasEvent;
        target._callbackActive = { };
        return target;
    },
    on:function(name, callback, scope) {
        if (! name || typeof(name) !== 'string' || ! callback)
            return this;

        if (! this._callbacks)
            this._callbacks = { };

        if (! this._callbacks[name])
            this._callbacks[name] = [ ];

        if (! this._callbackActive)
            this._callbackActive = { };

        if (this._callbackActive[name] && this._callbackActive[name] === this._callbacks[name])
            this._callbackActive[name] = this._callbackActive[name].slice();

        this._callbacks[name].push({
            callback: callback,
            scope: scope || this
        });

        return this;
    },
    off:function(name, callback, scope) {
        if (! this._callbacks)
            return this;

        if (this._callbackActive) {
            if (name) {
                if (this._callbackActive[name] && this._callbackActive[name] === this._callbacks[name])
                    this._callbackActive[name] = this._callbackActive[name].slice();
            } else {
                for (let key in this._callbackActive) {
                    if (! this._callbacks[key])
                        continue;

                    if (this._callbacks[key] !== this._callbackActive[key])
                        continue;

                    this._callbackActive[key] = this._callbackActive[key].slice();
                }
            }
        }

        if (! name) {
            this._callbacks = null;
        } else if (! callback) {
            if (this._callbacks[name])
                delete this._callbacks[name];
        } else {
            let events = this._callbacks[name];
            if (! events)
                return this;

            let i = events.length;

            while (i--) {
                if (events[i].callback !== callback)
                    continue;

                if (scope && events[i].scope !== scope)
                    continue;

                events.splice(i, 1);
            }
        }

        return this;
    },
    fire:function(name, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        if (! name || ! this._callbacks || ! this._callbacks[name])
            return this;

        let callbacks;

        if (! this._callbackActive)
            this._callbackActive = { };

        if (! this._callbackActive[name]) {
            this._callbackActive[name] = this._callbacks[name];
        } else {
            if (this._callbackActive[name] === this._callbacks[name])
                this._callbackActive[name] = this._callbackActive[name].slice();

            callbacks = this._callbacks[name].slice();
        }

        for (let i = 0; (callbacks || this._callbackActive[name]) && (i < (callbacks || this._callbackActive[name]).length); i++) {
            let evt = (callbacks || this._callbackActive[name])[i];
            evt.callback.call(evt.scope, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);

            if (evt.callback.once) {
                let ind = this._callbacks[name].indexOf(evt);
                if (ind !== -1) {
                    if (this._callbackActive[name] === this._callbacks[name])
                        this._callbackActive[name] = this._callbackActive[name].slice();

                    this._callbacks[name].splice(ind, 1);
                }
            }
        }

        if (! callbacks)
            this._callbackActive[name] = null;

        return this;
    },
    once:function(name, callback, scope) {
        callback.once = true;
        this.on(name, callback, scope);
        return this;
    },
    hasEvent:function(name) {
        return (this._callbacks && this._callbacks[name] && this._callbacks[name].length !== 0) || false;
    }
});

var  now = (!window.performance || !window.performance.now || !window.performance.timing)? Date.now :  () => window.performance.now();

function  clamp(value, min, max) {
    if (value >= max) return max;
    if (value <= min) return min;
    return value;
}

let lastTime = now();
const ONE_FRAME_TIME = 16;

function _requestAnimationFrame(callback) {
    if (typeof callback !== 'function'){
        throw new TypeError('is not a function');
    }
    const currentTime = now();
    let delay = ONE_FRAME_TIME + lastTime - currentTime;
    if (delay < 0) delay = 0;
    lastTime = currentTime;
    return setTimeout(function(){
        lastTime = now();
        callback(now());
    }, delay);
}

function _cancelAnimationFrame(id){
    clearTimeout(id);
}

var onFrame = (typeof window !== "undefined") && (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    _requestAnimationFrame
);

var offFrame = (typeof window !== "undefined") && (
    window.cancelAnimationFrame ||
    window.cancelRequestAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.mozCancelRequestAnimationFrame ||
    window.oCancelRequestAnimationFrame ||
    window.msCancelRequestAnimationFrame ||
    _cancelAnimationFrame
);

function makeTick(_ticker) {
    let _frameEndData = {};
    return function (timestamp) {
        if (_ticker.stoping) {
            return;
        }
        let _now = timestamp || now();
        let ms = _now - (_ticker._time || _now);
        let dt = ms / 1000.0;
        dt = clamp(dt, 0, _ticker.maxDeltaTime);
        dt *= _ticker.timeScale;
        _ticker._time = _now;
        _ticker.tickId = onFrame(_ticker.tick);

        _ticker.update(dt);

        if (_ticker.autoRender || _ticker.renderNextFrame) {
            _ticker.fire("renderscene", dt);
            _ticker.renderNextFrame = false;
        }

        _frameEndData.timestamp = now();
        _frameEndData.target = _ticker;

        _ticker.fire("frameend", _frameEndData);
    };
}


function Ticker() {
    Events.attach(this);
    this.tick = makeTick(this);
    this.autoRender = true;
    this.renderNextFrame = false;
    this.maxDeltaTime = 0.1;
    this._time = 0;
    this.timeScale = 1;


    this.update = function(dt){
        this.fire("update", dt);
    };

    this.start = function(){
        this.fire("start", {timestamp: now(), target: this});
        this.fire("initialize");
        this.fire("postinitialize");
        if(this.tick == null) {
            this.tick = makeTick(this);
        }
        this.tick();
    };

    this.destroy = function() {
        offFrame(this.tickId);
        this.tick = null;
    };
    this.stop = function() {
        this.stoping = true;
    };
    this.resume = function() {
        this.stoping = false;
    };
}


var ticker = new Ticker();


//#icon1-webgl-canvas

function renderIconEffect1(canvas){
    var glcanvas = canvas;
    var gl = glcanvas.getContext('webgl',{antialias:true,alpha: true,premultipliedAlpha: true});
    if(!gl) return;

//USE gl.UNSIGNED_INT
    var ext = gl.getExtension('OES_element_index_uint');

    gl.viewport(0, 0, glcanvas.width, glcanvas.height);
    gl.enable(gl.DEPTH_TEST);

    gl.clearStencil(gl.STENCIL_BUFFER_BIT);
    gl.clearColor(0,0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendEquation(gl.FUNC_ADD);
   // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var vs = `attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;
uniform vec2 uResolution;
uniform vec2 uSize;
uniform vec4 uxTime;
varying vec2 vUV;
varying vec3 vNormal;
void main() {

      vec2 zeroToOne = aPosition.xy / uResolution;
      vec2 clipSpace = zeroToOne * 2.0  - 1.0;
      
      vec4 pos = vec4(clipSpace * vec2(1, -1), 0, 1);
    
      gl_Position = pos;

      vUV = aUV * 2.0 - 1.0;
      vUV.x = vUV.x + 0.02 * sin(uxTime.y);
      vUV.y = vUV.y + 0.01 * sin(uxTime.y);
      vNormal = aNormal;
}`;

    var fs = `
precision mediump float;
uniform sampler2D iChannel0; //root
uniform sampler2D iChannel1; //ball
uniform sampler2D iChannel2; //flow
uniform sampler2D iChannel3; //remap
uniform sampler2D iChannel4; //plante
uniform sampler2D iChannel5; //ballflowmask
uniform sampler2D iChannel6; //kanji
//uniform sampler2D iChannel7; //glowBall
uniform vec4 uTime;
varying vec2 vUV;
varying vec3 vNormal;

vec2 rotate(vec2 uv, vec4 param,float time){
 float cosx = cos(param.z + param.w * time);
 float sinx = sin(param.z + param.w * time);
 mat2 m2 = mat2(cosx, sinx, -sinx, cosx);
 return m2 * (uv.xy - param.xy) + param.xy;
}

vec2 minmax(vec2 uv){
 return  vec2(uv.x > 0. ?( mod(uv.x,(1.+0.))) : (1.+0.) - mod(abs(uv.x),(1.+0.)),
                    uv.y > 0. ?( mod(uv.y,(1.+0.))) : (1.+0.) - mod(abs(uv.y),(1.+0.)));
}
bool discard_uv(vec2 uv,vec2 uv_orign){
 bool discard_uv = false;
 if(uv.x > 1. || uv.y > 1.)
  discard_uv = true;
 if(uv_orign.x < 0.)
  discard_uv = true;
 if(uv_orign.x > 1.)
  discard_uv = true;
 if(uv_orign.y < 0.)
  discard_uv = true;
 if(uv_orign.y > 1.)
  discard_uv = true;
 return discard_uv;
}


void main() {
    vec2 uv = vUV;

    vec4 rootcolor = texture2D(iChannel0,uv);

    vec2  uv_remap4 = uv;

    float uv_remap4A = texture2D(iChannel3,uv_remap4).b * texture2D(iChannel3,uv_remap4).a;
    vec4 color_remap4 = texture2D(iChannel3,uv_remap4);
    if(color_remap4.b >= 0.5)
    color_remap4 = vec4(0.,color_remap4.gba);



    vec4 mask1color = texture2D(iChannel4,uv);
      color_remap4.a = color_remap4.a * mask1color.a;


    vec2  plantebguv = uv;
    plantebguv = color_remap4.rg;
    plantebguv = plantebguv-vec2(0.5,0.5);
    plantebguv = plantebguv+vec2(-0.3486328,0.006835938) * uTime.y ;
    plantebguv = plantebguv+vec2(0.5,0.5);



    vec2 oringuv = plantebguv;
    plantebguv = minmax(oringuv);

    bool discard_plantuv = false;
    if(plantebguv.x > 1. || plantebguv.y > 1.)
    discard_plantuv = true;


   // vec4 color_plantebg = texture2D(iChannel7,plantebguv);
    //if(discard_plantuv == true) color_plantebg = vec4(0.,0.,0.,0.);

    //color_plantebg = vec4(color_plantebg.rgb,color_plantebg.a * color_remap4.a);
    vec4 result = vec4(0.0); //

    vec2 flowuv = uv;
    flowuv -= vec2(0.5);

    flowuv += vec2(0.03515625,-0.0009765625);
    flowuv +=   vec2(0.005859375,-0.2929688) * uTime.y;
    flowuv /= vec2(1.162582,1.19222);
    flowuv += vec2(0.5);
    vec2 oringflowuvuv = flowuv;
    flowuv = minmax(oringflowuvuv);
    bool discard_flowuv = false;
    if(flowuv.x > 1. || flowuv.y > 1.)
       discard_flowuv = true;

    vec4 flowcolor = texture2D(iChannel2,flowuv);
    vec4 ballmask = texture2D(iChannel5,uv);

    flowcolor = vec4(flowcolor.rgb * flowcolor.a * ballmask.r,1.0);
    vec2 flowcoloruv = -(flowcolor.r*vec2(-0.02929688,0.046875) + flowcolor.g*vec2(0.07617188,0.02734375) + flowcolor.b*vec2(0.,0.) +  flowcolor.a*vec2(0.,0.));

    vec2 balluv = uv;
    balluv -=  vec2(0.5);
    balluv = balluv+vec2(0.01464844,0.06347668);
    balluv = balluv/vec2(0.8144531,0.8554688);
    balluv +=  vec2(0.5);

    vec2 balluv_orign = balluv + flowcoloruv;

    balluv = minmax(balluv_orign);


    bool discard_balluv = discard_uv(balluv,balluv_orign);

    vec4 ballcolor = texture2D(iChannel1,balluv);

    if(discard_balluv == true) ballcolor = vec4(0.);



    vec2 kanjiuv = uv;
    kanjiuv -=  vec2(0.5);
    kanjiuv = kanjiuv+vec2(0.02050781,0.02246094);
    kanjiuv = kanjiuv/vec2(0.5507813,0.5507813);
    kanjiuv +=  vec2(0.5);
    
    
    kanjiuv.x = kanjiuv.x + sin(uTime.y) * 0.04;
    vec2 kanjiuv_orign = kanjiuv;

    kanjiuv = minmax(kanjiuv_orign);


    bool discard_kanjiuv = discard_uv(kanjiuv,kanjiuv_orign);
    
    vec4 kanjicolor = texture2D(iChannel6,kanjiuv);
    if(discard_kanjiuv == true) kanjicolor = vec4(0.);


      result = mix(result,vec4(rootcolor.rgb * 1.0,1.) ,rootcolor.a);
      result = mix(result,vec4( ballcolor.rgb,1.) , ballcolor.a);
      result = mix(result,vec4(mask1color.rgb ,1.) ,mask1color.a);
      result = mix(result,vec4(kanjicolor.rgb * 1.0,1.) ,kanjicolor.a);
    
      gl_FragColor = result;
    }`;
    var shader = shaderPrograme(gl,vs,fs);
    gl.useProgram(shader.program);

    var program = shader.program;
    var aPosition = gl.getAttribLocation(program, "aPosition");
    var aNormal = gl.getAttribLocation(program, "aNormal");
    var aUV = gl.getAttribLocation(program, "aUV");
    var uResolution = gl.getUniformLocation(program, "uResolution");
    var uSize = gl.getUniformLocation(program, "uSize");
    var uTime = gl.getUniformLocation(program, "uTime");
    var uxTime = gl.getUniformLocation(program, "uxTime");
    var plane = Plane({width:88 * 2,height:88 * 2,pivot:{x:0.5,y:0.5}});
    var buffers = plane[0];
    var indices = plane[1];





    var rawBuffer = gl.createBuffer();
    var buffferTypedata = new Float32Array(buffers);
    gl.bindBuffer(gl.ARRAY_BUFFER, rawBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,buffferTypedata , gl.STATIC_DRAW);



    var indexBuffer = gl.createBuffer();
    indexBuffer.numItems = indices.length;
    indexBuffer.typeArray = new Uint16Array(indices);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indexBuffer.typeArray,gl.STATIC_DRAW)


    gl.bindBuffer(gl.ARRAY_BUFFER, rawBuffer);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 8 * buffferTypedata.BYTES_PER_ELEMENT, 0 * buffferTypedata.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(aPosition);

    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 8 * buffferTypedata.BYTES_PER_ELEMENT, 3 * buffferTypedata.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(aNormal);

    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false,8 * buffferTypedata.BYTES_PER_ELEMENT, 6 * buffferTypedata.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(aUV);



    function texsource(src){
        return new Promise(function(resolve){
            _loadImage(src,'*',function(error,rawimg){
                if(!error) {
                    resolve(rawimg);
                }
            });
        })
    }



    var mainfest = {
        'hoshi':'https://p437.ssl.qhimgs4.com/t01bd491c283aeeca8b.png',
        'ball2':'https://p437.ssl.qhimgs4.com/t01b94caa99c2dc3bd0.png',
        'wave2':'https://p437.ssl.qhimgs4.com/t01691c2e6b62d5a0b2.png',
        'effect2_remap4':'https://p437.ssl.qhimgs4.com/t018252b128299299a8.png',
        'plante':'https://p437.ssl.qhimgs4.com/t01612549f0c78306f1.png',
        'ballmask': 'https://p437.ssl.qhimgs4.com/t01253d6630996c9e64.png',
        'kanji':'https://p437.ssl.qhimgs4.com/t017ca5c75cfdebf723.png'
    };
    Promise.all([texsource(mainfest.hoshi),texsource(mainfest.ball2),texsource(mainfest.wave2),
        texsource(mainfest.effect2_remap4), texsource(mainfest.plante),texsource(mainfest.ballmask),
        texsource(mainfest.kanji)])
        .then(function([rawimg0,rawimg1,rawimg2,rawimg3,rawimg4,rawimg5,rawimg6]){


            var iChannel0 = gl.getUniformLocation(program, "iChannel0");
            var iChannel0Tex = new TextureData(gl);
            iChannel0Tex.rawchannel(rawimg0,0);
            iChannel0Tex.bind(0);
            gl.uniform1i(iChannel0, 0);



            var iChannel1 = gl.getUniformLocation(program, "iChannel1");
            var iChannel1Tex = new TextureData(gl);
            iChannel1Tex.rawchannel(rawimg1,1);
            iChannel1Tex.bind(1);
            gl.uniform1i(iChannel1, 1);

            var iChannel2 = gl.getUniformLocation(program, "iChannel2");
            var iChannel2Tex = new TextureData(gl);
            iChannel2Tex.rawchannel(rawimg2,2,'repeat');
            iChannel2Tex.bind(2);
            gl.uniform1i(iChannel2, 2);


            var iChannel3 = gl.getUniformLocation(program, "iChannel3");
            var iChannel3Tex = new TextureData(gl);
            iChannel3Tex.rawchannel(rawimg3,3,'repeat');
            iChannel3Tex.bind(3);
            gl.uniform1i(iChannel3, 3);



            var iChannel4 = gl.getUniformLocation(program, "iChannel4");
            var iChannel4Tex = new TextureData(gl);
            iChannel4Tex.rawchannel(rawimg4,4);
            iChannel4Tex.bind(4);
            gl.uniform1i(iChannel4, 4);



            var iChannel5 = gl.getUniformLocation(program, "iChannel5");
            var iChannel5Tex = new TextureData(gl);
            iChannel5Tex.rawchannel(rawimg5,5);
            iChannel5Tex.bind(5);
            gl.uniform1i(iChannel5, 5);



            var iChannel6 = gl.getUniformLocation(program, "iChannel6");
            var iChannel6Tex = new TextureData(gl);
            iChannel6Tex.rawchannel(rawimg6,6);
            iChannel6Tex.bind(6);
            gl.uniform1i(iChannel6, 6);



            // var iChannel7 = gl.getUniformLocation(program, "iChannel7");
            // var iChannel7Tex = new TextureData(gl);
            // iChannel7Tex.rawchannel(rawimg7,7);
            // iChannel7Tex.bind(7);
            // gl.uniform1i(iChannel7, 7);


            var channelsize = iChannel0Tex.size();
            gl.uniform2fv(uSize,[channelsize[0],channelsize[1]]);
            gl.uniform2fv(uResolution,[glcanvas.width,glcanvas.height]);
           // gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT,0);

            ticker.resume();
            ticker.start();
        })




    var time = 0.,cutoff = 0;



    ticker.on('update',function(dt){
        time += dt * 2;
        time = time % 1000;

        cutoff += dt/1.5;
        gl.uniform4fv(uTime,[time,time,time,time]);
        gl.uniform4fv(uxTime,[time,time,time,time]);

        gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT,0);

    });


}

function disposeIconEffect1(){
     ticker.stop();
}

