/*jslint bitwise: true, browser: true, evil:true, devel: true, todo: true, debug: true, nomen: true, plusplus: true, sloppy: true, vars: true, white: true, indent: 2 */
/*globals  dateNow, uneval, decompileBody, putstr, version, options */

var
  t0 = dateNow(),
  H = {
    tab:      function (s,l){l=l||8;s=new Array(l+1).join(" ")+s;return s.substr(s.length-l);},
    toArray:  function (a){return Array.prototype.slice.call(a);},
    format:   function (){var a=H.toArray(arguments),s=a[0].split("%s"),p=a.slice(1).concat([""]),c=0;return s.map(function(t){return t + p[c++];}).join("");},
  },
  deb = function(){print((dateNow() - t0).toFixed(1), H.format.apply(H, arguments));};


function process0(source, target){
  
  var t0 = dateNow(), s, i = length;

  while (i--) {
    s = source[i];
    target[i] = (s === 1 || s === 2 || s === 4) ? 255 : 0;
  }
  tims[0].push(dateNow()-t0);
}


function process1(source, target, fn){

  var t0 = dateNow(), s, i = length;

  while (i--) {
    s = source[i];
    target[i] = fn(s);
  }
  tims[1].push(dateNow()-t0);
}

function process2(source, target, fn){

  var t0 = dateNow(), body = "";
  
  body += "var i = " + length + ";";
  body += "while (i--) { t[i] = f(s[i]);}";
  Function("s", "t", "f", body)(source, target, fn);  

  tims[2].push(dateNow()-t0);
}

function process3(source, target, fn){

  var t0 = dateNow(), body = "", fBody = fnBody(fn);
  
  body += "var i = " + length + ";";
  body += "while (i--) { t[i] = " + fBody + ";}";
  Function("s", "t", body)(source, target);  
  tims[3].push(dateNow()-t0);
}

function fnBody(fn){
  
  var body, source = fn.toString();
  
  if (source.indexOf("return") !== -1){
    body = source.slice(source.indexOf("return") + 6, source.lastIndexOf("}")).trim();
    
  } else if (source.indexOf("=>") !== -1){
     body = source.slice(source.indexOf("=>") + 2).trim();
    
  } else {
    throw "can't handle that";
  }
  
  return body;
  
}


var i, f0, source, target, size, loops, length, tims;

function init0(){

  f0 = function f0 (s){return (s === 1 || s === 2 || s === 4) ? 255 : 0;};

  size = 10; loops = 30; length = size * size;
  source = new Uint8ClampedArray(length);
  target = new Uint8ClampedArray(length);

  print();
  deb("Start V: %s, O: %s", version(), options());
  deb("Testing %s full iterations over Uint8ClampedArray of length: ", loops, length);
  deb("running func: %s", decompileBody(f0));

  i = length;
  while (i--){source[i] = ~~(Math.random() * 5);}
  deb("... source array randomized");

}

function test(){
  putstr("running...");
  putstr(0); i = loops; while (i--){process0(source, target, f0);}
  print(H.toArray(source).slice(0, 20));print(H.toArray(target).slice(0, 20));

  putstr(1); i = loops; while (i--){process1(source, target, f0);}
  putstr(2); i = loops; while (i--){process2(source, target, f0);}
  putstr(3); i = loops; while (i--){process3(source, target, f0);}
}

function result () {
  Object.keys(tims).forEach(k => {
    var avg = (tims[k].reduce((a, b) => a + b, 0) / tims[k].length).toFixed(1);
    deb("p%s avg: %s list: %s", k, avg, JSON.stringify(tims[k].map(n => n.toFixed(1))));
  });
}

function reset () {
  tims = {"0" : [], "1" : [], "2" : [], "3" : [] };
}

reset();
init0();
test();
print();
result();
print();
print();

function init1(){

  f0 = function f0 (s){return Math.sqrt(s);};

  size = 10; loops = 30; length = size * size;
  source = new Float32Array(length);
  target = new Float32Array(length);

  print();
  deb("Start V: %s, O: %s", version(), options());
  deb("Testing %s full iterations over Float32Array of length: ", loops, length);
  deb("running func: %s", decompileBody(f0));

  i = length;
  while (i--){source[i] = Math.random() * 1e10;}
  deb("... source array randomized");

}

reset();
init1();
test();
print();
result();
print();
print();



deb("Done");


