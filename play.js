

import * as THREE from 'three';

import { SplatterManager } from 'three/js/materials/SplatterManager.js';

window.THREE = THREE;
window.SplatterManager = SplatterManager;

let scene, renderer, camera;

let cube;

init();

animate();


function init() {

    // scene 

    scene = new THREE.Scene();
    window.scene = scene;


    // renderer

    renderer = new THREE.WebGLRenderer({});
    window.renderer = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);


    // camera

    camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        1000);
    camera.position.set(0, 0, 0);
    camera.rotation.order = "YXZ";
    window.camera = camera;

    //window resize

    window.addEventListener('resize', onWindowResize);

    // make a simple light

    const light = new THREE.PointLight(0xffffff, 2, 100);
    light.position.set(3, 1, 3);
    scene.add(light);

    // make a box 

    const geometry = new THREE.BoxGeometry(1, 1, 1, 10, 10, 10);

    // make splatter material 

    let material = SplatterManager.load({
        amount: 1.0,
        uv_scale: 1,
        mixMapFullPath: `mixmaps/mix2.jpg`,
        mix_data: null,
        mix_texture: null,
        texturePath1: `materials/cliff_rock_3`,
        texturePath2: `materials/desert_sand_2`,
        texturePath3: `materials/forest_moss_2`,
        texturePath4: `materials/muddy_soil`
    });

    // apply the splatter material to the box 

    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 2;

}



function animate() {

    cube.rotation.x += 0.005;
    cube.rotation.y += 0.005;

    renderer.render(scene, camera);

    requestAnimationFrame(animate);

}


function onWindowResize() {

    var width = window.innerWidth;
    var height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

}

