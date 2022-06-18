import * as THREE from 'three';
import {GLTFLoader} from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import l_system from './l-system.js';

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
let carnation_leaves = null;
let carnation_stem = null;
let carnation_bud = null;

const light = new THREE.DirectionalLight(0xffffff, .5);
light.position.set(-10, -10, 10);
light.name = 'light';
scene.add(light);

camera.position.z = 6;
camera.position.y = 4;

async function init() {

	console.log(scene);

	let gltf = await loader.loadAsync(
		'src/glb/carnation_seed.glb'
	);

	gltf.scene.position.y = -.3;
	scene.add(gltf.scene);
	carnation_seed = gltf.scene;
	carnation_seed.name = 'seed';

	console.log('Loaded carnation seed.');
	
	gltf = await loader.loadAsync(
		'src/glb/carnation_leaves.glb'
	);

	carnation_leaves = gltf.scene;

	console.log('Loaded carnation leaves.');
	
	gltf = await loader.loadAsync(
		'src/glb/carnation_stem.glb'
	);

	carnation_stem = gltf.scene;

	console.log('Loaded carnation stem.');

	gltf = await loader.loadAsync(
		'src/glb/carnation_bud.glb'
	);

	carnation_bud = gltf.scene;

	console.log('Loaded carnation bud.');


	// Make Carnation from L-System

	let seed = 0;

	document.addEventListener('keypress', () => {
		seed++;
		l_system_make(l_system(seed));
	})

	l_system_make(l_system(0));

	function l_system_make(system) {
		scene.children.forEach(child => {
			if (child.name != 'seed' && child.name != 'light') {
				scene.remove(child);
			}
		});

		let position_y = 0;

		system.split('').forEach(terminal => {
			switch (terminal) {
				case 'L':
					let _carnation_leaves = carnation_leaves.clone();
					_carnation_leaves.position.y = position_y;
					console.log(_carnation_leaves);
					scene.add(_carnation_leaves);
					console.log('Added leaves to scene.');
					break;
				case 'S':
					let _carnation_stem = carnation_stem.clone();
					_carnation_stem.position.y = position_y;
					position_y += 1.4;
					console.log(_carnation_stem);
					scene.add(_carnation_stem);
					console.log('Added stem to scene.');
					break;
				case 'B':
					carnation_bud.position.y = position_y;
					scene.add(carnation_bud);
					console.log('Added bud to scene.');
					break;
			}
		});
	}

}

init().then(animate);



function animate() {
	requestAnimationFrame(animate);
    if (carnation_seed != null) {
        carnation_seed.rotation.y += .008;
    }
	renderer.render(scene, camera);
}

window.addEventListener('resize', on_window_resize);

function on_window_resize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}