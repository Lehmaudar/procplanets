function initControls() {
  document.body.onkeyup = e => {
    // culling
    if (e.keyCode == 70) {
      updateFrustum();
      updateCullingVectors();
      findVisibleFaces(faceCache).forEach(face => {
        markFace(face, [0, 0, 1]);
      });
      geom.colorsNeedUpdate = true;
    }
    if (e.keyCode == 83) upDateColors();

    // testing
    if (e.keyCode == 80) {
      // findNeighbours(faceCache[20]).forEach(face => {
      //   subdivCacheFace(face);
      // });
      // geom.elementsNeedUpdate = true;

      if (conOrbit.enabled) {
        setPointerControls();
      } else {
        setOrbitControls();
      }
    }

    // camera travel
    if (e.keyCode == 32) {
      if (onGround) {
        toSky();
      } else if (
        pointer.position.x != 0 &&
        pointer.position.y != 0 &&
        pointer.position.z != 0
      ) {
        toGround();
      }
    }
  };

  setupControls();
  setOrbitControls();
  // setPointerControls();

  //   console.log(createjs.RotationPlugin);
  //   createjs.RotationPlugin.install();
}

function toSky() {
  onGround = false;
  pointer.material.color.setRGB(0.9, 0.9, 0.9);
  if (downTween != undefined) downTween.stop();

  setOrbitControls();
  conOrbit.enabled = false;

  targetQuarternion = new THREE.Quaternion().setFromEuler(skyRot);

  const tweens = {
    fov: camera.fov,
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    xR: camera.rotation.x,
    yR: camera.rotation.y,
    zR: camera.rotation.z
  };

  upTween = new TWEEN.Tween(tweens)
    .to(
      {
        fov: 15,
        x: skyPos.x,
        y: skyPos.y,
        z: skyPos.z,
        xR: skyRot.x,
        yR: skyRot.y,
        zR: skyRot.z
      },
      1000
    )
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => {
      camera.position.set(tweens.x, tweens.y, tweens.z);
      camera.rotation.set(tweens.xR, tweens.yR, tweens.zR);
      // camera.quaternion.slerp(targetQuarternion, tweens.t);

      camOrbit.fov = tweens.fov;
      camPointer.fov = tweens.fov;
      camera.updateProjectionMatrix();
    })
    .onComplete(() => {
      conOrbit.enabled = true;
    });
  upTween.start();

  // upTweenRot = new TWEEN.Tween(camOrbit.up)
  //   .to(new THREE.Vector3().copy(skyRot), 3000)
  //   .easing(TWEEN.Easing.Quadratic.InOut);
  // upTweenRot.start();
}

function toGround() {
  onGround = true;
  if (upTween == undefined || !upTween._isPlaying) {
    skyPos.copy(camera.position);
    skyRot.copy(camera.rotation);
  }

  if (upTween != undefined) upTween.stop();
  conOrbit.enabled = false;
  pointer.material.color.setRGB(0.7, 0.9, 0.7);

  targetQuarternion = new THREE.Quaternion().copy(pointer.quaternion);
  targetMesh = new THREE.Mesh().copy(pointer);
  // camera.lookAt(targetMesh.position);
  console.log(targetMesh.position);
  console.log(multiplyPos(vec3ToArray(targetMesh.position), 2));
  // camera.lookAt(...multiplyPos(vec3ToArray(targetMesh.position), 2));

  const tweens = {
    fov: camera.fov,
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    xR: camera.rotation.x,
    yR: camera.rotation.y,
    zR: camera.rotation.z,
    t: 0
  };
  downTween = new TWEEN.Tween(tweens)
    .to(
      {
        fov: 60,
        x: pointer.position.x,
        y: pointer.position.y,
        z: pointer.position.z,
        xR: pointer.rotation.x,
        yR: pointer.rotation.y,
        zR: pointer.rotation.z,
        t: 1
      },
      1000
    )
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => {
      camera.position.set(tweens.x, tweens.y, tweens.z);
      camera.rotation.set(tweens.xR, tweens.yR, tweens.zR);
      // camera.up.set(...multiplyPos(vec3ToArray(targetMesh.position), 2));
      // camera.lookAt(...multiplyPos(vec3ToArray(targetMesh.position), 1.001));

      // camera.quaternion.slerp(targetQuarternion, tweens.t);

      camOrbit.fov = tweens.fov;
      camPointer.fov = tweens.fov;
      camera.updateProjectionMatrix();
    })
    .onComplete(() => {
      setPointerControls();
    });
  downTween.start();

  // downTweenRot = new TWEEN.Tween(camOrbit.up)
  //   .to(new THREE.Vector3().copy(pointer.position), 3000)
  //   .easing(TWEEN.Easing.Quadratic.InOut);
  // downTweenRot.start();
}

function setupControls() {
  camOrbit = new THREE.PerspectiveCamera(
    15,
    window.innerWidth / window.innerHeight,
    0.001,
    100
  );
  camOrbit.position.set(0, 0, 5);
  conOrbit = new THREE.TrackballControls(camOrbit, renderer.domElement);
  conOrbit.maxDistance = 40;
  conOrbit.enabled = false;
  scene.add(camOrbit);

  conPointer = new THREE.PointerLockControls(camOrbit);
  conPointer.speedFactor = 0.1;
  camPointer = conPointer.getObject();
}

function setPointerControls() {
  // camPointer.copy(camera);
  camPointer.position.copy(camera.position);
  camPointer.rotation.copy(camera.rotation);
  // camPointer.up.copy(camera.up);
  // camPointer.lookAt(0, 0, 0);

  conOrbit.enabled = false;
  pointer.visible = false;
  camera = camPointer;
  conPointer.lock();
}

function setOrbitControls() {
  camOrbit.position.copy(camera.position);
  camOrbit.rotation.copy(camera.rotation);

  conPointer.unlock();
  conOrbit.enabled = true;
  pointer.visible = true;
  camera = camOrbit;
  controls = conOrbit;
}

var asd = 0;

function smootherControls() {
  // pointer.lookAt(0, 0, 0);
  pointer.lookAt(...multiplyPos(vec3ToArray(pointer.position), 2));

  //   console.log(pointer.matrix.elements);
  //   pointer.rotation.x += 0.1;
  // pointer.matrix.elements[2] = pointer.position.x;
  // pointer.matrix.elements[6] = pointer.position.y;
  // pointer.matrix.elements[10] = pointer.position.z;
  // asd += 0.1;
  // //   pointer.matrix.elements[10] = asd;
  // //   pointer.matrixAutoUpdate = false;
  // //   pointer.matrixWorldNeedsUpdate = true;
  // //   pointer.updateMatrixWorld();
  // //   pointer.updateMatrix();
  // //   pointer.setRotationFromMatrix(pointer.matrix);
  // //   pointer.matrix.decompose(pointer.position, pointer.quaternion, pointer.scale);

  // xAxis = new THREE.Vector3();
  // yAxis = new THREE.Vector3();
  // zAxis = new THREE.Vector3();

  // pointer.matrix.extractBasis(xAxis, yAxis, zAxis);
  //   console.log("");
  //   console.log(zAxis);
  //   console.log(
  //     pointer.matrix.elements[2],
  //     pointer.matrix.elements[6],
  //     pointer.matrix.elements[10]
  //   );

  //   var vector = new THREE.Vector3(0, 0, 1);
  //   vector.applyQuaternion(new THREE.Quaternion().setFromEuler(pointer.rotation));
  //   pointer.rotation.setFromVector3(vector);

  const oldCameraPos = vec3ToArray(camera.position);
  const oldCameraRot = vec3ToArray(camera.rotation);
  const oldCameraDist = distance(oldCameraPos, [0, 0, 0]);

  const oldTargetPos = vec3ToArray(conOrbit.target);
  const oldTargetDist = distance(oldTargetPos, [0, 0, 0]);

  // dist, startvalue, startvalue + endvalue, endDist
  ease = easeFunc(oldCameraDist - 1, 0, 1, 40);

  conOrbit.zoomSpeed = ease;
  conOrbit.rotateSpeed = ease * 2;
  conOrbit.panSpeed = ease / 5;

  conOrbit.update();

  const newCameraDist = distance(vec3ToArray(camera.position), [0, 0, 0]);
  if (newCameraDist < 1.00002) {
    camera.position.set(...oldCameraPos);
    camera.rotation.set(...oldCameraRot);
  }

  const newTargetDist = distance(vec3ToArray(conOrbit.target), [0, 0, 0]);
  if (newTargetDist > 1.00002) {
    conOrbit.target.normalize();
  }
}

function easeFunc(t, b, c, d) {
  var ts = (t /= d) * t;
  var tc = ts * t;
  return b + c * (-1 * ts * ts + 4 * tc + -6 * ts + 4 * t);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
