/**
 * Invitro for my wedding party. Features three.js dot field and a hand crafted sunset shader
 *
 * @summary Invitro for my wedding party. 
 * @author Boris Posavec
 *
 * Created at     : 2019-07-29 10:02:57 
 * Last modified  : 2019-07-29 10:12:07
 */


 /**
  * Some globals used through out the intro.
  */
var scene, camera, renderer;
var sun = null;
var cloud = null;
var time = 0;
var altitude = 1.2;
var startTime;

window.addEventListener('resize', onWindowResize, false);

/**
 * Resize callback.
 */
function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 
 * @param {Array} uniforms list of uniforms (see three.js documentation)
 * @param {String} vs Vertex shader
 * @param {String} fs Fragment shader
 */
function createPlane(uniforms, vs, fs)
{
    let z = 0.0;
    var geom = new THREE.BufferGeometry();
    var vertices = new Float32Array([
    -1.0, -1.0,  z,
	 1.0, -1.0,  z,
	 1.0,  1.0,  z,

	 1.0,  1.0,  z,
	-1.0,  1.0,  z,
	-1.0, -1.0,  z
    ]);

    var uvs = new Float32Array([
       0.0, 0.0,
       1.0, 0.0,
       1.0, 1.0,
       
       1.0, 1.0,
       0.0, 1.0,
       0.0, 0.0
    ]);

    geom.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    
    var mat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vs,
        fragmentShader: fs
    });        

    var mesh = new THREE.Mesh(geom, mat);        
    return {mesh: mesh, mat: mat};
}


/**
 * Set up point cloud. We have a wavy grid on the bottom of the screen. 
 */
var rows, cols;
var positions, scales;
function initPointCloud(_rows, _cols, spacing)
{
    let z = -60;
    rows = _rows;
    cols = _cols;
    let numParticles = rows * cols;
    positions = new Float32Array(numParticles * 3);
    scales = new Float32Array(numParticles);
    let i = 0, j = 0;
    for (let ix = 0; ix < cols; ix ++) {
        for (let iy = 0; iy < rows; iy ++) {
            positions[i] = ix * spacing - ( ( cols * spacing ) / 2 ); // x
            positions[i + 1] = 0; // y
            positions[i + 2] = iy * spacing - ( ( rows * spacing ) / 2 ) + z; // z
            scales[ j ] = 1;
            i += 3;
            j++;
        }
    }
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'scale', new THREE.BufferAttribute( scales, 1 ) );
    var material = new THREE.ShaderMaterial( {
        uniforms: {
            color: { value: new THREE.Color(0.9, 0.4, 0.6) },
        },
        vertexShader: document.getElementById( 'pointcloud_vs' ).textContent,
        fragmentShader: document.getElementById( 'pointcloud_fs' ).textContent
    } );
    
    var particles = new THREE.Points( geometry, material );
    scene.add( particles );
    return {mesh: particles, mat: material};
}


/**
 * Animate point cloud. Call once per frame.
 * @todo make this deltatime dependent. Currently animation is fixed step.
 */
function animatePointCloud()
{
    var i = 0, j = 0;
    for ( var ix = 0; ix < cols; ix ++ ) {
        for ( var iy = 0; iy < rows; iy ++ ) {
            positions[ i + 1 ] = ( Math.sin( ( ix + time * 4 ) * 0.3) ) +
                            ( Math.sin( ( iy + time ) * 0.5 ) * 1 );
            scales[ j ] = ( Math.sin( ( ix + time ) * 0.3 ) + 1 ) * 1 +
                            ( Math.sin( ( iy + time ) * 0.5 ) + 1 );
            i += 3;
            j ++;
        }
    }
    cloud.mesh.geometry.attributes.position.needsUpdate = true;
    cloud.mesh.geometry.attributes.scale.needsUpdate = true;
}

/**
 * Initialize renderer and scene.
 * Load shaders from file, when shaders ready: load uniforms, create plane, create blanket div (white cover).
 * Invoke start() to start animating stuff.
 */
function init()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    camera.position.z = 2;    
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });    
    renderer.setSize(window.innerWidth, window.innerHeight-4);
    
    var container = document.getElementById('world');
    container.appendChild(renderer.domElement);
    
    // Cover up the whole screen with white blanket
    var blanket = document.createElement('div');
    blanket.id = 'blanket';
    blanket.style.position = 'absolute';
    blanket.style.width = '100%';
    blanket.style.height = '4000px';
    blanket.style.top = '0px';
    blanket.style.left = '0px';
    blanket.style.backgroundColor = '#fff';
    container.appendChild(blanket);

    loadShader('./sun.vert', './sun.frag', (vertex, fragment) => {
        var uniforms = {
            time: {value: time},
            altitude: {value: altitude},
            topColor: {value: new THREE.Vector3(1.0, 1.0, 0.1)},
            // bottomColor: {value: new THREE.Vector3(1.0, 0.1, 0.67)},
            bottomColor: {value: new THREE.Vector3(0.6, 0.1, 0.47)},
            // blindsColor: {value: new THREE.Vector3(1.0, 0.3, 0.57)},
            blindsColor: {value: new THREE.Vector3(1.0, 0.3, 0.47)},
            resolution: {value: new THREE.Vector2(0.0, 0.0)}
          }
        sun = createPlane(uniforms, vertex, fragment);
        scene.add(sun.mesh);

        // start();
        intro();
    });
}

/**
 * Show splash screen. On click -> start music playback & demo
 */
function intro()
{
    var spiral = document.createElement('div');
    spiral.id = 'spiral';
    spiral.style.position = 'absolute';
    spiral.style.width = '100%';
    spiral.style.height = '100%';
    spiral.style.top = '0%';
    spiral.style.left = '0%';
    spiral.style.margin = 'auto';
    spiral.style.backgroundColor = '#fff';
    
    spiral.innerHTML = `
    <image id="pic" src="./gfx/spiral.jpg" style="position:absolute; top:0; left:0; right:0; bottom:0; width:10%; margin:auto;">
    `;

    var container = document.getElementById('world');
    container.appendChild(spiral);

    const onClick = (evt) => {
        document.removeEventListener('mousedown', onClick);
        const audio = document.getElementById('audio');
        audio.play();
        spiral.style.opacity = 0.0;
        spiral.style.transition = `opacity 1s linear`;
        setTimeout(() => {
            spiral.parentElement.removeChild(spiral);
        }, 2000);
        start();
    }
    document.addEventListener('mousedown', onClick, false);    
}

/**
 * Start animating stuff. Fade in the scene, let the sun glide in etc.
 */
function start()
{
    console.log('Ready');

    // Set up point clouds
    cloud = initPointCloud(40, 140, 3);
    sun.mesh.position.y = 0.2;
    sun.mesh.position.z = 0.4;

    // Fade out blanket
    const blanket = document.getElementById('blanket');
    blanket.style.opacity = 0;
    blanket.style.transition = 'opacity 4s linear';

    // Set initial gradient
    document.getElementById('world').style.background = 'linear-gradient(rgb(247,217,170),rgb(170,16,102))';
    startTime = new Date();
    render();
}

/**
 * Main update loop. This is where we render the current frame.
 */
function render()
{
    var endTime = new Date();
    var dt = (endTime - startTime) / 1000.0;
    // Prevent dt from going crazy, this can happen when browser in background.
    dt = Math.min(0.1, dt);
    startTime = new Date();

    requestAnimationFrame(render);
    renderer.render(scene, camera);


    // Move sun towards docking position
    let targetAltitude = 0.385;
    // Clamp tensor, otherwise initially sun glides too fast
    let delta = Math.min(Math.abs(altitude - targetAltitude), 0.2);
    let altitudeDiff = Math.abs(altitude - targetAltitude);
    // Epsilon tolerance 
    if (altitudeDiff > 0.051) {
        altitude = THREE.Math.lerp(altitude, targetAltitude, delta * dt);
    }
    sun.mat.uniforms.altitude.value = altitude;
    sun.mat.uniforms.time.value += dt;

    //rgb(247,217,170),rgb(170,16,102)
    let world = document.getElementById('world');
    let v1 = new THREE.Vector3(247,210,170);
    let v2 = new THREE.Vector3(100,0,20);
    let mix = {}; 
    mix.x = THREE.Math.lerp(v1.x, v2.x, 1.0 - altitude);
    mix.y = THREE.Math.lerp(v1.y, v2.y, 1.0 - altitude);
    mix.z = THREE.Math.lerp(v1.z, v2.z, 1.0 - altitude);
    world.style.background = `linear-gradient(rgb(${mix.x}, ${mix.y}, ${mix.z}), rgb(${v2.x}, ${v2.y}, ${v2.z}))`;
    
    time += dt;
    animatePointCloud();

    // Stretch the sun as it reaches the horizon
    if (altitude < 0.6) {
        sun.mesh.scale.x += dt * 0.02;
        sun.mesh.scale.x = Math.min(sun.mesh.scale.x, 1.15);
    }

    cloud.mesh.position.y = -35.0;

    /**
     * Animate text
     * Fade in text after the sun has reached docking position.
     * Text is positioned relatively to sun's position.
     */
    let label = document.getElementById('caption');
    let sunpos = (1.0 - altitude - 0.2) * window.innerHeight;
    label.style.top = sunpos + 'px';
    // Fade in text
    if (altitudeDiff < 0.1) {
        let seconds = 2.0;
        label.style.opacity = 1.0;
        label.style.transition = `opacity ${seconds}s linear`;
    }

}

// Start main loop
console.log('Sunset starting');
init();



/**
 * ====================================================
 * Stash
 * ====================================================
 */

 /**
 * This is a basic asyncronous shader loader for THREE.js.
 * 
 * It uses the built-in THREE.js async loading capabilities to load shaders from files!
 * 
 * `onProgress` and `onError` are stadard TREE.js stuff. Look at 
 * https://threejs.org/examples/webgl_loader_obj.html for an example. 
 * 
 * @param {String} vertex_url URL to the vertex shader code.
 * @param {String} fragment_url URL to fragment shader code
 * @param {function(String, String)} onLoad Callback function(vertex, fragment) that take as input the loaded vertex and fragment contents.
 * @param {function} onProgress Callback for the `onProgress` event. 
 * @param {function} onError Callback for the `onError` event.
 */
function loadShader(vertex_url, fragment_url, onLoad, onProgress, onError) {
    var vertex_loader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    vertex_loader.setResponseType('text');
    vertex_loader.load(vertex_url, function (vertex_text) {
      var fragment_loader = new THREE.FileLoader(THREE.DefaultLoadingManager);
      fragment_loader.setResponseType('text');
      fragment_loader.load(fragment_url, function (fragment_text) {
        onLoad(vertex_text, fragment_text);
      });
    }, onProgress, onError);
}

var loadTextResource = function (url, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', url + '?please-dont-cache=' + Math.random(), true);
	request.onload = function () {
		if (request.status < 200 || request.status > 299) {
			callback('Error: HTTP Status ' + request.status + ' on resource ' + url);
		} else {
			callback(null, request.responseText);
		}
	};
	request.send();
};

