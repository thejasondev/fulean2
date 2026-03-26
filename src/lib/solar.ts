// ============================================
// Solar Position Calculator
// NOAA simplified algorithm (Jean Meeus)
// Calculates sunrise/sunset for Havana, Cuba
// Zero dependencies, works 100% offline
// ============================================

// Havana, Cuba coordinates
const LAT = 23.1136;
const LNG = -82.3666;

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/**
 * Calculate sunrise and sunset times for a given date in Cuba.
 * Based on NOAA Solar Calculator equations.
 */
export function getSunTimes(date: Date): { sunrise: Date; sunset: Date } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Julian Day Number
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // Julian Century from J2000.0
  const jc = (jdn - 0.5 - 2451545) / 36525;

  // Sun's geometric mean longitude (degrees)
  const L0 = (280.46646 + jc * (36000.76983 + 0.0003032 * jc)) % 360;

  // Sun's mean anomaly (degrees)
  const M = (357.52911 + jc * (35999.05029 - 0.0001537 * jc)) % 360;

  // Eccentricity of Earth's orbit
  const e = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);

  // Sun's equation of center (degrees)
  const sinM = Math.sin(M * RAD);
  const sin2M = Math.sin(2 * M * RAD);
  const sin3M = Math.sin(3 * M * RAD);
  const C =
    sinM * (1.9146 - jc * (0.004817 + 0.000014 * jc)) +
    sin2M * (0.019993 - 0.000101 * jc) +
    sin3M * 0.00029;

  // Sun's true longitude
  const sunLon = L0 + C;

  // Sun's apparent longitude
  const omega = 125.04 - 1934.136 * jc;
  const lambda = sunLon - 0.00569 - 0.00478 * Math.sin(omega * RAD);

  // Mean obliquity of the ecliptic
  const obliq =
    23 +
    (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) /
      60;
  const obliqCorr = obliq + 0.00256 * Math.cos(omega * RAD);

  // Sun's declination (radians)
  const sinDec = Math.sin(obliqCorr * RAD) * Math.sin(lambda * RAD);
  const decl = Math.asin(sinDec);

  // Equation of Time (minutes)
  const tanHalfObliq = Math.tan((obliqCorr / 2) * RAD);
  const y2 = tanHalfObliq * tanHalfObliq;
  const sinL0 = Math.sin(2 * L0 * RAD);
  const cosL0 = Math.cos(2 * L0 * RAD);
  const sin2M2 = Math.sin(2 * M * RAD);
  const cos2L0 = Math.cos(4 * L0 * RAD);

  const eqTime =
    4 *
    DEG *
    (y2 * sinL0 -
      2 * e * sinM +
      4 * e * y2 * sinM * cosL0 -
      0.5 * y2 * y2 * cos2L0 -
      1.25 * e * e * sin2M2);

  // Hour angle of sunrise (degrees)
  const zenith = 90.833; // Official zenith for sunrise/sunset
  const latRad = LAT * RAD;
  const cosHA =
    (Math.cos(zenith * RAD) - Math.sin(latRad) * sinDec) /
    (Math.cos(latRad) * Math.cos(decl));

  // Clamp for polar regions (not needed for Cuba, but safety)
  const haClamp = Math.max(-1, Math.min(1, cosHA));
  const ha = Math.acos(haClamp) * DEG;

  // Solar noon (minutes from midnight UTC)
  const solarNoon = 720 - 4 * LNG - eqTime;

  // Sunrise and sunset (minutes from midnight UTC)
  const sunriseUTC = solarNoon - ha * 4;
  const sunsetUTC = solarNoon + ha * 4;

  // Convert UTC minutes to local Date objects
  const tzOffset = date.getTimezoneOffset(); // minutes (positive = behind UTC)

  const makeDate = (utcMinutes: number): Date => {
    const localMinutes = utcMinutes - tzOffset;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setMinutes(Math.round(localMinutes));
    return d;
  };

  return {
    sunrise: makeDate(sunriseUTC),
    sunset: makeDate(sunsetUTC),
  };
}
