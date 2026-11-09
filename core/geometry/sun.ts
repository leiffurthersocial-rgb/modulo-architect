/**
 * Approximate solar position (good to a degree or so: plenty for shadows).
 * Returns altitude/azimuth in radians; azimuth measured clockwise from north.
 */
export function sunPosition(latitudeDeg: number, month: number, hour: number) {
  const day = Math.round((month - 1) * 30.42 + 15);
  const decl = ((23.44 * Math.PI) / 180) * Math.sin(((2 * Math.PI) / 365) * (284 + day));
  const lat = (latitudeDeg * Math.PI) / 180;
  const H = ((hour - 12) * 15 * Math.PI) / 180;
  const sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAz =
    (Math.sin(decl) - Math.sin(altitude) * Math.sin(lat)) / (Math.cos(altitude) * Math.cos(lat) || 1e-9);
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (H > 0) azimuth = 2 * Math.PI - azimuth;
  return { altitude, azimuth };
}

/** Unit vector pointing at the sun in world space (y up, north = -z rotated by northAngle). */
export function sunDirection(
  latitudeDeg: number,
  month: number,
  hour: number,
  northAngle = 0,
): [number, number, number] {
  const { altitude, azimuth } = sunPosition(latitudeDeg, month, hour);
  const a = azimuth + northAngle;
  const c = Math.cos(altitude);
  return [Math.sin(a) * c, Math.sin(altitude), -Math.cos(a) * c];
}
