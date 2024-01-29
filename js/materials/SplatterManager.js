
// texture splatter for threeJS 
// nick fallon 2022

// creates a new standard material with texture splatting.
// the shader is modified using onBeforeCompile to create the splats in one shader.

// multiple textures blended together using a mixmap texture.
// blended textures have their own diffuseMap, normalMap and aoMap
// any texture can be mixed with any other textures without restriction.
// textures a stored in a texturePool for efficient cacheing.


class SplatterManager {

    static texturePool = [
        { path: ``, tally: 0, texture: null }
    ];

    static loadTextureSet(loader, path) {

        //load diffuse, normal and ao from a path

        const diffuseMap = SplatterManager.loadTexture(loader, `${path}/diffuse.jpg`);
        const normalMap = SplatterManager.loadTexture(loader, `${path}/normal.jpg`);
        const aoMap = SplatterManager.loadTexture(loader, `${path}/orm.jpg`);

        return { diffuseMap, normalMap, aoMap };

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

    static addUniforms(shader, index, diffuseMap, normalMap, aoMap) {

        shader.uniforms[`map${index}`] = { value: diffuseMap };
        shader.uniforms[`normalMap${index}`] = { value: normalMap };
        shader.uniforms[`normalScale${index}`] = { value: new THREE.Vector2(1, 1) };
        shader.uniforms[`aoMap${index}`] = { value: aoMap };

    }

    static load({
        amount,
        uv_scale,
        mixMapFullPath,
        mix_data,
        mix_texture,
        texturePath1,
        texturePath2,
        texturePath3,
        texturePath4
    }) {

        //amount:
        // not currently used. Included for later use with customProgramCacheKey.

        //uv_scale:
        // scale of the textures. 
        // bigger means the textures are smaller and repeat more often.

        //mixMapFullPath (optional):
        // path (including filename) of the mixmap. uses black/white/red/blue.
        // if NULL, we use mix_data instead.

        //mix_data (optional):
        //raw data of the mixmap. uses black/white/red/blue.
        // if NULL, we use mixMapFullPath instead.


        //texturePaths: 
        // folder paths (not including filenames) of diffuse, normal and ao maps.
        // make sure each texturePath folder contains the following files:
        // diffuse.jpg
        // normal.jpg
        // ao.jpg

        //load mix maps

        let mixMap;
        let textureLoader = new THREE.TextureLoader();

        if (mixMapFullPath) {
            //use mixMapFullPath
            mixMap = SplatterManager.loadTexture(textureLoader, mixMapFullPath);
        }
        if (mix_data) {
            //use mix_data
            mixMap = SplatterManager.loadData(textureLoader, mix_data);
        }
        if (mix_texture) {
            //use supplied texture 
            mixMap = mix_texture;
        }

        //load height map

        // const heightMap = SplatterManager.loadTexture(textureLoader, heightMapFullPath);

        //load splatter maps

        const { diffuseMap: diffuseMap1, normalMap: normalMap1, aoMap: aoMap1 } = SplatterManager.loadTextureSet(textureLoader, texturePath1);
        const { diffuseMap: diffuseMap2, normalMap: normalMap2, aoMap: aoMap2 } = SplatterManager.loadTextureSet(textureLoader, texturePath2);
        const { diffuseMap: diffuseMap3, normalMap: normalMap3, aoMap: aoMap3 } = SplatterManager.loadTextureSet(textureLoader, texturePath3);
        const { diffuseMap: diffuseMap4, normalMap: normalMap4, aoMap: aoMap4 } = SplatterManager.loadTextureSet(textureLoader, texturePath4);

        //set master scale (affects all textures)
        diffuseMap1.repeat.set(uv_scale, uv_scale);
        diffuseMap2.repeat.set(uv_scale, uv_scale);
        diffuseMap3.repeat.set(uv_scale, uv_scale);
        diffuseMap4.repeat.set(uv_scale, uv_scale);

        //create a material 
        const material = new THREE.MeshStandardMaterial(
            {
                side: THREE.FrontSide,
                // side: THREE.DoubleSide,
                map: diffuseMap1,
                normalMap: normalMap1,
                normalScale: new THREE.Vector2(1, 1),
                aoMap: aoMap1,
                aoMapIntensity: 1.0,
                metalness: 1.0,
                roughness: 1.0
            }
        );


        let shaderFunction = function (shader) {

            // add mix map 
            shader.uniforms.mixMap = { value: mixMap };

            // add height map
            // shader.uniforms.heightMap = { value: heightMap };

            // add splatter map uniforms

            // set 1 is already set by the material class so we don't specify it here
            // SplatterManager.addUniforms(shader, 1, diffuseMap1, normalMap1, aoMap1);

            SplatterManager.addUniforms(shader, 2, diffuseMap2, normalMap2, aoMap2);
            SplatterManager.addUniforms(shader, 3, diffuseMap3, normalMap3, aoMap3);
            SplatterManager.addUniforms(shader, 4, diffuseMap4, normalMap4, aoMap4);

            // mixMap uniform and varyings for mix amounts

            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                [
                    `#include <common>`,

                    `uniform sampler2D mixMap;`,
                    // `uniform sampler2D heightMap;`,

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

                    `vec4 mixData = texture2D( mixMap, uv );`,

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

                    `uniform sampler2D mixMap;`,
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
                    `uniform vec2 normalScale2;`,

                    `uniform sampler2D normalMap3;`,
                    `uniform vec2 normalScale3;`,

                    `uniform sampler2D normalMap4;`,
                    `uniform vec2 normalScale4;`,
                    ``
                ].join('\n')
            );


            // mix diffuse maps

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                [
                    `#ifdef USE_MAP`,

                    // mix diffuse maps 

                    `vec4 mixData = texture2D( mixMap, vUV2 );`,
                    `float vMix1_r = mixData.r;`,
                    `float vMix1_g = mixData.g;`,
                    `float vMix1_b = mixData.b;`,

                    //mix map1 and map2 with red channel
                    `vec4 cmap1 = (smoothstep(1.00, 0.00, vMix1_r)) * texture2D(map, vUV );`,
                    `vec4 cmap2 = (smoothstep(0.00, 1.00, vMix1_r)) * texture2D(map2, vUV );`,

                    //mix map3 and map4 with green channel
                    `vec4 cmap3 = (smoothstep(1.00, 0.00, vMix1_g)) * texture2D(map3, vUV );`,
                    `vec4 cmap4 = (smoothstep(0.00, 1.00, vMix1_g)) * texture2D(map4, vUV );`,

                    //mix red and green using blue channel
                    `vec4 cmap5 = (smoothstep(1.00, 0.00, vMix1_b)) * (cmap1 + cmap2);`,
                    `vec4 cmap6 = (smoothstep(0.00, 1.00, vMix1_b)) * (cmap3 + cmap4);`,

                    //final color
                    `vec4 sampledDiffuseColor = vec4(0.0, 0.0, 0.0, 1.0) + cmap5 + cmap6;`,


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


                    //mix normal1 and normal2 using mixmap red channel

                    `	vec3 mapN1 = (smoothstep(1.00, 0.00, vMix1_r)) * texture2D( normalMap, vUv ).xyz;`,
                    `	mapN1.xy *= normalScale;`,

                    `	vec3 mapN2 = (smoothstep(0.00, 1.00, vMix1_r)) * texture2D( normalMap2, vUv ).xyz;`,
                    `	mapN2.xy *= normalScale2;`,

                    //mix normal3 and normal4 using mixmap green channel

                    `	vec3 mapN3 = (smoothstep(1.00, 0.00, vMix1_g)) * texture2D( normalMap3, vUv ).xyz;`,
                    `	mapN3.xy *= normalScale3;`,

                    `	vec3 mapN4 = (smoothstep(0.00, 1.00, vMix1_g)) * texture2D( normalMap4, vUv ).xyz;`,
                    `	mapN4.xy *= normalScale4;`,

                    //mix red and green using mixmap blue channel

                    `	vec3 mapN5 = (smoothstep(1.00, 0.00, vMix1_b)) * (mapN1 + mapN2);`,
                    `	vec3 mapN6 = (smoothstep(0.00, 1.00, vMix1_b)) * (mapN3 + mapN4);`,
                    `   vec3 mapP = (mapN5 + mapN6) * 2.0 - 1.0; `,



                    `	#ifdef USE_TANGENT`,
                    `		normal = normalize( vTBN * mapP );`,
                    `	#else`,
                    `		normal = perturbNormal2Arb( - vViewPosition, normal, mapP, faceDirection );`,
                    `	#endif`,
                    `#elif defined( USE_BUMPMAP )`,
                    `	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );`,
                    `#endif`,
                    ``
                ].join('\n')
            );



            // new ao maps uniforms

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <aomap_pars_fragment>',
                [
                    `	uniform sampler2D aoMap;`,
                    `	uniform float aoMapIntensity;`,

                    //add new ao maps

                    `	uniform sampler2D aoMap2;`,
                    `	uniform sampler2D aoMap3;`,
                    `	uniform sampler2D aoMap4;`,

                    ``
                ].join('\n')
            );


            //roughness map
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <roughnessmap_fragment>',
                [

                    ``,

                    // AO mixer

                    `float cao1 = (smoothstep(1.00, 0.00, vMix1_r)) * (texture2D( aoMap, vUv ).r); `,
                    `float cao2 = (smoothstep(0.00, 1.00, vMix1_r)) * (texture2D( aoMap2, vUv ).r); `,

                    `float cao3 = (smoothstep(1.00, 0.00, vMix1_g)) * (texture2D( aoMap3, vUv ).r); `,
                    `float cao4 = (smoothstep(0.00, 1.00, vMix1_g)) * (texture2D( aoMap4, vUv ).r); `,

                    `float cao5 = (smoothstep(1.00, 0.00, vMix1_b)) * (cao1 + cao2); `,
                    `float cao6 = (smoothstep(0.00, 1.00, vMix1_b)) * (cao3 + cao4); `,

                    //mixed AO
                    `float mix_ao = (cao5 + cao6);`,



                    //roughness mixer 

                    `float ro1 = (smoothstep(1.00, 0.00, vMix1_r)) * (texture2D( aoMap, vUv ).g); `,
                    `float ro2 = (smoothstep(0.00, 1.00, vMix1_r)) * (texture2D( aoMap2, vUv ).g); `,

                    `float ro3 = (smoothstep(1.00, 0.00, vMix1_g)) * (texture2D( aoMap3, vUv ).g); `,
                    `float ro4 = (smoothstep(0.00, 1.00, vMix1_g)) * (texture2D( aoMap4, vUv ).g); `,

                    `float ro5 = (smoothstep(1.00, 0.00, vMix1_b)) * (ro1 + ro2); `,
                    `float ro6 = (smoothstep(0.00, 1.00, vMix1_b)) * (ro3 + ro4); `,

                    //mixed roughness
                    `float mix_ro = (ro5 + ro6);`,



                    //metalness mixer 

                    `float me1 = (smoothstep(1.00, 0.00, vMix1_r)) * (texture2D( aoMap, vUv ).b); `,
                    `float me2 = (smoothstep(0.00, 1.00, vMix1_r)) * (texture2D( aoMap2, vUv ).b); `,

                    `float me3 = (smoothstep(1.00, 0.00, vMix1_g)) * (texture2D( aoMap3, vUv ).b); `,
                    `float me4 = (smoothstep(0.00, 1.00, vMix1_g)) * (texture2D( aoMap4, vUv ).b); `,

                    `float me5 = (smoothstep(1.00, 0.00, vMix1_b)) * (me1 + me2); `,
                    `float me6 = (smoothstep(0.00, 1.00, vMix1_b)) * (me3 + me4); `,

                    //mixed metalness
                    `float mix_me = (me5 + me6);`,



                    //re-use ao for roughness
                    `float roughnessFactor = roughness;`,
                    `roughnessFactor *= mix_ro;`,


                    ``
                ].join('\n')
            );



            //metalness maps
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <metalnessmap_fragment>',
                [

                    ``,
                    `float metalnessFactor = metalness;`,
                    `metalnessFactor *= mix_me;`,

                    ``
                ].join('\n')
            );

            //mix ao maps

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <aomap_fragment>',
                [

                    ``,

                    // set mixed ao

                    `float ambientOcclusion = (mix_ao - 1.0) * aoMapIntensity + 1.0;`,
                    `reflectedLight.indirectDiffuse *= ambientOcclusion;`,

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