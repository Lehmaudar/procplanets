var faceCache = [];
var vertexCache = [];
var geom;

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

  for (let i = 0; i < 100000; i++) {
    const face = new THREE.Face3(0, 0, 0);
    face.isFree = true;
    geom.faces.push(face);

    const vertex = new THREE.Vector3(0, 0, 0);
    vertex.isFree = true;
    geom.vertices.push(vertex);
  }

  baseVertices.forEach(vertex => {
    createVertex(vertex, true, [-1, -1]);
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

  for (let i = 0; i < 0; i++) {
    // TODO: why error here with old addDetail and i < 2
    addDetail();
  }
  // removeDetail();

  // additional mesh with different material
  geom.computeVertexNormals();
  var helpMat = new THREE.MeshNormalMaterial({});
  helpIcosphere = new THREE.Mesh(geom, helpMat);
  helpIcosphere.name = "helpIcosphere";
  // scene.add(helpIcosphere);

  geom.computeVertexNormals();
}

function createVertex(position, normalize, parents) {
  const cacheIndex = vertexCache.length;
  const vertex = geom.vertices[cacheIndex];
  vertex.x = position[0];
  vertex.y = position[1];
  vertex.z = position[2];

  if (normalize) {
    vertex.normalize();
    normalizedPos = [vertex.x, vertex.y, vertex.z];
    originalPosition = undefined;
  } else {
    normalizedPos = undefined;
    originalPosition = position;
  }

  vertexCache.push({
    cacheIndex: cacheIndex,
    normalizedPos: normalizedPos,
    originalPosition: position,
    vertex: vertex,
    // TODO: change to parentA and parentB
    parents: parents
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

  const colorT = depth / 4;
  face.color.setRGB(
    Math.random() - 0.6 + 0.6 * colorT,
    Math.random() + 0.3 - 0.3 * colorT,
    Math.random() + 0.3 - 0.3 * colorT
  );

  face.isFree = false;
  face.a = cacheVertices[0];
  face.b = cacheVertices[1];
  face.c = cacheVertices[2];
  // face.vertexColors.push(new THREE.Color(0xff00ff));
  // face.vertexColors.push(new THREE.Color(0xff00ff));
  // face.vertexColors.push(new THREE.Color(0xff00ff));

  faceCache.push({
    cacheIndex: cacheIndex,
    geometryIndex: geometryIndex,
    cacheVertices: cacheVertices,
    // face: face,
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
    // const face = cacheFace.face;
    const parentIndex = cacheFace.cacheIndex;

    // const a = face.a;
    // const b = face.b;
    // const c = face.c;
    const a = cacheFace.cacheVertices[0];
    const b = cacheFace.cacheVertices[1];
    const c = cacheFace.cacheVertices[2];
    const ab = midPoint(a, b);
    const bc = midPoint(b, c);
    const ca = midPoint(c, a);

    removeCacheFace(cacheFace);

    cacheFace.children = [
      createFace([a, ab, ca], parentIndex),
      createFace([ab, b, bc], parentIndex),
      createFace([ca, bc, c], parentIndex),
      createFace([ab, bc, ca], parentIndex)
    ];
  } else {
    removeCacheFace(cacheFace);

    cacheFace.children.forEach(childIndex => {
      addCacheFace(faceCache[childIndex]);
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
    faceCache[cacheParent.children[0]].maxDepth >= cacheFace.maxDepth &&
    faceCache[cacheParent.children[1]].maxDepth >= cacheFace.maxDepth &&
    faceCache[cacheParent.children[2]].maxDepth >= cacheFace.maxDepth &&
    faceCache[cacheParent.children[3]].maxDepth >= cacheFace.maxDepth
  ) {
    cacheParent.maxDepth = cacheFace.maxDepth;
    lowerTreeDepth(cacheParent);
  }
}

function midPoint(idA, idB) {
  const sameParents = vertexCache.filter(vertex =>
    idA < idB
      ? vertex.parents[0] === idA && vertex.parents[1] === idB
      : vertex.parents[0] === idB && vertex.parents[1] === idA
  );

  if (sameParents.length > 0) {
    normalizeVertex(sameParents[0]);
    return sameParents[0].cacheIndex;
  }

  const index = createVertex(
    midPosOf2Verts(
      vec3ToArray(geom.vertices[idA]),
      vec3ToArray(geom.vertices[idB])
    ),
    false,
    idA < idB ? [idA, idB] : [idB, idA]
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
  if (counter == 60) {
    console.log(distCalcs, lenCalcs, counter);
  }
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
  const faceDist = distance(cameraPos, cacheFace.middlePos);
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
      // console.log("paha");
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
  //  else if (
  //   tessZoomOut &&
  //   !cacheFace.isRendered &&
  //   cacheFace.children.length != 0 &&
  //   faceCache[cacheFace.children[0]].isRendered &&
  //   faceCache[cacheFace.children[1]].isRendered &&
  //   faceCache[cacheFace.children[2]].isRendered &&
  //   faceCache[cacheFace.children[3]].isRendered &&
  //   faceEdgeLenght < tesselationConstant - tessGive
  // ) {
  //   undivCacheFace(cacheFace);
  //   geom.elementsNeedUpdate = true;
  // }
}

function LODold(
  cameraPosVec,
  tesselationConstant,
  tessGive,
  tessZoomIn,
  tessZoomOut
) {
  if (counter == 60) {
    console.log(distCalcs, lenCalcs, counter);
  }
  counter += 1;
  const cameraPos = vec3ToArray(cameraPosVec);
  const meshDist = distance(cameraPos, [0, 0, 0]);
  // TODO: mby use this for not generating backside
  // TODO: SEE POLE JU ISEGI TREE STRUKTUURIGA????

  // for (let i = 0; i < faceCache.length; i++) {
  for (let i = 0; i < 1; i++) {
    const cacheFace = faceCache[i];
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
  }

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
  cacheFace.isRendered = true;
  cacheFace.geometryIndex = findFirstFreeFaceIndex();
  geom.faces[cacheFace.geometryIndex].isFree = false;
  // TODO: kui neid enam ei renderdata siis ei pea vist abc muutma
  const geomFace = geom.faces[cacheFace.geometryIndex];
  geomFace.b = cacheFace.cacheVertices[1];
  geomFace.a = cacheFace.cacheVertices[0];
  geomFace.c = cacheFace.cacheVertices[2];
}

function normalizeVertex(cacheVertex) {
  if (cacheVertex.normalizedPos === undefined) {
    cacheVertex.vertex.normalize();
    cacheVertex.normalizedPos = [
      cacheVertex.vertex.x,
      cacheVertex.vertex.y,
      cacheVertex.vertex.z
    ];
  }
}

function distance(posA, posB) {
  const x = posA[0] - posB[0];
  const y = posA[1] - posB[1];
  const z = posA[2] - posB[2];
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
