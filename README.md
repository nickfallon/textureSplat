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


