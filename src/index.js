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
		constructor() {
			this.root = new LComponent({
				name: 'root',
				id: 0,
				height: 0,
				position: {x: 0, y: 0, z: 0},
				parent: null
			});
		}

		getLatest() {
			let component = this.recurse(this.root);
			return component;
		}

		recurse(l_component) {
			let children = l_component.children;
			if (children && children.length > 0) {
				for (let i = 0; i < children.length; i++) {
					// Needs return statement to return all the way up the stack
					return this.recurse(children[i]);
				}
			} else if (children.length == 0) {
				console.log(l_component);
				return l_component;
			}
		}
	}

	class LComponent {
		static angle = 0.7853981634; // 45deg
		static y_delta = 1.4;

		constructor(params) {
			this.name = params.name;
			this.height = params.height;
			this.position = params.position;
			this.parent = params.parent;
			this.children = [];
			this.id = params.id;
		}

		addChild(params, id) {
			this.children.push(new LComponent({
				   name: params.name,
				   height: (this.height + 1),
				   position: this.computePosition(params),
				   parent: this,
				   id: params.id
			}));
		}

		computePosition(params) {
			let x = params.position.x;
			let y = params.position.y;
			let z = params.position.z;

			if (params.name == 'leaves' || params.name == 'bud') {
				y = (LComponent.y_delta * this.height / 2);
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

		scene.add(models.seed.clone());

		system.split('').forEach((terminal, n) => {
			switch (terminal) {
				case 'L':
					look_forward(system, n);
					break;
				case 'S':
					l_system_add_component('stem');
					break;
				case 'B':
					l_system_add_component('bud');
					break;
			}
		});

		l_system_draw(ltree);
	}

	function look_forward(system, n) {
		if (system[n + 1] == '+') {
			make_right_branch(system, n);
		} else {
			l_system_add_component('leaves', 1);
		}
	}

	function make_right_branch(system, n) {
		n++; // starting at [
		while (system[n] != ']') {
			switch (system[n]) {
				case 'L':
					look_forward(system, n);
					break;
				case 'S':
					l_system_add_component('stem', 1);
					break;
				case 'B':
					l_system_add_component('bud', 1);
					break;
			}
			n++; 
		}
	}

	function l_system_add_component(type, id) {
		let component = ltree.getLatest();
		component.addChild({
			name: type,
			position: component.position,
		});
	}

	function l_system_draw(ltree) {
		let root = ltree.root;
		l_system_draw_components(root);
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
		carnation.add(_model);
		console.log('Added: ' + l_component.name);
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