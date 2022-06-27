import * as THREE from 'three';
import {GLTFLoader} from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import {RGBELoader} from '/node_modules/three/examples/jsm/loaders/RGBELoader.js'
import l_system from './l-system.js';
import { Lehmer16 } from './l-system.js';
import { Vector3 } from 'three';

const PIXEL_RATIO = window.devicePixelRatio;

const SEED = 42057;
const lehmer16 = new Lehmer16(SEED);

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

let stem = null;

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

	let progressions = 0;

	class LSystem {
		constructor(startingPosition, models) {
			this.models = models;
			this.stateStack = [];
			this.state = {
				length: 1.4,
				position: startingPosition ? startingPosition : new THREE.Vector3( 0, 0, 0 ),
				angle: (45 * Math.PI / 180),
				theta: 0
			}
			this.carnation = new THREE.Object3D();
			this.lehmer16 = new Lehmer16(SEED);
		}

		cloneState(state) {
			return {
				length: 1.4,
				position:  new THREE.Vector3().copy(state.position),
				angle: (45 * Math.PI / 180),
				theta: state.theta
			}
		}

		addLeaves() {
			let model = this.models['leaves'];
			let _model = model.clone();
			let position = new Vector3(0, this.state.length, 0);

			if (this.stateStack.length != 0) {
				if (this.state.position.y == this.stateStack[this.stateStack.length - 1].position.y) {
					position = new Vector3(0, Math.asin(this.state.angle) + .1, 0);
				}
			}
			
			this.state.position.add(position);

			_model.position.copy(this.state.position);
			this.carnation.add(_model);
		}

		addStem() {
			let model = this.models['stem'];
			let _model = model.clone();

			_model.position.copy(this.state.position);

			if (this.stateStack.length != 0) {
				let x = (this.stateStack[this.stateStack.length - 1].position.x + 1) * Math.sin(this.state.theta);
				let z = (this.stateStack[this.stateStack.length - 1].position.z + 1) * Math.cos(this.state.theta);
				if (this.state.position.y == this.stateStack[this.stateStack.length - 1].position.y) {
					_model.position.x -= x;
					_model.position.z -= z;
					_model.rotateX(this.state.angle);
					_model.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), this.state.theta);
				}
			}

			this.carnation.add(_model);
		}

		addBud() {
			let model = this.models['bud'];
			let _model = model.clone();

			_model.position.copy(this.state.position);
			this.carnation.add(_model);
		}

		calculatePositionDisplace() {
			console.log('Called position displace');
			// From the random position on a perimeter of a circle: https://stackoverflow.com/a/50746409
			let theta = (lehmer16.next() % 11 / 10) * 2 * Math.PI;
			this.state.theta = theta;
			let x = (this.state.position.x + 1) * Math.sin(theta);
			let z = (this.state.position.z + 1) * Math.cos(theta);
			let y = 0;
			return new Vector3(x, y, z);
		}

		clear(startingPosition) {
			this.stateStack = [];
			this.state = {
				length: 1.4,
				position: startingPosition ? startingPosition : new THREE.Vector3( 0, 0, 0 ),
				angle: (45 * Math.PI / 180),
				theta: 0
			}
			this.carnation = new THREE.Object3D();
		}
	}

	const lsystem = new LSystem(new Vector3(0, 0, 0), models);

	console.log('\n');
	console.log(`💬 : ${l_system(0)}`);
	console.log('\n');
	l_system_make(l_system(0));

	document.addEventListener('keypress', () => {
		progressions++;
		console.log('\n');
		console.log(`💬 : ${l_system(progressions)}`);
		console.log('\n');
		l_system_make(l_system(progressions));
	})

	function l_system_make(system) {
		lsystem.clear(new Vector3(0, 0, 0));
		lehmer16.seed = SEED;
		clearThree(scene);

		system.split('').forEach((terminal, n) => {
			switch (terminal) {
				case '+':
					break;
				case '[':
					console.log('\n');
					console.log(`🪵 : Hit branch!`);
					console.log('\n');
					lsystem.stateStack.push(lsystem.cloneState(lsystem.state));
					let position_displace = lsystem.calculatePositionDisplace();
					lsystem.state.position.add(position_displace);
					break;
				case ']':
					console.log('\n');
					console.log(`🪵✖️ : Ended branch!`);
					console.log('\n');
					lsystem.state = lsystem.cloneState(lsystem.stateStack.pop());
					break;
				case 'L':
					lsystem.addLeaves();
					console.log(`➕${emojis['leaves']} ${'x'} : Added ${'leaves'} to branch ${'x'}`);
					break;
				case 'S':
					lsystem.addStem();
					console.log(`➕${emojis['stem']} ${'x'} : Added ${'stem'} to branch ${'x'}`);
					break;
				case 'B':
					lsystem.addBud();
					console.log(`➕${emojis['bud']} ${'x'} : Added ${'bud'} to branch ${'x'}`);
					break;
			}
		});

		console.log('\n');
		((lsystem) => {const log = console.log.bind(window.console, '🌳'); log(lsystem)})();
		l_system_draw();
	}

	function l_system_add_component(type) {
		let model = models[type];
		let _model = model.clone();
		console.log(`➕${emojis[type]} ${'x'} : Added ${type} to branch ${'x'}`);
	}

	function l_system_draw() {
		scene.add(lsystem.carnation);
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