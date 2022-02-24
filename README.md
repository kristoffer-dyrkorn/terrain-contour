# terrain-contour

A tool to calculate and draw contour lines on a triangular mesh (a terrain).

## Method

The contour lines are made this way:

- The terrain (a triangular mesh) is loaded.
- In a preprosessing step, a bounding volume hierarchy (BVH) for the triangular mesh is generated, using [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh). The BVH provides fast intersection calculations between the terrain (ie its triangles) and a given shape.
- The main idea here is to sweep a plane parallel to the xy-plane through the terrain, at increasing elevations, and at desired elevation intervals, calculate the intersections between the mesh triangles and the plane.
- The intersections form line segments - which together create the contour lines for that elevation.
- Each contour line is then drawn on screen, nudged slightly upwards to avoid z-fighting and/or being hidden behind the terrain surface itself.

## Credits

The code here is heavily borrowed from the [clipped-edge example](https://gkjohnson.github.io/three-mesh-bvh/example/bundle/clippedEdges.html) in three-mesh-bvh. Also, the method itself relies on fast intersection calculations such as those provided by three-mesh-bvh.

## Performance

For the provided example mesh, consisting of 130k triangles, the preprocessing step takes 83 ms. Generating a single contour line takes approx 0.45 ms. For this particular mesh, generating contour lines with 10 meter spacing (181 contour lines in total) takes 75 ms. All times are measured on a 2020 MacBook Air (M1) using Chrome.

## Limitations

- The contour lines consist of line segments, and not curves (splines). Line segments might not produce visually ideal results, but as the source geometry here consists of planar patches, using any kind of interpolation will create horizontal gaps between the terrain surface and the contours.
- The contour lines themselves might contain gaps. Where the intersection plane only hits one vertex (or one edge) of a mesh triangle, the method used here will skip creating a line segment for that section of the contour. Also, whenever the contour plane fully coincides with a mesh triangle (ie the triangle is parallel to the xy-plane, and has the same elevation as the intersection plane), the intersection no longer forms a line segment. In this case, the resulting contour line will have a gap there.

## Possible improvements

- Thicker, antialiased lines
- Some way to calculate a (dummy) intersection line in the cases where an intersection plane fully coincides with a mesh triangle
- Better ways to draw the contour lines on the terrain surface without nudging the elevation or introducing artifacts (z-fighting)
