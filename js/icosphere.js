var faceCache = [];
var vertexCache = [];
var geom;

function icosphere() {
  geom = new THREE.Geometry();
  // const t = 0.5 + Math.sqrt(5) / 2; // TODO: test efficiency
  const t = 1.618;

  const vertices = [
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

  const faces = [
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

  for (let index = 0; index < 1000; index++) {
    geom.faces.push(new THREE.Face3(0, 0, 0));
    geom.vertices.push(new THREE.Vector3(0, 0, 0));
  }

  vertices.forEach(vertex => {
    // geom.vertices.push(new THREE.Vector3(vertex[0], vertex[1], vertex[2]).normalize());
    createVertex(vertex, true, [-1, -1]);
  });

  faces.forEach(face => {
    // geom.faces.push(new THREE.Face3(face[0], face[1], face[2]));
    createFace(face, undefined);
  });

  var mat = new THREE.MeshBasicMaterial({
    wireframe: true
  });

  icosphere = new THREE.Mesh(geom, mat);

  // subdiv(geom);
  // addDetail(geom);
  scene.add(icosphere);

  // additional mesh with differen material
  // geom.verticesNeedUpdate = true;
  // geom.computeVertexNormals();
  var helpMat = new THREE.MeshNormalMaterial({});
  helpIcosphere = new THREE.Mesh(geom, helpMat);
  // scene.add(helpIcosphere);
}

function bufferIcosphere(positions, faces, threeIcoGeometry) {
  // console.log(faces);

  var vertices = new Float32Array([]);
  for (let faceIx = 0; faceIx < faces.length; faceIx++) {
    const face = faces[faceIx];
    for (let vertexIx = 0; vertexIx < 3; vertexIx++) {
      const vertex = positions[face[vertexIx]];
      console.log(vertex);
      vertices = new Float32Array([...vertices, ...vertex]);
    }
  }

  var geometry = new THREE.BufferGeometry();
  geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 3));
  var material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true
  });
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

function createVertex(position, normalize, parents) {
  // TODO: probably should use uuid-s because indexes will change
  // (because i dont want to fill up the original vertices number,
  // so i need to remove from geom but i still want to keep in cache)

  const index = vertexCache.length;
  const vertex = geom.vertices[index];
  vertex.x = position[0];
  vertex.y = position[1];
  vertex.z = position[2];

  if (normalize) {
    // only for start faces i think
    vertex.normalize();
    normalizedPos = [vertex.x, vertex.y, vertex.z];
    originalPosition = undefined;
  } else {
    normalizedPos = undefined;
    originalPosition = position;
  }

  vertexCache.push({
    vertexIndex: index,
    normalizedPos: normalizedPos,
    originalPosition: position,
    vertex: vertex,
    parents: parents
  });

  return index;
}

// creating a tree for keeping stock of faces and their hierarchy
function createFace(vertices, parent) {
  // const face = new THREE.Face3(vertices[0], vertices[1], vertices[2]);

  const middlePos = [
    (geom.vertices[vertices[0]].x +
      geom.vertices[vertices[1]].x +
      geom.vertices[vertices[2]].x) *
      0.33,
    (geom.vertices[vertices[0]].y +
      geom.vertices[vertices[1]].y +
      geom.vertices[vertices[2]].y) *
      0.33,
    (geom.vertices[vertices[0]].z +
      geom.vertices[vertices[1]].z +
      geom.vertices[vertices[2]].z) *
      0.33
  ];

  const index = faceCache.length;
  const face = geom.faces[index];
  face.a = vertices[0];
  face.b = vertices[1];
  face.c = vertices[2];

  // geom.faces[0].a = faces[0][0];
  // geom.faces[0].b = faces[0][1];
  // geom.faces[0].c = faces[0][2];

  faceCache.push({
    faceIndex: index,
    vertices: vertices,
    face: face,
    parent: parent,
    middlePos: middlePos,
    children: [],
    isRendered: true
  });

  // return index;
}

// dynamic vertex generation
function addDetail(geom) {
  // basic face generation
  for (let i = 0; i < 1; i++) {
    // var startFaces = [...faceCache];
    const startFaces = faceCache.filter(face => face.isRendered === true);
    for (let j = 0; j < 2; j++) {
      // for (let j = 0; j < startFaces.length; j++) {
      // addDetailToFace(geom, startFaces[j]);
      addDetailToFaceRecursive(startFaces[j], 1);
    }
  }

  // addDetailToFaceRecursive(faceCache[0], 1);

  // tests
  // addDetailToFace(faceCache[0]);
  // for (let index = 0; index < 1000000; index++) {
  //   geom.faces.push(new THREE.Face3(0, 0, 0));
  // }
}

function addDetailToFace(cacheFace) {
  const index = geom.faces.indexOf(cacheFace.face);
  subdivFaceCache(geom, cacheFace);
  geom.faces.splice(index, 1);
  cacheFace.isRendered = false;

  console.log("asder");
}

function addDetailToFaceRecursive(cacheFace, recursions) {
  if (recursions === 0) return;

  const index = geom.faces.indexOf(cacheFace.face);
  subdivFaceCache(geom, cacheFace);
  // geom.faces.splice(index, 1);
  cacheFace.isRendered = false;

  // TODO: mitte lslt child UUID vaid child ise
  cacheFace.children.forEach(child => {
    addDetailToFaceRecursive(getFaceFromCache(child), recursions - 1);
  });
}

function subdivFaceCache(geom, cacheFace) {
  const face = cacheFace.face;
  const index = cacheFace.index;

  const a = face.a;
  const b = face.b;
  const c = face.c;
  const ab = midPoint(geom, a, b, geom.vertices[a], geom.vertices[b]);
  const bc = midPoint(geom, b, c, geom.vertices[b], geom.vertices[c]);
  const ca = midPoint(geom, c, a, geom.vertices[c], geom.vertices[a]);

  // console.log(a, b, c, ab, bc, ca);

  // cacheFace.children = [uuidv1(), uuidv1(), uuidv1(), uuidv1()];

  cacheFace.isRendered = false;
  cacheFace.index = -1;
  cacheFace.face.a = 0;
  cacheFace.face.b = 0;
  cacheFace.face.c = 0;

  cacheFace.children = [
    createFace([a, ab, ca], index),
    createFace([ab, b, bc], index),
    createFace([ca, bc, c], index),
    createFace([ab, bc, ca], index)
  ];
}

function subdiv(geom) {
  divisions = 1;
  for (let i = 0; i < divisions; i++) {
    const facescount = geom.faces.length;
    // const facescount = 1;
    for (let index = 0; index < facescount; index++) {
      subdivFace(geom, index);
    }
    for (let i = 0; i < facescount; i++) {
      geom.faces.shift();
    }
  }
}

function subdivFace(geom, faceIndex) {
  const face = geom.faces[faceIndex];

  const a = face.a;
  const b = face.b;
  const c = face.c;

  const ab = midPoint(geom, a, b, geom.vertices[a], geom.vertices[b]);
  const bc = midPoint(geom, b, c, geom.vertices[b], geom.vertices[c]);
  const ca = midPoint(geom, c, a, geom.vertices[c], geom.vertices[a]);

  geom.faces.push(new THREE.Face3(a, ab, ca));
  geom.faces.push(new THREE.Face3(ab, b, bc));
  geom.faces.push(new THREE.Face3(ca, bc, c));
  geom.faces.push(new THREE.Face3(ab, bc, ca));

  // geom.faces.push(createFace([a, ab, ca], undefined));
  // geom.faces.push(createFace([ca, bc, c], undefined));
  // geom.faces.push(createFace([ab, b, bc], undefined));
  // geom.faces.push(createFace([ab, bc, ca], undefined));
}

function midPoint(geom, id1, id2, vertex1, vertex2) {
  // const parents = id1 < id2 ? `k_${id1}_${id2}` : `k_${id2}_${id1}`;
  // if (midPoints[key]) {
  //   geom.vertices[midPoints[key]].normalize();
  //   return midPoints[key];
  // }

  // console.log(id1, id2);

  // console.log(
  //   vertexCache.filter(
  //     vertex => vertex.parents[0] === 0 && vertex.parents[1] === 5
  //   )
  // );

  const sameParents = vertexCache.filter(vertex =>
    id1 < id2
      ? vertex.parents[0] === id1 && vertex.parents[1] === id2
      : vertex.parents[0] === id2 && vertex.parents[1] === id1
  );

  if (sameParents.length > 0) {
    console.log(sameParents);
    // sameParents[0].vertex.x =
    vertexToNormalized(sameParents[0]);
    return sameParents[0].vertexIndex;
  }

  // geom.vertices.push(
  //   new THREE.Vector3(
  //     (vertex1.x + vertex2.x) * 0.5,
  //     (vertex1.y + vertex2.y) * 0.5,
  //     (vertex1.z + vertex2.z) * 0.5
  //   ) //.normalize()
  // );

  const index = createVertex(
    [
      (vertex1.x + vertex2.x) * 0.5,
      (vertex1.y + vertex2.y) * 0.5,
      (vertex1.z + vertex2.z) * 0.5
    ],
    false,
    // TODO: use parent uuids
    id1 < id2 ? [id1, id2] : [id2, id1]
  );

  // midPoints[key] =  - 1;
  // return geom.vertices.length - 1;
  return index;
}

function getFaceFromCache(uuid) {
  return faceCache.find(face => face.uuid === uuid);
}

let asd = 1;
let asdDate = Date.now() + 1110;

function LOD(cameraPos) {
  // const cacheFace = faceCache[0];

  // console.log(cacheFace);
  // const dist = distance(cacheFace.middlePos, [
  //   cameraPos.x,
  //   cameraPos.y,
  //   cameraPos.z
  // ]);
  // console.log(dist);

  if (asd === 1 && asdDate < Date.now()) {
    // TODO: this is not even possible, webgl doesn't allow adding faces to a mesh
    // only way would be creating a huge amount of

    // console.log("asd");
    // addDetailToFace(cacheFace);

    addDetail();

    geom.computeBoundingSphere();
    geom.elementsNeedUpdate = true;

    asd = 0;
  }

  // if (dist < 4 && cacheFace.isRendered) {
  //   // console.log("asd");
  //   // addDetailToFace(cacheFace);
  //   // geom.verticesNeedUpdate = true;
  //   // geom.computeVertexNormals();
  // }

  // console.log(
  //   distance(faceCache[0].middlePos, [cameraPos.x, cameraPos.y, cameraPos.z])
  // );
}

function vertexToNormalized(cacheVertex) {
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
