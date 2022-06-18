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

	let progressions = 0;
	let carnation = {}

	document.addEventListener('keypress', () => {
		progressions++;
		l_system_make(l_system(progressions));
	})

	l_system_make(l_system(0));

	function l_system_make(system) {
		scene.children.forEach(child => {
			if (child.name != 'seed' && child.name != 'light') {
				scene.remove(child);
			}
		});

		let position_y = 0;
		let position_x = 0;
		let prev_element = null;
		let angle = 0.7853981634; // 45deg

		system.split('').forEach((terminal, n) => {
			switch (terminal) {
				case 'L':
					l_system_draw_leaves();
					console.log('Added leaves to scene.');
					break;
				case 'S':
					if (system.split('')[n - 2] == '+' && system.split('')[n - 2] == '[') {
						l_system_draw_stem(0);
					} else {
						l_system_draw_stem(-angle);
						console.log('Branched right.');
					}
					
					console.log('Added stem to scene.');
					break;
				case 'B':
					l_system_draw_bud();
					console.log('Added bud to scene.');
					break;
			}
			console.log(terminal);
		});

		function l_system_draw_leaves() {
			let _carnation_leaves = carnation_leaves.clone();
			_carnation_leaves.position.y = position_y;
			_carnation_leaves.position.x = position_x;
			scene.add(_carnation_leaves);
			prev_element = _carnation_leaves;
		}
	
		function l_system_draw_stem(angle) {
			let _carnation_stem = carnation_stem.clone();
			_carnation_stem.position.y = position_y;
			_carnation_stem.position.x = position_x;
			_carnation_stem.rotation.z = angle;
			position_y += 1.4;
			scene.add(_carnation_stem);
			prev_element = _carnation_stem;
		}
	
		function l_system_draw_bud() {
			carnation_bud.position.y = position_y;
			carnation_bud.position.x = position_x;
			scene.add(carnation_bud);
		}
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