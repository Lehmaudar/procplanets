var faceCache = [];
var vertexCache = [];
var geom;

const waterLevel = 0;

function noise(position) {
  let value = 0;
  let maxHeight = 0;

  // value += simplex.noise3D(...changePos(position, 0.5)) * 0.1;
  // value += simplex.noise3D(...changePos(position, 1)) * 0.1;
  // value += simplex.noise3D(...changePos(position, 3)) * 0.05;
  // value += simplex.noise3D(...changePos(position, 10)) * 0.01;

  const layers = [[0.5, 0.1], [1, 0.1], [3, 0.05], [10, 0.01]];

  layers.forEach(layer => {
    value += simplex.noise3D(...multiplyPos(position, layer[0])) * layer[1];
    maxHeight += layer[1];
  });
  value /= maxHeight;
  // console.log(maxHeight);

  // value *= 0.6;
  if (value < waterLevel) value = waterLevel;

  // v.z += noisefn(x * 0.003, y * 0.002) * heightScale + 6;
  // v.z += noisefn(x * 0.005, y * 0.005) * (heightScale / 2);
  // v.z += noisefn(x * 0.010, y * 0.010) * (heightScale / 4);
  // v.z += noisefn(x * 0.03, y * 0.03) * 2;
  // v.z += noisefn(x * 0.1, y * 0.1) * 0.7;
  // v.z *= 3;

  // console.log(value);
  return value;
}

function multiplyPos(position, value) {
  return [position[0] * value, position[1] * value, position[2] * value];
}

function icosphere() {
  geom = new THREE.Geometry();
  // const t = 0.5 + Math.sqrt(5) / 2; // TODO: test efficiency
  const t = 1.618;

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

  for (let i = 0; i < 50000; i++) {
    const face = new THREE.Face3(0, 0, 0);
    face.isFree = true;
    // face.color.setRGB(Math.random(), Math.random(), Math.random());
    face.vertexColors[0] = new THREE.Color(0xff0000); // red
    face.vertexColors[1] = new THREE.Color(0xaa3300); // green
    face.vertexColors[2] = new THREE.Color(0xaa0033); // blue
    geom.faces.push(face);

    const vertex = new THREE.Vector3(0, 0, 0);

    vertex.isFree = true;
    geom.vertices.push(vertex);
  }

  baseVertices.forEach(vertex => {
    createVertex(vertex, true, [undefined, undefined], undefined);
  });

  baseFaces.forEach(face => {
    createFace(face, undefined);
  });

  var mat = new THREE.MeshBasicMaterial({
    // wireframe: true,
    vertexColors: THREE.VertexColors
  });

  icosphere = new THREE.Mesh(geom, mat);
  icosphere.name = "Icosphere";
  scene.add(icosphere);

  // addDetail();
  // addDetail();
  // addDetail();
  // addDetail();
  // addDetail();

  subdivCacheFace(faceCache[0]);
  subdivCacheFace(faceCache[1]);

  // additional mesh with different material
  geom.computeVertexNormals();
  var helpMat = new THREE.MeshNormalMaterial({});
  helpIcosphere = new THREE.Mesh(geom, helpMat);
  helpIcosphere.name = "helpIcosphere";
  // scene.add(helpIcosphere);

  // reColorFace(faceCache[0]);
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
    originalNoise =
      (vertexCache[parentVerts[0]].normalizedNoise +
        vertexCache[parentVerts[1]].normalizedNoise) /
      2;
    // console.log(originalNoise);
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
    // TODO: change to parentA and parentB
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

  // const colorT = depth / 4;
  // let colors = [];
  // colors.push(Math.random() - 0.6 + 0.6 * colorT);
  // colors.push(Math.random() + 0.3 - 0.3 * colorT);
  // colors.push(Math.random() + 0.3 - 0.3 * colorT);
  // for (let i = 0; i < 3; i++) {
  //   if (colors[i] >= 1) colors[i] = Math.random() * 0.1 + 0.9;
  //   if (colors[i] <= 0) colors[i] = Math.random() * 0.1;
  // }
  // face.color.setRGB(...colors);

  // let value = (noise(middlePos) + 1) / 2;
  // value -= 0.4;
  // value *= 5;
  // // console.log(waterLevel);
  // // console.log(value, ((waterLevel + 1) / 2 - 0.4) * 5);
  // if (value === ((waterLevel + 1) / 2 - 0.4) * 5) {
  //   face.color.setRGB(value * 0.95, value * 0.95, value);
  // } else face.color.setRGB(value, value, value);

  for (let i = 0; i < 3; i++) {
    const cacheVertex = vertexCache[cacheVertices[i]];
    let height = 99;
    // height =
    //   distance(vec3ToArray(geom.vertices[cacheVertex.geometryIndex]), [
    //     0,
    //     0,
    //     0
    //   ]) - 1;
    // face.vertexColors[i].setRGB(height, height, height);

    // if (cacheVertex.normalized) {
    //   height = distance(cacheVertex.normalizedPos, [0, 0, 0]) - 1;
    // } else {
    //   height = distance(cacheVertex.originalPos, [0, 0, 0]) - 1;
    // }
    // face.vertexColors[i].setRGB(height, height, height);

    if (cacheVertex.normalized) {
      height = cacheVertex.normalizedNoise;
    } else {
      height = cacheVertex.originalNoise;
    }
    face.vertexColors[i].setRGB(height, height, height);
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

function addDetail() {
  faceCache
    .filter(face => face.isRendered)
    .forEach(face => {
      if (face.isRendered) {
        subdivCacheFace(face);
      }
    });

  // faceCache
  //   .filter(face => face.isRendered)
  //   .forEach(face => {
  //     if (face.isRendered) {
  //       reColorFace(face);
  //     }
  //   });
}

function removeDetail() {
  faceCache
    .filter(
      cacheFace =>
        !cacheFace.isRendered &&
        // cacheFace.geometryIndex == undefined &&
        cacheFace.children.length != 0 &&
        faceCache[cacheFace.children[0]].isRendered &&
        faceCache[cacheFace.children[1]].isRendered &&
        faceCache[cacheFace.children[2]].isRendered &&
        faceCache[cacheFace.children[3]].isRendered
    )
    .forEach(cacheFace => {
      undivCacheFace(cacheFace);
    });
  removeWeirdFaces();
}

function subdivCacheFace(cacheFace) {
  cacheFace.maxDepth += 1;
  cacheFace.minDepth += 1;
  increaseTreeDepth(cacheFace);
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

    // if ()
    const newVertices = [ab, bc, ca];
    newVertices.forEach(vertexId => {
      console.log(vertexCache[vertexId].parentFaceB[1]);
      console.log(vertexCache[vertexId].parentFaceB[0]);
      console.log(vertexCache[vertexId]);
      if (vertexCache[vertexId].parentFaceB[1]) {
        const parentB = faceCache[vertexCache[vertexId].parentFaceA[0]];
        parentB.children.forEach(childIndex => {
          console.log("asd");
          reColorFace(faceCache[childIndex]);
        });
      }
    });

    // if (vertexCache[ab].parentFaceB[1]) {
    //   const parentB = faceCache[vertexCache[ab].parentFaceB[0]];
    //   parentB.children.forEach(childIndex => {
    //     console.log("asd");
    //     reColorFace(faceCache[childIndex]);
    //   });
    // }

    // console.log(faceCache[vertexCache[ab].parentFaceB[0]].children);
    // faceCache[cacheVertex.parentFaceA[0]].children.forEach(childIndex => {
    //   console.log("asd");
    //   reColorFace(faceCache[childIndex]);
    // });

    // cacheFace.children.forEach(childIndex => {
    //   // console.log("asd");
    //   reColorFace(faceCache[childIndex]);
    // });
  } else {
    removeCacheFace(cacheFace);

    cacheFace.children.forEach(childIndex => {
      addCacheFace(faceCache[childIndex]);
      reColorFace(faceCache[childIndex]);
    });
  }
}

function increaseTreeDepth(cacheFace) {
  // console.log("increaseTreeDepth");
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
    removeCacheFace(faceCache[childIndex]);
  });

  cacheFace.minDepth = cacheFace.depth;
  cacheFace.maxDepth = cacheFace.depth;
  lowerTreeDepth(cacheFace);
  addCacheFace(cacheFace);
}

function lowerTreeDepth(cacheFace) {
  // console.log("lowerTreeDepth");
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

    console.log("asdasdasd");

    // console.log(faceCache[cacheVertex.parentFaceB[0]].children);
    // faceCache[cacheVertex.parentFaceA[0]].children.forEach(childIndex => {
    //   console.log("asd");
    //   reColorFace(faceCache[childIndex]);
    // });

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
  // if (counter % 600 == 0) {
  //   console.log(distCalcs, lenCalcs, counter);
  //   distCalcs = 0;
  //   lenCalcs = 0;
  // }
  counter += 1;
  const cameraPos = vec3ToArray(cameraPosVec);

  // console.log(distance(cameraPos, [0, 0, 0]));

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

  // geom.computeVertexNormals();
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
  // console.log(vec3ToArray(group.localToWorld(arrayToVec3(pos))));
  // console.log(arrayToVec3(pos), group.localToWorld(arrayToVec3(pos)));
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
  // if (counter % 600 == 0) {
  //   console.log(distCalcs, lenCalcs, counter);
  //   distCalcs = 0;
  //   lenCalcs = 0;
  // }
  counter += 1;
  const cameraPos = vec3ToArray(cameraPosVec);
  const meshDist = distance(cameraPos, [0, 0, 0]);
  // TODO: mby use this for not generating backside

  faceCache
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

  removeWeirdFaces();
}

function removeWeirdFaces() {
  for (let i = 0; i < faceCache.length; i++) {
    const cacheFace = faceCache[i];
    if (
      cacheFace.isRendered &&
      faceCache[cacheFace.parent] != undefined &&
      faceCache[cacheFace.parent].maxDepth < cacheFace.depth
    ) {
      removeCacheFace(cacheFace);
      console.log("removeWeirdFaces() REMOVED");
    }
  }
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
  // TODO: isFree tagasi
  // geomFace.isFree = true;
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
  // TODO: iterateb läbi terve cache (vb aeglane)

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

function reColorFace(cacheFace) {
  const face = geom.faces[cacheFace.geometryIndex];
  // console.log("");
  // console.log(cacheFace);
  // console.log(face);
  // console.log(cacheFace.cacheIndex);

  for (let i = 0; i < 3; i++) {
    const cacheVertex = vertexCache[cacheFace.cacheVertices[i]];

    // if (cacheVertex.normalized) {
    //   height = distance(cacheVertex.normalizedPos, [0, 0, 0]) - 1;
    // } else {
    //   height = distance(cacheVertex.originalPos, [0, 0, 0]) - 1;
    // }
    // face.vertexColors[i].setRGB(1, 0, 0);

    if (cacheVertex.normalized) {
      height = cacheVertex.normalizedNoise;
      // console.log("Normalized: ", cacheFace.cacheVertices[i]);
    } else {
      height = cacheVertex.originalNoise;
      // console.log("NOT Normalized: ", cacheFace.cacheVertices[i]);
    }
    face.vertexColors[i].setRGB(height, height, height);
    // face.vertexColors[i].setRGB(1, 0, 0);
  }

  // geom.colorsNeedUpdate = true;
}
