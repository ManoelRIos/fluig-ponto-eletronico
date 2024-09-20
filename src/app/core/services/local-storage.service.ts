import { Injectable } from '@angular/core';

declare const window: any;

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  storage = window.localStorage;

  get(key: string): any {
    if (this.storage) {
      return JSON.parse(this.storage.getItem(key));
    }
  }

  set(key: string, value: any): boolean {
    if (this.storage) {
      this.storage.setItem(key, JSON.stringify(value));
      return true;
    }
    return false;
  }

  remove(key: string): boolean {
    if (this.storage) {
      this.storage.removeItem(key);
      return true;
    }
    return false;
  }

  clear(): boolean {
    if (this.storage) {
      this.storage.clear();
      return true;
    }
    return false;
  }
}
