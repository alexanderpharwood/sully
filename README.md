
# Sully.js source code

This is the repository for Sully's source. If you are looking to use Sully, please [check us out on npm](https://www.npmjs.com/package/sully).


**For development only**

```
git clone https://github.com/alexanderpharwood/sully.git
```

```
npm install
```

**BUILD UNCOMPRESSED VERSION**
```
rollup src/main.js --format umd --name "Sully" --file dist/sully-1.0.0.js;
```


**BUILD PRODUCTION, MINIFIED VERSION**
```
uglifyjs dist/sully-1.0.0.js -c -m -o dist/sully-1.0.0.min.js
```
