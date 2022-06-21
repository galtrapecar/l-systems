# l-systems

Attepmt in procedual generation using l-systems and three.js

# Before running:

1. Install three, webpack and webpack-cli

```console
npm install three webpack webpack-cli
```

2. Run webpack to generate main.js

```console
npx webpack
```

# Credits

- HDR background for three.js demo by Poly Haven: https://polyhaven.com/a/fouriesburg_mountain_cloudy 

# Papers, literature, references

- Lehmer RNG: https://en.wikipedia.org/wiki/Lehmer_random_number_generator
- Video about procedual generation using Lehmer32 by javidx9 (16:00):
  - https://www.youtube.com/watch?v=ZZY9YE7rZJw

# Notes

Lehmer RNG was tested for equal distributions with the following script:

```javascript
function lehmer16(seed) {
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

let seed = Math.random() * 10;
let distributions = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

for  (let i = 0; i < 10000; i++) {
    distributions[lehmer16_0to10(seed)]++;
    seed++;
}

distributions.forEach((number, n) => {
    distributions[n] = distributions[n] / 1000
});

console.log(distributions);
```

```javascript
[ 0.976, 1.063, 1.011, 0.973, 0.968, 1.009, 0.979, 0.991, 1.066, 0.964 ]
```
