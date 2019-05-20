function initControls() {
  document.body.onkeyup = e => {
    // culling - f
    if (e.keyCode == 70) {
      updateFrustum();
      updateCullingVectors();
      findVisibleFaces(faceCache).forEach(face => {
        markFace(face, [0, 0, 1]);
      });
      geom.colorsNeedUpdate = true;
    }

    // update colors - s
    if (e.keyCode == 83) upDateColors();

    // testing - i
    if (e.keyCode == 73) {
    }

    // testing - p
    if (e.keyCode == 80) {
      if (conOrbit.enabled) {
        setPointerControls();
      } else {
        setOrbitControls();
      }
    }

    // camera travel - space
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

      camera.fov = tweens.fov;
      camera.updateProjectionMatrix();
    })
    .onComplete(() => {
      conOrbit.enabled = true;
      // pointer.visible = true;
      // console.log(camera.rotation);
    });
  upTween.start();
}

function toGround() {
  // pointer.visible = false;
  onGround = true;
  if (upTween == undefined || !upTween._isPlaying) {
    skyPos.copy(camera.position);
    skyRot.copy(camera.rotation);
  }

  if (upTween != undefined) upTween.stop();
  conOrbit.enabled = false;
  // pointer.material.color.setRGB(0.7, 0.9, 0.7);

  targetQuarternion = new THREE.Quaternion().copy(pointer.quaternion);
  targetMesh = new THREE.Mesh().copy(pointer);
  // camera.lookAt(targetMesh.position);
  // console.log(targetMesh.position);
  // console.log(multiplyPos(vec3ToArray(targetMesh.position), 2));
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
      3000
    )
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => {
      camera.position.set(tweens.x, tweens.y, tweens.z);
      // camera.rotation.set(tweens.xR, tweens.yR, tweens.zR);
      // camera.up.set(...multiplyPos(vec3ToArray(targetMesh.position), 2));
      // camera.lookAt(...multiplyPos(vec3ToArray(targetMesh.position), 1.001));
      // camera.quaternion.slerp(targetQuarternion, tweens.t);

      camera.fov = tweens.fov;
      camera.updateProjectionMatrix();
    })
    .onComplete(() => {
      setPointerControls();
    });
  downTween.start();
}

function setupControls() {
  conPointer = new THREE.PointerLockControls(orgCamera);
  conPointer.speedFactor = 0.1;
  camera = conPointer.getObject();

  conOrbit = new THREE.TrackballControls(camera, renderer.domElement);
  conOrbit.maxDistance = 40;
  conOrbit.enabled = false;
}

function setPointerControls() {
  conOrbit.enabled = false;
  // pointer.visible = false;
  conPointer.lock();
}

function setOrbitControls() {
  conPointer.unlock();
  conOrbit.enabled = true;
  // pointer.visible = true;
  controls = conOrbit;
}

var asd = 0;

function smootherControls() {
  // pointer.lookAt(0, 0, 0);
  // pointer.lookAt(...multiplyPos(vec3ToArray(pointer.position), 2));

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

function generateInfo(visible) {
  if (visible) {
    [...document.getElementsByTagName("span")].forEach(span => {
      if (span.textContent == "generate")
        generateRect = span.getBoundingClientRect();
    });
    document.getElementById("generate").style.visibility = "visible";
    document.getElementById("generate").style.top = generateRect.top + 8 + "px";
    document.getElementById("generate").style.left =
      generateRect.left - 145 + "px";
  } else {
    document.getElementById("generate").style.visibility = "hidden";
  }
}

function addNewNoise(density, height) {
  name = "noise" + noiseNames.length;
  variables[name + "Density"] = density;
  folder5
    .add(variables, name + "Density", 0.0, 10)
    .step(0.01)
    .onChange(() => {
      generateInfo(true);
    });

  variables[name + "Height"] = height;
  folder5
    .add(variables, name + "Height", 0.0, 1.0)
    .step(0.01)
    .onChange(() => {
      generateInfo(true);
    });

  noiseNames.push(name);

  generateInfo(true);
}

function addNewColor(color, level) {
  name = "color" + colorNames.length;
  variables[name] = color;
  folder3.addColor(variables, name).onChange(() => {
    upDateColors();
  });

  variables[name + "Level"] = level;
  folder3
    .add(variables, name + "Level", 0.0, 1.0)
    .step(0.01)
    .onChange(() => {
      upDateColors();
    });

  colorNames.push(name);
}

function sortedDictKeysFromVariables() {
  const colors = {};
  colorNames.forEach(name => {
    colors[variables[name + "Level"]] = name;
  });

  const sortedColors = [];
  Object.keys(colors)
    .sort()
    .forEach(key => {
      sortedColors.push(colors[key]);
    });
  return sortedColors;
}

function randomize() {
  variables.seed = Math.random() * 50;
  simplex = new SimplexNoise(variables.seed);

  for (let i = 0; i < colorNames.length; i++) {
    variables[colorNames[i]] = [
      Math.random() * 255,
      Math.random() * 255,
      Math.random() * 255
    ];
    variables[colorNames[i] + "Level"] = Math.random();
  }
  // upDateColors();

  variables.maxLevel = Math.random();
  variables.minLevel = Math.random() * variables.maxLevel - variables.maxLevel;

  refreshIcosphere();
}
