import * as THREE from 'three';
import {GLTFLoader} from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';

const PIXEL_RATIO = window.devicePixelRatio;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(PIXEL_RATIO);
renderer.setClearColor( 0xffffff, 0);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();

let carnation_seed = null;

const light = new THREE.DirectionalLight(0xffffff, .5);
light.position.set(-10, -10, 10);
scene.add(light);

camera.position.z = 4;

loader.load(
	'src/glb/carnation_seed.glb',
	function (gltf) {
        gltf.scene.position.y = -.3;
		scene.add(gltf.scene);
        carnation_seed = gltf.scene;
	},
	function (xhr) {
		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
	},
	function (error) {
		console.log('An error happened');
	}
);

loader.load(
	'src/glb/carnation_leaves.glb',
	function (gltf) {
		scene.add(gltf.scene);
	},
	function (xhr) {
		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
	},
	function (error) {
		console.log('An error happened');
	}
);

loader.load(
	'src/glb/carnation_stem.glb',
	function (gltf) {
		scene.add(gltf.scene);
	},
	function (xhr) {
		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
	},
	function (error) {
		console.log('An error happened');
	}
);

function animate() {
	requestAnimationFrame(animate);
    if (carnation_seed != null) {
        carnation_seed.rotation.y += .008;
    }
	renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', on_window_resize);

function on_window_resize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}