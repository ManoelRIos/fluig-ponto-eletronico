import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private httpClient = inject(HttpClient);

  private apiKey = 'AIzaSyBmRz7IVPiDK1k92V0ukLRPIurfK0vi7Sk';

  getAddress(lat: number, lng: number): Observable<any> {
    return this.httpClient.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`
    );
  }

  getDistanceMatrix(
    origins: { lat: number; lng: number }[],
    destinations: { lat: number; lng: number }[]
  ): Observable<any> {
    const originsParam = origins
      .map((coord) => `${coord.lat},${coord.lng}`)
      .join('|');
    const destinationsParam = destinations
      .map((coord) => `${coord.lat},${coord.lng}`)
      .join('|');

    console.log(destinationsParam);

    return this.httpClient.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsParam}&destinations=${destinationsParam}&key=${this.apiKey}`
    );
  }
}
