# terrain-contour

Drawing contour lines on a triangular mesh (a terrain).

## Method

The contour lines are made like this:

- The terrain (a triangular mesh) is loaded
- In a preprosessing step, a bounding hierarchical volume (BVH) is generated, using [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh). This is to enable fast intersection queries between the terrain and a plane parallel to the xy-plane.
- Using a bouding box for the terrain, find the min and max elevations.
- For each contour line to be drawn (given a spacing rule, ie "every 10 meters"), calculate the intersections between the terrain mesh (the triangles in it) and a plane parallel to the xy-plane, at the contour line elevation.
- The intersections that are found between the plane and the triangles are collected into line segments - that in turn constitute a contour line.
- Draw the line segments on screen, nudging them to a slightly higher elevation to avoid z-fighting and/or intersecting the terrain surface itself.

The code here is heavly borrowed from the [clipped-edge example](https://gkjohnson.github.io/three-mesh-bvh/example/bundle/clippedEdges.html) in three-mesh-bvh.

## Performance

On the provided example mesh, consisting of 130k triangles, the preprossesing step takes 83 ms, and generating a single contour line takes approx 0.45 ms. In this particular case, generating contour lines with 10 meter spacing (181 contour lines in total) takes 75 ms. All times are measured on an 2020 MacBook Air (M1) using Chrome.

## Limitations

- The contour lines consist of linear segments, and not curves (splines). Linear segments might not be visually ideal, but as the source geometry here consists of planar patches, using any kind of interpolation to produce rounder contour lines will create artifacts (unnatural gaps between the terrain surface and the contours).
- Contour lines might contain gaps. Where the intersection plane only hits one vertex (or one edge) of a mesh triangle, the method chosen here will not create a line segment for that section of the contour. Also, whenever the contour plane coincides with a mesh triangle (both are parallel to the xy-plane, and have the same elevation), the line segment for that triangle is not well-defined, and the resulting contour line will contain a gap.

## Possible improvements

- Thicker, antialiased lines
- Better ways to draw the contour lines on the surface without nudging the elevation and without introducing artifacts (z-fighting)
