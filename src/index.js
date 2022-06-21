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

let models = {
	seed: null,
	leaves: null,
	stem: null,
	bud: null
}

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
		constructor(params) {
			this.name = params.name;
			this.height = params.height;
			this.position = params.position;
			this.parent = params.parent;
			this.angle = 0.7853981634; // 45deg
			this.children = [];

			if (params.id) { 
				this.id = params.id;
			} else if (params.parent) {
				this.id = params.parent.id;
			}
		}

		addChild(params) {
			this.children.push(new LComponent({
				   name: params.name,
				   height: (this.height + 1),
				   position: params.position,
				   parent: this
			}));
		}
	}

	let ltree = new LTree();

	l_system_make(l_system(0));

	document.addEventListener('keypress', () => {
		progressions++;
		console.log(l_system(progressions));
		l_system_make(l_system(progressions));
	})

	function l_system_make(system) {
		ltree = new LTree();

		scene.children.forEach(child => { 
			if (child.name != 'seed' && child.name != 'light') {
				scene.remove(child);
			}
		});

		system.split('').forEach((terminal, n) => {
			switch (terminal) {
				case 'L':
					console.log("Adding Leaves ...");
					l_system_add_component('leaves');
					break;
				case 'S':
					console.log("Adding Stem ...");
					l_system_add_component('stem');
					break;
				case 'B':
					console.log("Adding Bud ...");
					l_system_add_component('bud');
					break;
			}
		});

		console.log(ltree);
		l_system_draw(ltree);
	}

	function l_system_add_component(type) {
		let component = ltree.getLatest();
		component.addChild({
			name: type,
			position: component.position,
		});
	}

	function l_system_draw(ltree) {
		console.log('Draw called.');
		let root = ltree.root;
		l_system_draw_components(root);	
	}

	function l_system_draw_components(l_component) {
		let children = l_component.children;
		if (l_component.name == 'root') { for (let i = 0; i < children.length; i++) { return l_system_draw_components(children[i]); } }
		l_system_add_to_scene(l_component);
		for (let i = 0; i < children.length; i++) { return l_system_draw_components(children[i]); }
	}

	function l_system_add_to_scene(l_component) {
		console.log('Add to scene called.');
		let model = models[l_component.name];
		console.log(model);
		let _model = model.clone();
		scene.add(_model);
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