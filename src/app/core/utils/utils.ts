export function getGeoLocation(): any {
  navigator.geolocation.getCurrentPosition((position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;    
  });

}

export function distanceCalculate(
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number
) {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(destinationLat - originLat);
  const dLon = toRad(destinationLng - originLng);
  const lat1Rad = toRad(originLat);
  const lat2Rad = toRad(destinationLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1Rad) *
      Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distância em km

  return distance;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
