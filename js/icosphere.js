var faceCache = [];
var vertexCache = [];
var geom;

function noise(position) {
  let value = 0;
  let noiseMaxHeight = 0;

  const layers = [];
  noiseNames.forEach(name => {
    layers.push([variables[name + "Density"], variables[name + "Height"]]);
  });

  // value += simplex.noise3D(...changePos(position, 0.5)) * 0.1;
  // const layers = [[0.5, 0.1], [1, 0.1], [3, 0.05], [10, 0.01]];

  layers.forEach(layer => {
    value += simplex.noise3D(...multiplyPos(position, layer[0])) * layer[1];
    noiseMaxHeight += layer[1];
  });

  value /= noiseMaxHeight;
  value *= variables.maxLevel;
  if (value < variables.minLevel) value = variables.minLevel;

  // return value * variables.maxLevel;
  return value;
}

function multiplyPos(position, value) {
  return [position[0] * value, position[1] * value, position[2] * value];
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

function color(height) {
  height = normalizeValue(height, variables.minLevel, variables.maxLevel);
  let sortedColors = sortedDictKeysFromVariables();

  for (let i = 0; i < sortedColors.length; i++) {
    if (height < variables[sortedColors[i] + "Level"]) {
      if (i == 0) {
        baseLevel = -1;
        baseColor = [0, 0, 0];
      } else {
        baseLevel = variables[sortedColors[i - 1] + "Level"];
        baseColor = variableToColorValue(variables[sortedColors[i - 1]]);
      }

      topLevel = variables[sortedColors[i] + "Level"];
      topColor = variableToColorValue(variables[sortedColors[i]]);

      return lerpRGB(
        baseColor,
        topColor,
        normalizeValue(height, baseLevel, topLevel)
      );
    }
  }

  return lerpRGB(
    variableToColorValue(variables[sortedColors[sortedColors.length - 1]]),
    [1, 1, 1],
    normalizeValue(
      height,
      variables[sortedColors[sortedColors.length - 1] + "Level"],
      1
    )
  );
}

function addNewNoise(density, height) {
  name = "noise" + noiseNames.length;
  variables[name + "Density"] = density;
  folder5.add(variables, name + "Density", 0.0, 10).step(0.01);

  variables[name + "Height"] = height;
  folder5.add(variables, name + "Height", 0.0, 1.0).step(0.01);

  noiseNames.push(name);
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

function normalizeValue(value, bottom, top) {
  return (value - bottom) / (top - bottom);
}

function variableToColorValue(variable) {
  return [
    normalizeValue(variable[0], 0, 255),
    normalizeValue(variable[1], 0, 255),
    normalizeValue(variable[2], 0, 255)
  ];
}

function lerpRGB(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

function initIcosphere() {
  geom = new THREE.Geometry();
  for (let i = 0; i < 50000; i++) {
    const face = new THREE.Face3(0, 0, 0);
    face.isFree = true;
    face.vertexColors[0] = new THREE.Color(0xff0000);
    face.vertexColors[1] = new THREE.Color(0xaa3300);
    face.vertexColors[2] = new THREE.Color(0xaa0033);
    geom.faces.push(face);

    const vertex = new THREE.Vector3(0, 0, 0);
    vertex.isFree = true;
    geom.vertices.push(vertex);
  }

  createIcosaherdron();

  var mat = new THREE.MeshBasicMaterial({
    vertexColors: THREE.VertexColors
  });

  var mesh = new THREE.Mesh(geom, mat);
  mesh.name = "Icosphere";

  addDetail(faceCache);
  addDetail(faceCache);
  addDetail(faceCache);
  addDetail(faceCache);

  return mesh;
}

function refreshIcosphere() {
  faceCache = [];
  vertexCache = [];
  geom.faces.forEach(face => {
    face.isFree = true;
    face.a = 0;
    face.b = 0;
    face.c = 0;
  });

  createIcosaherdron();

  addDetail(faceCache);
  addDetail(faceCache);
  addDetail(faceCache);
  addDetail(faceCache);
}

function createIcosaherdron() {
  const t = 0.5 + Math.sqrt(5) / 2;

  const baseVertices = [
    [-1, +t, 0],
    [+1, +t, 0],
    [-1, -t, 0],
    [+1, -t, 0],

    [0, -1, +t],
    [0, +1, +t],
    [0, -1, -t],
    [0, +1, -t],

    [+t, 0, -1],
    [+t, 0, +1],
    [-t, 0, -1],
    [-t, 0, +1]
  ];

  const baseFaces = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],

    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],

    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],

    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],

    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1]
  ];

  baseVertices.forEach(vertex => {
    createVertex(vertex, true, [undefined, undefined], undefined);
  });

  baseFaces.forEach(face => {
    createFace(face, undefined);
  });

  geom.elementsNeedUpdate = true;
}

function findNeighbours(cacheFace) {
  const parent = faceCache[cacheFace.parent];
  if (parent == undefined) return [];
  return faceCache.filter(face => {
    if (!face.isRendered) return false;
    found = false;
    for (let i = 0; i < 3; i++) {
      if (face.cacheVertices.includes(parent.cacheVertices[i])) {
        if (found) return found;
        found = true;
      }
    }
    return false;
  });
}

function createVertex(
  position,
  isStartVertex,
  parentVerts,
  firstParentFaceIndex
) {
  const cacheIndex = vertexCache.length;
  const vertex = geom.vertices[cacheIndex];
  vertex.x = position[0];
  vertex.y = position[1];
  vertex.z = position[2];
  let water = false;

  let normalizedNoise = undefined;
  let originalNoise = undefined;
  if (isStartVertex) {
    vertex.normalize();
    normalizedNoise = noise(vec3ToArray(vertex));
    normalizedPos = [
      vertex.x * (normalizedNoise + 1),
      vertex.y * (normalizedNoise + 1),
      vertex.z * (normalizedNoise + 1)
    ];
    vertex.set(...normalizedPos);
    normalized = true;
    originalPos = normalizedPos;
    originalNoise = normalizedNoise;
  } else {
    let firstParentNoise = undefined;
    let secondParentNoise = undefined;

    if (vertexCache[parentVerts[0]].normalized)
      firstParentNoise = vertexCache[parentVerts[0]].normalizedNoise;
    else firstParentNoise = vertexCache[parentVerts[0]].originalNoise;

    if (vertexCache[parentVerts[1]].normalized)
      secondParentNoise = vertexCache[parentVerts[1]].normalizedNoise;
    else secondParentNoise = vertexCache[parentVerts[1]].originalNoise;

    originalNoise = (firstParentNoise + secondParentNoise) / 2;

    normalizedPos = undefined;
    normalized = false;
    originalPos = position;
  }

  vertexCache.push({
    normalized: normalized,
    cacheIndex: cacheIndex,
    normalizedPos: normalizedPos,
    originalPos: originalPos,
    normalizedNoise: normalizedNoise,
    originalNoise: originalNoise,
    geometryIndex: cacheIndex,
    parentVerts: parentVerts,
    parentFaceA: [firstParentFaceIndex, true],
    parentFaceB: [undefined, false]
  });

  return cacheIndex;
}

function createFace(cacheVertices, parent) {
  const middlePos = midPosOf3Verts(
    vec3ToArray(geom.vertices[cacheVertices[0]]),
    vec3ToArray(geom.vertices[cacheVertices[1]]),
    vec3ToArray(geom.vertices[cacheVertices[2]])
  );

  const geometryIndex = findFirstFreeFaceIndex();
  const cacheIndex = faceCache.length;
  const face = geom.faces[geometryIndex];
  let depth = 0;

  if (parent != undefined) {
    depth = faceCache[parent].depth + 1;
  }

  for (let i = 0; i < 3; i++) {
    const cacheVertex = vertexCache[cacheVertices[i]];
    let height = 99;
    if (cacheVertex.normalized) {
      height = cacheVertex.normalizedNoise;
    } else {
      height = cacheVertex.originalNoise;
    }
    face.vertexColors[i].setRGB(
      height * 0.8 + 0.1,
      height + 0.1,
      height * 0.7 + 0.1
    );
  }

  face.isFree = false;
  face.a = cacheVertices[0];
  face.b = cacheVertices[1];
  face.c = cacheVertices[2];

  faceCache.push({
    cacheIndex: cacheIndex,
    geometryIndex: geometryIndex,
    cacheVertices: cacheVertices,
    parent: parent,
    middlePos: middlePos,
    children: [],
    isRendered: true,
    depth: depth,
    minDepth: depth,
    maxDepth: depth
  });

  return cacheIndex;
}

function addDetail(faces) {
  faces
    .filter(face => face.isRendered)
    .forEach(face => {
      if (face.isRendered) {
        subdivCacheFace(face);
      }
    });
}

function removeDetail() {
  faceCache
    .filter(
      cacheFace =>
        !cacheFace.isRendered &&
        cacheFace.children.length != 0 &&
        faceCache[cacheFace.children[0]].isRendered &&
        faceCache[cacheFace.children[1]].isRendered &&
        faceCache[cacheFace.children[2]].isRendered &&
        faceCache[cacheFace.children[3]].isRendered
    )
    .forEach(cacheFace => {
      undivCacheFace(cacheFace);
    });
}

function subdivCacheFace(cacheFace) {
  cacheFace.maxDepth += 1;
  cacheFace.minDepth += 1;
  increaseTreeDepth(cacheFace);

  findNeighbours(cacheFace).forEach(face => {
    subdivCacheFace(face);
  });

  if (cacheFace.children.length == 0) {
    const cacheIndex = cacheFace.cacheIndex;
    const parentIndex = cacheFace.cacheIndex;

    const a = cacheFace.cacheVertices[0];
    const b = cacheFace.cacheVertices[1];
    const c = cacheFace.cacheVertices[2];

    const ab = a < b ? midPoint(a, b, cacheIndex) : midPoint(b, a, cacheIndex);
    const bc = b < c ? midPoint(b, c, cacheIndex) : midPoint(c, b, cacheIndex);
    const ca = c < a ? midPoint(c, a, cacheIndex) : midPoint(a, c, cacheIndex);

    removeCacheFace(cacheFace);

    cacheFace.children = [
      createFace([a, ab, ca], parentIndex),
      createFace([ab, b, bc], parentIndex),
      createFace([ca, bc, c], parentIndex),
      createFace([ab, bc, ca], parentIndex)
    ];

    [ab, bc, ca].forEach(vertexId => {
      if (vertexCache[vertexId].parentFaceB[1]) {
        const parentA = faceCache[vertexCache[vertexId].parentFaceA[0]];
        parentA.children.forEach(childIndex => {
          const parentAChild = faceCache[childIndex];

          if (parentAChild.isRendered) {
            colorsNeedUpdate = true;
          } else if (parentAChild.children.length != 0) {
            parentAChild.children.forEach(childChildIndex => {
              const childChild = faceCache[childChildIndex];
              childChild.cacheVertices.forEach(vertexId => {});
            });
          }
        });
      }
    });
  } else {
    removeCacheFace(cacheFace);

    cacheFace.children.forEach(childIndex => {
      addCacheFace(faceCache[childIndex]);
      colorsNeedUpdate = true;
    });
  }
}

function increaseTreeDepth(cacheFace) {
  const cacheParent = faceCache[cacheFace.parent];
  if (cacheParent != undefined && cacheFace.maxDepth > cacheParent.maxDepth) {
    cacheParent.maxDepth = cacheFace.maxDepth;
    increaseTreeDepth(cacheParent);
  }
  if (
    cacheFace.depth != 0 &&
    faceCache[cacheParent.children[0]].minDepth >= cacheFace.minDepth &&
    faceCache[cacheParent.children[1]].minDepth >= cacheFace.minDepth &&
    faceCache[cacheParent.children[2]].minDepth >= cacheFace.minDepth &&
    faceCache[cacheParent.children[3]].minDepth >= cacheFace.minDepth
  ) {
    cacheParent.minDepth = cacheFace.minDepth;
  }
}

function undivCacheFace(cacheFace) {
  cacheFace.children.forEach(childIndex => {
    const face = faceCache[childIndex];
    removeCacheFace(face);
  });

  cacheFace.minDepth = cacheFace.depth;
  cacheFace.maxDepth = cacheFace.depth;
  lowerTreeDepth(cacheFace);
  addCacheFace(cacheFace);
  colorsNeedUpdate = true;
}

function lowerTreeDepth(cacheFace) {
  const cacheParent = faceCache[cacheFace.parent];
  if (
    cacheFace.depth != 0 &&
    faceCache[cacheParent.children[0]].minDepth >= cacheFace.minDepth &&
    faceCache[cacheParent.children[1]].minDepth >= cacheFace.minDepth &&
    faceCache[cacheParent.children[2]].minDepth >= cacheFace.minDepth &&
    faceCache[cacheParent.children[3]].minDepth >= cacheFace.minDepth
  ) {
    cacheParent.minDepth = cacheFace.minDepth;
    lowerTreeDepth(cacheParent);
  }
  if (
    cacheFace.depth != 0 &&
    faceCache[cacheParent.children[0]].maxDepth <= cacheFace.maxDepth &&
    faceCache[cacheParent.children[1]].maxDepth <= cacheFace.maxDepth &&
    faceCache[cacheParent.children[2]].maxDepth <= cacheFace.maxDepth &&
    faceCache[cacheParent.children[3]].maxDepth <= cacheFace.maxDepth
  ) {
    cacheParent.maxDepth = cacheFace.maxDepth;
    lowerTreeDepth(cacheParent);
  }
}

function midPoint(idA, idB, cacheFaceIndex) {
  const sameParents = vertexCache.filter(
    vertex => vertex.parentVerts[0] === idA && vertex.parentVerts[1] === idB
  );

  if (sameParents.length > 0) {
    const cacheVertex = sameParents[0];
    cacheVertex.parentFaceB = [cacheFaceIndex, true];
    normalizeVertex(cacheVertex);
    return cacheVertex.cacheIndex;
  }

  const index = createVertex(
    midPosOf2Verts(
      vec3ToArray(geom.vertices[idA]),
      vec3ToArray(geom.vertices[idB])
    ),
    false,
    [idA, idB],
    cacheFaceIndex
  );

  return index;
}

let distCalcs = 0;
let lenCalcs = 0;
let counter = 0;

function LOD(
  cameraPosVec,
  tesselationConstant,
  tessGive,
  tessZoomIn,
  tessZoomOut
) {
  counter += 1;
  const cameraPos = vec3ToArray(cameraPosVec);

  for (let i = 0; i < 20; i++) {
    const startFace = faceCache[i];

    LODRek(
      startFace,
      cameraPos,
      tesselationConstant,
      tessGive,
      tessZoomIn,
      tessZoomOut
    );
  }
}

function LODRek(
  cacheFace,
  cameraPos,
  tesselationConstant,
  tessGive,
  tessZoomIn,
  tessZoomOut
) {
  let pos = 0;
  pos = cacheFace.middlePos;
  pos = vec3ToArray(group.localToWorld(arrayToVec3(pos)));
  const faceDist = distance(cameraPos, pos);
  const minDepthEdgeLenghtView = Math.pow(0.5, cacheFace.minDepth) / faceDist;
  const maxDepthEdgeLenghtView =
    Math.pow(0.5, cacheFace.maxDepth - 1) / faceDist;
  distCalcs += 1;
  lenCalcs += 2;

  if (tessZoomIn && minDepthEdgeLenghtView > tesselationConstant + tessGive) {
    if (cacheFace.minDepth == cacheFace.depth) {
      if (cacheFace.minDepth > cacheFace.depth && children.length == 0) {
        throw new Error(
          "MyError: minDepth can't be higher than depth if face \
          does not have children"
        );
      }
      subdivCacheFace(cacheFace);
      geom.elementsNeedUpdate = true;
    } else {
      cacheFace.children.forEach(child => {
        LODRek(
          faceCache[child],
          cameraPos,
          tesselationConstant,
          tessGive,
          tessZoomIn,
          tessZoomOut
        );
      });
    }
  } else if (
    tessZoomOut &&
    maxDepthEdgeLenghtView < tesselationConstant - tessGive
  ) {
    if (
      cacheFace.children.length != 0 &&
      cacheFace.maxDepth == faceCache[cacheFace.children[0]].depth &&
      // alumisi ei tohiks vaja olla
      faceCache[cacheFace.children[0]].isRendered &&
      faceCache[cacheFace.children[1]].isRendered &&
      faceCache[cacheFace.children[2]].isRendered &&
      faceCache[cacheFace.children[3]].isRendered &&
      !cacheFace.isRendered
    ) {
      undivCacheFace(cacheFace);
      geom.elementsNeedUpdate = true;
    } else {
      cacheFace.children.forEach(child => {
        LODRek(
          faceCache[child],
          cameraPos,
          tesselationConstant,
          tessGive,
          tessZoomIn,
          tessZoomOut
        );
      });
    }
  }
}

function LODold(
  cameraPosVec,
  tesselationConstant,
  tessGive,
  tessZoomIn,
  tessZoomOut
) {
  counter += 1;
  const cameraPos = vec3ToArray(cameraPosVec);

  updateFrustum();
  updateCullingVectors();
  // faceCache
  findVisibleFaces(faceCache)
    .filter(
      cacheFace =>
        cacheFace.isRendered ||
        (cacheFace.children.length != 0 &&
          (faceCache[cacheFace.children[0]].isRendered &&
            faceCache[cacheFace.children[1]].isRendered &&
            faceCache[cacheFace.children[2]].isRendered &&
            faceCache[cacheFace.children[3]].isRendered))
    )
    .forEach(cacheFace => {
      const faceDist = distance(cameraPos, cacheFace.middlePos);
      distCalcs += 1;
      const faceEdgeLenght = Math.pow(0.5, cacheFace.depth) / faceDist;
      lenCalcs += 1;

      if (
        tessZoomIn &&
        cacheFace.isRendered &&
        faceEdgeLenght > tesselationConstant + tessGive
      ) {
        subdivCacheFace(cacheFace);
        geom.elementsNeedUpdate = true;
        // } else if (tessZoomOut && !cacheFace.isRendered) {
        //   console.log(900);
      } else if (
        tessZoomOut &&
        !cacheFace.isRendered &&
        cacheFace.children.length != 0 &&
        faceCache[cacheFace.children[0]].isRendered &&
        faceCache[cacheFace.children[1]].isRendered &&
        faceCache[cacheFace.children[2]].isRendered &&
        faceCache[cacheFace.children[3]].isRendered &&
        faceEdgeLenght < tesselationConstant - tessGive
      ) {
        undivCacheFace(cacheFace);
        geom.elementsNeedUpdate = true;
      }
    });
}

// simple functions
function findFirstFreeFaceIndex() {
  for (let i = 0; i < geom.faces.length; i++) {
    if (geom.faces[i].isFree) {
      return i;
    }
  }
  throw new Error("MyError: Geometry face array is full");
}

function removeCacheFace(cacheFace) {
  if (cacheFace.isRendered == false) {
    throw new Error("MyError: face should be rendered before removing it");
  }

  normalizeFace(cacheFace);
  cacheFace.isRendered = false;
  const geomFace = geom.faces[cacheFace.geometryIndex];
  geomFace.b = 0;
  geomFace.a = 0;
  geomFace.c = 0;
  cacheFace.geometryIndex = undefined;
  geomFace.isFree = true;
  // TODO: kui neid enam ei renderdata siis ei pea vist abc muutma
}

function addCacheFace(cacheFace) {
  deNormalizeFace(cacheFace);
  cacheFace.isRendered = true;
  cacheFace.geometryIndex = findFirstFreeFaceIndex();
  geom.faces[cacheFace.geometryIndex].isFree = false;
  // TODO: kui neid enam ei renderdata siis ei pea vist abc muutma
  const geomFace = geom.faces[cacheFace.geometryIndex];
  geomFace.b = cacheFace.cacheVertices[1];
  geomFace.a = cacheFace.cacheVertices[0];
  geomFace.c = cacheFace.cacheVertices[2];
}

function normalizeFace(cacheFace) {
  vertexCache.forEach(cacheVertex => {
    if (cacheVertex.parentFaceA[0] == cacheFace.cacheIndex) {
      cacheVertex.parentFaceA[1] = true;
      normalizeVertex(cacheVertex);
    } else if (cacheVertex.parentFaceB[0] == cacheFace.cacheIndex) {
      cacheVertex.parentFaceB[1] = true;
      normalizeVertex(cacheVertex);
    }
  });
}

function normalizeVertex(cacheVertex) {
  const vertex = geom.vertices[cacheVertex.geometryIndex];
  if (
    cacheVertex.parentFaceA[1] == true &&
    cacheVertex.parentFaceB[1] == true
  ) {
    if (cacheVertex.normalizedPos == undefined) {
      vertex.normalize();
      cacheVertex.normalizedNoise = noise(vec3ToArray(vertex));
      // console.log(cacheVertex.normalizedNoise);
      cacheVertex.water;
      cacheVertex.normalizedPos = [
        vertex.x * (cacheVertex.normalizedNoise + 1),
        vertex.y * (cacheVertex.normalizedNoise + 1),
        vertex.z * (cacheVertex.normalizedNoise + 1)
      ];
      vertex.set(...cacheVertex.normalizedPos);
    } else {
      vertex.x = cacheVertex.normalizedPos[0];
      vertex.y = cacheVertex.normalizedPos[1];
      vertex.z = cacheVertex.normalizedPos[2];
    }
    cacheVertex.normalized = true;
    geom.verticesNeedUpdate = true;
  }
}

function deNormalizeFace(cacheFace) {
  vertexCache.forEach(cacheVertex => {
    if (cacheVertex.parentFaceA[0] == cacheFace.cacheIndex) {
      cacheVertex.parentFaceA[1] = false;
      deNormalizeVertex(cacheVertex);
    } else if (cacheVertex.parentFaceB[0] == cacheFace.cacheIndex) {
      cacheVertex.parentFaceB[1] = false;
      deNormalizeVertex(cacheVertex);
    }
  });
}

function deNormalizeVertex(cacheVertex) {
  if (
    cacheVertex.parentFaceA[1] == false ||
    cacheVertex.parentFaceB[1] == false
  ) {
    const vertex = geom.vertices[cacheVertex.geometryIndex];
    vertex.x = cacheVertex.originalPos[0];
    vertex.y = cacheVertex.originalPos[1];
    vertex.z = cacheVertex.originalPos[2];
    cacheVertex.normalized = false;
  }
}

function distance(posA, posB) {
  const x = posA[0] - posB[0];
  const y = posA[1] - posB[1];
  const z = posA[2] - posB[2];
  return Math.sqrt(x * x + y * y + z * z);
}

function vecDistance(vecA, vecB) {
  const x = vecA.x - vecB.x;
  const y = vecA.y - vecB.y;
  const z = vecA.z - vecB.z;
  return Math.sqrt(x * x + y * y + z * z);
}

function midPosOf2Verts(vertexA, vertexB) {
  return [
    (vertexA[0] + vertexB[0]) * 0.5,
    (vertexA[1] + vertexB[1]) * 0.5,
    (vertexA[2] + vertexB[2]) * 0.5
  ];
}

function midPosOf3Verts(vertexA, vertexB, vertexC) {
  return [
    (vertexA[0] + vertexB[0] + vertexC[0]) * 0.33,
    (vertexA[1] + vertexB[1] + vertexC[1]) * 0.33,
    (vertexA[2] + vertexB[2] + vertexC[2]) * 0.33
  ];
}

function vec3ToArray(vector3) {
  return [vector3.x, vector3.y, vector3.z];
}

function arrayToVec3(array) {
  return new THREE.Vector3(array[0], array[1], array[2]);
}

function upDateColors() {
  faceCache
    .filter(face => face.isRendered)
    .forEach(face => simpleReColorFace(face));
  geom.colorsNeedUpdate = true;
  colorsNeedUpdate = false;
}

function simpleReColorFace(cacheFace) {
  const face = geom.faces[cacheFace.geometryIndex];
  for (let i = 0; i < 3; i++) {
    const cacheVertex = vertexCache[cacheFace.cacheVertices[i]];
    if (cacheVertex.normalized) height = cacheVertex.normalizedNoise;
    else height = cacheVertex.originalNoise;
    if (color(height) == undefined)
      throw new Error("MyError: color came out undefined");
    face.vertexColors[i].setRGB(...color(height));
  }
}

function markFace(cacheFace, colorArray) {
  const face = geom.faces[cacheFace.geometryIndex];
  for (let i = 0; i < 3; i++) {
    face.vertexColors[i].setRGB(...colorArray);
  }

  geom.colorsNeedUpdate = true;
}

function updateFrustum() {
  frustum.setFromMatrix(
    new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
  );
}

function updateCullingVectors() {
  geom.computeFaceNormals();
  cameraVector = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
}

function findVisibleFaces(faceArray) {
  // TODO: ilmselt for-loop kiirem
  return faceArray
    .filter(face => face.isRendered)
    .filter(face => {
      let frontSide = false;
      const normalVector = geom.faces[
        face.geometryIndex
      ].normal.applyQuaternion(icosphere.quaternion);
      if (normalVector.angleTo(cameraVector) > Math.PI / 2) frontSide = true;
      return frontSide;
    })
    .filter(face => {
      let inFrustum = false;
      face.cacheVertices.forEach(vertexId => {
        let vertex = vertexCache[vertexId];
        let pos = vertex.normalized ? vertex.normalizedPos : vertex.originalPos;
        if (frustum.containsPoint(arrayToVec3(pos))) inFrustum = true;
      });
      return inFrustum;
    })
    .filter(face => {
      if (
        face.depth > 4 &&
        vertexCache[face.cacheVertices[0]].normalizedNoise ==
          variables.minLevel &&
        vertexCache[face.cacheVertices[1]].normalizedNoise ==
          variables.minLevel &&
        vertexCache[face.cacheVertices[2]].normalizedNoise == variables.minLevel
      ) {
        return false;
      }
      return true;
    });
}
