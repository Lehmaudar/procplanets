var downTweens = [];
var upTweens = [];
var closestDist;
var curvePoints;
var splineTweens = {
  t: 0,
  fov: 15
};
const travelTime = 2000;

function initControls() {
  splineMesh = new THREE.Line(
    new THREE.Geometry(),
    new THREE.LineBasicMaterial({ color: 0x00ff00 })
  );

  document.body.onkeyup = e => {
    // culling - f
    if (e.keyCode == 85) {
      updateFrustum();
      updateCullingVectors();
      findVisibleFaces(faceCache).forEach(face => {
        markFace(face, [0, 0, 1]);
      });
      geom.colorsNeedUpdate = true;
    }

    // update colors - s
    if (e.keyCode == 89) upDateColors();

    // testing - i
    if (e.keyCode == 73) {
    }

    // testing - p
    if (e.keyCode == 80 && goingToGround) setPointerControls();
    if (e.keyCode == 79 && !goingToGround) setOrbitControls();

    // camera travel - space
    if (e.keyCode == 32) {
      if (onGround) toSky();
      else if (inSky) toGround();
    }
  };

  setupControls();
  setOrbitControls();

  // prettier-ignore
  presets.earth = [
    41,
    [ [[59, 97, 188], 0.0],
      [[210, 203, 94], 0.01],
      [[71, 155, 53], 0.2],
      [[255, 255, 255], 1] ],
      [[0.6, 1], [1.3, 0.9], [6, 0.2]], 0.3, 0
  ];
  // prettier-ignore
  presets.sun = [
    15,
    [ [[240, 93, 13], 0.0],
      [[210, 210, 28], 0.5],
      [[255, 250, 229], 0.7],
      [[255, 255, 255], 1]],
      [[1, 1], [7.18, 0.7], [3, 0.7]], 0.01, -0.01
  ];
  // prettier-ignore
  presets.mars = [
    44,
    [ [[195, 100, 34], 0],
      [[188, 93, 43], 0.3],
      [[233, 111, 27], 0.57],
      [[110, 69, 63], 1]],
      [[1, 0.8], [5, 0.2], [1.5, 0.3]], 0.01, -0.01
  ];
}

function toSky() {
  goingToGround = false;

  setOrbitControls();
  conOrbit.enabled = false;

  downTweens.forEach(tween => {
    tween.stop();
  });

  const splineRotTween = new TWEEN.Tween(camera.rotation)
    .to({ x: -Math.PI / 2, y: 0, z: 0 }, travelTime)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onComplete(() => {
      splineTween.start();
    });

  const splineTween = new TWEEN.Tween(splineTweens)
    .to({ t: 0, fov: 15 }, travelTime)
    .easing(TWEEN.Easing.Sinusoidal.InOut)
    .onUpdate(() => {
      camera.position.copy(curvePoints[Math.trunc(splineTweens.t)]);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      camera.fov = splineTweens.fov;
      camera.updateProjectionMatrix();
    })
    .onComplete(() => {
      setOrbitControls();
      inSky = true;
    });

  upTweens.push(splineRotTween);
  upTweens.push(splineTween);

  if (onGround) splineRotTween.start();
  else splineTween.start();

  onGround = false;
}

function toGround() {
  goingToGround = true;
  inSky = false;

  upTweens.forEach(tween => {
    tween.stop();
  });
  conOrbit.enabled = false;

  closestIsFinal = false;
  closestAxePos = new THREE.Vector3(0, 0, 0);
  for (let i = 0; i < skyAxeArray.length; i++) {
    if (
      vecDistance(camera.position, skyAxeArray[i].position) <
      vecDistance(camera.position, closestAxePos)
    ) {
      if (i == 1) closestIsFinal = true;
      else closestIsFinal = false;
      closestDist = vecDistance(camera.position, skyAxeArray[i].position);
      closestAxePos = skyAxeArray[i].position;
    }
  }

  var groundPos;
  const raycaster = new THREE.Raycaster();
  raycaster.set(skyAxe.position, new THREE.Vector3(0, -1, 0));
  raycaster.intersectObject(icosphere).forEach(intersection => {
    groundPos = intersection.point;
  });
  groundPos.y = groundPos.y += 0.005;

  // prettier-ignore
  var points = [
    camera.position,
    closestAxePos,
    new THREE.Vector3(
      ...multiplyPos(
        midPosOf2Verts(vec3ToArray(skyAxe.position),
        midPosOf2Verts(vec3ToArray(skyAxe.position),
        midPosOf2Verts(vec3ToArray(skyAxe.position),
                       vec3ToArray(closestAxePos)))),
        1.5
      )
    ),
    groundPos
  ];
  var curve = new THREE.CatmullRomCurve3(points);
  curvePoints = curve.getPoints(travelTime);
  // splineMesh.spline = curve;
  // splineMesh.geometry.vertices = curve.getPoints(40);
  // splineMesh.geometry.verticesNeedUpdate = true;

  const splineTween = new TWEEN.Tween(splineTweens)
    .to({ t: travelTime, fov: 60 }, travelTime)
    .easing(TWEEN.Easing.Sinusoidal.InOut)
    .onUpdate(() => {
      camera.position.copy(curvePoints[Math.trunc(splineTweens.t)]);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      camera.fov = splineTweens.fov;
      camera.updateProjectionMatrix();
    })
    .onComplete(() => {
      splineRotTween.start();
    });
  splineTween.start();

  const splineRotTween = new TWEEN.Tween(camera.rotation)
    .to({ x: 0, y: Math.PI / 2, z: 0 }, 1000)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onComplete(() => {
      setPointerControls();
      updateInfo();
      onGround = true;
    });

  downTweens.push(splineRotTween);
  downTweens.push(splineTween);
}

function setupControls() {
  const orgCamera = new THREE.PerspectiveCamera(
    15,
    window.innerWidth / window.innerHeight,
    0.0001,
    50
  );
  orgCamera.position.set(0, 0, 15);
  conPointer = new THREE.PointerLockControls(orgCamera);
  conPointer.speedFactor = 0.1;
  camera = conPointer.getObject();

  conOrbit = new THREE.TrackballControls(camera, renderer.domElement);
  conOrbit.maxDistance = 35;
  conOrbit.enabled = false;
}

function setPointerControls() {
  conPointer.lock();
  conPointer.isLocked = false;
  conOrbit.enabled = false;
}

function setOrbitControls() {
  conPointer.unlock();
  conOrbit.enabled = true;
}

var asd = 0;

function smootherControls() {
  const oldCameraPos = vec3ToArray(camera.position);
  const oldCameraRot = vec3ToArray(camera.rotation);
  const oldCameraDist = distance(oldCameraPos, [0, 0, 0]);

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

function updateInfo() {
  if (onGround || inSky) document.getElementById("travel").style.opacity = "1";
  else document.getElementById("travel").style.opacity = "0.";
  if (conPointer.isLocked && onGround)
    document.getElementById("exitpointer").style.opacity = "1";
  else document.getElementById("exitpointer").style.opacity = "0.";
  if (!conPointer.isLocked && onGround)
    document.getElementById("enterpointer").style.opacity = "1";
  else document.getElementById("enterpointer").style.opacity = "0.";
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

function setRandom() {
  const seed = Math.random() * 50;
  const colors = [];
  const noiseLayers = [];
  const maxLevel = Math.random() * 0.5;
  const minLevel = Math.random() * variables.maxLevel - variables.maxLevel;

  for (_ in colorNames) {
    colors.push([
      [Math.random() * 255, Math.random() * 255, Math.random() * 255],
      Math.random()
    ]);
  }

  noiseStep = 0;
  for (let i = 0; i < noiseNames.length; i++) {
    noiseLayers.push([
      (Math.random() * 10 * (i + 1)) / noiseNames.length,
      Math.random() * (1 - i / noiseNames.length)
    ]);
  }

  setPreset(seed, colors, noiseLayers, maxLevel, minLevel);
}

function setPreset(seed, colors, noiseLayers, maxLevel, minLevel) {
  colors.sort((a, b) => {
    return a[1] - b[1];
  });
  noiseLayers.sort((a, b) => {
    return b[1] - a[1];
  });

  variables.seed = seed;
  simplex = new SimplexNoise(variables.seed);

  for (let i = 0; i < colorNames.length; i++) {
    if (i < colors.length) {
      variables[colorNames[i]] = colors[i][0];
      variables[colorNames[i] + "Level"] = colors[i][1];
    } else {
      variables[colorNames[i]] = [0, 0, 0];
      variables[colorNames[i] + "Level"] = 1.1;
    }
  }

  for (let i = 0; i < noiseNames.length; i++) {
    if (i < noiseLayers.length) {
      variables[noiseNames[i] + "Density"] = noiseLayers[i][0];
      variables[noiseNames[i] + "Height"] = noiseLayers[i][1];
    } else {
      variables[noiseNames[i] + "Density"] = 0;
      variables[noiseNames[i] + "Height"] = 0;
    }
  }

  variables.maxLevel = maxLevel;
  variables.minLevel = minLevel;

  function refreshGui(object) {
    Object.keys(object.__folders).forEach(folderName => {
      const folder = object.__folders[folderName];
      Object.keys(folder.__controllers).forEach(controllerName => {
        const controller = folder.__controllers[controllerName];
        controller.updateDisplay();
      });
      refreshGui(folder);
    });
  }

  refreshGui(gui);
  refreshIcosphere();
}

function datGui() {
  var Variables = function() {
    this.wireframe = false;
    this.axes = false;
    this.vertexColors = true;

    this.tessConstant = 12;
    this.tessGive = 0;
    this.tessZoomIn = false;
    this.tessZoomOut = false;
    this.addDetail = () => {
      t0 = performance.now();
      addDetail(faceCache, false);
      icosphere.geometry.elementsNeedUpdate = true;
      t1 = performance.now();
      console.log("AddDetail took " + (t1 - t0) + " milliseconds.");
    };
    this.addDetailOptimized = () => {
      t0 = performance.now();
      addDetail(findVisibleFaces(faceCache), true);
      icosphere.geometry.elementsNeedUpdate = true;
      t1 = performance.now();
      console.log("AddDetailOpt took " + (t1 - t0) + " milliseconds.");
    };
    this.removeDetail = () => {
      t0 = performance.now();
      removeDetail();
      icosphere.geometry.elementsNeedUpdate = true;
      t1 = performance.now();
      console.log("RemoveDetail took " + (t1 - t0) + " milliseconds.");
    };

    this.addNewColor = function() {
      addNewColor([212, 10, 10], Math.random());
      refreshIcosphere();
    };

    this.seed = 41;
    this.addNewNoise = function() {
      addNewNoise(Math.random(), 1);
    };
    this.maxLevel = 0.2;
    this.minLevel = 0;
    this.generate = () => {
      refreshIcosphere();
      generateInfo(false);
    };

    this.randomize = () => {
      setRandom();
    };

    this.Earth = () => {
      setPreset(...presets.earth);
    };
    this.Sun = () => {
      setPreset(...presets.sun);
    };
    this.Mars = () => {
      if (colorNames.length < 4) {
        addNewColor([0, 0, 0], 0);
      }
      setPreset(...presets.mars);
    };
  };

  variables = new Variables();
  gui = new dat.GUI();

  gui.add(variables, "randomize");
  folder1 = gui.addFolder("Appearance");
  folder2 = gui.addFolder("Tesselation");
  folder3 = gui.addFolder("Colors");
  folder4 = gui.addFolder("Terrain");
  folder5 = folder4.addFolder("Noise");
  folder6 = folder4.addFolder("Height");
  folder7 = gui.addFolder("Presets");
  folder3.open();
  folder5.open();
  folder6.open();

  folder2.add(variables, "tessConstant", 0.01, 20);
  // folder2.add(variables, "tessGive", 0, 10);
  folder2.add(variables, "tessZoomIn");
  // folder2.add(variables, "tessZoomOut");
  // folder2.add(variables, "useTreeStruc");
  folder2.add(variables, "addDetail");
  folder2.add(variables, "addDetailOptimized");
  folder2.add(variables, "removeDetail");
  folder1.add(variables, "wireframe").onChange(value => {
    icosphere.material.wireframe = value;
  });
  folder1.add(variables, "axes").onChange(value => {
    value ? (axes.visible = true) : (axes.visible = false);
  });
  folder1.add(variables, "vertexColors").onChange(value => {
    value
      ? (icosphere.material.vertexColors = 1)
      : (icosphere.material.vertexColors = 0);
    icosphere.material.needsUpdate = true;
  });

  folder3.add(variables, "addNewColor");

  folder5.add(variables, "seed", 0, 50).onChange(value => {
    simplex = new SimplexNoise(value);
    generateInfo(true);
  });
  folder5.add(variables, "addNewNoise");
  folder6
    .add(variables, "maxLevel", 0.01, 1)
    .step(0.01)
    .onChange(value => {
      if (value < Math.abs(variables.minLevel))
        variables.minLevel = -variables.maxLevel;
      generateInfo(true);
    });

  folder6
    .add(variables, "minLevel", -1, 0)
    .step(0.01)
    .onChange(value => {
      if (Math.abs(value) > variables.maxLevel)
        variables.minLevel = -variables.maxLevel;
      generateInfo(true);
    })
    .listen();
  folder4.add(variables, "generate");

  folder7.add(variables, "Sun");
  folder7.add(variables, "Earth");
  folder7.add(variables, "Mars");

  return variables;
}
