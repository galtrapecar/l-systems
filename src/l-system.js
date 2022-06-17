
// Currently working for single strand of garden carnation
// R - root ; S - stem ; M - meristem ; B - bud ; L - leaves

const axiom = 'RMB';

let rules = {
    M: 'LSM'
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
        	temp = temp.substring(0, n) + rules[terminal] + temp.substring(n + 1, temp.length);
        }
    })
    return temp;
}

// Lehmer Random Number Generator

function lehmer16(seed) {
    seed += 3777035285;
    let temp = 0;
    temp = seed * 1245296397;
    let m1 = (temp >> 16) ^ temp;
    temp = m1 * 318428617;
    let m2 = (temp >> 16) ^ temp;
    return m2;
}