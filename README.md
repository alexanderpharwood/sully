
# Sully.js source code

This is the repository for Sully's source. If you are looking to use Sully, please [check us out on npm](https://www.npmjs.com/package/sully).


**For development only**

```
git clone https://github.com/alexanderpharwood/sully.git
```

```
npm install
```
You should be good to branch and get your dev on!


**Build uncompressed version**
```
rollup src/main.js --format umd --name "Sully" --file dist/sully-1.0.0.js;
```


**Build production, minified version**
```
uglifyjs dist/sully-1.0.0.js -c -m -o dist/sully-1.0.0.min.js
```
