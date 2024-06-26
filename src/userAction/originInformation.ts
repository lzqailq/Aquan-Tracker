import { type OriginInformation } from '../types/userAction';

export function OriginInformationTracker(): OriginInformation {
  return {
    referrer: document.referrer,
    type: performance.getEntriesByType('navigation')[0].type,
  };
}
