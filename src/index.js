

import * as THREE from '../node_modules/three/build/three.module.js';

import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '../node_modules/three/examples/jsm/loaders/RGBELoader.js';
import { RoughnessMipmapper } from '../node_modules/three/examples/jsm/utils/RoughnessMipmapper.js';

let container, controls;
let camera, scene, renderer;

let infProg = {};
infProg.scene = null;
infProg.material = [];
infProg.dirLight = null;
infProg.arr = [];


init();
render();
setElemRP();


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.style.width = '100%';
	renderer.domElement.style.height = '100%';
	
	render();

}



function render() {

	renderer.render( scene, camera );

}


function init() {

	container = document.createElement( 'div' );	
	document.body.appendChild( container );
	
	container.style.position = 'fixed';
	container.style.width = '100%';
	container.style.height = '100%';
	container.style.top = 0;
	container.style.left = 0;	

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 50 );
	camera.position.set( 0, 1, 8 );
	
	scene = new THREE.Scene();
	//scene.background = new THREE.Color( 0x4f5152 );
	scene.background = new THREE.Color( 0xffffff );
	
	let dirLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
	dirLight.castShadow = true;
	dirLight.position.set(0,6,5);	
	scene.add(dirLight);
	
	infProg.dirLight = dirLight;
	
	//let dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10, 0xff0000 );
	//scene.add( dirLightHelper );

	let lightMap_1 = new THREE.TextureLoader().load('textures/lightMap_1.png');
	
			
	new RGBELoader()
		.setDataType( THREE.UnsignedByteType )
		.setPath( 'textures/' )
		.load( 'studio_small_03_1k.hdr', function ( texture ) {

			var envMap = pmremGenerator.fromEquirectangular( texture ).texture;

			//scene.background = envMap;
			scene.environment = envMap;

			texture.dispose();
			pmremGenerator.dispose();

			render();

			// model

			// use of RoughnessMipmapper is optional
			let roughnessMipmapper = new RoughnessMipmapper( renderer );			
			
			let loader = new GLTFLoader().setPath( 'model/' );
			loader.load( 'scene.gltf', function ( gltf ) {
				
				infProg.scene = gltf.scene;
				
				gltf.scene.traverse( function ( child ) {

					if ( child.isMesh ) {
						child.castShadow = true;	
						//child.receiveShadow = true;	
						child.material.needsUpdate = true;	

						addMaterialObjToList({material: child.material});
						
						if ( child.name == 'mesh_2' ) { infProg.arr[infProg.arr.length] = {name: 'mesh_2', o: child}; }
						if ( child.name == 'mesh_8' ) { infProg.arr[infProg.arr.length] = {name: 'mesh_8', o: child}; }
						if ( child.name == 'mesh_9' ) { infProg.arr[infProg.arr.length] = {name: 'mesh_9', o: child}; }
					}

				} );


				let elemLoad = document.querySelector('[nameId="progress_wrap"]');
				elemLoad.style.display = "none";
				
				scene.add( gltf.scene );
				
				roughnessMipmapper.dispose();
				
				setDefaultMaterial();
				
				const plane = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100, 1 ), new THREE.MeshStandardMaterial( {color: 0xffffff, lightMap: lightMap_1} ) );
				plane.material.metalness = 0;
				plane.material.envMapIntensity = 0;
				plane.position.y = -1.55;
				plane.rotation.x = -Math.PI/2;
				plane.receiveShadow = true;
				scene.add( plane );				

				render();
			},
			function ( xhr ) {

				//console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

			});
			

		} );						
	

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1;
	renderer.outputEncoding = THREE.sRGBEncoding;
	
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
	
	container.appendChild( renderer.domElement );
	
	var pmremGenerator = new THREE.PMREMGenerator( renderer );
	pmremGenerator.compileEquirectangularShader();	

	renderer.domElement.style.width = '100%';
	renderer.domElement.style.height = '100%';
	renderer.domElement.style.outline = 'none';

	controls = new OrbitControls( camera, renderer.domElement );
	controls.addEventListener( 'change', render ); // use if there is no animation loop
	controls.minDistance = 0.1;
	controls.maxDistance = 100;
	controls.target.set( 0, 0.3, 0 );
	controls.update();

	window.addEventListener( 'resize', onWindowResize, false );

}


function addMaterialObjToList(params)
{
	let exist = false;
	let material = params.material;
	
	for (let i = 0; i < infProg.material.length; i++)
	{
		if(material == infProg.material[i]) 
		{
			exist = true;
			break;
		}
	}
	
	if(!exist) infProg.material[infProg.material.length] = material;
}



function setDefaultMaterial()
{
	if(infProg.material.length == 0) return;
	
	inputMetalness({value: 0.96});
	inputRoughness({value: infProg.material[0].roughness});
	inputEnvMapIntensity({value: infProg.material[0].envMapIntensity});
	inputDirLight({value: 3.27});
	setToneMapping({value: 1.1});
}



function setElemRP()
{
	let input1 = document.querySelector('[nameId="input_metalness"]');
	input1.onmousemove = function(e) { inputMetalness({value: input1.value}); };	
	
	let input2 = document.querySelector('[nameId="input_roughness"]');
	input2.onmousemove = function(e) { inputRoughness({value: input2.value}); }	

	let input3 = document.querySelector('[nameId="input_envMapIntensity"]');
	input3.onmousemove = function(e) { inputEnvMapIntensity({value: input3.value}); }	

	let input4 = document.querySelector('[nameId="input_dirLight"]');
	input4.onmousemove = function(e) { inputDirLight({value: input4.value}); }

	let input5 = document.querySelector('[nameId="input_toneMapping"]');
	input5.onmousemove = function(e) { setToneMapping({value: input5.value}); }	
}



function inputEnvMapIntensity(params)
{
	if(infProg.material.length == 0) return;
	
	let value = params.value;						
	
	let input = document.querySelector('[nameId="input_envMapIntensity"]');
	input.value = value;
	
	let elem = document.querySelector('[nameId="txt_envMapIntensity"]');
	elem.innerText = 'envMapIntensity '+ value;
	
	infProg.material[0].envMapIntensity = value;
	infProg.material[0].needsUpdate = true;
	
	render();	
}




function inputMetalness(params)
{
	if(infProg.material.length == 0) return;

	let value = params.value;						

	let input = document.querySelector('[nameId="input_metalness"]');
	input.value = value;
	
	let elem = document.querySelector('[nameId="txt_metalness"]');
	elem.innerText = 'metalness '+ value;
	
	infProg.material[0].metalness = value;
	infProg.material[0].needsUpdate = true;
	
	render();	
}


function inputRoughness(params)
{
	if(infProg.material.length == 0) return;
	
	let value = params.value;						
	
	let input = document.querySelector('[nameId="input_roughness"]');
	input.value = value;
	
	let elem = document.querySelector('[nameId="txt_roughness"]');
	elem.innerText = 'roughness '+ value;
	
	infProg.material[0].roughness = value;
	infProg.material[0].needsUpdate = true;
	
	render();	
}


function inputDirLight(params)
{
	if(!infProg.dirLight) return;
	
	let value = params.value;						
	
	let input = document.querySelector('[nameId="input_dirLight"]');
	input.value = value;
	
	let elem = document.querySelector('[nameId="txt_dirLight"]');
	elem.innerText = 'lightIntensity '+ value;
	
	infProg.dirLight.intensity = value;
	
	render();	
}



function setToneMapping(params)
{
	let value = params.value;						
	
	let input = document.querySelector('[nameId="input_toneMapping"]');
	input.value = value;
	
	let elem = document.querySelector('[nameId="txt_toneMapping"]');
	elem.innerText = 'toneMapping '+ value;	
	
	renderer.toneMappingExposure = value;					
	
	render();	
}


document.body.addEventListener( 'mousemove', onDocumentMouseMove, false );


function onDocumentMouseMove( event )
{
	let rayhit = clickRayHit(event);
	
	if(rayhit)
	{
		console.log(rayhit);
	}
}



function clickRayHit(event)
{
	let rayhit = null;
	
	let arrO = infProg.arr.map(item => item.o);
	rayhit = rayIntersect( event, arrO, 'arr' );
	rayhit = (rayhit.length > 0) ? rayhit[0] : null;

	return rayhit;
}


function rayIntersect( event, obj, t, recursive ) 
{
	let mouse = {x: 0, y: 0};
	let raycaster = new THREE.Raycaster();
	
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	raycaster.setFromCamera( mouse, camera );
	
	let intersects = null;
	if(t == 'one'){ intersects = raycaster.intersectObject( obj ); } 
	else if(t == 'arr'){ intersects = raycaster.intersectObjects( obj, recursive ); }
	
	return intersects;
}


