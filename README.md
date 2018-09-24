
# Sully.js source code

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
