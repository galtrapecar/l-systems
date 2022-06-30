import * as THREE from 'three';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from '/node_modules/three/examples/jsm/loaders/RGBELoader.js'
import { LSystem } from './LSystem.js';
import { Lehmer16 } from './Lehmer16.js';
import { Carnation } from './Canration.js';
import { Vector3 } from 'three';

const PIXEL_RATIO = window.devicePixelRatio;

// const SEED = Math.round(Math.random() * 10000);
let SEED = 7994;

const seed_in = document.querySelector('#seed_in');
	  seed_in.value = SEED;
const seedslider_in = document.querySelector('#seedslider_in');
const seedslider_out = document.querySelector('#seedslider_out');
const progression_in = document.querySelector('#progression_in');
	  progression_in.value = 0;
const progression_out = document.querySelector('#progression_out');
const autoplay_in = document.querySelector('#autoplay_in');

console.log(`\n🌰 : seed is ${SEED}\n\n`);

seed_in.addEventListener('input', () => {
	SEED = seed_in.value;
	console.log(`\n🔄🌰 : New seed is ${SEED}\n\n`);
	clearThree(scene);
	init();
});

seedslider_in.addEventListener('input', () => {
	SEED = seedslider_in.value;
	seed_in.value = SEED;
	console.log(`\n🔄🌰 : New seed is ${SEED}\n\n`);
	clearThree(scene);
	init();
});
  
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(PIXEL_RATIO);
renderer.setClearColor( 0xffffff, 0);
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const loader = new GLTFLoader();

let models = {
	pot: null,
	seed: null,
	leaves: null,
	stem: null,
	bud: null
}

let emojis = {
	pot: '⚱️',
	seed: '🌰',
	leaves: '🌿',
	stem: '🥒',
	bud: '🌺',
}

let carnation = new THREE.Group();
	carnation.name = 'carnation';

const light = new THREE.DirectionalLight(0xffffff, .5);
light.position.set(-10, -10, 10);
light.name = 'light';
scene.add(light);

scene.position.y = -4;
camera.position.z = 6;
camera.position.y = 3;
controls.update();

async function init() {

	new RGBELoader()
		.setPath('src/hdr/')
		.load('fouriesburg_mountain_cloudy_1k.hdr', function (texture) {

			texture.mapping = THREE.EquirectangularReflectionMapping;

			scene.background = texture;
			scene.environment = texture;

			renderer.render(scene, camera);

		});

	let gltf = await loader.loadAsync(
		'src/glb/pot.glb'
	);
	models.pot = gltf.scene;

	gltf = await loader.loadAsync(
		'src/glb/carnation_seed.glb'
	);

	gltf.scene.position.y = -.3;
	models.seed = gltf.scene;

	console.log(`🔄${emojis['seed']} : Loaded carnation seed.`);
	
	gltf = await loader.loadAsync(
		'src/glb/carnation_leaves.glb'
	);

	models.leaves = gltf.scene;

	console.log(`🔄${emojis['leaves']} : Loaded carnation leaves.`);
	
	gltf = await loader.loadAsync(
		'src/glb/carnation_stem.glb'
	);

	models.stem = gltf.scene;

	console.log(`🔄${emojis['stem']} : Loaded carnation stem.`);

	gltf = await loader.loadAsync(
		'src/glb/carnation_bud.glb'
	);

	models.bud = gltf.scene;

	console.log(`🔄${emojis['bud']} : Loaded carnation bud.`);


	// Make Carnation from L-System

	let progressions = progression_in.value;
	
	let L_System = new LSystem(Carnation.axiom, Carnation.rules, SEED, Carnation.IAAdependent);

	let plant = null;

	console.log('\n');
	console.log(`💬 : ${L_System.make(progressions)}`);
	console.log('\n');
	l_system_make(L_System.make(progressions));

	let autoplay_interval = setInterval(() => {
		if (!autoplay_in.checked) return;
		if (progressions == progression_in.getAttribute('max')) return;
		progressions++;
		progression_in.value = progressions;
		progression_out.innerText = progressions;
		console.log(`\n💬 : ${L_System.make(progressions)}\n\n`);
		l_system_make(L_System.make(progressions));
	}, 3000);

	document.addEventListener('keypress', () => {
		if (progressions == progression_in.getAttribute('max')) return;
		progressions++;
		progression_in.value = progressions;
		progression_out.innerText = progressions;
		console.log(`\n💬 : ${L_System.make(progressions)}\n\n`);
		l_system_make(L_System.make(progressions));
	});

	progression_in.addEventListener('input', () => {
		progressions = progression_in.value;
		progression_out.innerText = progressions;
		console.log(`\n💬 : ${L_System.make(progressions)}\n\n`);
		l_system_make(L_System.make(progressions));
	});

	function l_system_make(system) {
		plant = new Carnation(system, new Vector3(0, 0, 0), models, SEED);
		clearThree(scene);

		plant.make(system);

		console.log('\n');
		((plant) => {const log = console.log.bind(window.console, '🌳'); log(plant)})(plant.carnation);
		l_system_draw();
	}

	function l_system_draw() {
		scene.add(plant.carnation);
		let pot = models['pot'].clone();
		pot.position.y = 1.5;
		scene.add(pot);
	}
}

init().then(animate);

function animate() {
	requestAnimationFrame(animate);
    if (carnation != null) {
        scene.rotateY(.008);
    }

	renderer.render(scene, camera);
}

window.addEventListener('resize', on_window_resize);

function on_window_resize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function clearThree(obj){
	while (obj.children.length > 0) {
		clearThree(obj.children[0]);
		obj.remove(obj.children[0]);
	}
	if (obj.geometry) obj.geometry.dispose();

	if (obj.material) {
		Object.keys(obj.material).forEach(prop => {
			if (!obj.material[prop])
				return
			if (obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')
				obj.material[prop].dispose();
		});
		obj.material.dispose();
	}
}   