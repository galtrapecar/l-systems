export class Lehmer16 {
    constructor(seed) {
        this.seed = seed;
        this._seed = seed;
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