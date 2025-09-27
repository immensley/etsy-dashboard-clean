export interface MonitoredListing {
  label: string;
  input: string;
  threshold?: number;
}

export const MONITORED_LISTINGS: MonitoredListing[] = [
  {
    label: "Signature Knife",
    input: "https://www.etsy.com/listing/727800978",
    threshold: 5,
  },
  {
    label: "Keepsake Box",
    input: "https://www.etsy.com/listing/123456789",
    threshold: 8,
  },
  {
    label: "Art Deco Badge",
    input: "https://www.etsy.com/listing/987654321",
    threshold: 6,
  },
];
