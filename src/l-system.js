
// Currently working for single strand of garden carnation
// R - root ; 
// S - stem ; 
// M - meristem ; 
// B - bud ; 
// L - leaves ;
// + - right branch ;
// [ - start branch ;
// ] - end branch ;

let SEED = 42057; // Makes 1 branch on step 3
const axiom = 'RML B';

let rules = {
    M: {
        rules: ['LSM', 'L+[SMLB]SM'],
        odds: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 0.9 -> 1st rule ; 0.1 -> 2nd rule
    }
}

export default function l_system(progressions) {
    SEED = 42057; // init seed
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
    return lehmer16() % length;
}

// Lehmer Random Number Generator

export function lehmer16() {
    let seed = SEED;
    seed += 3777035285;
    let temp = 0;
    temp = seed * 1245296397;
    let m1 = (temp >> 16) ^ temp;
    temp = m1 * 318428617;
    let m2 = (temp >> 16) ^ temp;
    SEED++;
    return m2;
}

function lehmer16_0to10(seed) {
    return lehmer16(seed) % 10;
}