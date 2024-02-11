# textureSplat for ThreeJS

ThreeJS texture splatting class with diffuse, normal and ORM (ambient occlusion/roughness/metalness) maps.

The SplatterManager class creates a new standard material with texture splatting.
The shader is modified using onBeforeCompile to create the splats in one shader.

4 textures are blended together using a mixmap texture. The mixmap blends textures like this:
- red channel mixes textures 1 and 2.
- green channel mixes textures 3 and 4.
- blue channel mixes red and green.

Blended textures have their own diffuseMap, normalMap and ORM maps.

ORM maps contain the following:
- red channel - ambient occlusion
- green channel - roughness map
- blue channel - metalness map

Any texture can be mixed with any other textures without restriction.

![Demo](demo.png)


## 7-texture variant

The file `SplatterManager_7_materials_normal_diffuse.js` contains a version that combines 
7 different diffuse and normal maps, no ORM map, and 2 mix maps, as follows:

mix map 1:

- R1 -> textures 1 + 2
- G1 -> textures 3 + 4 
- B1 -> R1 + G1

mix map 2:

- R2 -> textures 5 + 6
- G2 -> texture 7 + R2
- B2 -> G2 + B1

This variant does not include ORM maps because for some GPU's, renderer.capabilities.maxTextures yields 16, which means no more than 16 textures can be used in a single shader.

Since 7 pseudo-materials with one diffuse and one normal is 14 textures, plus 2 mixmaps means all 16 textures are used. For maximum compatibility, ORM maps have been dropped to meet the 16 texture limit.

![Demo](demo7.jpg)
