/* ============================================================
   moodscale — scales.js
   The PHQ-9 and GAD-7 instruments, their verbatim items, the
   shared 0–3 response options, and the published severity bands.

   Every string here is verbatim from a public-domain instrument.
   Every band range and citation is verified — see sources/CITATIONS.md.

   The scoring engine (app.js) and the Node self-tests both read
   their constants FROM this module. Nothing is duplicated elsewhere.
   ============================================================ */

/* Shared 0–3 response options — identical wording on both instruments.
   Verbatim from the official Pfizer/APA PHQ-9 and the public-domain
   GAD-7 (Spitzer/Kroenke/Williams). */
const OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 }
];

/* The unscored functional-impact follow-up (shared wording family).
   Its four difficulty choices are NOT part of the total. */
const IMPACT_OPTIONS = [
  { label: 'Not difficult at all', value: 0 },
  { label: 'Somewhat difficult', value: 1 },
  { label: 'Very difficult', value: 2 },
  { label: 'Extremely difficult', value: 3 }
];

/* ---------------- PHQ-9 (depression) ---------------- */
/* Stem + 9 scored items + 1 unscored functional-impact follow-up.
   Verbatim from the official PHQ-9 (developed by Drs. Robert L. Spitzer,
   Janet B.W. Williams, Kurt Kroenke and colleagues; educational grant
   from Pfizer Inc.; "No permission required to reproduce, translate,
   display or distribute."). */
const PHQ9 = {
  id: 'phq9',
  name: 'PHQ-9',
  title: 'PHQ-9 — Patient Health Questionnaire (depression)',
  stem: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
  maxScore: 27,
  crisisItemOrder: 9, // item 9 is the self-harm item
  items: [
    { scale: 'phq9', order: 1, scored: true, text: 'Little interest or pleasure in doing things' },
    { scale: 'phq9', order: 2, scored: true, text: 'Feeling down, depressed, or hopeless' },
    { scale: 'phq9', order: 3, scored: true, text: 'Trouble falling or staying asleep, or sleeping too much' },
    { scale: 'phq9', order: 4, scored: true, text: 'Feeling tired or having little energy' },
    { scale: 'phq9', order: 5, scored: true, text: 'Poor appetite or overeating' },
    { scale: 'phq9', order: 6, scored: true, text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
    { scale: 'phq9', order: 7, scored: true, text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
    { scale: 'phq9', order: 8, scored: true, text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual' },
    { scale: 'phq9', order: 9, scored: true, text: 'Thoughts that you would be better off dead or of hurting yourself in some way' }
  ],
  followUp: {
    scale: 'phq9', order: 10, scored: false,
    text: 'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
    options: IMPACT_OPTIONS
  }
};

/* ---------------- GAD-7 (anxiety) ---------------- */
/* Stem + 7 scored items + 1 unscored functional-impact follow-up.
   Verbatim from the public-domain GAD-7 (Spitzer RL, Kroenke K,
   Williams JB, et al. 2006; "May be printed without permission.
   Available in the public domain."). */
const GAD7 = {
  id: 'gad7',
  name: 'GAD-7',
  title: 'GAD-7 — Generalized Anxiety Disorder scale',
  stem: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
  maxScore: 21,
  crisisItemOrder: null, // GAD-7 has no self-harm item
  items: [
    { scale: 'gad7', order: 1, scored: true, text: 'Feeling nervous, anxious or on edge' },
    { scale: 'gad7', order: 2, scored: true, text: 'Not being able to stop or control worrying' },
    { scale: 'gad7', order: 3, scored: true, text: 'Worrying too much about different things' },
    { scale: 'gad7', order: 4, scored: true, text: 'Trouble relaxing' },
    { scale: 'gad7', order: 5, scored: true, text: 'Being so restless that it is hard to sit still' },
    { scale: 'gad7', order: 6, scored: true, text: 'Becoming easily annoyed or irritable' },
    { scale: 'gad7', order: 7, scored: true, text: 'Feeling afraid as if something awful might happen' }
  ],
  followUp: {
    scale: 'gad7', order: 8, scored: false,
    text: 'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
    options: IMPACT_OPTIONS
  }
};

/* ---------------- Severity bands (published cutoffs) ---------------- */
/* PHQ-9 bands verified against Kroenke K, Spitzer RL, Williams JBW.
   The PHQ-9: Validity of a Brief Depression Severity Measure.
   J Gen Intern Med. 2001;16(9):606-613 (Table 3). Ranges are inclusive. */
const PHQ9_BANDS = [
  { min: 0,  max: 4,  label: 'Minimal',
    source: 'Kroenke, Spitzer & Williams (2001) J Gen Intern Med 16:606-613' },
  { min: 5,  max: 9,  label: 'Mild',
    source: 'Kroenke, Spitzer & Williams (2001) J Gen Intern Med 16:606-613' },
  { min: 10, max: 14, label: 'Moderate',
    source: 'Kroenke, Spitzer & Williams (2001) J Gen Intern Med 16:606-613' },
  { min: 15, max: 19, label: 'Moderately severe',
    source: 'Kroenke, Spitzer & Williams (2001) J Gen Intern Med 16:606-613' },
  { min: 20, max: 27, label: 'Severe',
    source: 'Kroenke, Spitzer & Williams (2001) J Gen Intern Med 16:606-613' }
];

/* GAD-7 bands verified against Spitzer RL, Kroenke K, Williams JBW, Löwe B.
   A Brief Measure for Assessing Generalized Anxiety Disorder: The GAD-7.
   Arch Intern Med. 2006;166(10):1092-1097. Ranges are inclusive. */
const GAD7_BANDS = [
  { min: 0,  max: 4,  label: 'Minimal',
    source: 'Spitzer, Kroenke, Williams & Löwe (2006) Arch Intern Med 166:1092-1097' },
  { min: 5,  max: 9,  label: 'Mild',
    source: 'Spitzer, Kroenke, Williams & Löwe (2006) Arch Intern Med 166:1092-1097' },
  { min: 10, max: 14, label: 'Moderate',
    source: 'Spitzer, Kroenke, Williams & Löwe (2006) Arch Intern Med 166:1092-1097' },
  { min: 15, max: 21, label: 'Severe',
    source: 'Spitzer, Kroenke, Williams & Löwe (2006) Arch Intern Med 166:1092-1097' }
];

const SCALES = { phq9: PHQ9, gad7: GAD7 };
const BANDS = { phq9: PHQ9_BANDS, gad7: GAD7_BANDS };

/* Dual export: browser global + Node require(). */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OPTIONS, IMPACT_OPTIONS, PHQ9, GAD7, SCALES, BANDS, PHQ9_BANDS, GAD7_BANDS };
}
