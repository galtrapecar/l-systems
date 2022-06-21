import * as THREE from 'three';
import {GLTFLoader} from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import {RGBELoader} from '/node_modules/three/examples/jsm/loaders/RGBELoader.js'
import l_system from './l-system.js';

const PIXEL_RATIO = window.devicePixelRatio;

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

	class LTree {
		static current_branch = 0;
		// l - left, r - right, c - center
		static current_side = 'c';
		constructor() {
			this.branches = [];
			this.makeBranch({
				id: 0,
				connection_root: new LComponent({
					name: 'root',
					id: 0,
					height: 0,
					position: { x: 0, y: 0, z: 0 },
					parent: null,
					branch: null
				}),
				y_delta: 0
			});
		}

		makeBranch(params) {
			let branch = new LBranch({
				id: params.id,
				connection_root: params.connection_root,
				y_delta: params.y_delta
			});
			this.branches.push(branch);
		}
	}

	class LBranch {
		constructor(params) {
			this.id = params.id;
			this.connection_root = params.connection_root;
			this.height = params.connection_root.height;
			this.position = this.computePosition();
			this.y_delta = params.y_delta;
		}

		increaseHeight() {
			this.height++;
		}

		increaseYDelta() {
			this.y_delta += 1.4;
		}

		getConnectionRoot() {
			return this.connection_root;
		}

		getLatest() {
			let component = this.recurse(this.connection_root);
			return component;
		}

		recurse(l_component) {
			let children = l_component.children;
			if (children && children.length > 0) {
				for (let i = 0; i < children.length; i++) {
					return this.recurse(children[i]);
				}
			} else if (children.length == 0) {
				return l_component;
			}
		}

		computePosition() {
			let x = this.connection_root.position.x + 1;
			let y = this.connection_root.position.y;
			let z = this.connection_root.position.z;

			if (this.id == 0) return { x: 0, y: 0, z: 0 }
			return { x: x, y: y, z: z }
		}
	}

	class LComponent {
		static angle = 0.7853981634; // 45deg
		static y_delta = 1.4;

		constructor(params) {
			this.name = params.name;
			this.position = params.position;
			this.parent = params.parent;
			this.id = params.id;
			this.children = [];

			if (!params.branch) {
				this.branch = 0;
				this.height = 0;
			} else {
				this.branch = params.branch;
				this.height = params.branch.height;
			}
		}

		addChild(params) {
			params.branch.increaseHeight();
			this.children.push(new LComponent({
				   name: params.name,
				   height: params.branch.height,
				   position: this.computePosition(params),
				   parent: this,
				   id: params.id,
				   branch: params.branch
			}));
		}

		computePosition(params) {
			let x = params.branch.position.x;
			let y = params.position.y;
			let z = params.branch.position.z;

			if (params.name == 'leaves' || params.name == 'bud') {
				params.branch.increaseYDelta();
				y = params.branch.y_delta;
			}

			return {x: x, y: y, z: z}
		}
	}

	let ltree = new LTree();

	console.log(l_system(0));
	l_system_make(l_system(0));

	document.addEventListener('keypress', () => {
		progressions++;
		console.log(l_system(progressions));
		l_system_make(l_system(progressions));
	})

	function l_system_make(system) {
		ltree = new LTree();
		carnation = new THREE.Group();
		clearThree(scene)

		system.split('').forEach((terminal, n) => {
			switch (terminal) {
				case '-':
					LTree.current_side = 'l';
					LTree.current_branch++;
					break;
				case '+':
					console.log('Hit branch!');
					LTree.current_side = 'r';
					LTree.current_branch++;
					ltree.makeBranch({
						id: LTree.current_branch,
						connection_root: ltree.branches[LTree.current_branch - 1].getLatest(),
						y_delta: ltree.branches[LTree.current_branch - 1].y_delta
					});
					break;
				case '[':
					break;
				case ']':
					LTree.current_side = 'c';
					LTree.current_branch--;
					break;
				case 'L':
					// console.log(`Added leaves to branch ${LTree.current_branch}`);
					l_system_add_component('leaves', LTree.current_branch);
					break;
				case 'S':
					// console.log(`Added stem to branch ${LTree.current_branch}`);
					l_system_add_component('stem', LTree.current_branch);
					break;
				case 'B':
					// console.log(`Added bud to branch ${LTree.current_branch}`);
					l_system_add_component('bud', LTree.current_branch);
					break;
			}
		});

		console.log(ltree);
		l_system_draw(ltree);
	}

	function l_system_add_component(type, id) {
		let component = ltree.branches[id].getLatest();
		console.log(`Adding ${type} to Y: ${component.position.y}`);
		component.addChild({
			name: type,
			position: component.position,
			id: id,
			branch: ltree.branches[id]
		});
	}

	function l_system_draw(ltree) {
		ltree.branches.forEach(branch => {
			l_system_draw_components(branch.connection_root);
		});
		scene.add(carnation);
	}

	function l_system_draw_components(l_component) {
		let children = l_component.children;
		if (l_component.name == 'root') { for (let i = 0; i < children.length; i++) { return l_system_draw_components(children[i]); } }
		l_system_add_to_scene(l_component);
		for (let i = 0; i < children.length; i++) { return l_system_draw_components(children[i]); }
	}

	function l_system_add_to_scene(l_component) {
		let model = models[l_component.name];
		let _model = model.clone();
		_model.position.y = l_component.position.y;
		_model.position.x = l_component.position.x;
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