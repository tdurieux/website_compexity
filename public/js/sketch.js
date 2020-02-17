// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/BjoM9oKOAKY

var inc = 0.1;
var scl = 5;
var cols, rows;

var zoff = 0;

var fr;

var particles = [];

var flowfield;

function getRequestType(r) {
    if (r.type == "text/css" || r.type.indexOf('font') != -1) {
        return 'style';
    }
    if (r.type.indexOf('image') != -1) {
        return 'image';
    }
    if (r.type.indexOf('javascript') != -1) {
        return 'script';
    }
    if (r.type.indexOf('json') != -1) {
        return 'data';
    }
    if (r.type.indexOf('html') != -1) {
        return 'content';
    }
    return r.type;
}
function colorType(type, alpha) {
    if (alpha == null) {
        alpha = 50;
    }
    if (type == 'content') {
        return {r: 78, g: 72, b:0 , a: alpha}
    }
    if (type == 'data') {
        return {r: 0, g: 0, b:0 , a: alpha}
    }
    if (type == 'style') {
        return {r: 169, g: 70, b: 175, a: alpha}
    }
    if (type == 'image') {
        return {r: 101, g: 181, b: 41, a: alpha}
    }
    if (type == 'script') {
        return {r: 72, g: 70, b: 175, a: alpha}
    }
    return {r: 0, g: 0, b:0 , a: alpha}
}
let totalSize = 0
function setup() {
  const c = createCanvas(document.getElementById("requests").clientWidth, document.getElementById("requests").clientHeight);
  c.parent("requests")
  cols = floor(width / scl);
  rows = floor(height / scl);
  fr = createP('');

  flowfield = new Array(cols * rows);

}

function draw() {
  clear()
  var yoff = 0;
  for (var y = 0; y < rows; y++) {
    var xoff = 0;
    for (var x = 0; x < cols; x++) {
      var index = x + y * cols;
      var angle = noise(xoff, yoff, zoff) * TWO_PI * 4;
      var v = p5.Vector.fromAngle(angle);
      v.setMag(1);
      flowfield[index] = v;
      xoff += inc;
      stroke(0, 50);
      // push();
      // translate(x * scl, y * scl);
      // rotate(v.heading());
      // strokeWeight(1);
      // line(0, 0, scl, 0);
      // pop();
    }
    yoff += inc;

    zoff += 0.0003;
  }
  for (var i = 0; i < particles.length; i++) {
    particles[i].follow(flowfield);
    particles[i].update();
    particles[i].edges();
    particles[i].show();
  }
}