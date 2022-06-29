import { Lehmer16 } from "./Lehmer16";
// Currently working for branching strand of garden carnation
// R - root ; 
// S - stem ; 
// M - meristem ; 
// B - bud ; 
// L - leaves ;
// [ - start branch ;
// ] - end branch ;


// const SEED = Math.random() * 42069;
const SEED = 42022;

export class LSystem {
    constructor(axiom, rules, seed) {
        this.axiom = axiom;
        this.rules = rules;
        this.seed = seed;
        this.lehmer16 = new Lehmer16(seed);
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
        system.split('').forEach((terminal) => {
            if (this.rules[terminal]) {
                let odds = this.lehmer16.next() % this.rules[terminal]['odds'].length;
                let index = this.rules[terminal]['odds'][odds];
                let rule = this.rules[terminal]['rules'][index];
                _system += rule;
            } else {
                _system += terminal;
            }
        })
        return _system;
    }

    clear() {
        this.lehmer16 = new Lehmer16(this.seed);
    }
}