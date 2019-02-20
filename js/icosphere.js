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
    wireframe: true
  });

  icosphere = new THREE.Mesh(geom, mat);
  scene.add(icosphere);

  // addDetail(geom);

  // additional mesh with different material
  // geom.verticesNeedUpdate = true;
  // geom.computeVertexNormals();
  var helpMat = new THREE.MeshNormalMaterial({});
  helpIcosphere = new THREE.Mesh(geom, helpMat);
  // scene.add(helpIcosphere);
}

function findFirstFreeFaceIndex() {
  for (let i = 0; i < geom.faces.length; i++) {
    if (geom.faces[i].isFree) {
      return i;
    }
  }
  throw new Error("MyError: Geometry face array is full");
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

// creating a tree for keeping stock of faces and their hierarchy
function createFace(vertIndices, parent) {
  const middlePos = midPosOf3Verts(
    vec3ToArray(geom.vertices[vertIndices[0]]),
    vec3ToArray(geom.vertices[vertIndices[1]]),
    vec3ToArray(geom.vertices[vertIndices[2]])
  );

  const geomIndex = findFirstFreeFaceIndex();
  const cacheIndex = faceCache.length;
  const face = geom.faces[geomIndex];
  face.isFree = false;
  face.a = vertIndices[0];
  face.b = vertIndices[1];
  face.c = vertIndices[2];

  faceCache.push({
    cacheIndex: cacheIndex,
    geomIndex: geomIndex,
    vertices: vertIndices,
    face: face,
    parent: parent,
    middlePos: middlePos,
    children: [],
    isRendered: true
  });

  return cacheIndex;
}

// basic subdivsion
function addDetail() {
  for (let i = 0; i < 1; i++) {
    const startFaces = faceCache.filter(face => face.isRendered === true);
    // for (let j = 0; j < 2; j++) {
    for (let j = 0; j < startFaces.length; j++) {
      // addDetailToFace(geom, startFaces[j]);
      subdivCacheFace(startFaces[j], 1);
    }
    // console.log(startFaces);
  }
}

function subdivCacheFace(cacheFace) {
  // console.log(cacheFace);
  const face = cacheFace.face;
  const parentIndex = cacheFace.cacheIndex;

  const a = face.a;
  const b = face.b;
  const c = face.c;
  const ab = midPoint(a, b, geom.vertices[a], geom.vertices[b]);
  const bc = midPoint(b, c, geom.vertices[b], geom.vertices[c]);
  const ca = midPoint(c, a, geom.vertices[c], geom.vertices[a]);

  removeFace(cacheFace);

  cacheFace.children = [
    createFace([a, ab, ca], parentIndex),
    createFace([ab, b, bc], parentIndex),
    createFace([ca, bc, c], parentIndex),
    createFace([ab, bc, ca], parentIndex)
  ];
}

function midPoint(idA, idB, vertexA, vertexB) {
  // const parents = id1 < id2 ? `k_${id1}_${id2}` : `k_${id2}_${id1}`;
  const sameParents = vertexCache.filter(vertex =>
    idA < idB
      ? vertex.parents[0] === idA && vertex.parents[1] === idB
      : vertex.parents[0] === idB && vertex.parents[1] === idA
  );

  if (sameParents.length > 0) {
    // console.log(sameParents);
    normalizeVertex(sameParents[0]);
    return sameParents[0].cacheIndex;
  }

  const index = createVertex(
    midPosOf2Verts(vec3ToArray(vertexA), vec3ToArray(vertexB)),
    false,
    // TODO: use parent uuids
    idA < idB ? [idA, idB] : [idB, idA]
  );

  return index;
}

function getFaceFromCache(uuid) {
  return faceCache.find(face => face.uuid === uuid);
}

let count = 5;
let sleepDate = Date.now() + 3000;

function LOD(cameraPos) {
  if (count > 0 && sleepDate < Date.now()) {
    addDetail();

    geom.elementsNeedUpdate = true;

    sleepDate += 1000;
    count -= 1;
  }
}

// simple functions
function removeFace(cacheFace) {
  cacheFace.face.isFree = true;
  cacheFace.isRendered = false;
  cacheFace.geomIndex = undefined;
  cacheFace.face.a = 0;
  cacheFace.face.b = 0;
  cacheFace.face.c = 0;
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

function findFirstSpotForFace() {
  for (let index = 0; index < geom.faces.length; index++) {
    const element = array[index];
  }
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
