import * as THREE from 'three';
import {GLTFLoader} from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import {RGBELoader} from '/node_modules/three/examples/jsm/loaders/RGBELoader.js'
import l_system from './l-system.js';
import { Lehmer16 } from './l-system.js';

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
	seed: null,
	leaves: null,
	stem: null,
	bud: null
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

			renderer.render();

		});

	let gltf = await loader.loadAsync(
		'src/glb/carnation_seed.glb'
	);

	gltf.scene.position.y = -.3;
	scene.add(gltf.scene);
	models.seed = gltf.scene;
	models.seed.name = 'seed';

	console.log('Loaded carnation seed.');
	
	gltf = await loader.loadAsync(
		'src/glb/carnation_leaves.glb'
	);

	models.leaves = gltf.scene;

	console.log('Loaded carnation leaves.');
	
	gltf = await loader.loadAsync(
		'src/glb/carnation_stem.glb'
	);

	models.stem = gltf.scene;

	console.log('Loaded carnation stem.');

	gltf = await loader.loadAsync(
		'src/glb/carnation_bud.glb'
	);

	models.bud = gltf.scene;

	console.log('Loaded carnation bud.');


	// Make Carnation from L-System

	let progressions = 0;

	class LSystem {
		static current_branch_id = 0;

		constructor() {
			this.branches = [];

			this.makeInitialBranch();
		}

		clear() {
			this.branches = [];
			this.makeInitialBranch();
		}

		makeBranch(params) {
			let branch = new LBranch({
				id: params.branch_id,
				root: params.root,
			});
			this.branches.push(branch);
		}

		makeInitialBranch() {
			let branch = new LBranch({
				id: 0,
				root: new LComponent({
					type: 'root',
					branch_id: 0,
					branch: null,
					position: {x: 0, y: 0, z: 0},
					root: {position: {x: 0, y: 0, z: 0}}
				}),
			});
			branch.root.branch = branch;
			this.branches.push(branch);
		}

		addLComponent(type, branch_id) {
			let branch = this.branches[branch_id];
			if (branch === undefined) {
				this.makeBranch({
					id: branch_id,
					root: this.branches[branch_id - 1].getLatest()
				})
			}
			branch = this.branches[branch_id];
			branch.addLComponent({
				type: type,
				branch_id: branch_id
			});
		}
	}

	class LBranch {

		constructor(params) {
			this.id = params.id;
			this.root = params.root;
			this.position = this.calculatePosition(params);
			this.position_displace = this.calculatePositionDisplace();
			this.l_components = [this.root];
		}

		getLatest() {
			return this.l_components[this.l_components.length - 1];
		}

		calculatePosition(params) {
			let x = params.root.position.x;
			let z = params.root.position.z;
			let y = params.root.position.y;

			return {x: x, y: y, z: z}
		}

		calculatePositionDisplace() {
			if (this.id === 0) return {x: 0, z: 0};
			// Random position on a perimeter of a circle: https://stackoverflow.com/a/50746409
			const R = 1;
			let theta = (lehmer16.next() % 11 / 10) * 2 * Math.PI;
			let x = this.position.x + 1 * Math.sin(theta);
			let z = this.position.z + 1 * Math.cos(theta);
			console.log(x + ' ' + z);
			return {x: x, z: z};
		}

		addLComponent(params) {
			let l_component = new LComponent({
				type: params.type,
				branch_id: params.branch_id,
				branch: this,
				root: this.root
			});
			this.l_components.push(l_component);
		}
	}

	class LComponent {

		constructor(params) {
			this.type = params.type;
			this.branch_id = params.branch_id;
			this.branch = params.branch;
			this.position = this.calculatePosition(params);
		}

		calculatePosition(params) {

			let x = 0;
			let z = 0;
			let y = 0;

			if (params.branch) {
				x = params.branch.position.x;
				z = params.branch.position.z;
				y = params.branch.getLatest().position.y;
				if (params.type == 'leaves') y += 1.4;
			}

			return {x: x, y: y, z: z}
		}
	}

	const lsystem = new LSystem();

	console.log(l_system(0));
	l_system_make(l_system(0));

	document.addEventListener('keypress', () => {
		progressions++;
		console.log(l_system(progressions));
		l_system_make(l_system(progressions));
	})

	function l_system_make(system) {
		lsystem.clear();
		lehmer16.seed = SEED;
		carnation = new THREE.Group();
		clearThree(scene)

		system.split('').forEach((terminal, n) => {
			switch (terminal) {
				case '-':
					LSystem.current_branch_id++;
					break;
				case '+':
					console.log('Hit branch!');
					LSystem.current_branch_id++;
					break;
				case '[':
					break;
				case ']':
					LSystem.current_branch_id--;
					break;
				case 'L':
					// console.log(`Added leaves to branch ${LSystem.current_branch_id}`);
					l_system_add_component('leaves', LSystem.current_branch_id);
					break;
				case 'S':
					// console.log(`Added stem to branch ${LSystem.current_branch_id}`);
					l_system_add_component('stem', LSystem.current_branch_id);
					break;
				case 'B':
					// console.log(`Added bud to branch ${LSystem.current_branch_id}`);
					l_system_add_component('bud', LSystem.current_branch_id);
					break;
			}
		});

		console.log(lsystem);
		l_system_draw();
	}

	function l_system_add_component(type, branch_id) {
		lsystem.addLComponent(type, branch_id);
	}

	function l_system_draw() {
		lsystem.branches.forEach(branch => {
			l_system_draw_components(branch);
		});
		console.log(carnation);
		scene.add(carnation);
	}

	function l_system_draw_components(branch) {
		let l_components = branch.l_components;
		l_components.forEach(l_component => {
			l_system_add_to_scene(l_component);
		});
	}

	function l_system_add_to_scene(l_component) {
		if (l_component.type == 'root') return;
		let model = models[l_component.type];
		let _model = model.clone();
		_model.position.x = l_component.position.x + l_component.branch.position_displace.x;
		_model.position.z = l_component.position.z + l_component.branch.position_displace.z;

		_model.position.y = l_component.position.y;
		carnation.add(_model);
	}
}

init().then(animate);

function animate() {
	requestAnimationFrame(animate);
    if (models.seed != null) {
        models.seed.rotation.y += .008;
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