/* global THREE, AFRAME  */
var cylinderTexture = require('./lib/cylinderTexture');
var parabolicCurve = require('./lib/ParabolicCurve');
var RayCurve = require('./lib/RayCurve');

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
    showTeleportRay: {default: true}

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
    window.addEventListener('touchstart', this.onButtonDown.bind(this));
    window.addEventListener('keyup', this.onButtonUp.bind(this));
    window.addEventListener('mouseup', this.onButtonUp.bind(this));

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

  __onMouseMove: function (evt) {
    // if (!this.__isActive()) { return }

    this.__updateMouse(evt)
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

    this.el.emit('dash-move', {
      dashSpeed: this.dashSpeed,
      dashVector: this.chargedirection
    });

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
