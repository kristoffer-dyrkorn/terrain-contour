import * as THREE from "./three.module.js";
import { OBJLoader } from "./OBJLoader.js";
import { OrbitControls } from "./OrbitControls.js";
import { MeshBVH } from "./three-mesh-bhv.module.js";
import { GUI } from "./lil-gui.module.min.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  100,
  25000
);
camera.up.set(0, 0, 1);
camera.position.x = 12000;
camera.position.y = 11000;
camera.position.z = 2000;

scene.add(camera);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.4);
camera.add(pointLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.panSpeed = 0.5;
controls.rotateSpeed = 0.2;
controls.zoomSpeed = 0.2;

const majorLineColor = 0x000000;
const minorLineColor = 0xc9c9c9;

let majorInterval = 100;
let minorInterval = 20;

const gui = new GUI();
const param = {
  "minor interval": minorInterval,
  "major interval": majorInterval,
};

gui.add(param, "minor interval", 5, 100, 5).onChange(function (val) {
  minorInterval = val;
  drawContourLines();
});

gui.add(param, "major interval", 50, 250, 25).onChange(function (val) {
  majorInterval = val;
  drawContourLines();
});

animate();

window.addEventListener("resize", onWindowResize);

// each contour line is defined as the intersection between
// a plane parallel to the xy plane and the terrain
// this plane is moved for each contour line that is to be calculated
const contourPlane = new THREE.Plane();
contourPlane.normal.set(0, 0, 1);

let colliderBvh;
let mesh;

const loader = new OBJLoader();
loader.load("terrain.obj", (object) => {
  mesh = object.children[0];
  mesh.geometry.computeBoundingBox();
  scene.add(mesh);

  const triangleCount =
    mesh.geometry.attributes.position.count /
    mesh.geometry.attributes.position.itemSize;
  console.log(`${triangleCount} triangles in mesh`);

  console.time("initializing");
  colliderBvh = new MeshBVH(mesh.geometry.clone(), { maxLeafTris: 3 });
  console.timeEnd("initializing");

  drawContourLines();
});

function drawContourLines() {
  // first, remove all old contour lines
  const oldCountourLines = scene.getObjectByName("contourlines");
  if (oldCountourLines) {
    for (let contourLine of oldCountourLines.children) {
      contourLine.geometry.dispose();
      contourLine.material.dispose();
    }
    oldCountourLines.clear();
    scene.remove(oldCountourLines);
  }

  const newContourLines = new THREE.Group();
  newContourLines.name = "contourlines";
  scene.add(newContourLines);

  // use the min and max terrain elevations to find the range of contour lines to generate
  const minz =
    mesh.geometry.boundingBox.min.z -
    (mesh.geometry.boundingBox.min.z % minorInterval);
  const maxz = mesh.geometry.boundingBox.max.z;

  let numContours = 0;

  console.time("calculating contours");
  // loop through the desired contour line elevations and calculate contour lines
  for (let elevation = minz; elevation < maxz; elevation += minorInterval) {
    contourPlane.constant = -elevation;
    newContourLines.add(
      getContourLine(colliderBvh, contourPlane, elevation % majorInterval === 0)
    );
    numContours++;
  }
  console.timeEnd("calculating contours");
  console.log(`${numContours} contours`);
}

function getContourLine(colliderBvh, contourPlane, major) {
  // use temp variables to avoid GC-ing
  const tempVector = new THREE.Vector3();
  const tempLine = new THREE.Line3();

  let index = 0;
  // gather the intersection points between the plane and each triangle here
  const positions = [];

  // calculate the intersection between a shape (the contourPlane) and the mesh
  colliderBvh.shapecast({
    intersectsBounds: (box) => {
      // the bvh check, just defer to a bounding box check
      return contourPlane.intersectsBox(box);
    },
    intersectsTriangle: (tri) => {
      // check each triangle edge to see if it intersects with the contour plane.
      // if yes then add it to the list of line segments.
      let count = 0;
      tempLine.start.copy(tri.a);
      tempLine.end.copy(tri.b);
      if (contourPlane.intersectLine(tempLine, tempVector)) {
        positions[3 * index + 0] = tempVector.x;
        positions[3 * index + 1] = tempVector.y;
        positions[3 * index + 2] = tempVector.z;
        index++;
        count++;
      }

      tempLine.start.copy(tri.b);
      tempLine.end.copy(tri.c);
      if (contourPlane.intersectLine(tempLine, tempVector)) {
        positions[3 * index + 0] = tempVector.x;
        positions[3 * index + 1] = tempVector.y;
        positions[3 * index + 2] = tempVector.z;
        count++;
        index++;
      }

      tempLine.start.copy(tri.c);
      tempLine.end.copy(tri.a);
      if (contourPlane.intersectLine(tempLine, tempVector)) {
        positions[3 * index + 0] = tempVector.x;
        positions[3 * index + 1] = tempVector.y;
        positions[3 * index + 2] = tempVector.z;
        count++;
        index++;
      }

      // if we only intersected with one or three sides of the triangle then
      // just remove it. (this could be handled more gracefully.)
      if (count !== 2) {
        index -= count;
      }
    },
  });

  const lineGeometry = new THREE.BufferGeometry();
  const linePositionAttribute = new THREE.BufferAttribute(
    new Float32Array(positions),
    3,
    false
  );
  lineGeometry.setAttribute("position", linePositionAttribute);

  const contourLine = new THREE.LineSegments(
    lineGeometry,
    new THREE.LineBasicMaterial()
  );
  contourLine.material.color
    .set(major ? majorLineColor : minorLineColor)
    .convertSRGBToLinear();

  // nudge the contour line a bit up to avoid intersections
  contourLine.position.copy(contourPlane.normal).multiplyScalar(1);
  return contourLine;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  renderer.render(scene, camera);
}
