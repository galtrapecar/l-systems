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
		static angle = (45 * Math.PI / 180);

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

		addLComponent(model, type, branch_id) {
			let branch = this.branches[branch_id];
			if (branch === undefined) {
				this.makeBranch({
					id: branch_id,
					root: this.branches[branch_id - 1].getLatest()
				})
			}
			branch = this.branches[branch_id];
			branch.addLComponent({
				model: model,
				type: type,
				branch_id: branch_id,
			});
		}
	}

	class LBranch extends THREE.Group {

		constructor(params) {
			super();
			this.ID = params.id;
			this.root = params.root;
			this.theta = 0;
			this.setPosition(params);
			this.position_displace = this.calculatePositionDisplace();
			this.addPositionDisplaceToPosition();
		}

		getLatest() {
			if (this.children.length == 0) return {position: {x: 0, y: 0, z: 0}};
			return this.children[this.children.length - 1];
		}

		setPosition(params) {
			let x = params.root.position.x;
			let z = params.root.position.z;
			let y = params.root.position.y;

			this.position.set(x, y, z);
		}

		calculatePositionDisplace() {
			if (this.ID === 0) return {x: 0, z: 0};
			// Random position on a perimeter of a circle: https://stackoverflow.com/a/50746409
			const R = 1;
			this.theta = (lehmer16.next() % 11 / 10) * 2 * Math.PI;
			let x = (this.position.x + 1) * Math.sin(this.theta);
			let z = (this.position.z + 1) * Math.cos(this.theta);
			return {x: x, z: z};
		}

		addPositionDisplaceToPosition() {
			let x = this.position.x + this.position_displace.x;
			let z = this.position.z + this.position_displace.z;
			let y = this.position.y;

			this.position.set(x, y, z);
		}

		addLComponent(params) {
			let l_component = new LComponent({
				type: params.type,
				branch_id: params.branch_id,
				branch: this,
				model: params.model,
				root: this.root,
				first_stem: params.first_stem,
			});
			this.add(l_component);
		}
	}

	class LComponent extends THREE.Group {

		constructor(params) {
			super();
			this.type = params.type;
			this.model = params.model;
			this.branch_id = params.branch_id;
			this.branch = params.branch;
			this.setPosition(params);
			this.setModel(params.model);
		}

		setModel(model) {
			if (model) {
				if (this.branch_id != 0 && this.position.y == 0) {
					model.position.x = this.position.x - this.branch.position_displace.x;
					model.position.z = this.position.z - this.branch.position_displace.z;
					let angle = this.branch.theta;
					model.rotateX(LSystem.angle);
					model.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), angle);
					console.log(angle);
					console.log('Added root stem: ' + `${model.position.x} ${model.position.z} ${model.rotation.y} ${model.rotation.x}`);
				} else {
					model.position.x = this.position.x;
					model.position.z = this.position.z;
				}
				this.add(model);
			}
				
		}

		setPosition(params) {
			let x = 0;
			let z = 0;
			let y = 0;

			if (params.branch) {
				// x = params.branch.position.x;
				// z = params.branch.position.z;
				y = params.branch.getLatest().position.y;
				if (params.type == 'leaves') {
					if (params.branch_id != 0 && params.branch.children.length == 1) {
						y += Math.asin(LSystem.angle) + .1;
					} else {
						y += 1.4;
					}
				}
			}

			this.position.set(x, y, z);
		}
	}

	const lsystem = new LSystem();

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
					LSystem.current_branch_id++;
					break;
				case '[':
					console.log(`Hit branch ${LSystem.current_branch_id}!`);
					break;
				case ']':
					LSystem.current_branch_id--;
					console.log(`Ended branch ${LSystem.current_branch_id + 1}!`);
					break;
				case 'L':
					l_system_add_component('leaves', LSystem.current_branch_id);
					break;
				case 'S':
					l_system_add_component('stem', LSystem.current_branch_id);
					break;
				case 'B':
					l_system_add_component('bud', LSystem.current_branch_id);
					break;
			}
		});

		console.log(lsystem);
		l_system_draw();
	}

	function l_system_add_component(type, branch_id) {
		let model = models[type];
		let _model = model.clone();
		console.log(`Added ${type} to branch ${LSystem.current_branch_id}`);
		lsystem.addLComponent(_model, type, branch_id);
	}

	function l_system_draw() {
		lsystem.branches.forEach(branch => {
			carnation.add(branch);
		});
		scene.add(carnation);
		console.log(carnation);
	}

	function l_system_draw_components2(branch) {
		scene.add(branch)
	}

	function l_system_draw_components(branch) {
		let l_components = branch.l_components;
		l_components.forEach((l_component, i) => {
			l_system_add_to_scene(l_component, i);
		});
	}

	function l_system_add_to_scene(l_component, i) {
		if (l_component.type == 'root') return;
		let model = models[l_component.type];
		let _model = model.clone();
		// Tilt first stem in branch
		if (l_component.branch_id != 0 && i == 1) {
			_model.position.x = l_component.position.x - l_component.branch.position_displace.x;
			_model.position.z = l_component.position.z - l_component.branch.position_displace.z;
			let angle = l_component.branch.theta;
			_model.rotateX(LSystem.angle);
			_model.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), angle);
			console.log(angle);
			console.log('Added root stem: ' + `${_model.position.x} ${_model.position.z} ${_model.rotation.y} ${_model.rotation.x}`);
		} else {
			_model.position.x = l_component.position.x;
			_model.position.z = l_component.position.z;
		}

		_model.position.y = l_component.position.y;
		carnation.add(_model);
	}
}

init().then(animate);
let rot = 0;
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