
// Currently working for single strand of garden carnation
// R - root ; 
// S - stem ; 
// M - meristem ; 
// B - bud ; 
// L - leaves ;
// [ - left branch ;
// ] - right branch ;

let SEED = 42057; // Makes 1 LSMB]SM branch on step 3
const axiom = 'RMB';

let rules = {
    M: {
        rules: ['LSM', 'LSMB]LSM'],
        odds: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 0.9 -> 1st rule ; 0.1 -> 2nd rule
    }
}

export default function l_system(progressions) {
    let result_system = axiom;
    for (let i = 0; i < progressions; i++) {
        result_system = l_system_progress(result_system);
    }
    return result_system;
}

function l_system_progress(system) {
    let temp = system;
    system.split('').forEach((terminal, n) => {
        if (rules[terminal]) {
            let odds = l_system_pick_odds(rules[terminal]['odds'].length);
            let index = rules[terminal]['odds'][odds];
            let rule = rules[terminal]['rules'][index];
        	temp = temp.substring(0, n) + rule + temp.substring(n + 1, temp.length);
        }
    })
    return temp;
}

function l_system_pick_odds(length) {
    return lehmer16(SEED) % length;
}

// Lehmer Random Number Generator

function lehmer16(seed) {
    SEED++;
    seed += 3777035285;
    let temp = 0;
    temp = seed * 1245296397;
    let m1 = (temp >> 16) ^ temp;
    temp = m1 * 318428617;
    let m2 = (temp >> 16) ^ temp;
    return m2;
}

function lehmer16_0to10(seed) {
    return lehmer16(seed) % 10;
}