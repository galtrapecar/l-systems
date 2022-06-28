import { Object3D } from 'three';
import { Vector3 } from 'three';
import { Lehmer16 } from './Lehmer16.js';

// Notable seeds :
// 6762
// 7994
// 8727
// 4481

export class Carnation {
    static axiom = 'RMLB';

    static rules = {
        M: {
            rules: ['LSM', 'L[SMLB]SM'],
            odds: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // 0.8 -> 1st rule ; 0.2 -> 2nd rule
        }
    }

    static emojis = {
        pot: '⚱️',
        seed: '🌰',
        leaves: '🌿',
        stem: '🥒',
        bud: '🌺',
    }

    constructor(system, startingPosition, models, seed) {
        this.carnation = new Object3D();
        this.lehmer16 = new Lehmer16(seed);
        this.system = system;
        this.models = models;
        this.order = 0;
        this.stateStack = [];
        this.state = {
            length: 1.4,
            position: startingPosition ? startingPosition : new Vector3(0, 0, 0),
            angle: (45 * Math.PI / 180),
            theta: 0
        }
    }

    cloneState(state) {
        return {
            length: 1.4,
            position: new Vector3().copy(state.position),
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
            let x = 1 * Math.sin(this.state.theta);
            let z = 1 * Math.cos(this.state.theta);
            if (this.state.position.y == this.stateStack[this.stateStack.length - 1].position.y) {
                _model.position.x -= x;
                _model.position.z -= z;
                _model.rotateX(this.state.angle);
                _model.rotateOnWorldAxis(new Vector3(0, 1, 0), this.state.theta);
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
        // From the random position on a perimeter of a circle: https://stackoverflow.com/a/50746409
        let theta = (this.lehmer16.next() % 11 / 10) * 2 * Math.PI;
        this.state.theta = theta;
        let x = 1 * Math.sin(theta);
        let z = 1 * Math.cos(theta);
        let y = 0;
        return new Vector3(x, y, z);
    }

    make(system) {
        system.split('').forEach((terminal, n) => {
			switch (terminal) {
				case '[':
					console.log(`\n🪵 : Hit branch!\n\n`);
					this.order++;

					this.stateStack.push(this.cloneState(this.state));
					this.state.position.add(this.calculatePositionDisplace());
					break;
				case ']':
					console.log(`\n🪵✖️ : Ended branch!\n\n`);
					this.order--;
					this.state = this.cloneState(this.stateStack.pop());
					break;
				case 'L':
					this.addLeaves();
					console.log(`➕${Carnation.emojis['leaves']} ${'x'} : Added ${'leaves'} to branch ${'x'}`);
					break;
				case 'S':
					this.addStem();
					console.log(`➕${Carnation.emojis['stem']} ${'x'} : Added ${'stem'} to branch ${'x'}`);
					break;
				case 'B':
					this.addBud();
					console.log(`➕${Carnation.emojis['bud']} ${'x'} : Added ${'bud'} to branch ${'x'}`);
					break;
			}
		});
    }
}