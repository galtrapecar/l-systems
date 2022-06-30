import { Lehmer16 } from "./Lehmer16";

export class LSystem {
    constructor(axiom, rules, seed, IAAdependent) {
        this.axiom = axiom;
        this.rules = rules;
        this.seed = seed;
        this.lehmer16 = new Lehmer16(seed);
        this.IAAdependent = IAAdependent ? IAAdependent : false;
        this.IAA = 0;
    }

    make(progressions) {
        this.clear();
        let system = this.axiom;
        for (let i = 0; i < progressions; i++) {
            system = this.progress(system);
        }
        return system;
    }

    progress(system) {
        let _system = '';
        system.split('').forEach((input) => {
            if (this.IAAdependent) {
                if (this.rules(IAA, input)) {
                    let odds = this.lehmer16.next() % this.rules(IAA, input)['odds'].length;
                    let index = this.rules(IAA, input)['odds'][odds];
                    let rule = this.rules(IAA, input)['rules'][index];
                    _system += rule;
                } else {
                    _system += input;
                }
            } else {
                if (this.rules(input)) {
                    let odds = this.lehmer16.next() % this.rules(input)['odds'].length;
                    let index = this.rules(input)['odds'][odds];
                    let rule = this.rules(input)['rules'][index];
                    _system += rule;
                } else {
                    _system += input;
                }
            }
        })
        return _system;
    }

    _progress(system) {
        let _system = '';
        system.split('').forEach((input) => {
            if (this.rules[input]) {
                let odds = this.lehmer16.next() % this.rules[input]['odds'].length;
                let index = this.rules[input]['odds'][odds];
                let rule = this.rules[input]['rules'][index];
                _system += rule;
            } else {
                _system += input;
            }
        })
        return _system;
    }

    clear() {
        this.lehmer16 = new Lehmer16(this.seed);
    }
}