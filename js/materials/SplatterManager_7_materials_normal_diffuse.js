
// splatterManager version producing a shader with 7 pseudo-materials

// For some GPUS, renderer.capabilities.maxTextures yields 16, which means 
// no more than 16 textures can be used in a single shader.

// this shader combines 7 different diffuse and normal maps, no ORM map, and 2 mix maps.
// 7 pseudo-materials with one diffuse and one normal is 14 textures;
// plus 2 mixmaps -> all 16 textures are used.

// mix map 1:
// R1 -> 1 + 2
// G1 -> 3 + 4 
// B1 -> R1 + G1

// mix map 2:
// R2 -> 5 + 6
// G2 -> 7 + R2
// B2 -> G2 + B1

// final output is determined by the value of B2.


import { Data3DTexture } from "three";


class SplatterManager {

    static texturePool = [
        { path: ``, tally: 0, texture: null }
    ];

    static loadTextureSet(loader, path) {

        //load diffuse, normal from a path

        const diffuseMap = SplatterManager.loadTexture(loader, `${path}/diffuse.jpg`);
        const normalMap = SplatterManager.loadTexture(loader, `${path}/normal.jpg`);

        return { diffuseMap, normalMap };

    }

    static loadTexture(loader, path) {

        //load a texture. if it's already in our texture pool, reuse it.
        //keep a tally so they can be unloaded later.

        let texture;
        //is the texture in the pool? return it
        let texturePoolMatches = SplatterManager.texturePool.filter(texture => texture.path == path);
        if (texturePoolMatches.length) {
            let texture_pool = texturePoolMatches[0];
            texture_pool.tally = texture_pool.tally + 1;
            return texture_pool.texture;
        }

        //new texture - load it
        texture = loader.load(path);
        texture.mapping = THREE.UVMapping;

        //fix artefacts on edges
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        // texture.magFilter = THREE.NearestFilter;
        // texture.minFilter = THREE.NearestMipmapNearestFilter;

        //push the texture to the pool
        let texture_item = { path: path, tally: 1, texture: texture };
        SplatterManager.texturePool.push(texture_item);
        //return the texture
        return texture;
    }

    static getTextureFromPool(path) {

        //get the texture from the pool, find by path

        let texturePoolMatches = SplatterManager.texturePool.filter(texture => texture.path == path);

        if (texturePoolMatches.length) {
            let texture_pool = texturePoolMatches[0];
            return texture_pool.texture;
        }

    }

    static replaceTextureInPool(path, texture) {

        for (var item of SplatterManager.texturePool) {
            if (item.path == path) {
                item.texture = texture;
            }
        }

    }

    static loadData(loader, data) {

        //load a texture from image data
        let texture = loader.load(data);
        return texture;

    }

    static addUniforms(shader, index, diffuseMap, normalMap) {

        shader.uniforms[`map${index}`] = { value: diffuseMap };
        shader.uniforms[`normalMap${index}`] = { value: normalMap };

    }

    static load({
        amount,
        uv_scale,
        mixMapFullPath1,
        mix_data1,
        mix_texture1,
        mixMapFullPath2,
        mix_data2,
        mix_texture2,
        texturePath1,
        texturePath2,
        texturePath3,
        texturePath4,
        texturePath5,
        texturePath6,
        texturePath7
    }) {

        //load mix maps

        let mixMap1;
        let mixMap2;
        let textureLoader = new THREE.TextureLoader();

        if (mixMapFullPath1) {
            //use mixMapFullPath1
            mixMap1 = SplatterManager.loadTexture(textureLoader, mixMapFullPath1);
        }
        if (mix_data1) {
            //use mix_data1
            mixMap1 = SplatterManager.loadData(textureLoader, mix_data1);
        }
        if (mix_texture1) {
            //use supplied texture 
            mixMap1 = mix_texture1;
        }

        if (mixMapFullPath2) {
            //use mixMapFullPath2
            mixMap2 = SplatterManager.loadTexture(textureLoader, mixMapFullPath2);
        }
        if (mix_data2) {
            //use mix_data2
            mixMap2 = SplatterManager.loadData(textureLoader, mix_data2);
        }
        if (mix_texture2) {
            //use supplied texture 
            mixMap2 = mix_texture2;
        }



        //load height map

        // const heightMap = SplatterManager.loadTexture(textureLoader, heightMapFullPath);

        //load splatter maps

        const { diffuseMap: diffuseMap1, normalMap: normalMap1 } = SplatterManager.loadTextureSet(textureLoader, texturePath1);
        const { diffuseMap: diffuseMap2, normalMap: normalMap2 } = SplatterManager.loadTextureSet(textureLoader, texturePath2);
        const { diffuseMap: diffuseMap3, normalMap: normalMap3 } = SplatterManager.loadTextureSet(textureLoader, texturePath3);
        const { diffuseMap: diffuseMap4, normalMap: normalMap4 } = SplatterManager.loadTextureSet(textureLoader, texturePath4);

        const { diffuseMap: diffuseMap5, normalMap: normalMap5 } = SplatterManager.loadTextureSet(textureLoader, texturePath5);
        const { diffuseMap: diffuseMap6, normalMap: normalMap6 } = SplatterManager.loadTextureSet(textureLoader, texturePath6);
        const { diffuseMap: diffuseMap7, normalMap: normalMap7 } = SplatterManager.loadTextureSet(textureLoader, texturePath7);

        //set master scale (affects all textures)
        diffuseMap1.repeat.set(uv_scale, uv_scale);
        diffuseMap2.repeat.set(uv_scale, uv_scale);
        diffuseMap3.repeat.set(uv_scale, uv_scale);
        diffuseMap4.repeat.set(uv_scale, uv_scale);

        diffuseMap5.repeat.set(uv_scale, uv_scale);
        diffuseMap6.repeat.set(uv_scale, uv_scale);
        diffuseMap7.repeat.set(uv_scale, uv_scale);

        //create a material 
        const material = new THREE.MeshStandardMaterial(
            {
                side: THREE.FrontSide,
                map: diffuseMap1,
                normalMap: normalMap1,
                normalScale: new THREE.Vector2(1, 1),
                metalness: 0.0,
                roughness: 1.0
            }
        );


        let shaderFunction = function (shader) {

            // add mix maps
            shader.uniforms.mixMap1 = { value: mixMap1 };

            shader.uniforms.mixMap2 = { value: mixMap2 };


            // add height map
            // shader.uniforms.heightMap = { value: heightMap };

            // add splatter map uniforms

            // set 1 is already set by the material class so we don't specify it here
            // SplatterManager.addUniforms(shader, 1, diffuseMap1, normalMap1, aoMap1);

            SplatterManager.addUniforms(shader, 2, diffuseMap2, normalMap2);
            SplatterManager.addUniforms(shader, 3, diffuseMap3, normalMap3);
            SplatterManager.addUniforms(shader, 4, diffuseMap4, normalMap4);

            SplatterManager.addUniforms(shader, 5, diffuseMap5, normalMap5);
            SplatterManager.addUniforms(shader, 6, diffuseMap6, normalMap6);
            SplatterManager.addUniforms(shader, 7, diffuseMap7, normalMap7);


            // mixMap uniform and varyings for mix amounts

            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                [
                    `#include <common>`,

                    `uniform sampler2D mixMap1;`,

                    `uniform sampler2D mixMap2;`,


                    `varying vec2 vUV; `,
                    `varying vec2 vUV2; `,
                    ``
                ].join('\n')
            );


            //get mix amounts

            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                [
                    '#include <begin_vertex>',

                    `vUV = uv * vec2(${uv_scale},${uv_scale});`,

                    `vUV2 = uv;`,

                    `vec4 mixData1 = texture2D( mixMap1, uv );`,

                    `vec4 mixData2 = texture2D( mixMap2, uv );`,

                    ``

                ].join('\n')
            );

            // new diffuse maps and mix map uniforms

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_pars_fragment>',
                [
                    `uniform sampler2D map;`,
                    `uniform sampler2D map2;`,
                    `uniform sampler2D map3;`,
                    `uniform sampler2D map4;`,

                    `uniform sampler2D map5;`,
                    `uniform sampler2D map6;`,
                    `uniform sampler2D map7;`,

                    `uniform sampler2D mixMap1;`,
                    `uniform sampler2D mixMap2;`,

                    `varying vec2 vUV;`,
                    `varying vec2 vUV2;`,

                    ``
                ].join('\n')
            );


            // new normal uniforms

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <normalmap_pars_fragment>',
                [
                    '#include <normalmap_pars_fragment>',

                    `uniform sampler2D normalMap2;`,

                    `uniform sampler2D normalMap3;`,

                    `uniform sampler2D normalMap4;`,

                    `uniform sampler2D normalMap5;`,
                    `uniform sampler2D normalMap6;`,
                    `uniform sampler2D normalMap7;`,

                    ``
                ].join('\n')
            );


            // mix diffuse maps

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                [
                    `#ifdef USE_MAP`,

                    // mix diffuse maps 

                    `vec4 mixData1 = texture2D( mixMap1, vUV2 );`,

                    `float vMix1_r = mixData1.r;`,
                    `float vMix1_g = mixData1.g;`,
                    `float vMix1_b = mixData1.b;`,

                    //mix map1 and map2 with red channel
                    `vec4 cmap1 = (smoothstep(1.00, 0.00, vMix1_r)) * texture2D(map, vUV );`,
                    `vec4 cmap2 = (smoothstep(0.00, 1.00, vMix1_r)) * texture2D(map2, vUV );`,

                    //mix map3 and map4 with green channel
                    `vec4 cmap3 = (smoothstep(1.00, 0.00, vMix1_g)) * texture2D(map3, vUV );`,
                    `vec4 cmap4 = (smoothstep(0.00, 1.00, vMix1_g)) * texture2D(map4, vUV );`,

                    //mix red and green using blue channel
                    `vec4 cmapr1 = (smoothstep(1.00, 0.00, vMix1_b)) * (cmap1 + cmap2);`,
                    `vec4 cmapg1 = (smoothstep(0.00, 1.00, vMix1_b)) * (cmap3 + cmap4);`,


                    //xz - diffuse

                    `vec4 mixData2 = texture2D( mixMap2, vUV2 );`,

                    `float vMix2_r = mixData2.r;`,
                    `float vMix2_g = mixData2.g;`,
                    `float vMix2_b = mixData2.b;`,

                    //mix map5 and map6 with red channel 
                    `vec4 cmap5 = (smoothstep(1.00, 0.00, vMix2_r)) * texture2D(map5, vUV );`,
                    `vec4 cmap6 = (smoothstep(0.00, 1.00, vMix2_r)) * texture2D(map6, vUV );`,

                    //mix map7 and red channel with green channel
                    `vec4 cmap7 = (smoothstep(1.00, 0.00, vMix2_g)) * texture2D(map7, vUV );`,
                    `vec4 cmap8 = (smoothstep(0.00, 1.00, vMix2_g)) * (cmap5 + cmap6);`,

                    //mix green and mixmap1 using blue channel
                    `vec4 cmapr2 = (smoothstep(1.00, 0.00, vMix2_b)) * (cmap7 + cmap8);`,
                    `vec4 cmapg2 = (smoothstep(0.00, 1.00, vMix2_b)) * (cmapr1 + cmapg1);`,

                    //xz - diffuse


                    //final color
                    // `vec4 sampledDiffuseColor = vec4(0.0, 0.0, 0.0, 1.0) + cmapr1 + cmapg1;`,
                    // `vec4 sampledDiffuseColor = vec4(0.0, 0.0, 0.0, 1.0) + cmapr2 + cmapg2;`
                    // `vec4 sampledDiffuseColor = vec4(0.0, 0.0, 0.0, 1.0) + cmapr1 + cmapg1 + cmapr2 + cmapg2;`,

                    `vec4 sampledDiffuseColor = vec4(0.0, 0.0, 0.0, 1.0) + cmapr2 + cmapg2;`,



                    `#ifdef DECODE_VIDEO_TEXTURE`,
                    `sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );`,
                    `#endif`,

                    `diffuseColor *= sampledDiffuseColor;`,
                    `#endif`
                ].join('\n')
            );


            // mix normal maps
            // only works with tangentspace. I've included objectspace calcs for clarity

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <normal_fragment_maps>',
                [
                    `#ifdef OBJECTSPACE_NORMALMAP`,

                    `	normal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals`,

                    `	#ifdef FLIP_SIDED`,
                    `		normal = - normal;`,
                    `	#endif`,
                    `	#ifdef DOUBLE_SIDED`,
                    `		normal = normal * faceDirection;`,
                    `	#endif`,
                    `	normal = normalize( normalMatrix * normal );`,

                    `#elif defined( TANGENTSPACE_NORMALMAP )`,


                    //mix normal1 and normal2 using mixmap1 red channel

                    `	vec3 mapN1 = (smoothstep(1.00, 0.00, vMix1_r)) * texture2D( normalMap, vUv ).xyz;`,
                    `	mapN1.xy *= normalScale;`,

                    `	vec3 mapN2 = (smoothstep(0.00, 1.00, vMix1_r)) * texture2D( normalMap2, vUv ).xyz;`,
                    `	mapN2.xy *= normalScale;`,

                    //mix normal3 and normal4 using mixmap1 green channel

                    `	vec3 mapN3 = (smoothstep(1.00, 0.00, vMix1_g)) * texture2D( normalMap3, vUv ).xyz;`,
                    `	mapN3.xy *= normalScale;`,

                    `	vec3 mapN4 = (smoothstep(0.00, 1.00, vMix1_g)) * texture2D( normalMap4, vUv ).xyz;`,
                    `	mapN4.xy *= normalScale;`,

                    //mix red and green using mixmap1 blue channel

                    `	vec3 mapNR1 = (smoothstep(1.00, 0.00, vMix1_b)) * (mapN1 + mapN2);`,
                    `	vec3 mapNG1 = (smoothstep(0.00, 1.00, vMix1_b)) * (mapN3 + mapN4);`,
                    `   vec3 mapP1 = (mapNR1 + mapNG1) * 2.0 - 1.0; `,




                    //xz - normal

                    //mix normal5 and normal6 using mixmap2 red channel

                    `	vec3 mapN5 = (smoothstep(1.00, 0.00, vMix2_r)) * texture2D( normalMap5, vUv ).xyz;`,
                    `	mapN5.xy *= normalScale;`,

                    `	vec3 mapN6 = (smoothstep(0.00, 1.00, vMix2_r)) * texture2D( normalMap6, vUv ).xyz;`,
                    `	mapN6.xy *= normalScale;`,

                    //mix normal7 and red channel using mixmap2 green channel

                    `	vec3 mapN7 = (smoothstep(1.00, 0.00, vMix2_g)) * texture2D( normalMap7, vUv ).xyz;`,
                    `	mapN7.xy *= normalScale;`,

                    `	vec3 mapN8 = (smoothstep(0.00, 1.00, vMix2_g)) * (mapN5 + mapN6);`,
                    `	mapN7.xy *= normalScale;`,


                    //mix green and mixmap1 using mixmap2 blue channel

                    `	vec3 mapNR2 = (smoothstep(1.00, 0.00, vMix2_b)) * (mapN7 + mapN8);`,
                    `	vec3 mapNG2 = (smoothstep(0.00, 1.00, vMix2_b)) * (mapNR1 + mapNG1);`,
                    `   vec3 mapP2 = (mapNR2 + mapNG2) * 2.0 - 1.0; `,

                    //xz - normal

                    `	#ifdef USE_TANGENT`,
                    // `		normal = normalize( vTBN * mapP );`,
                    `		normal = normalize( vTBN * mapP2 );`,

                    `	#else`,
                    // `		normal = perturbNormal2Arb( - vViewPosition, normal, mapP, faceDirection );`,
                    `		normal = perturbNormal2Arb( - vViewPosition, normal, mapP2, faceDirection );`,
                    `	#endif`,
                    `#elif defined( USE_BUMPMAP )`,
                    `	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );`,
                    `#endif`,
                    ``
                ].join('\n')
            );





            material.userData.shader = shader;

        };

        material.onBeforeCompile = shaderFunction;

        //custom depth material to help shadows
        // material.customDepthMaterial = new THREE.MeshDepthMaterial({
        //     depthPacking: THREE.RGBADepthPacking,
        //     displacementMap: heightMap,
        //     displacementScale: displacementScale,
        //     displacementBias: 0.01,
        // });

        // material.customDepthMaterial.onBeforeCompile = shaderFunction;

        // Make sure WebGLRenderer doesnt reuse a single program

        material.customProgramCacheKey = function () {

            //we don't use amount for this demo, but leaving it in for clarity
            //for the future

            return amount;

        };

        return material;

    }

}

export { SplatterManager }