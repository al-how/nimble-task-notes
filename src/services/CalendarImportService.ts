import { Notice, Plugin, TFile } from 'obsidian';
import { ICSSubscriptionService } from './ICSSubscriptionService';
import { ICSEvent, LightweightTasksSettings } from '../types';

/**
 * CalendarImportService: Import calendar meetings into daily notes
 *
 * Finds "#### 📆 Agenda" heading and inserts wikilinks for today's meetings.
 * Deduplicates against existing links and sorts chronologically.
 */
export class CalendarImportService {
  private plugin: Plugin;
  private icsService: ICSSubscriptionService;
  private settings: LightweightTasksSettings;

  constructor(
    plugin: Plugin,
    icsService: ICSSubscriptionService,
    settings: LightweightTasksSettings
  ) {
    this.plugin = plugin;
    this.icsService = icsService;
    this.settings = settings;
  }

  /**
   * Import meetings into the active note
   * Filters by the note's date (from filename like 2025-11-06.md) or today if not a date-based filename
   *
   * @param activeNote - The active note file
   * @returns Number of meetings imported
   */
  async importTodaysMeetings(activeNote: TFile): Promise<number> {
    try {
      console.log('CalendarImportService: Starting import...');

      const content = await this.plugin.app.vault.read(activeNote);
      const headingIndex = this.findAgendaHeading(content);

      if (headingIndex === -1) {
        console.log('CalendarImportService: No Agenda heading found');
        new Notice('No Agenda heading found. Add #### 📆 Agenda to your note.');
        return 0;
      }

      // Extract date from filename (e.g., "2025-11-06.md" -> "2025-11-06")
      const dateFromFilename = this.extractDateFromFilename(activeNote.basename);
      const filterDate = dateFromFilename || this.getToday();
      console.log(`CalendarImportService: Filtering events for date: ${filterDate}`);

      const events = this.icsService.getAllEvents();
      console.log(`CalendarImportService: Got ${events.length} total events from cache`);
      const matchingEvents = this.filterEventsByDate(events, filterDate);
      console.log(`CalendarImportService: Filtered to ${matchingEvents.length} events for ${filterDate}`);

      if (matchingEvents.length === 0) {
        new Notice(`No meetings scheduled for ${filterDate}.`);
        return 0;
      }

      const existingLinks = this.extractWikilinksUnderHeading(content, headingIndex);
      const newWikilinks = matchingEvents
        .map(event => this.sanitizeMeetingTitle(event.title))
        .filter(title => !existingLinks.includes(title));

      if (newWikilinks.length === 0) {
        new Notice('All meetings already imported.');
        return 0;
      }

      const newContent = this.insertWikilinksAtHeading(content, headingIndex, newWikilinks);
      await this.plugin.app.vault.modify(activeNote, newContent);

      new Notice(`Imported ${newWikilinks.length} meeting(s) for ${filterDate}`);
      return newWikilinks.length;
    } catch (error) {
      console.error('Calendar import failed:', error);
      new Notice('Failed to import meetings');
      return 0;
    }
  }

  /**
   * Extract date from filename (e.g., "2025-11-06" from "2025-11-06.md")
   * Returns null if filename doesn't match YYYY-MM-DD pattern
   */
  private extractDateFromFilename(basename: string): string | null {
    const dateMatch = basename.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    }
    return null;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Filter events to match a specific date (YYYY-MM-DD format)
   * Works with both timed events (ISO strings) and all-day events (date-only strings)
   */
  private filterEventsByDate(events: ICSEvent[], targetDate: string): ICSEvent[] {
    return events
      .filter(event => {
        // event.start is either ISO string or YYYY-MM-DD
        const eventDate = event.start.split('T')[0]; // Extract date part
        return eventDate === targetDate;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  /**
   * Find "#### 📆 Agenda" heading in note content
   *
   * @param content - Note content
   * @returns Character index of heading, or -1 if not found
   */
  private findAgendaHeading(content: string): number {
    const headingRegex = /^####\s+📆\s+Agenda/m;
    const match = headingRegex.exec(content);
    return match ? match.index : -1;
  }

  /**
   * Sanitize meeting title for use as filename/wikilink
   *
   * Handles Windows reserved names, forbidden characters, and length limits.
   */
  private sanitizeMeetingTitle(title: string): string {
    const WINDOWS_RESERVED_NAMES = [
      'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4',
      'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2',
      'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ];

    let sanitized = title
      .trim()
      .replace(/[\[\]#^\|]/g, '-')
      .replace(/[*"\\/<>:?]/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/^\.+|\.+$/g, '');

    if (!sanitized) {
      return 'Untitled Meeting';
    }

    const upperName = sanitized.toUpperCase();
    if (WINDOWS_RESERVED_NAMES.includes(upperName)) {
      sanitized = `${sanitized}_`;
    }

    if (sanitized.length > 200) {
      sanitized = sanitized.slice(0, 200);
    }

    return sanitized;
  }

  /**
   * Extract existing wikilinks under the Agenda heading
   *
   * @param content - Note content
   * @param headingIndex - Character index of the heading
   * @returns Array of wikilink titles (without brackets)
   */
  private extractWikilinksUnderHeading(content: string, headingIndex: number): string[] {
    const afterHeading = content.slice(headingIndex);
    const nextHeadingMatch = afterHeading.slice(1).match(/^#{1,6}\s+/m);
    const sectionEnd = nextHeadingMatch && nextHeadingMatch.index !== undefined
      ? headingIndex + nextHeadingMatch.index + 1
      : content.length;
    const section = content.slice(headingIndex, sectionEnd);

    const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
    const links: string[] = [];
    let match;

    while ((match = wikilinkRegex.exec(section)) !== null) {
      const linkText = match[1].split('|')[0].trim();
      links.push(linkText);
    }

    return links;
  }

  /**
   * Insert wikilinks after the Agenda heading
   *
   * @param content - Note content
   * @param headingIndex - Character index of the heading
   * @param wikilinks - Array of meeting titles to insert
   * @returns Updated note content
   */
  private insertWikilinksAtHeading(content: string, headingIndex: number, wikilinks: string[]): string {
    const lines = content.split('\n');
    let insertLineIndex = 0;
    let charCount = 0;

    // Find the line number where the heading is
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= headingIndex) {
        insertLineIndex = i + 1;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }

    // Insert wikilinks after the heading
    const wikilinkLines = wikilinks.map(title => `- [[${title}]]`);
    lines.splice(insertLineIndex, 0, ...wikilinkLines);

    return lines.join('\n');
  }
}