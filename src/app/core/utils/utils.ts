import { format, parse, differenceInMinutes } from 'date-fns';

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

export function calculateTotalHours(intervals: string[][]): {
  totalHours: number;
  remainingMinutes: number;
} {
  let totalMinutes = 0;

  for (const interval of intervals) {
    const [startTime, endTime] = interval;
    const parsedStartTime = parse(startTime, 'HH:mm:ss', new Date());
    const parsedEndTime = parse(endTime, 'HH:mm:ss', new Date());

    // Calculate the difference in minutes
    const differenceInMinutesValue = differenceInMinutes(
      parsedEndTime,
      parsedStartTime
    );
    totalMinutes += differenceInMinutesValue;
  }

  // Convert total minutes into hours and remaining minutes
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return { totalHours, remainingMinutes };
}
