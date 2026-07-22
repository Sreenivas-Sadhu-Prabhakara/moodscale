/* ============================================================
   moodscale — helplines.js
   A hand-verified directory of mental-health / crisis support lines.

   HONESTY: this is a directory of numbers, NOT live help. Numbers
   change. Each entry carries the official page it was verified against
   and the date it was verified. Any number that could not be confirmed
   from an official government/organisation page was DROPPED, never
   guessed. verified_on is shown in-app next to every entry.

   Verified 2026-07-22. See sources/CITATIONS.md for the full source list.
   ============================================================ */

const HELPLINES = [
  /* ---- India (India-first: shown first) ---- */
  {
    country: 'India', iso2: 'IN',
    service: 'Tele-MANAS (Govt. of India, MoHFW)',
    phone: '14416', altphone: '1-800-891-4416',
    hours: '24/7', languages: 'English + 20 Indian languages',
    official_url: 'https://telemanas.mohfw.gov.in/',
    source_url: 'https://telemanas.mohfw.gov.in/',
    verified_on: '2026-07-22'
  },
  {
    country: 'India', iso2: 'IN',
    service: 'KIRAN Mental Health Rehabilitation Helpline (Govt. of India, DEPwD)',
    phone: '1800-599-0019', altphone: null,
    hours: '24/7', languages: '13 languages',
    official_url: 'https://depwd.gov.in/',
    source_url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=1652240',
    verified_on: '2026-07-22'
  },
  {
    country: 'India', iso2: 'IN',
    service: 'AASRA',
    phone: '+91-9820466726', altphone: null,
    hours: '24/7', languages: 'English, Hindi',
    official_url: 'https://www.aasra.info/',
    source_url: 'https://www.aasra.info/helpline.html',
    verified_on: '2026-07-22'
  },
  {
    country: 'India', iso2: 'IN',
    service: 'iCALL (TISS)',
    phone: '9152987821', altphone: null,
    hours: 'Mon–Sat, 10:00–20:00 IST', languages: 'English, Hindi, Marathi, Gujarati, and more',
    official_url: 'https://icallhelpline.org/',
    source_url: 'https://icallhelpline.org/what-is-icall/',
    verified_on: '2026-07-22'
  },

  /* ---- Rest of world (alphabetical by country) ---- */
  {
    country: 'Australia', iso2: 'AU',
    service: 'Lifeline Australia',
    phone: '13 11 14', altphone: null,
    hours: '24/7', languages: 'English',
    official_url: 'https://www.lifeline.org.au/',
    source_url: 'https://www.lifeline.org.au/131114',
    verified_on: '2026-07-22'
  },
  {
    country: 'Canada', iso2: 'CA',
    service: '9-8-8 Suicide Crisis Helpline',
    phone: '988', altphone: null,
    hours: '24/7 (call or text)', languages: 'English, French',
    official_url: 'https://988.ca/',
    source_url: 'https://www.camh.ca/en/camh-news-and-stories/canada-988-suicide-crisis-helpline-launches-today',
    verified_on: '2026-07-22'
  },
  {
    country: 'Ireland', iso2: 'IE',
    service: 'Samaritans Ireland',
    phone: '116 123', altphone: null,
    hours: '24/7 (freephone)', languages: 'English',
    official_url: 'https://www.samaritans.org/samaritans-ireland/',
    source_url: 'https://www.samaritans.org/how-we-can-help/contact-samaritan/talk-us-phone/',
    verified_on: '2026-07-22'
  },
  {
    country: 'New Zealand', iso2: 'NZ',
    service: '1737 — Need to Talk?',
    phone: '1737', altphone: null,
    hours: '24/7 (call or text)', languages: 'English',
    official_url: 'https://1737.org.nz/',
    source_url: 'https://mentalhealth.org.nz/helplines',
    verified_on: '2026-07-22'
  },
  {
    country: 'Philippines', iso2: 'PH',
    service: 'NCMH Crisis Hotline',
    phone: '1553', altphone: '0917-899-8727',
    hours: '24/7', languages: 'English, Filipino',
    official_url: 'https://ncmh.gov.ph/',
    source_url: 'https://ncmh.gov.ph/',
    verified_on: '2026-07-22'
  },
  {
    country: 'Singapore', iso2: 'SG',
    service: 'Samaritans of Singapore (SOS)',
    phone: '1767', altphone: '9151 1767 (CareText via WhatsApp)',
    hours: '24/7', languages: 'English',
    official_url: 'https://www.sos.org.sg/',
    source_url: 'https://www.sos.org.sg/our-services/',
    verified_on: '2026-07-22'
  },
  {
    country: 'United Kingdom', iso2: 'GB',
    service: 'Samaritans',
    phone: '116 123', altphone: null,
    hours: '24/7 (free from any phone)', languages: 'English',
    official_url: 'https://www.samaritans.org/',
    source_url: 'https://www.samaritans.org/how-we-can-help/contact-samaritan/talk-us-phone/',
    verified_on: '2026-07-22'
  },
  {
    country: 'United States', iso2: 'US',
    service: '988 Suicide & Crisis Lifeline',
    phone: '988', altphone: null,
    hours: '24/7 (call, text or chat)', languages: 'English, Spanish',
    official_url: 'https://988lifeline.org/',
    source_url: 'https://988lifeline.org/about/',
    verified_on: '2026-07-22'
  }
];

/* Dual export: browser global + Node require(). */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HELPLINES };
}
