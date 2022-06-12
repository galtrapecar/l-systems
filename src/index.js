import * as THREE from 'three';

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, WIDTH / HEIGHT, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( WIDTH, HEIGHT );
document.body.appendChild( renderer.domElement );