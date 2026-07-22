# Sources & Citations — moodscale

Every health-facing fact in this app was verified against a real, authoritative
source at build time (2026-07-22). Nothing was authored from memory. This file
records exactly what was checked and where.

## Instruments (verbatim item wording + public-domain status)

### PHQ-9 (Patient Health Questionnaire-9)

- **Item wording**, response labels, and the functional-impact follow-up were
  copied verbatim from the official PHQ-9 instrument PDF distributed by the
  American Psychological Association:
  `https://www.apa.org/depression-guideline/patient-health-questionnaire.pdf`
- **Verbatim licensing statement on the instrument:** "Developed by Drs. Robert L.
  Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues, with an educational
  grant from Pfizer Inc. **No permission required to reproduce, translate, display
  or distribute.**"
- **Severity bands (inclusive ranges):** 0–4 Minimal, 5–9 Mild, 10–14 Moderate,
  15–19 Moderately severe, 20–27 Severe.
  Source: Kroenke K, Spitzer RL, Williams JBW. *The PHQ-9: Validity of a Brief
  Depression Severity Measure.* J Gen Intern Med. 2001;16(9):606–613.
  Cross-checked: `https://en.wikipedia.org/wiki/PHQ-9`.

### GAD-7 (Generalized Anxiety Disorder scale)

- **Item wording**, response labels, scoring, and the functional-health follow-up
  were copied verbatim from a public-domain GAD-7 reproduction:
  `https://concussionsontario.org/sites/default/files/2025-01/GAD7%20Appendix%208.2%20Jan%202025.pdf`
- **Verbatim licensing statement on the instrument:** "May be printed without
  permission. Available in the public domain. Spitzer RL, Kroenke K, Williams JB,
  et al. A brief measure for assessing generalised anxiety disorder: the GAD-7.
  Archives of Internal Medicine. 2006;166:1092-1097."
- **Severity bands (inclusive ranges):** 0–4 Minimal, 5–9 Mild, 10–14 Moderate,
  15–21 Severe.
  Source: Spitzer RL, Kroenke K, Williams JBW, Löwe B. *A Brief Measure for
  Assessing Generalized Anxiety Disorder: The GAD-7.* Arch Intern Med.
  2006;166(10):1092–1097.
  Cross-checked: CORC directory and the concussionsontario scoring card above.

> Both instruments are public domain / free to reproduce; moodscale reproduces the
> item wording unchanged and cites the developers, as the instruments require.

## Crisis helpline directory (verified_on = 2026-07-22)

Each entry's phone number was confirmed against an official government or
organisation source. Any number that could not be confirmed was dropped.

| Country | Service | Number | Source verified |
|---|---|---|---|
| India | Tele-MANAS (MoHFW) | 14416 / 1-800-891-4416 | https://telemanas.mohfw.gov.in/ |
| India | KIRAN (DEPwD) | 1800-599-0019 | PIB PRID 1652240 |
| India | AASRA | +91-9820466726 | https://www.aasra.info/helpline.html |
| India | iCALL (TISS) | 9152987821 | https://icallhelpline.org/what-is-icall/ |
| Australia | Lifeline | 13 11 14 | https://www.lifeline.org.au/131114 |
| Canada | 9-8-8 | 988 | CAMH launch page |
| Ireland | Samaritans Ireland | 116 123 | samaritans.org contact page |
| New Zealand | 1737 Need to Talk? | 1737 | mentalhealth.org.nz/helplines |
| Philippines | NCMH Crisis Hotline | 1553 / 0917-899-8727 | https://ncmh.gov.ph/ |
| Singapore | Samaritans of Singapore | 1767 | https://www.sos.org.sg/our-services/ |
| United Kingdom | Samaritans | 116 123 | samaritans.org phone page |
| United States | 988 Suicide & Crisis Lifeline | 988 | https://988lifeline.org/about/ |

## What is NOT in the corpus (honest scope)

- No C-SSRS (it is licensed, not public domain).
- No PHQ-2 / GAD-2 / PHQ-A (out of scope by the brief).
- No translated instruments (published translations carry their own validation and
  distribution terms).
- No advice, interpretation, or "what your score means" text beyond the published
  band labels above.
