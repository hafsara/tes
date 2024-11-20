import { Injectable } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FormService } from './form.service';

@Injectable({
  providedIn: 'root',
})
export class PollingService {
  private pollingSubscriptions: { [key: string]: Subscription } = {};

  constructor(private formService: FormService) {}

  /**
   * Start polling for a specific resource.
   * @param key Unique identifier for this polling.
   * @param intervalMs Interval in milliseconds.
   * @param fetchCallback Data recovery function.
   * @param updateCallback Function to execute when there is new data.
   * @param onChange Function called if the new data differs from the previous one (optional).
   */
  startPolling<T>(
    key: string,
    intervalMs: number,
    fetchCallback: () => Promise<T>,
    updateCallback: (data: T) => void,
    onChange?: (newData: T) => void,
    hasChanged?: (newData: T, previousData: T | null) => boolean
  ): void {
    if (this.pollingSubscriptions[key]) {
      console.warn(`Polling already running for key: ${key}`);
      return;
    }

    let previousData: T | null = null;

    this.pollingSubscriptions[key] = interval(intervalMs)
      .pipe(switchMap(() => fetchCallback()))
      .subscribe({
        next: (data) => {
          if (onChange && hasChanged && hasChanged(data, previousData)) {
            onChange(data);
          }
          previousData = data;
          updateCallback(data);
        },
        error: (err) => console.error(`Polling error for key ${key}:`, err),
      });
  }

  /**
   * Stop polling for a specific resource.
   * @param key Unique identifier for this polling.
   */
  stopPolling(key: string): void {
    if (this.pollingSubscriptions[key]) {
      this.pollingSubscriptions[key].unsubscribe();
      delete this.pollingSubscriptions[key];
    }
  }

  /**
   * Stop all polling.
   */
  stopAllPolling(): void {
    Object.keys(this.pollingSubscriptions).forEach((key) => this.stopPolling(key));
  }
}
