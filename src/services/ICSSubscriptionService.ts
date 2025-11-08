import { Notice, Plugin, requestUrl } from 'obsidian';
import ICAL from 'ical.js';
import { ICSEvent, ICSCache, LightweightTasksSettings } from '../types';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * ICSSubscriptionService: Calendar feed fetching and caching
 *
 * Simplified from TaskNotes - single subscription only, remote URL only.
 * No local file support, no EXDATE/RECURRENCE-ID exception handling.
 *
 * Key Features:
 * - Fetch from Outlook ICS URL
 * - Cache with 15-minute expiration + 5-minute grace period
 * - Automatic background refresh when cache stale
 * - Timezone handling via VTIMEZONE registration
 * - All-day event detection (date-only format)
 * - Basic RRULE expansion (1-year lookahead, max 100 instances)
 */
export class ICSSubscriptionService extends EventEmitter {
  private plugin: Plugin;
  private settings: LightweightTasksSettings;
  private cache: ICSCache | null = null;
  private refreshTimer: number | null = null;
  private readonly CACHE_EXPIRATION = 15 * 60 * 1000;
  private readonly CACHE_GRACE_PERIOD = 5 * 60 * 1000;

  constructor(plugin: Plugin, settings: LightweightTasksSettings) {
    super();
    this.plugin = plugin;
    this.settings = settings;
  }

  async initialize(): Promise<void> {
    if (!this.settings.calendarURL) {
      console.log('ICSSubscriptionService: No calendar URL configured');
      return;
    }
    await this.fetchSubscription();
    this.startRefreshTimer();
  }

  /**
   * Fetch calendar subscription from URL
   */
  async fetchSubscription(): Promise<void> {
    if (!this.settings.calendarURL) return;
    try {
      const response = await requestUrl({
        url: this.settings.calendarURL,
        method: 'GET',
        headers: { Accept: 'text/calendar,*/*;q=0.1' },
      });
      const events = this.parseICS(response.text);
      this.cache = {
        subscriptionId: 'default',
        events,
        lastUpdated: new Date().toISOString(),
        expires: new Date(Date.now() + this.CACHE_EXPIRATION).toISOString(),
      };
      console.log(`ICSSubscriptionService: Cached ${events.length} events`);
      this.emit('data-changed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('ICSSubscriptionService: Failed to fetch calendar:', errorMessage);

      // Show user-friendly error
      if (errorMessage.includes('404')) {
        new Notice('Calendar not found. Check your calendar URL in settings.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        new Notice('Failed to fetch calendar. Check your internet connection.');
      } else {
        new Notice(`Calendar sync failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Parse ICS data into ICSEvent objects
   */
  private parseICS(icsData: string): ICSEvent[] {
    try {
      const jcalData = ICAL.parse(icsData);
      const comp = new ICAL.Component(jcalData);
      const vtimezones = comp.getAllSubcomponents('vtimezone');
      vtimezones.forEach((vtz: ICAL.Component) => {
        (ICAL as any).TimezoneService.register(vtz);
      });
      const events: ICSEvent[] = [];
      comp.getAllSubcomponents('vevent').forEach((vevent: ICAL.Component) => {
        try {
          const event = new ICAL.Event(vevent);
          const start = event.startDate;
          if (!start) return;

          const uid = event.uid || `event-${events.length}`;
          const icsEvent: ICSEvent = {
            id: `default-${uid}`,
            title: event.summary || 'Untitled Event',
            start: this.icalTimeToISOString(start),
            end: event.endDate ? this.icalTimeToISOString(event.endDate) : undefined,
            allDay: start.isDate,
            description: event.description,
            location: event.location,
          };

          // Handle recurring events
          if (event.isRecurring()) {
            const iterator = event.iterator(start);
            const maxDate = ICAL.Time.fromJSDate(
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            );

            let occurrence;
            let instanceCount = 0;
            const maxInstances = 100;

            while ((occurrence = iterator.next()) && instanceCount < maxInstances) {
              if (occurrence.compare(maxDate) > 0) break;

              const instanceStart = this.icalTimeToISOString(occurrence);
              let instanceEnd = icsEvent.end;

              if (event.endDate && start) {
                const duration = event.endDate.toUnixTime() - start.toUnixTime();
                const instanceEndTime = occurrence.toUnixTime() + duration;
                instanceEnd = new Date(instanceEndTime * 1000).toISOString();
              }

              events.push({
                ...icsEvent,
                id: `default-${uid}-${instanceCount}`,
                start: instanceStart,
                end: instanceEnd,
              });

              instanceCount++;
            }
          } else {
            events.push(icsEvent as ICSEvent);
          }
        } catch (eventError) {
          console.warn('Failed to parse individual event:', eventError);
        }
      });
      return events;
    } catch (error) {
      console.error('Failed to parse ICS data:', error);
      throw new Error('Invalid ICS format');
    }
  }

  /**
   * Converts an ICAL.Time object to an ISO string with proper timezone handling.
   *
   * For all-day events, returns date-only string (YYYY-MM-DD).
   * For timed events, uses toUnixTime() which correctly handles all timezones.
   */
  private icalTimeToISOString(icalTime: ICAL.Time): string {
    if (icalTime.isDate) {
      const year = icalTime.year.toString().padStart(4, '0');
      const month = icalTime.month.toString().padStart(2, '0');
      const day = icalTime.day.toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return new Date(icalTime.toUnixTime() * 1000).toISOString();
  }

  /**
   * Get all cached events
   *
   * Returns events if cache is valid (within grace period).
   * Triggers background refresh if cache is stale but within grace period.
   * Returns empty array if cache expired beyond grace period.
   */
  getAllEvents(): ICSEvent[] {
    if (!this.cache) return [];
    const now = new Date();
    const expires = new Date(this.cache.expires);
    const graceEnd = new Date(expires.getTime() + this.CACHE_GRACE_PERIOD);
    if (now < graceEnd) {
      if (now > expires) {
        this.fetchSubscription().catch(console.error);
      }
      return [...this.cache.events];
    }
    return [];
  }

  /**
   * Start refresh timer to periodically check cache
   */
  private startRefreshTimer(): void {
    this.refreshTimer = window.setInterval(() => {
      if (this.cache && new Date() >= new Date(this.cache.expires)) {
        this.fetchSubscription().catch(console.error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Cleanup timers and listeners
   */
  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.cache = null;
    this.removeAllListeners();
  }
}