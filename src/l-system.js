
// Currently working for single strand of garden carnation
// R - root ; 
// S - stem ; 
// M - meristem ; 
// B - bud ; 
// L - leaves ;
// + - right branch ;
// [ - start branch ;
// ] - end branch ;

// Lehmer Random Number Generator
export class Lehmer16 {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        let lehmer16 = this.lehmer16();
        this.seed++;
        return lehmer16;
    }

    lehmer16() {
        let seed = this.seed;
        seed += 3777035285;
        let temp = 0;
        temp = seed * 1245296397;
        let m1 = (temp >> 16) ^ temp;
        temp = m1 * 318428617;
        let m2 = (temp >> 16) ^ temp;
        return m2;
    }
}

const SEED = 42057; // Makes 1 branch on step 3
const lehmer16 = new Lehmer16(SEED);
const axiom = 'RMLB';

let rules = {
    M: {
        rules: ['LSM', 'L+[SMLB]SM'],
        odds: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1], // 0.7 -> 1st rule ; 0.3 -> 2nd rule
    }
}

export default function l_system(progressions) {
    lehmer16.seed = SEED; // init seed
    let result_system = axiom;
    for (let i = 0; i < progressions; i++) {
        result_system = l_system_progress(result_system);
    }
    return result_system;
}

function l_system_progress(system) {
    let _system = '';
    system.split('').forEach((terminal, n) => {
        if (rules[terminal]) {
            let odds = l_system_pick_odds(rules[terminal]['odds'].length);
            let index = rules[terminal]['odds'][odds];
            let rule = rules[terminal]['rules'][index];
        	_system += rule;
        } else {
            _system += terminal;
        }
    })
    console.log(_system);
    return _system;
}

function l_system_pick_odds(length) {
    return lehmer16.next() % length;
}