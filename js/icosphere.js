var faceCache = [];
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

  vertices.forEach(vertex => {
    geom.vertices.push(
      new THREE.Vector3(vertex[0], vertex[1], vertex[2]).normalize()
    );
  });
  faces.forEach(face => {
    // geom.faces.push(new THREE.Face3(face[0], face[1], face[2]));
    geom.faces.push(createFace(face, undefined, uuidv1()));
  });

  var mat = new THREE.MeshBasicMaterial({
    wireframe: true
  });

  icosphere = new THREE.Mesh(geom, mat);

  // subdiv(geom);
  addDetail(geom);
  scene.add(icosphere);

  // additional mesh with differen material
  geom.verticesNeedUpdate = true;
  geom.computeVertexNormals();
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

// creating a tree for keeping stock of faces and their hierarchy
function createFace(vertices, parent, uuid) {
  const face = new THREE.Face3(vertices[0], vertices[1], vertices[2]);

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

  faceCache.push({
    uuid: uuid,
    face: face,
    parent: parent,
    middlePos: middlePos,
    children: [],
    isRendered: true
  });

  return face;
}

// dynamic vertex generation
function addDetail(geom) {
  // basic face generation
  for (let i = 0; i < 4; i++) {
    // var startFaces = [...faceCache];
    const startFaces = faceCache.filter(face => face.isRendered === true);
    // for (let j = 0; j < 3; j++) {
    for (let j = 0; j < startFaces.length; j++) {
      // addDetailToFace(geom, startFaces[j]);
      addDetailToFaceRecursive(startFaces[j], 1);
    }
  }

  // tests
  // addDetailToFace(faceCache[0]);
  for (let index = 0; index < 1000000; index++) {
    geom.faces.push(new THREE.Face3(0, 0, 0));
  }
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
  geom.faces.splice(index, 1);
  cacheFace.isRendered = false;

  // TODO: mitte lslt child UUID vaid child ise
  cacheFace.children.forEach(child => {
    addDetailToFaceRecursive(getFaceFromCache(child), recursions - 1);
  });
}

function subdivFaceCache(geom, cacheFace) {
  const face = cacheFace.face;
  const uuid = cacheFace.uuid;

  const a = face.a;
  const b = face.b;
  const c = face.c;
  const ab = midPoint(geom, a, b, geom.vertices[a], geom.vertices[b]);
  const bc = midPoint(geom, b, c, geom.vertices[b], geom.vertices[c]);
  const ca = midPoint(geom, c, a, geom.vertices[c], geom.vertices[a]);

  cacheFace.children = [uuidv1(), uuidv1(), uuidv1(), uuidv1()];

  geom.faces.push(createFace([a, ab, ca], uuid, cacheFace.children[0]));
  geom.faces.push(createFace([ab, b, bc], uuid, cacheFace.children[1]));
  geom.faces.push(createFace([ca, bc, c], uuid, cacheFace.children[2]));
  geom.faces.push(createFace([ab, bc, ca], uuid, cacheFace.children[3]));
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
}

function midPoint(geom, id1, id2, vertex1, vertex2) {
  const key = id1 < id2 ? `k_${id1}_${id2}` : `k_${id2}_${id1}`;
  if (midPoints[key]) {
    geom.vertices[midPoints[key]].normalize();
    return midPoints[key];
  }

  geom.vertices.push(
    new THREE.Vector3(
      (vertex1.x + vertex2.x) * 0.5,
      (vertex1.y + vertex2.y) * 0.5,
      (vertex1.z + vertex2.z) * 0.5
    ) //.normalize()
  );

  midPoints[key] = geom.vertices.length - 1;
  return geom.vertices.length - 1;
}

function getFaceFromCache(uuid) {
  return faceCache.find(face => face.uuid === uuid);
}

let asd = 1;
let asdDate = Date.now() + 140;

function LOD(cameraPos) {
  // const uuid = "08740230-3496-11e9-af5e-e3202a47f8c0";
  // const cacheFace = getFaceFromCache(uuid);
  const cacheFace = faceCache[0];
  const dist = distance(cacheFace.middlePos, [
    cameraPos.x,
    cameraPos.y,
    cameraPos.z
  ]);
  // console.log(dist);

  if (asd === 1 && asdDate < Date.now()) {
    // TODO: this is not even possible, webgl doesn't allow adding faces to a mesh
    // only way would be creating a huge amount of

    console.log("asd");
    addDetailToFace(cacheFace);
    geom.computeBoundingSphere();

    geom.elementsNeedUpdate = true;

    asd = 0;
  }

  if (dist < 4 && cacheFace.isRendered) {
    // console.log("asd");
    // addDetailToFace(cacheFace);
    // geom.verticesNeedUpdate = true;
    // geom.computeVertexNormals();
  }

  // console.log(
  //   distance(faceCache[0].middlePos, [cameraPos.x, cameraPos.y, cameraPos.z])
  // );
}

function distance(posA, posB) {
  const x = posA[0] - posB[0];
  const y = posA[1] - posB[1];
  const z = posA[2] - posB[2];
  return Math.sqrt(x * x + y * y + z * z);
}
