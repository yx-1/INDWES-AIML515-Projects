import { SearchRecord } from '../types';

export function shortJurisdictionLabel(record: SearchRecord): string {
  switch (record.jurisdictionKey) {
    case 'austin':
      return 'Austin, TX';
    case 'seattle':
      return 'Seattle, WA';
    case 'los_angeles':
      return 'Los Angeles, CA';
    default:
      return record.jurisdiction;
  }
}
