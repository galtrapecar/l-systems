import { Lehmer16 } from "./Lehmer16";

/* This class implements a system for generating a SD0L-system word from defined parameters.
 * 
 * Parameter Summary
 * 
 * axiom: string
 * Specifies the starting sequence of inputs.
 * 
 * rules: func: (input: string) => { rules: string[], odds: number[] }
 * Specifies a function that returns an object with rules for a specific input.
 * 
 * IAAdependent?: boolean
 * Optional. Specifies if current L-system is auxin dependent.
 * 
 * IAAdelta?: number
 * Optional. Specifies the amount auxin changes on each progression.
 */
export class LSystem {
    constructor(axiom, rules, seed, IAAdependent, IAAdelta) {
        this.axiom = axiom;
        this.rules = rules;
        this.seed = seed;
        this.lehmer16 = new Lehmer16(seed);
        this.IAAdependent = IAAdependent ? IAAdependent : false;
        this.IAAdelta = IAAdelta ? IAAdelta : 0;
        this.IAA = 0;
    }

    /* Loops a set ammount of times and returns a built L-system.
     * 
     * Parameter Summary
     * 
     * progressions: int
     * Specifies number of progressions for an L-system to make.
     */
    make(progressions) {
        this.clear();
        let system = this.axiom;
        for (let i = 0; i < progressions; i++) {
            system = this.progress(system);
            this.IAA += this.IAAdelta;
        }
        return system;
    }

    /* Loops through a word and replaces characters based on rules defined in the constructor.
     * 
     * Parameter Summary
     * 
     * system: string
     * Specifies an L-system string to loop through
     */
    progress(system) {
        let _system = '';
        system.split('').forEach((input) => {
            if (this.IAAdependent) {
                if (this.rules(this.IAA, input)) {
                    let odds = this.lehmer16.next() % this.rules(this.IAA, input)['odds'].length;
                    let index = this.rules(this.IAA, input)['odds'][odds];
                    let rule = this.rules(this.IAA, input)['rules'][index];
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

    /* Clears auxin level and RNG seed. */
    clear() {
        this.IAA = 0;
        this.lehmer16 = new Lehmer16(this.seed);
    }
}