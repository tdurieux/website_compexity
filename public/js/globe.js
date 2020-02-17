var masterContainer = document.getElementById('visualization');

var mouseX = 0, mouseY = 0, pmouseX = 0, pmouseY = 0;
var pressX = 0, pressY = 0;
var pscale = 0;

var dragging = false;
var touchEndTime = 0;

var rotateX = 0, rotateY = 0;
var rotateVX = 0, rotateVY = 0;
var rotateXMax = 90 * Math.PI / 180;

var rotateTargetX = undefined;
var rotateTargetY = undefined;

var tilt = 0;
var tiltTarget = undefined;
var scaleTarget = undefined;

var keyboard = new THREEx.KeyboardState();

var mapOutlineImage;
var glContainer = document.getElementById( 'glContainer' );
var dpr = window.devicePixelRatio ? window.devicePixelRatio : 1;

var camera, scene, renderer;
var camera2s, scene2d;

function initScene() {
    scene = new THREE.Scene();
	scene.matrixAutoUpdate = false;
	// scene.fog = new THREE.FogExp2( 0xBBBBBB, 0.00003 );

	scene2d = new THREE.Scene();

	scene.add( new THREE.AmbientLight( 0x505050 ) );

	light1 = new THREE.SpotLight( 0xeeeeee, 3 );
	light1.position.x = 730;
	light1.position.y = 520;
	light1.position.z = 626;
	light1.castShadow = true;
	scene.add( light1 );

	light2 = new THREE.PointLight( 0x222222, 14.8 );
	light2.position.x = -640;
	light2.position.y = -500;
	light2.position.z = -1000;
	scene.add( light2 );

	rotating = new THREE.Object3D();
    scene.add(rotating);
    
    var outlinedMapTexture = new THREE.Texture( mapOutlineImage );
	outlinedMapTexture.needsUpdate = true;
	// outlinedMapTexture.magFilter = THREE.NearestFilter;
	// outlinedMapTexture.minFilter = THREE.NearestFilter;

	var mapMaterial = new THREE.MeshBasicMaterial({
		map: outlinedMapTexture,
		polygonOffset: true,
		polygonOffsetFactor: 1,
		polygonOffsetUnits: 1
	});


	//	-----------------------------------------------------------------------------
	sphere = new THREE.Mesh( new THREE.SphereBufferGeometry( 100, 40, 40 ), mapMaterial );
	sphere.doubleSided = false;
	sphere.rotation.x = Math.PI;
	sphere.rotation.y = -Math.PI/2;
	sphere.rotation.z = Math.PI;
	sphere.id = "base";
	rotating.add( sphere );

    // var atmosphereMaterial = new THREE.ShaderMaterial({
	// 	vertexShader: document.getElementById('vertexShaderAtmosphere').textContent,
	// 	fragmentShader: document.getElementById('fragmentShaderAtmosphere').textContent,
	// 	// atmosphere should provide light from behind the sphere, so only render the back side
	// 	side: THREE.BackSide
	// });

	// var atmosphere = new THREE.Mesh(sphere.geometry.clone(), atmosphereMaterial);
	// atmosphere.scale.x = atmosphere.scale.y = atmosphere.scale.z = 1.8;
	// rotating.add(atmosphere);

	// for( var i in timeBins ){
	// 	var bin = timeBins[i].data;
	// 	for( var s in bin ){
	// 		var set = bin[s];

	// 		var seriesPostfix = set.series ? ' [' + set.series + ']' : '';
	// 		var testName = (set.date + ' ' + missileLookup[set.missile].name + seriesPostfix).toUpperCase();

	// 		selectableTests.push( testName );
	// 	}
	// }

	// load geo data (facility lat lons in this case)
	console.time('loadGeoData');
	// loadGeoData( latlonData );
	console.timeEnd('loadGeoData');

	console.time('buildDataVizGeometries');
	// var vizilines = buildDataVizGeometries(timeBins);
	console.timeEnd('buildDataVizGeometries');

	visualizationMesh = new THREE.Object3D();
	rotating.add(visualizationMesh);


	//	-----------------------------------------------------------------------------
	//	Setup our renderer
	renderer = new THREE.WebGLRenderer({antialias:false});
	renderer.setPixelRatio(dpr);
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;

	renderer.sortObjects = false;
	renderer.generateMipmaps = false;

	glContainer.appendChild( renderer.domElement );


	// Detect passive event support
	var passive = false;
	var options = Object.defineProperty({}, 'passive', {
		get: function() {
			passive = true;
		}
	});
	document.addEventListener('testPassiveEventSupport', function() {}, options);
	document.removeEventListener('testPassiveEventSupport', function() {}, options);

	//	-----------------------------------------------------------------------------
	//	Event listeners
	// // document.addEventListener( 'mousemove', onDocumentMouseMove, true );
	// // document.addEventListener( 'touchmove', onDocumentMouseMove, passive ? { capture: true, passive: false } : true );
	// document.addEventListener( 'windowResize', onDocumentResize, false );

	// // //masterContainer.addEventListener( 'mousedown', onDocumentMouseDown, true );
	// // //masterContainer.addEventListener( 'mouseup', onDocumentMouseUp, false );
	// // document.addEventListener( 'mousedown', onDocumentMouseDown, true );
	// // document.addEventListener( 'touchstart', onDocumentMouseDown, passive ? { capture: true, passive: false } : true );
	// // document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	// // document.addEventListener( 'touchend', onDocumentMouseUp, false );
	// // document.addEventListener( 'touchcancel', onDocumentMouseUp, false );

	// var mc = new Hammer(document);
	// mc.get('pinch').set({ enable: true });
	// mc.get('pan').set({ threshold: 0, pointers: 3, direction: Hammer.DIRECTION_VERTICAL });
	// mc.on('pinchstart pinchmove', onDocumentPinch);
	// mc.on('panmove', onDocumentPan);

	// masterContainer.addEventListener( 'click', onClick, true );
	masterContainer.addEventListener( 'mousewheel', onMouseWheel, false );

	// //	firefox
	masterContainer.addEventListener( 'DOMMouseScroll', function(e){
			var evt=window.event || e; //equalize event object
			onMouseWheel(evt);
	}, false );

	// document.addEventListener( 'keydown', onKeyDown, false);

	//	-----------------------------------------------------------------------------
	//	Setup our camera
	var aspect = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera(12 / Math.min(aspect, 1), aspect, 1, 20000);
	camera.position.z = 400;
	camera.position.y = 0;
	camera.lookAt(scene.position);
	camera.zoom = 0.3;
	scene.add( camera );

	camera2d = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, 1, 20000);
	camera2d.position.z = 400;
	camera2d.position.y = 0;
	camera.lookAt(scene2d.position);

	var windowResize = THREEx.WindowResize(renderer, camera, camera2d);
}

function render() {
	renderer.clear();
	renderer.render( scene, camera );
}

function render2d() {
	renderer.render( scene2d, camera2d );
}

function animate() {

	//	Disallow roll for now, this is interfering with keyboard input during search
/*
	if(keyboard.pressed('o') && keyboard.pressed('shift') == false)
		camera.rotation.z -= 0.08;
	if(keyboard.pressed('p') && keyboard.pressed('shift') == false)
		camera.rotation.z += 0.08;
*/

	if( rotateTargetX !== undefined && rotateTargetY !== undefined ){

		rotateVX += (rotateTargetX - rotateX) * 0.012;
		rotateVY += (rotateTargetY - rotateY) * 0.012;

		// var move = new THREE.Vector3( rotateVX, rotateVY, 0 );
		// var distance = move.length();
		// if( distance > .01 )
		// 	distance = .01;
		// move.normalize();
		// move.multiplyScalar( distance );

		// rotateVX = move.x;
		// rotateVy = move.y;

		if( Math.abs(rotateTargetX - rotateX) < 0.02 && Math.abs(rotateTargetY - rotateY) < 0.02 ){
			rotateTargetX = undefined;
			rotateTargetY = undefined;
		}
	}

	rotateX += rotateVX;
	rotateY += rotateVY;

	//rotateY = wrap( rotateY, -Math.PI, Math.PI );

	rotateVX *= 0.98;
	rotateVY *= 0.98;

	if(dragging || rotateTargetX !== undefined ){
		rotateVX *= 0.6;
		rotateVY *= 0.6;
	}

	//	constrain the pivot up/down to the poles
	//	force a bit of bounce back action when hitting the poles
	if(rotateX < -rotateXMax){
		rotateX = -rotateXMax;
		rotateVX *= -0.95;
	}
	if(rotateX > rotateXMax){
		rotateX = rotateXMax;
		rotateVX *= -0.95;
	}

	rotating.rotation.x = rotateX;
	rotating.rotation.y = rotateY;

	if (tiltTarget !== undefined) {
		tilt += (tiltTarget - tilt) * 0.012;
		camera.position.y = 300 * Math.sin(-tilt);
		camera.position.z = 100 + 300 * Math.cos(-tilt);
		camera.lookAt(new THREE.Vector3(0, 0, 100));

		if (Math.abs(tiltTarget - tilt) < 0.05) {
			tiltTarget = undefined;
		}
	}

	if (scaleTarget !== undefined) {
		camera.zoom *= Math.pow(scaleTarget / camera.zoom, 0.012);
		camera.updateProjectionMatrix();

		if (Math.abs(Math.log(scaleTarget / camera.zoom)) < 0.05) {
			scaleTarget = undefined;
		}
	}

	render();

	requestAnimationFrame( animate );


	rotating.traverse(function(mesh) {
		if (mesh.update !== undefined) {
			mesh.update();
		}
	});

	// updateMarkers();
	render2d();
}

function constrain(v, min, max){
	if( v < min )
		v = min;
	else
	if( v > max )
		v = max;
	return v;
}

function handleMWheel(delta) {
	camera.zoom += delta * 0.1;
	camera.zoom = constrain(camera.zoom, 0.5, 5.0);
	camera.updateProjectionMatrix();
	scaleTarget = undefined;
}

function onMouseWheel(event) {
	var delta = 0;

	if (event.wheelDelta) { /* IE/Opera. */
		delta = event.wheelDelta / 120;
	} else if (event.detail) { // firefox
		delta = -event.detail / 3;
	}

	if (delta) {
		handleMWheel(delta);
	}

	event.returnValue = false;
}

function start(e) {
	//	detect for webgl and reject everything else
	// loadLangCSS(lang);
	//	ensure the map images are loaded first!!
	mapOutlineImage = new Image();
	mapOutlineImage.src = 'images/map_outline.png';
	mapOutlineImage.onload = function() {
		initScene();
		animate();
		camera.updateProjectionMatrix();
	};
}

start();
