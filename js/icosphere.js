function icosphere() {
  var geom = new THREE.Geometry();
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
    geom.faces.push(new THREE.Face3(face[0], face[1], face[2]));
  });

  var mat = new THREE.MeshBasicMaterial({
    wireframe: true
  });

  icosphere = new THREE.Mesh(geom, mat);

  // subdiv(geom);
  addDetail(geom);
  createTree(geom);
  scene.add(icosphere);

  geom.verticesNeedUpdate = true;
  geom.computeVertexNormals();
  var helpMat = new THREE.MeshNormalMaterial({});
  helpIcosphere = new THREE.Mesh(geom, helpMat);
  scene.add(helpIcosphere);
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

  // var vertices = new Float32Array([
  //   ...threeIcoGeometry.attributes.position.array
  // ]);

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
function createTree() {
  // tree = {
  //   children: []
  // };
  facesCache = [];

  console.log("tree: ", tree);
}

function addToTree(face, children) {
  key = facesCache.push({});
}

// dynamic vertex generation
function addChildFaces(face, childFaces) {}

function addDetail(geom) {
  subdivFace(geom, 10);
  geom.faces.splice(10, 1);
}

// subdivison
function subdiv(geom) {
  divisions = 1;
  for (let i = 0; i < divisions; i++) {
    const facescount = geom.faces.length;
    // const facescount = 1;
    for (let index = 0; index < facescount; index++) {
      // console.log("asd");
      subdivFace(geom, index);
    }
    for (let i = 0; i < facescount; i++) {
      geom.faces.shift();
    }

    // subdivFace(geom, 10);
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
    // console.log("asd");
    geom.vertices[midPoints[key]].normalize();
    return midPoints[key];
  }

  geom.vertices.push(
    new THREE.Vector3(
      (vertex1.x + vertex2.x) / 2,
      (vertex1.y + vertex2.y) / 2,
      (vertex1.z + vertex2.z) / 2
    ) //.normalize()
  );

  midPoints[key] = geom.vertices.length - 1;
  return geom.vertices.length - 1;
}
