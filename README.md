# terrain-contour

A tool to calculate and draw contour lines on a triangular mesh (a terrain).

![Screenshot](https://github.com/kristoffer-dyrkorn/terrain-contour/blob/main/images/terrain.jpg)

## Method

- The terrain (a triangular mesh) is loaded.
- In a preprosessing step, a bounding volume hierarchy (BVH) for the triangular mesh is generated, using [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh). The BVH provides fast intersection calculations between the terrain (ie its triangles) and a given shape.
- A plane parallel to the xy-plane is swept through the terrain, and intersections between the mesh triangles and the plane are calculated at desired (contour line) elevations.
- The intersections (plane-triangle intersections) produce line segments - which, when connected, form contour lines for the given elevation.
- Each contour line is nudged slightly upwards (to avoid z-fighting and/or being hidden underneath the terrain surface) before being drawn on screen.

## Credits

The code here is heavily borrowed from the [clipped-edge example](https://gkjohnson.github.io/three-mesh-bvh/example/bundle/clippedEdges.html) in three-mesh-bvh. Also, the method itself relies on fast intersection calculations such as those provided by three-mesh-bvh.

## Performance

For the provided example mesh, consisting of 130k triangles, the preprocessing step takes 83 ms. Generating a single contour line takes approx 0.45 ms. For this particular mesh, generating contour lines with 10 meter spacing (181 different elevation levels) takes 75 ms. All times are measured on a 2020 MacBook Air (M1) using Chrome.

## Limitations

- The contour lines are built up of line segments, and not curves (splines). Line segments might not produce visually ideal results, but as the source geometry is built up of planar patches, using any kind of interpolated curve will lead to gaps between the contour and the surface, thereby breaking with the definition of a contour.
- The contour lines themselves might contain gaps. If the intersection plane only hits one edge of a mesh triangle, the method used here will skip creating a line segment for that section. Also, whenever the contour plane fully coincides with a mesh triangle (ie both are parallel to the xy-plane and have the same elevation), the intersection will no longer form a line segment. In that case, the resulting contour line will have a gap there.

## Possible improvements

- Some way to calculate a (dummy) intersection line in the cases where an intersection plane fully coincides with a mesh triangle
- Better ways to draw the contour lines on the terrain surface without nudging the elevation or introducing artifacts (z-fighting)
- Thicker, antialiased lines
