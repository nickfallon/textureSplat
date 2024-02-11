

import * as THREE from 'three';

import { SplatterManager } from 'three/js/materials/SplatterManager_7_materials_normal_diffuse.js';

window.THREE = THREE;
window.SplatterManager = SplatterManager;

let scene, renderer, camera;

let cube;

let light;

let tick = 0;

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

    light = new THREE.PointLight(0xffffff, 2, 100);
    light.position.set(3, 1, 3);
    scene.add(light);

    // make a box 

    const geometry = new THREE.BoxGeometry(1, 1, 1, 10, 10, 10);

    // make splatter material with 7 textures (diffuse + normals)

    let material = SplatterManager.load({
        amount: 1.0,
        uv_scale: 1,
        mixMapFullPath1: `mixmaps/mix10.jpg`,
        mix_data1: null,
        mix_texture1: null,
        mixMapFullPath2: `mixmaps/mix11.jpg`,
        mix_data2: null,
        mix_texture2: null,
        texturePath1: `materials/cliff_rock_3`,
        texturePath2: `materials/desert_sand_2`,
        texturePath3: `materials/forest_moss_2`,
        texturePath4: `materials/muddy_soil`,
        texturePath5: `materials/alien_sludge`,
        texturePath6: `materials/forest_moss_3`,
        texturePath7: `materials/tactile_paving_17`

    });

    // apply the splatter material to the box 

    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 1.6;

}



function animate() {


    tick++;

    // cube.rotation.x += 0.005;
    // cube.rotation.y += 0.005;

    renderer.render(scene, camera);

    requestAnimationFrame(animate);

    // light.position.set(Math.sin(tick * 0.05) * 3, 1, 3);

}


function onWindowResize() {

    var width = window.innerWidth;
    var height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

}

