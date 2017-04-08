/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* global THREE, AFRAME  */
	var cylinderTexture = __webpack_require__(1);
	var parabolicCurve = __webpack_require__(2);
	var RayCurve = __webpack_require__(3);
	var TrailRenderer = __webpack_require__(4);

	if (typeof AFRAME === 'undefined') {
	  throw new Error('Component attempted to register before AFRAME was available.');
	}

	/* global AFRAME */
	var utils = AFRAME.utils;

	/**
	 * Spawn bullets on an event.
	 * Default schema optimized for Vive controllers.
	 */
	AFRAME.registerComponent('shoot', {
	  schema: {
	    direction: {type: 'vec3', default: {x: 0, y: -2, z: -1}},  // Event to fire bullet.
	    on: {default: 'triggerdown'},  // Event to fire bullet.
	    spaceKeyEnabled: {default: false},  // Keyboard support.
	    weapon: {default: 'default'}  // Weapon definition.
	  },

	  init: function () {
	    var data = this.data;
	    var el = this.el;
	    var self = this;

	    this.coolingDown = false;  // Limit fire rate.
	    this.shoot = this.shoot.bind(this);
	    this.weapon = null;

	    // Add event listener.
	    if (data.on) { el.addEventListener(data.on, this.shoot); }

	    // Add keyboard listener.
	    if (data.spaceKeyEnabled) {
	      window.addEventListener('keydown', function (evt) {
	        if (evt.code === 'Space' || evt.keyCode === '32') { self.shoot(); }
	      });
	    }

	   // if (AFRAME.utils.isMobile())
	    {
	      window.addEventListener('click', function (evt) {
	        self.shoot();
	      });
	    }
	  },

	  update: function (oldData) {
	  },

	  shoot: (function () {
	    var direction = new THREE.Vector3();
	    var position = new THREE.Vector3();
	    var quaternion = new THREE.Quaternion();
	    var scale = new THREE.Vector3();
	    var translation = new THREE.Vector3();

	    return function () {
	      var bulletEntity;
	      var el = this.el;
	      var data = this.data;
	      var inc;
	      var matrixWorld;
	      var self = this;
	      var weapon = this.weapon;

	      // Get firing entity's transformations.
	      matrixWorld = el.object3D.matrixWorld;
	      position.setFromMatrixPosition(matrixWorld);
	      matrixWorld.decompose(translation, quaternion, scale);

	      // Set projectile direction.
	      direction.set(data.direction.x, data.direction.y, data.direction.z);
	      direction.applyQuaternion(quaternion);
	      direction.normalize();

	      inc = new THREE.Vector3(0.0, -0.23, -0.15);
	      inc.applyQuaternion(quaternion);
	      position.add(inc);

	    };
	  })()
	});


	AFRAME.registerComponent('velocity-trail', {

	  schema: {

	  },

	  init: function() {
	    this.TrailTypes = Object.freeze(
	    {
	      Basic : 1,
	      Textured : 2
	    } );

	    this.TrailShapes = Object.freeze(
	    {
	      Plane : 1,
	      Star : 2,
	      Circle : 3
	    } );

	    this.options = {

	       headRed : 1.0,
	       headGreen : 0.0,
	       headBlue : 0.0,
	       headAlpha : 0.75,

	       tailRed : 0.0,
	       tailGreen : 1.0,
	       tailBlue : 1.0,
	       tailAlpha : 0.35,

	       trailLength : 30,
	       trailType : this.TrailTypes.Basic,
	       trailShape : this.TrailShapes.Circle,

	       textureTileFactorS : 10.0,
	       textureTileFactorT : 0.8,

	       dragTexture : false,
	       depthWrite : false,

	       pauseSim : false
	     };

	     this.trailTarget = null;
	     this.lastTrailUpdateTime = performance.now();
	     this.lastTrailResetTime = performance.now();

	  },

	  update: function() {

	    var scene, gui, renderer, clock;
	    var camera, pointLight, ambientLight, controls, stats;

	    var options = this.options;
	    var TrailTypes = this.TrailTypes;
	    var TrailShapes = this.TrailShapes;

	    var starPoints, circlePoints, planePoints;
	    var trailHeadGeometry;
	    var trailMaterial, baseTrailMaterial, texturedTrailMaterial;

	    simulationPause = false;
	    clock = new THREE.Clock();


	       // init trail head geometries

	       planePoints = [];
	       planePoints.push( new THREE.Vector3( -14.0, 4.0, 0.0 ), new THREE.Vector3( 0.0, 4.0, 0.0 ), new THREE.Vector3( 14.0, 4.0, 0.0 ) );

	       circlePoints = [];
	       var twoPI = Math.PI * 2;
	       var index = 0;
	       var scale = 0.75;
	       var inc = twoPI / 32.0;

	       for ( var i = 0; i <= twoPI + inc; i+= inc )  {

	         var vector = new THREE.Vector3();
	         vector.set( Math.cos( i ) * scale, Math.sin( i ) * scale, 0 );
	         circlePoints[ index ] = vector;
	         index ++;

	       }

	       starPoints = [];
	       starPoints.push( new THREE.Vector3 (  0,  16 ) );
	       starPoints.push( new THREE.Vector3 (  4,  4 ) );
	       starPoints.push( new THREE.Vector3 (  16,  4 ) );
	       starPoints.push( new THREE.Vector3 (  8, -4 ) );
	       starPoints.push( new THREE.Vector3 (  12, -16 ) );
	       starPoints.push( new THREE.Vector3 (   0, -8 ) );
	       starPoints.push( new THREE.Vector3 ( -12, -16 ) );
	       starPoints.push( new THREE.Vector3 ( -8, -4 ) );
	       starPoints.push( new THREE.Vector3 ( -16,  4 ) );
	       starPoints.push( new THREE.Vector3 ( -4,  4 ) );
	       starPoints.push( new THREE.Vector3 (  0,  16 ) );

	       // init trail target

	       this.trailTarget = this.el.object3D;

	        // init trail renderers

	        trail = new THREE.TrailRenderer( scene, false );

	        baseTrailMaterial = THREE.TrailRenderer.createBaseMaterial();

	        var textureLoader = new THREE.TextureLoader();
	        textureLoader.load( "textures/sparkle4.jpg", function( tex ) {

	          tex.wrapS = THREE.RepeatWrapping;
	          tex.wrapT = THREE.RepeatWrapping;

	            texturedTrailMaterial = THREE.TrailRenderer.createTexturedMaterial();
	          texturedTrailMaterial.uniforms.texture.value = tex;

	        });


	       // set trail shape options
	       switch ( options.trailShape ) {

	         case TrailShapes.Plane:

	           trailHeadGeometry = planePoints;

	         break;
	         case TrailShapes.Star:

	           trailHeadGeometry = starPoints;

	         break;
	         case TrailShapes.Circle:

	           trailHeadGeometry = circlePoints;

	         break;

	       }

	       // set trail type
	       switch ( options.trailType ) {

	         case TrailTypes.Basic:

	           trailMaterial = baseTrailMaterial;

	         break;
	         case TrailTypes.Textured:

	           trailMaterial = texturedTrailMaterial;


	         break;

	       }

	       // initialize trail

	       trail.initialize( trailMaterial, Math.floor(options.trailLength), options.dragTexture ? 1.0 : 0.0, 0, trailHeadGeometry, this.trailTarget );

	       //updateTrailColors();

	       trailMaterial.uniforms.headColor.value.set( options.headRed, options.headGreen, options.headBlue, options.headAlpha );
	       trailMaterial.uniforms.tailColor.value.set( options.tailRed, options.tailGreen, options.tailBlue, options.tailAlpha );

	       // updateTrailTextureTileSize();

	       trailMaterial.uniforms.textureTileFactor.value.set( options.textureTileFactorS, options.textureTileFactorT );

	       // updateTrailDepthWrite();

	       trailMaterial.depthWrite = options.depthWrite;

	       trail.activate();
	    },

	    tick: function() {
	        var time = performance.now();

	        if ( ! this.options.pauseSim )
	        {
	          var tempQuaternion = new THREE.Quaternion();

	          var baseForward = new THREE.Vector3( 0, 0, -1 );
	          var tempForward = new THREE.Vector3();
	          var tempUp = new THREE.Vector3();

	          var tempRotationMatrix= new THREE.Matrix4();
	          var tempTranslationMatrix= new THREE.Matrix4();

	          var currentTargetPosition = new THREE.Vector3();
	          var lastTargetPosition = new THREE.Vector3();

	          var currentDirection = new THREE.Vector3();
	          var lastDirection= new THREE.Vector3();

	          var lastRotationMatrix = new THREE.Matrix4();
	          if ( time - this.lastTrailUpdateTime > 10 ) {

	            trail.advance();
	            this.lastTrailUpdateTime = time;

	          } else {

	            trail.updateHead();

	          }

	          /*if ( time - lastTrailResetTime > 2000 ) {

	            trail.reset();
	            lastTrailResetTime = time;

	          }*/

	          tempRotationMatrix.identity();
	          tempTranslationMatrix.identity();

	          var scaledTime = time * .001;
	          var areaScale = 100;

	          lastTargetPosition.copy( currentTargetPosition );

	          currentTargetPosition.x = Math.sin( scaledTime ) * areaScale;
	          currentTargetPosition.y = Math.sin( scaledTime * 1.1 ) * areaScale;
	          currentTargetPosition.z = Math.sin( scaledTime * 1.6 ) * areaScale;

	          lastDirection.copy( currentDirection );

	          currentDirection.copy( currentTargetPosition );
	          currentDirection.sub( lastTargetPosition );
	          currentDirection.normalize();

	          tempUp.crossVectors( currentDirection, baseForward );
	          var angle = baseForward.angleTo( currentDirection );

	          if( Math.abs( angle ) > .01 && tempUp.lengthSq() > .001 ) {

	            tempQuaternion.setFromUnitVectors( baseForward, currentDirection );
	            tempQuaternion.normalize();
	            tempRotationMatrix.makeRotationFromQuaternion( tempQuaternion );
	            lastRotationMatrix.copy( tempRotationMatrix );

	          }

	          tempTranslationMatrix.makeTranslation ( currentTargetPosition.x, currentTargetPosition.y, currentTargetPosition.z );
	          tempTranslationMatrix.multiply( tempRotationMatrix );

	          /*
	          this.trailTarget.matrix.identity();
	          trailTarget.applyMatrix( tempTranslationMatrix );
	          trailTarget.updateMatrixWorld();
	          */

	          // this.trailTarget.position.x = this.trailTarget.position.x + 0.5;

	        }





	    }


	});

	if (!Element.prototype.matches) {
	  Element.prototype.matches =
	    Element.prototype.matchesSelector ||
	    Element.prototype.mozMatchesSelector ||
	    Element.prototype.msMatchesSelector ||
	    Element.prototype.oMatchesSelector ||
	    Element.prototype.webkitMatchesSelector ||
	    function (s) {
	      var matches = (this.document || this.ownerDocument).querySelectorAll(s);
	      var i = matches.length;
	      while (--i >= 0 && matches.item(i) !== this) { /* no-op */ }
	      return i > -1;
	    };
	}

	AFRAME.registerComponent('dash-move-controls', {
	  schema: {
	    type: {default: 'parabolic', oneOf: ['parabolic', 'line']},
	    button: {default: 'trackpad', oneOf: ['trackpad', 'trigger', 'grip', 'menu']},
	    collisionEntities: {default: ''},
	    hitEntity: {type: 'selector'},
	    hitCylinderColor: {type: 'color', default: '#99ff99'},
	    hitCylinderRadius: {default: 0.25, min: 0},
	    hitCylinderHeight: {default: 0.3, min: 0},
	    maxLength: {default: 30, min: 0, if: {type: ['line']}},
	    curveNumberPoints: {default: 30, min: 2, if: {type: ['parabolic']}},
	    curveLineWidth: {default: 0.2},
	    curveChargingLineWidth: {default: 0.5},
	    curveHitColor: {type: 'color', default: '#99ff99'},
	    curveMissColor: {type: 'color', default: '#ff0000'},
	    curveChargingColor:  {type: 'color', default: '#0000ff'},
	    curveShootingSpeed: {default: 5, min: 0, if: {type: ['parabolic']}},
	    landingNormal: {type: 'vec3', default: '0 1 0'},
	    landingMaxAngle: {default: '45', min: 0, max: 360},
	    raycastCamera: {default: ''},
	    dashLineLength: {default: '3'},
	    showTeleportRay: {default: true},
	    moveScheme: {default: 'cursor', oneOf: ['cursor', 'button']}

	  },

	  init: function () {
	    var data = this.data;
	    var el = this.el;
	    var teleportEntity;
	    var chargeEntity;

	    this.active = false;
	    this.obj = el.object3D;
	    this.hitPoint = new THREE.Vector3();
	    this.hit = false;
	    this.prevHeightDiff = 0;
	    this.referenceNormal = new THREE.Vector3();
	    this.curveMissColor = new THREE.Color();
	    this.curveHitColor = new THREE.Color();
	    this.raycaster = new THREE.Raycaster();
	    this.__mouse = new THREE.Vector2();
	    this.__isMobile = this.el.sceneEl.isMobile;

	    this.defaultPlane = createDefaultPlane();

	    this.keyUp = true;
	    this.dashSpeed = 0;
	    this.chargedirection = new THREE.Vector3();

	    teleportEntity = this.teleportEntity = document.createElement('a-entity');
	    teleportEntity.classList.add('teleportRay');
	    teleportEntity.setAttribute('visible', false);
	    el.sceneEl.appendChild(this.teleportEntity);

	    chargeEntity = this.chargeEntity = document.createElement('a-entity');
	    chargeEntity.classList.add('chargeRay');
	    chargeEntity.setAttribute('visible', false);
	    el.sceneEl.appendChild(this.chargeEntity);


	    el.addEventListener(data.button + 'down', this.onButtonDown.bind(this));
	    el.addEventListener(data.button + 'up', this.onButtonUp.bind(this));

	    window.addEventListener('keydown', this.onButtonDown.bind(this));
	    window.addEventListener('mousedown', this.onButtonDown.bind(this));
	    window.addEventListener('keyup', this.onButtonUp.bind(this));
	    window.addEventListener('mouseup', this.onButtonUp.bind(this));

	    window.addEventListener('touchstart', this.__onTouch.bind(this));
	    window.addEventListener('touchmove', this.__onTouch.bind(this));
	    window.addEventListener('mousemove', this.__onMouseMove.bind(this));


	    this.queryCollisionEntities();
	  },

	  update: function (oldData) {
	    var data = this.data;
	    var diff = AFRAME.utils.diff(data, oldData);

	    // Update normal.
	    this.referenceNormal.copy(data.landingNormal);

	    // Update colors.
	    this.curveMissColor.set(data.curveMissColor);
	    this.curveHitColor.set(data.curveHitColor);

	    // Create or update line mesh.
	    if (!this.line ||
	        'curveLineWidth' in diff || 'curveNumberPoints' in diff || 'type' in diff) {
	      this.line = createLine(data, data.curveLineWidth);
	      this.chargeline = createLine(data, data.curveChargingLineWidth);
	      this.teleportEntity.setObject3D('mesh', this.line.mesh);
	      this.chargeEntity.setObject3D('mesh', this.chargeline.mesh);
	    }

	    // Create or update hit entity.
	    if (data.hitEntity) {
	      this.hitEntity = data.hitEntity;
	    } else if (!this.hitEntity || 'hitCylinderColor' in diff || 'hitCylinderHeight' in diff ||
	               'hitCylinderRadius' in diff) {
	      // Remove previous entity, create new entity (could be more performant).
	      if (this.hitEntity) { this.hitEntity.parentNode.removeChild(this.hitEntity); }
	      this.hitEntity = createHitEntity(data);
	      this.el.sceneEl.appendChild(this.hitEntity);
	    }
	    this.hitEntity.setAttribute('visible', false);

	    if ('collisionEntities' in diff) { this.queryCollisionEntities(); }
	  },

	  remove: function () {
	    var el = this.el;
	    var hitEntity = this.hitEntity;
	    var teleportEntity = this.teleportEntity;
	    var chargeEntity = this.chargeEntity;

	    if (hitEntity) { hitEntity.parentNode.removeChild(hitEntity); }
	    if (teleportEntity) { teleportEntity.parentNode.removeChild(teleportEntity); }
	    if (chargeEntity) { chargeEntity.parentNode.removeChild(chargeEntity); }


	    el.sceneEl.removeEventListener('child-attached', this.childAttachHandler);
	    el.sceneEl.removeEventListener('child-detached', this.childDetachHandler);
	  },

	  getDirectionVector: function (p1, p2) {

	      return new THREE.Vector3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
	  },

	  getPointInBetweenByLen: function (pointA, pointB, length) {

	      var dir = pointB.clone().sub(pointA).normalize().multiplyScalar(length);
	      return pointA.clone().add(dir);

	  },

	   getPointInBetweenByPerc: function (pointA, pointB, percentage) {

	      var dir = pointB.clone().sub(pointA);
	      var len = dir.length();
	      dir = dir.normalize().multiplyScalar(len*percentage);
	      return pointA.clone().add(dir);

	  },

	  tick: (function () {
	    var p0 = new THREE.Vector3();
	    var quaternion = new THREE.Quaternion();
	    var translation = new THREE.Vector3();
	    var scale = new THREE.Vector3();
	    var shootAngle = new THREE.Vector3();
	    var lastNext = new THREE.Vector3();

	    return function (time, delta) {
	      // if (!this.active) { return; }
	      if (!this.keyUp)
	      {
	        this.dashSpeed += 0.1;
	      }

	      /*
	      var matrixWorld = this.obj.matrixWorld;
	      matrixWorld.decompose(translation, quaternion, scale);

	      var direction = shootAngle.set(this.__mouse.x, this.__mouse.y, -1)
	        .applyQuaternion(quaternion).normalize();
	      */

	      const camera =  this.el.sceneEl.querySelector( this.data.raycastCamera ).getObject3D('camera');
	      var raycaster = this.raycaster;
	      var __mouse = this.__mouse;

	      raycaster.ray.origin.setFromMatrixPosition(camera.matrixWorld)
	      var direction = raycaster.ray.direction.set(__mouse.x, __mouse.y, 0.5).unproject(camera).sub(raycaster.ray.origin).normalize()

	      this.line.setDirection(direction.clone());

	      // p0.copy(this.obj.position);
	      p0.copy(this.el.sceneEl.querySelector( this.data.raycastCamera ).object3D.position);

	      var last = p0.clone();
	      var next;

	      // Set default status as non-hit
	      this.teleportEntity.setAttribute('visible', true);
	      this.line.material.color.set(this.curveMissColor);
	      this.hitEntity.setAttribute('visible', false);
	      this.hit = false;

	      // set chargeline colors
	      this.chargeEntity.setAttribute('visible', true);
	      this.chargeline.material.color.set(this.data.curveChargingColor);

	      if (this.data.type === 'parabolic') {
	        var v0 = direction.clone().multiplyScalar(this.data.curveShootingSpeed + this.dashSpeed);
	        var g = -9.8;
	        var a = new THREE.Vector3(0, g, 0);

	        for (var i = 0; i < this.line.numPoints; i++) {
	          var t = i / (this.line.numPoints - 1);
	          next = parabolicCurve(p0, v0, a, t);
	          // Update the raycaster with the length of the current segment last->next
	          var dirLastNext = lastNext.copy(next).sub(last).normalize();
	          this.raycaster.far = dirLastNext.length();
	          this.raycaster.set(last, dirLastNext);

	          if (this.checkMeshCollisions(i, next)) { break; }
	          last.copy(next);
	        }
	      } else if (this.data.type === 'line') {
	        next = last.add(direction.clone().multiplyScalar(this.data.maxLength));
	        this.raycaster.far = this.data.maxLength;

	        this.raycaster.set(p0, direction);

	        // this.line.setPoint(0, p0);
	        this.line.setPoint(0, this.obj.position);
	        this.checkMeshCollisions(1, next);

	        var chargelineStart = this.obj.position.clone();
	        var chargelineEnd = this.hitPoint.clone();
	        chargelineStart.y = 0.1;
	        chargelineEnd.y = 0.1;

	        this.chargedirection = this.getDirectionVector(chargelineStart, chargelineEnd);
	        this.chargeline.setDirection(this.chargedirection);
	        this.chargeline.setWidth(0.1 + (this.dashSpeed / 25));

	        chargelineEnd = this.getPointInBetweenByLen(chargelineStart, chargelineEnd, this.data.dashLineLength);

	        this.chargeline.setPoint(0, chargelineStart);
	        this.chargeline.setPoint(1, chargelineEnd);


	      }

	      if (this.data.moveScheme == 'cursor')
	      {
	        var cameraEl = this.el;
	        var camPosition = new THREE.Vector3().copy(cameraEl.getAttribute('position'));

	        var newCamPosition = camPosition.add(this.chargedirection.multiplyScalar(0.05));

	        cameraEl.setAttribute('position', newCamPosition);

	        this.el.emit('dash-move', {
	          dashSpeed: this.dashSpeed,
	          dashVector: this.chargedirection
	        });

	      }



	    };
	  })(),

	  /**
	   * Run `querySelectorAll` for `collisionEntities` and maintain it with `child-attached`
	   * and `child-detached` events.
	   */
	  queryCollisionEntities: function () {
	    var collisionEntities;
	    var data = this.data;
	    var el = this.el;

	    if (!data.collisionEntities) {
	      this.collisionEntities = [];
	      return
	    }

	    collisionEntities = [].slice.call(el.sceneEl.querySelectorAll(data.collisionEntities));
	    this.collisionEntities = collisionEntities;

	    // Update entity list on attach.
	    this.childAttachHandler = function childAttachHandler (evt) {
	      if (!evt.detail.el.matches(data.collisionEntities)) { return; }
	      collisionEntities.push(evt.detail.el);
	    };
	    el.sceneEl.addEventListener('child-attached', this.childAttachHandler);

	    // Update entity list on detach.
	    this.childDetachHandler = function childDetachHandler (evt) {
	      var index;
	      if (!evt.detail.el.matches(data.collisionEntities)) { return; }
	      index = collisionEntities.indexOf(evt.detail.el);
	      if (index === -1) { return; }
	      collisionEntities.splice(index, 1);
	    };
	    el.sceneEl.addEventListener('child-detached', this.childDetachHandler);
	  },

	  onButtonDown: function (evt) {
	    if ((evt.type == "keydown" && this.keyUp &&
	        (evt.code === 'Space' || evt.keyCode === '32'))
	        || evt.type == "mousedown")
	        {
	          this.keyUp = false;
	        }
	    // this.active = true;
	  },

	  /**
	   * Get mouse position
	   * @private
	   */
	  __getPosition: function (evt) {
	    var __window = { innerWidth: w, innerHeight: h } = window

	    var cx, cy
	    if (this.__isMobile) {
	      var touches = evt
	      if (!touches || touches.length !== 1) { return }
	      var touch = touches[0]
	      cx = touch.pageX
	      cy = touch.pageY
	    }
	    else {
	      cx = evt.clientX
	      cy = evt.clientY
	    }

	    if (this.__isStereo) {
	      cx = (cx % (w/2)) * 2
	    }

	    var x = (cx / w) * 2 - 1
	    var y = - (cy / h) * 2 + 1

	    return { x:x, y:y }

	  },

	  /**
	   * Update mouse
	   * @private
	   */
	  __updateMouse: function (evt) {
	    const pos = this.__getPosition(evt)
	    if (pos === null) { return }
	    this.__mouse.x = pos.x
	    this.__mouse.y = pos.y
	  },

	  __onTouch: function (evt)
	  {
	    var touches = evt.changedTouches;

	    for (var i = 0; i < touches.length; i++)
	    {
	      this.__mouse.x = touches[i].pageX;
	      this.__mouse.y = touches[i].pageY;
	    }
	  },

	  __onMouseMove: function (evt) {
	    // if (!this.__isActive()) { return }

	    console.log(evt.type);
	    if (evt.type == "mousemove")
	    {
	      this.__updateMouse(evt);
	    }
	    // this.__updateIntersectObject()

	    // if (this.__isDown) {
	    //   this.__setMousePosition(evt)
	    // }
	  },

	  /**
	   * Jump!
	   */
	  onButtonUp: function (evt) {
	  //  if (!this.active) { return; }
	    if (evt.type == "keyup")
	    {
	       if ((evt.code === 'Space' || evt.keyCode === '32'))
	        {
	          this.keyUp = true;
	        }
	        else return;
	    }


	    if (!this.hit) {
	      // Button released but not hit point
	      return;
	    }

	    // @todo Create this aux vectors outside

	    // var cameraEl = this.el.sceneEl.camera.el;
	    var cameraEl = this.el;
	    var camPosition = new THREE.Vector3().copy(cameraEl.getAttribute('position'));

	    var newCamPositionY = camPosition.y + this.hitPoint.y - this.prevHeightDiff;
	    var newCamPosition = new THREE.Vector3(this.hitPoint.x, newCamPositionY, this.hitPoint.z);
	    this.prevHeightDiff = this.hitPoint.y;

	    cameraEl.setAttribute('position', newCamPosition);

	    // Find the hands and move them proportionally
	    var hands = document.querySelectorAll('a-entity[tracked-controls]');
	    for (var i = 0; i < hands.length; i++) {
	      var position = hands[i].getAttribute('position');
	      var pos = new THREE.Vector3().copy(position);
	      var diff = camPosition.clone().sub(pos);
	      var newPosition = newCamPosition.clone().sub(diff);
	      hands[i].setAttribute('position', newPosition);
	    }

	    /*
	    this.el.emit('teleport', {
	      oldPosition: camPosition,
	      newPosition: newCamPosition,
	      hitPoint: this.hitPoint
	    });
	    */

	    /*
	    this.el.emit('dash-move', {
	      dashSpeed: this.dashSpeed,
	      dashVector: this.chargedirection
	    });
	    */

	    // Jump!
	    this.keyUp = true;
	    this.dashSpeed = 0;

	    // Hide the hit point and the curve
	    this.active = false;
	    this.hitEntity.setAttribute('visible', false);
	    this.teleportEntity.setAttribute('visible', false);



	  },

	  /**
	   * Check for raycaster intersection.
	   *
	   * @param {number} Line fragment point index.
	   * @param {number} Next line fragment point index.
	   * @returns {boolean} true if there's an intersection.
	   */
	  checkMeshCollisions: function (i, next) {
	    var intersects;
	    var meshes;

	    // Gather the meshes here to avoid having to wait for entities to iniitalize.
	    meshes = this.collisionEntities.map(function (entity) {
	      return entity.getObject3D('mesh');
	    }).filter(function (n) { return n; });
	    meshes = meshes.length ? meshes : [this.defaultPlane];

	    intersects = this.raycaster.intersectObjects(meshes, true);
	    if (intersects.length > 0 && !this.hit &&
	        this.isValidNormalsAngle(intersects[0].face.normal)) {
	      var point = intersects[0].point;

	      this.line.material.color.set(this.curveHitColor);
	      this.hitEntity.setAttribute('position', point);
	      this.hitEntity.setAttribute('visible', true);

	      this.hit = true;
	      this.hitPoint.copy(intersects[0].point);

	      // If hit, just fill the rest of the points with the hit point and break the loop
	      for (var j = i; j < this.line.numPoints; j++) {
	        this.line.setPoint(j, this.hitPoint);
	      }
	      return true;
	    } else {
	      this.line.setPoint(i, next);
	      return false;
	    }
	  },

	  isValidNormalsAngle: function (collisionNormal) {
	    var angleNormals = this.referenceNormal.angleTo(collisionNormal);
	    return (THREE.Math.RAD2DEG * angleNormals <= this.data.landingMaxAngle);
	  },
	});


	function createLine (data, width) {
	  var numPoints = data.type === 'line' ? 2 : data.curveNumberPoints;
	  return new RayCurve(numPoints, width);
	}

	/**
	 * Create mesh to represent the area of intersection.
	 * Default to a combination of torus and cylinder.
	 */
	function createHitEntity (data) {
	  var cylinder;
	  var hitEntity;
	  var torus;

	  // Parent.
	  hitEntity = document.createElement('a-entity');
	  hitEntity.className = 'hitEntity';

	  // Torus.
	  torus = document.createElement('a-entity');
	  torus.setAttribute('geometry', {
	    primitive: 'torus',
	    radius: data.hitCylinderRadius,
	    radiusTubular: 0.01
	  });
	  torus.setAttribute('rotation', {x: 90, y: 0, z: 0});
	  torus.setAttribute('material', {
	    shader: 'flat',
	    color: data.hitCylinderColor,
	    side: 'double',
	    depthTest: false
	  });
	  hitEntity.appendChild(torus);

	  // Cylinder.
	  cylinder = document.createElement('a-entity');
	  cylinder.setAttribute('position', {x: 0, y: data.hitCylinderHeight / 2, z: 0});
	  cylinder.setAttribute('geometry', {
	    primitive: 'cylinder',
	    segmentsHeight: 1,
	    radius: data.hitCylinderRadius,
	    height: data.hitCylinderHeight,
	    openEnded: true
	  });
	  cylinder.setAttribute('material', {
	    shader: 'flat',
	    color: data.hitCylinderColor,
	    side: 'double',
	    src: cylinderTexture,
	    transparent: true,
	    depthTest: false
	  });
	  hitEntity.appendChild(cylinder);

	  return hitEntity;
	}

	function createDefaultPlane () {
	  var geometry;
	  var material;

	  // @hack: Because I can't get THREE.BufferPlane working on raycaster.
	  geometry = new THREE.BoxBufferGeometry(100, 0.5, 100);
	  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, -0.25, 0));
	  material = new THREE.MeshBasicMaterial({color: 0xffff00});
	  return new THREE.Mesh(geometry, material);
	}


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = 'url(data:image/png;base64,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)';


/***/ },
/* 2 */
/***/ function(module, exports) {

	/* global THREE */
	// Parabolic motion equation, y = p0 + v0*t + 1/2at^2
	function parabolicCurveScalar (p0, v0, a, t) {
	  return p0 + v0 * t + 0.5 * a * t * t;
	}

	// Parabolic motion equation applied to 3 dimensions
	function parabolicCurve (p0, v0, a, t) {
	  var ret = new THREE.Vector3();
	  ret.x = parabolicCurveScalar(p0.x, v0.x, a.x, t);
	  ret.y = parabolicCurveScalar(p0.y, v0.y, a.y, t);
	  ret.z = parabolicCurveScalar(p0.z, v0.z, a.z, t);
	  return ret;
	}

	module.exports = parabolicCurve;


/***/ },
/* 3 */
/***/ function(module, exports) {

	/* global THREE */
	var RayCurve = function (numPoints, width) {
	  this.geometry = new THREE.BufferGeometry();
	  this.vertices = new Float32Array(numPoints * 3 * 2);
	  this.uvs = new Float32Array(numPoints * 2 * 2);
	  this.width = width;

	  this.geometry.addAttribute('position', new THREE.BufferAttribute(this.vertices, 3).setDynamic(true));

	  this.material = new THREE.MeshBasicMaterial({
	    side: THREE.DoubleSide,
	    color: 0xff0000
	  });

	  this.mesh = new THREE.Mesh(this.geometry, this.material);
	  this.mesh.drawMode = THREE.TriangleStripDrawMode;

	  this.mesh.frustumCulled = false;
	  this.mesh.vertices = this.vertices;

	  this.direction = new THREE.Vector3();
	  this.numPoints = numPoints;
	};

	RayCurve.prototype = {
	  setDirection: function (direction) {
	    var UP = new THREE.Vector3(0, 1, 0);
	    this.direction
	      .copy(direction)
	      .cross(UP)
	      .normalize()
	      .multiplyScalar(this.width / 2);
	  },

	  setWidth: function (width) {
	    this.width = width;
	  },

	  setPoint: (function () {
	    var posA = new THREE.Vector3();
	    var posB = new THREE.Vector3();

	    return function (i, point) {
	      posA.copy(point).add(this.direction);
	      posB.copy(point).sub(this.direction);

	      var idx = 2 * 3 * i;
	      this.vertices[idx++] = posA.x;
	      this.vertices[idx++] = posA.y;
	      this.vertices[idx++] = posA.z;

	      this.vertices[idx++] = posB.x;
	      this.vertices[idx++] = posB.y;
	      this.vertices[idx++] = posB.z;

	      this.geometry.attributes.position.needsUpdate = true;
	    };
	  })()
	};

	module.exports = RayCurve;


/***/ },
/* 4 */
/***/ function(module, exports) {

	/**
	* @author Mark Kellogg - http://www.github.com/mkkellogg
	*/

	//=======================================
	// Trail Renderer
	//=======================================

	THREE.TrailRenderer = function( scene, orientToMovement ) {

		THREE.Object3D.call( this );

		this.active = false;

		this.orientToMovement = false;
		if ( orientToMovement ) this.orientToMovement = true;

		this.scene = scene;

		this.geometry = null;
		this.mesh = null;
		this.nodeCenters = null;

		this.lastNodeCenter = null;
		this.currentNodeCenter = null;
		this.lastOrientationDir = null;
		this.nodeIDs = null;
		this.currentLength = 0;
		this.currentEnd = 0;
		this.currentNodeID = 0;

	}

	THREE.TrailRenderer.prototype = Object.create( THREE.Object3D.prototype );
	THREE.TrailRenderer.prototype.constructor = THREE.TrailRenderer;

	THREE.TrailRenderer.MaxHeadVertices = 128;
	THREE.TrailRenderer.LocalOrientationTangent = new THREE.Vector3( 1, 0, 0 );
	THREE.TrailRenderer.LocalOrientationDirection = new THREE.Vector3( 0, 0, -1 );
	THREE.TrailRenderer.LocalHeadOrigin = new THREE.Vector3( 0, 0, 0 );
	THREE.TrailRenderer.PositionComponentCount = 3;
	THREE.TrailRenderer.UVComponentCount = 2;
	THREE.TrailRenderer.IndicesPerFace = 3;
	THREE.TrailRenderer.FacesPerQuad = 2;


	THREE.TrailRenderer.Shader = {};

	THREE.TrailRenderer.Shader.BaseVertexVars = [

		"attribute float nodeID;",
		"attribute float nodeVertexID;",
		"attribute vec3 nodeCenter;",

		"uniform float minID;",
		"uniform float maxID;",
		"uniform float trailLength;",
		"uniform float maxTrailLength;",
		"uniform float verticesPerNode;",
		"uniform vec2 textureTileFactor;",

		"uniform vec4 headColor;",
		"uniform vec4 tailColor;",

		"varying vec4 vColor;",

	].join( "\n" );

	THREE.TrailRenderer.Shader.TexturedVertexVars = [

		THREE.TrailRenderer.Shader.BaseVertexVars,
		"varying vec2 vUV;",
		"uniform float dragTexture;",

	].join( "\n" );

	THREE.TrailRenderer.Shader.BaseFragmentVars = [

		"varying vec4 vColor;",
		"uniform sampler2D texture;",

	].join( "\n" );

	THREE.TrailRenderer.Shader.TexturedFragmentVars = [

		THREE.TrailRenderer.Shader.BaseFragmentVars,
		"varying vec2 vUV;"

	].join( "\n" );


	THREE.TrailRenderer.Shader.VertexShaderCore = [

		"float fraction = ( maxID - nodeID ) / ( maxID - minID );",
		"vColor = ( 1.0 - fraction ) * headColor + fraction * tailColor;",
		"vec4 realPosition = vec4( ( 1.0 - fraction ) * position.xyz + fraction * nodeCenter.xyz, 1.0 ); ",

	].join( "\n" );

	THREE.TrailRenderer.Shader.BaseVertexShader = [

		THREE.TrailRenderer.Shader.BaseVertexVars,

		"void main() { ",

			THREE.TrailRenderer.Shader.VertexShaderCore,
			"gl_Position = projectionMatrix * viewMatrix * realPosition;",

		"}"

	].join( "\n" );

	THREE.TrailRenderer.Shader.BaseFragmentShader = [

		THREE.TrailRenderer.Shader.BaseFragmentVars,

		"void main() { ",

			"gl_FragColor = vColor;",

		"}"

	].join( "\n" );

	THREE.TrailRenderer.Shader.TexturedVertexShader = [

		THREE.TrailRenderer.Shader.TexturedVertexVars,

		"void main() { ",

			THREE.TrailRenderer.Shader.VertexShaderCore,
			"float s = 0.0;",
			"float t = 0.0;",
			"if ( dragTexture == 1.0 ) { ",
			"   s = fraction *  textureTileFactor.s; ",
			" 	t = ( nodeVertexID / verticesPerNode ) * textureTileFactor.t;",
			"} else { ",
			"	s = nodeID / maxTrailLength * textureTileFactor.s;",
			" 	t = ( nodeVertexID / verticesPerNode ) * textureTileFactor.t;",
			"}",
			"vUV = vec2( s, t ); ",
			"gl_Position = projectionMatrix * viewMatrix * realPosition;",

		"}"

	].join( "\n" );

	THREE.TrailRenderer.Shader.TexturedFragmentShader = [

		THREE.TrailRenderer.Shader.TexturedFragmentVars,

		"void main() { ",

		    "vec4 textureColor = texture2D( texture, vUV );",
			"gl_FragColor = vColor * textureColor;",

		"}"

	].join( "\n" );

	THREE.TrailRenderer.createMaterial = function( vertexShader, fragmentShader, customUniforms ) {

		customUniforms = customUniforms || {};

		customUniforms.trailLength = { type: "f", value: null };
		customUniforms.verticesPerNode = { type: "f", value: null };
		customUniforms.minID = { type: "f", value: null };
		customUniforms.maxID = { type: "f", value: null };
		customUniforms.dragTexture = { type: "f", value: null };
		customUniforms.maxTrailLength = { type: "f", value: null };
		customUniforms.textureTileFactor = { type: "v2", value: null };

		customUniforms.headColor = { type: "v4", value: new THREE.Vector4() };
		customUniforms.tailColor = { type: "v4", value: new THREE.Vector4() };

		vertexShader = vertexShader || THREE.TrailRenderer.Shader.BaseVertexShader;
		fragmentShader = fragmentShader || THREE.TrailRenderer.Shader.BaseFragmentShader;

		return new THREE.ShaderMaterial(
		{
			uniforms: customUniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,

			transparent: true,
			alphaTest: 0.5,

			blending : THREE.CustomBlending,
			blendSrc : THREE.SrcAlphaFactor,
			blendDst : THREE.OneMinusSrcAlphaFactor,
			blendEquation : THREE.AddEquation,

			depthTest: true,
			depthWrite: false,

			side: THREE.DoubleSide
		} );

	}

	THREE.TrailRenderer.createBaseMaterial = function( customUniforms ) {

		return this.createMaterial( THREE.TrailRenderer.Shader.BaseVertexShader, THREE.TrailRenderer.Shader.BaseFragmentShader, customUniforms );

	}

	THREE.TrailRenderer.createTexturedMaterial = function( customUniforms ) {

		customUniforms = {};
		customUniforms.texture = { type: "t", value: null };

		return this.createMaterial( THREE.TrailRenderer.Shader.TexturedVertexShader, THREE.TrailRenderer.Shader.TexturedFragmentShader, customUniforms );

	}

	THREE.TrailRenderer.prototype.initialize = function( material, length, dragTexture, localHeadWidth, localHeadGeometry, targetObject ) {

			this.deactivate();
			this.destroyMesh();

			this.length = ( length > 0 ) ? length + 1 : 0;
			this.dragTexture = ( ! dragTexture ) ? 0 : 1;
			this.targetObject = targetObject;

			this.initializeLocalHeadGeometry( localHeadWidth, localHeadGeometry );

			this.nodeIDs = [];
			this.nodeCenters = [];

			for (var i = 0; i < this.length; i ++ ) {

				this.nodeIDs[ i ] = -1;
				this.nodeCenters[ i ] = new THREE.Vector3();

			}

			this.material = material;

			this.initializeGeometry();
			this.initializeMesh();

			this.material.uniforms.trailLength.value = 0;
			this.material.uniforms.minID.value = 0;
			this.material.uniforms.maxID.value = 0;
			this.material.uniforms.dragTexture.value = this.dragTexture;
			this.material.uniforms.maxTrailLength.value = this.length;
			this.material.uniforms.verticesPerNode.value = this.VerticesPerNode;
			this.material.uniforms.textureTileFactor.value = new THREE.Vector2( 1.0, 1.0 );

			this.reset();

	}

	THREE.TrailRenderer.prototype.initializeLocalHeadGeometry = function( localHeadWidth, localHeadGeometry ) {

		this.localHeadGeometry = [];

		if ( ! localHeadGeometry ) {

			var halfWidth = localHeadWidth || 1.0;
			halfWidth = halfWidth / 2.0;

			this.localHeadGeometry.push( new THREE.Vector3( -halfWidth, 0, 0 ) );
			this.localHeadGeometry.push( new THREE.Vector3( halfWidth, 0, 0 ) );

			this.VerticesPerNode = 2;

		} else {

			this.VerticesPerNode = 0;
			for ( var i = 0; i < localHeadGeometry.length && i < THREE.TrailRenderer.MaxHeadVertices; i ++ ) {

				var vertex = localHeadGeometry[ i ];

				if ( vertex && vertex instanceof THREE.Vector3 ) {

					var vertexCopy = new THREE.Vector3();

					vertexCopy.copy( vertex );

					this.localHeadGeometry.push( vertexCopy );
					this.VerticesPerNode ++;

				}

			}

		}

		this.FacesPerNode = ( this.VerticesPerNode - 1 ) * 2;
		this.FaceIndicesPerNode = this.FacesPerNode * 3;

	}

	THREE.TrailRenderer.prototype.initializeGeometry = function() {

		this.vertexCount = this.length * this.VerticesPerNode;
		this.faceCount = this.length * this.FacesPerNode;

		var geometry = new THREE.BufferGeometry();

		var nodeIDs = new Float32Array( this.vertexCount );
		var nodeVertexIDs = new Float32Array( this.vertexCount * this.VerticesPerNode );
		var positions = new Float32Array( this.vertexCount * THREE.TrailRenderer.PositionComponentCount );
		var nodeCenters = new Float32Array( this.vertexCount * THREE.TrailRenderer.PositionComponentCount );
		var uvs = new Float32Array( this.vertexCount * THREE.TrailRenderer.UVComponentCount );
		var indices = new Uint32Array( this.faceCount * THREE.TrailRenderer.IndicesPerFace );

		var nodeIDAttribute = new THREE.BufferAttribute( nodeIDs, 1 );
		nodeIDAttribute.setDynamic( true );
		geometry.addAttribute( 'nodeID', nodeIDAttribute );

		var nodeVertexIDAttribute = new THREE.BufferAttribute( nodeVertexIDs, 1 );
		nodeVertexIDAttribute.setDynamic( true );
		geometry.addAttribute( 'nodeVertexID', nodeVertexIDAttribute );

		var nodeCenterAttribute = new THREE.BufferAttribute( nodeCenters, THREE.TrailRenderer.PositionComponentCount );
		nodeCenterAttribute.setDynamic( true );
		geometry.addAttribute( 'nodeCenter', nodeCenterAttribute );

		var positionAttribute = new THREE.BufferAttribute( positions, THREE.TrailRenderer.PositionComponentCount );
		positionAttribute.setDynamic( true );
		geometry.addAttribute( 'position', positionAttribute );

		var uvAttribute = new THREE.BufferAttribute( uvs, THREE.TrailRenderer.UVComponentCount );
		uvAttribute.setDynamic( true );
		geometry.addAttribute( 'uv', uvAttribute );

		var indexAttribute = new THREE.BufferAttribute( indices, 1 );
		indexAttribute.setDynamic( true );
		geometry.setIndex( indexAttribute );

		this.geometry = geometry;

	}

	THREE.TrailRenderer.prototype.zeroVertices = function( ) {

		var positions = this.geometry.getAttribute( 'position' );

		for ( var i = 0; i < this.vertexCount; i ++ ) {

			var index = i * 3;

			positions.array[ index ] = 0;
			positions.array[ index + 1 ] = 0;
			positions.array[ index + 2 ] = 0;

		}

		positions.needsUpdate = true;
		positions.updateRange.count = - 1;

	}

	THREE.TrailRenderer.prototype.zeroIndices = function( ) {

		var indices = this.geometry.getIndex();

		for ( var i = 0; i < this.faceCount; i ++ ) {

			var index = i * 3;

			indices.array[ index ] = 0;
			indices.array[ index + 1 ] = 0;
			indices.array[ index + 2 ] = 0;

		}

		indices.needsUpdate = true;
		indices.updateRange.count = - 1;

	}

	THREE.TrailRenderer.prototype.formInitialFaces = function() {

		this.zeroIndices();

		var indices = this.geometry.getIndex();

		for ( var i = 0; i < this.length - 1; i ++ ) {

			this.connectNodes( i, i + 1 );

		}

		indices.needsUpdate = true;
		indices.updateRange.count = - 1;

	}

	THREE.TrailRenderer.prototype.initializeMesh = function() {

		this.mesh = new THREE.Mesh( this.geometry, this.material );
		this.mesh.dynamic = true;
		this.mesh.matrixAutoUpdate = false;

	}

	THREE.TrailRenderer.prototype.destroyMesh = function() {

		if ( this.mesh ) {

			this.scene.remove( this.mesh );
			this.mesh = null;

		}

	}

	THREE.TrailRenderer.prototype.reset = function() {

		this.currentLength = 0;
		this.currentEnd = -1;

		this.lastNodeCenter = null;
		this.currentNodeCenter = null;
		this.lastOrientationDir = null;

		this.currentNodeID = 0;

		this.formInitialFaces();
		this.zeroVertices();

		this.geometry.setDrawRange( 0, 0 );

	}

	THREE.TrailRenderer.prototype.updateUniforms = function() {

		if ( this.currentLength < this.length ) {

			this.material.uniforms.minID.value = 0;

		} else {

			this.material.uniforms.minID.value = this.currentNodeID - this.length;

		}
		this.material.uniforms.maxID.value = this.currentNodeID;
		this.material.uniforms.trailLength.value = this.currentLength;
		this.material.uniforms.maxTrailLength.value = this.length;
		this.material.uniforms.verticesPerNode.value = this.VerticesPerNode;

	}

	THREE.TrailRenderer.prototype.advance = function() {

		var orientationTangent = new THREE.Vector3();
		var position = new THREE.Vector3();
		var offset = new THREE.Vector3();
		var tempMatrix4 = new THREE.Matrix4();

		return function advance() {

			this.targetObject.updateMatrixWorld();
			tempMatrix4.copy( this.targetObject.matrixWorld );

			this.advanceWithTransform( tempMatrix4 );

			this.updateUniforms();
		}

	}();

	THREE.TrailRenderer.prototype.advanceWithPositionAndOrientation = function( nextPosition, orientationTangent ) {

		this.advanceGeometry( { position : nextPosition, tangent : orientationTangent }, null );

	}

	THREE.TrailRenderer.prototype.advanceWithTransform = function( transformMatrix ) {

		this.advanceGeometry( null, transformMatrix );

	}

	THREE.TrailRenderer.prototype.advanceGeometry = function() {

		var direction = new THREE.Vector3();
		var tempPosition = new THREE.Vector3();

		return function advanceGeometry( positionAndOrientation, transformMatrix ) {

			var nextIndex = this.currentEnd + 1 >= this.length ? 0 : this.currentEnd + 1;

			if( transformMatrix ) {

				this.updateNodePositionsFromTransformMatrix( nextIndex, transformMatrix );

			} else {

				this.updateNodePositionsFromOrientationTangent( nextIndex, positionAndOrientation.position, positionAndOrientation.tangent );
			}

			if ( this.currentLength >= 1 ) {

				var connectRange = this.connectNodes( this.currentEnd , nextIndex );
				var disconnectRange = null;

				if( this.currentLength >= this.length ) {

					var disconnectIndex  = this.currentEnd + 1  >= this.length ? 0 : this.currentEnd + 1;
					disconnectRange = this.disconnectNodes( disconnectIndex );

				}

			}

			if( this.currentLength < this.length ) {

				this.currentLength ++;

			}

			this.currentEnd ++;
			if ( this.currentEnd >= this.length ) {

				this.currentEnd = 0;

			}

			if ( this.currentLength >= 1 ) {

				if( this.currentLength < this.length ) {

					this.geometry.setDrawRange( 0, ( this.currentLength - 1 ) * this.FaceIndicesPerNode);

				} else {

					this.geometry.setDrawRange( 0, this.currentLength * this.FaceIndicesPerNode);

				}

			}

			this.updateNodeID( this.currentEnd,  this.currentNodeID );
			this.currentNodeID ++;
		}

	}();

	THREE.TrailRenderer.prototype.updateHead = function() {

		var tempMatrix4 = new THREE.Matrix4();

		return function advance() {

			if( this.currentEnd < 0 ) return;

			this.targetObject.updateMatrixWorld();
			tempMatrix4.copy( this.targetObject.matrixWorld );

			this.updateNodePositionsFromTransformMatrix( this.currentEnd, tempMatrix4 );
		}

	}();

	THREE.TrailRenderer.prototype.updateNodeID = function( nodeIndex, id ) {

		this.nodeIDs[ nodeIndex ] = id;

		var nodeIDs = this.geometry.getAttribute( 'nodeID' );
		var nodeVertexIDs = this.geometry.getAttribute( 'nodeVertexID' );

		for ( var i = 0; i < this.VerticesPerNode; i ++ ) {

			var baseIndex = nodeIndex * this.VerticesPerNode + i ;
			nodeIDs.array[ baseIndex ] = id;
			nodeVertexIDs.array[ baseIndex ] = i;

		}

		nodeIDs.needsUpdate = true;
		nodeVertexIDs.needsUpdate = true;

		nodeIDs.updateRange.offset = nodeIndex * this.VerticesPerNode;
		nodeIDs.updateRange.count = this.VerticesPerNode;

		nodeVertexIDs.updateRange.offset = nodeIndex * this.VerticesPerNode;
		nodeVertexIDs.updateRange.count = this.VerticesPerNode;

	}

	THREE.TrailRenderer.prototype.updateNodeCenter = function( nodeIndex, nodeCenter ) {

		this.lastNodeCenter = this.currentNodeCenter;

		this.currentNodeCenter = this.nodeCenters[ nodeIndex ];
		this.currentNodeCenter.copy( nodeCenter );

		var nodeCenters = this.geometry.getAttribute( 'nodeCenter' );

		for ( var i = 0; i < this.VerticesPerNode; i ++ ) {

			var baseIndex = ( nodeIndex * this.VerticesPerNode + i ) * 3;
			nodeCenters.array[ baseIndex ] = nodeCenter.x;
			nodeCenters.array[ baseIndex + 1 ] = nodeCenter.y;
			nodeCenters.array[ baseIndex + 2 ] = nodeCenter.z;

		}

		nodeCenters.needsUpdate = true;

		nodeCenters.updateRange.offset = nodeIndex * this.VerticesPerNode * THREE.TrailRenderer.PositionComponentCount;
		nodeCenters.updateRange.count = this.VerticesPerNode * THREE.TrailRenderer.PositionComponentCount;

	}

	THREE.TrailRenderer.prototype.updateNodePositionsFromOrientationTangent = function() {

		var tempMatrix4 = new THREE.Matrix4();
		var tempQuaternion = new THREE.Quaternion();
		var tempOffset = new THREE.Vector3();
		var tempLocalHeadGeometry = [];

		for ( var i = 0; i < THREE.TrailRenderer.MaxHeadVertices; i ++ ) {

			var vertex = new THREE.Vector3();
			tempLocalHeadGeometry.push( vertex );

		}

		return function updateNodePositionsFromOrientationTangent( nodeIndex, nodeCenter, orientationTangent  ) {

			var positions = this.geometry.getAttribute( 'position' );

			this.updateNodeCenter( nodeIndex, nodeCenter );

			tempOffset.copy( nodeCenter );
			tempOffset.sub( THREE.TrailRenderer.LocalHeadOrigin );
			tempQuaternion.setFromUnitVectors( THREE.TrailRenderer.LocalOrientationTangent, orientationTangent );

			for ( var i = 0; i < this.localHeadGeometry.length; i ++ ) {

				var vertex = tempLocalHeadGeometry[ i ];
				vertex.copy( this.localHeadGeometry[ i ] );
				vertex.applyQuaternion( tempQuaternion );
				vertex.add( tempOffset );
			}

			for ( var i = 0; i <  this.localHeadGeometry.length; i ++ ) {

				var positionIndex = ( ( this.VerticesPerNode * nodeIndex ) + i ) * THREE.TrailRenderer.PositionComponentCount;
				var transformedHeadVertex = tempLocalHeadGeometry[ i ];

				positions.array[ positionIndex ] = transformedHeadVertex.x;
				positions.array[ positionIndex + 1 ] = transformedHeadVertex.y;
				positions.array[ positionIndex + 2 ] = transformedHeadVertex.z;

			}

			positions.needsUpdate = true;

		}

	}();

	THREE.TrailRenderer.prototype.updateNodePositionsFromTransformMatrix = function() {

		var tempMatrix4 = new THREE.Matrix4();
		var tempMatrix3 = new THREE.Matrix3();
		var tempQuaternion = new THREE.Quaternion();
		var tempPosition = new THREE.Vector3();
		var tempOffset = new THREE.Vector3();
		var worldOrientation = new THREE.Vector3();
		var tempDirection = new THREE.Vector3();

		var tempLocalHeadGeometry = [];
		for ( var i = 0; i < THREE.TrailRenderer.MaxHeadVertices; i ++ ) {

			var vertex = new THREE.Vector3();
			tempLocalHeadGeometry.push( vertex );

		}

		function getMatrix3FromMatrix4( matrix3, matrix4) {

			var e = matrix4.elements;
			matrix3.set( e[0], e[1], e[2],
						 e[4], e[5], e[6],
						 e[8], e[9], e[10] );

		}

		return function updateNodePositionsFromTransformMatrix( nodeIndex, transformMatrix ) {

			var positions = this.geometry.getAttribute( 'position' );

			tempPosition.set( 0, 0, 0 );
			tempPosition.applyMatrix4( transformMatrix );
			this.updateNodeCenter( nodeIndex, tempPosition );

			for ( var i = 0; i < this.localHeadGeometry.length; i ++ ) {

				var vertex = tempLocalHeadGeometry[ i ];
				vertex.copy( this.localHeadGeometry[ i ] );

			}

			for ( var i = 0; i < this.localHeadGeometry.length; i ++ ) {

				var vertex = tempLocalHeadGeometry[ i ];
				vertex.applyMatrix4( transformMatrix );

			}

			if( this.lastNodeCenter && this.orientToMovement ) {

				getMatrix3FromMatrix4( tempMatrix3, transformMatrix );
				worldOrientation.set( 0, 0, -1 );
				worldOrientation.applyMatrix3( tempMatrix3 );

				tempDirection.copy( this.currentNodeCenter );
				tempDirection.sub( this.lastNodeCenter );
				tempDirection.normalize();

				if( tempDirection.lengthSq() <= .0001 && this.lastOrientationDir ) {

					tempDirection.copy( this.lastOrientationDir );
				}

				if( tempDirection.lengthSq() > .0001 ) {

					if( ! this.lastOrientationDir ) this.lastOrientationDir = new THREE.Vector3();

					tempQuaternion.setFromUnitVectors( worldOrientation, tempDirection );

					tempOffset.copy( this.currentNodeCenter );

					for ( var i = 0; i < this.localHeadGeometry.length; i ++ ) {

						var vertex = tempLocalHeadGeometry[ i ];
						vertex.sub( tempOffset );
						vertex.applyQuaternion( tempQuaternion );
						vertex.add( tempOffset );

					}
				}

			}

			for ( var i = 0; i < this.localHeadGeometry.length; i ++ ) {

				var positionIndex = ( ( this.VerticesPerNode * nodeIndex ) + i ) * THREE.TrailRenderer.PositionComponentCount;
				var transformedHeadVertex = tempLocalHeadGeometry[ i ];

				positions.array[ positionIndex ] = transformedHeadVertex.x;
				positions.array[ positionIndex + 1 ] = transformedHeadVertex.y;
				positions.array[ positionIndex + 2 ] = transformedHeadVertex.z;

			}

			positions.needsUpdate = true;

			positions.updateRange.offset = nodeIndex * this.VerticesPerNode * THREE.TrailRenderer.PositionComponentCount;
			positions.updateRange.count = this.VerticesPerNode * THREE.TrailRenderer.PositionComponentCount;
		}

	}();

	THREE.TrailRenderer.prototype.connectNodes = function() {

		var returnObj = {

				"attribute" : null,
				"offset" : 0,
				"count" : - 1

			};

		return function connectNodes( srcNodeIndex, destNodeIndex ) {

			var indices = this.geometry.getIndex();

			for ( var i = 0; i < this.localHeadGeometry.length - 1; i ++ ) {

				var srcVertexIndex = ( this.VerticesPerNode * srcNodeIndex ) + i;
				var destVertexIndex = ( this.VerticesPerNode * destNodeIndex ) + i;

				var faceIndex = ( ( srcNodeIndex * this.FacesPerNode ) + ( i * THREE.TrailRenderer.FacesPerQuad  ) ) * THREE.TrailRenderer.IndicesPerFace;

				indices.array[ faceIndex ] = srcVertexIndex;
				indices.array[ faceIndex + 1 ] = destVertexIndex;
				indices.array[ faceIndex + 2 ] = srcVertexIndex + 1;

				indices.array[ faceIndex + 3 ] = destVertexIndex;
				indices.array[ faceIndex + 4 ] = destVertexIndex + 1;
				indices.array[ faceIndex + 5 ] = srcVertexIndex + 1;

			}

			indices.needsUpdate = true;
			indices.updateRange.count = - 1;

			returnObj.attribute = indices;
			returnObj.offset =  srcNodeIndex * this.FacesPerNode * THREE.TrailRenderer.IndicesPerFace;
			returnObj.count = this.FacesPerNode * THREE.TrailRenderer.IndicesPerFace;

			return returnObj;

		}
	}();

	THREE.TrailRenderer.prototype.disconnectNodes = function( srcNodeIndex ) {

		var returnObj = {

				"attribute" : null,
				"offset" : 0,
				"count" : - 1

			};

		return function disconnectNodes( srcNodeIndex ) {

			var indices = this.geometry.getIndex();

			for ( var i = 0; i < this.localHeadGeometry.length - 1; i ++ ) {

				var srcVertexIndex = ( this.VerticesPerNode * srcNodeIndex ) + i;

				var faceIndex = ( ( srcNodeIndex * this.FacesPerNode ) + ( i * THREE.TrailRenderer.FacesPerQuad ) ) * THREE.TrailRenderer.IndicesPerFace;

				indices.array[ faceIndex ] = 0;
				indices.array[ faceIndex + 1 ] = 0;
				indices.array[ faceIndex + 2 ] = 0;

				indices.array[ faceIndex + 3 ] = 0;
				indices.array[ faceIndex + 4 ] = 0;
				indices.array[ faceIndex + 5 ] = 0;

			}

			indices.needsUpdate = true;
			indices.updateRange.count = - 1;

			returnObj.attribute = indices;
			returnObj.offset = srcNodeIndex * this.FacesPerNode * THREE.TrailRenderer.IndicesPerFace;
			returnObj.count = this.FacesPerNode * THREE.TrailRenderer.IndicesPerFace;

			return returnObj;

		}

	}();

	THREE.TrailRenderer.prototype.deactivate = function() {

		if ( this.isActive ) {

			this.scene.remove( this.mesh );
			this.isActive = false;

		}

	}

	THREE.TrailRenderer.prototype.activate = function() {

		if ( ! this.isActive ) {

			//		this.scene.object3D.add( this.mesh );
			var sceneEl = document.querySelector('a-scene');
			sceneEl.object3D.add(this.mesh);
			
			this.isActive = true;

		}

	}


/***/ }
/******/ ]);