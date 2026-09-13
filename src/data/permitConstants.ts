import { JurisdictionOption, CategoryOption, JurisdictionKey, PermitCategoryKey } from '../types';

export const JURISDICTIONS: JurisdictionOption[] = [
  {
    key: 'austin',
    name: 'City of Austin',
    state: 'TX',
    department: 'Development Services Department (DSD)',
    portalName: 'Austin Build + Connect (AB+C)',
    codeStandard: '2021 IRC with Austin Local Amendments'
  },
  {
    key: 'seattle',
    name: 'City of Seattle',
    state: 'WA',
    department: 'Seattle Dept of Construction and Inspections (SDCI)',
    portalName: 'Seattle Services Portal (Accela)',
    codeStandard: 'Seattle Residential Code (SRC) & SMC Title 23'
  },
  {
    key: 'los_angeles',
    name: 'City of Los Angeles',
    state: 'CA',
    department: 'Department of Building and Safety (LADBS)',
    portalName: 'LADBS ePermit System',
    codeStandard: 'City of Los Angeles Electrical & Building Code (LAMC / CEC)'
  }
];

export const CATEGORIES: CategoryOption[] = [
  {
    key: 'deck_patio',
    title: 'Residential Deck / Patio Addition',
    shortTitle: 'Deck & Patio',
    description: 'Attached or detached exterior decks, walking surfaces over grade, stairs, guardrails, and ledger attachments.',
    icon: 'Hammer',
    typicalReviewTime: '3 – 10 business days (Express or Standard)'
  },
  {
    key: 'remodel',
    title: 'Kitchen & Bathroom Remodel',
    shortTitle: 'Kitchen & Bath',
    description: 'Interior alterations, layout reconfiguration, partition removals, and electrical / plumbing trade permits.',
    icon: 'Wrench',
    typicalReviewTime: '1 – 5 business days (Express / Over-the-counter STFI)'
  },
  {
    key: 'adu',
    title: 'Accessory Dwelling Unit (ADU) / Garage Conversion',
    shortTitle: 'ADU / Conversion',
    description: 'Attached or detached secondary units, garage conversions to living space, utility tie-ins, and parking standards.',
    icon: 'Home',
    typicalReviewTime: '15 – 30 business days (Comprehensive Review)'
  },
  {
    key: 'electrical_upgrade',
    title: 'Electrical Service Upgrade',
    shortTitle: 'Electrical Upgrade',
    description: 'Main service panel upgrades (100A to 200A+), meter relocation, subpanel additions, and utility meter clearances.',
    icon: 'Zap',
    typicalReviewTime: 'Express ePermit / 1 – 3 business days'
  }
];

export const SAMPLE_QUESTIONS: Record<JurisdictionKey, Record<PermitCategoryKey, string[]>> = {
  austin: {
    deck_patio: [
      "What documents are required for an attached uncovered deck 36 inches above grade?",
      "Can I build a 24-inch high detached ground patio without pulling a building permit?",
      "Does post footing excavation in Austin trigger tree review or Critical Root Zone protection?"
    ],
    remodel: [
      "Do I need a structural engineer stamp if removing an interior kitchen wall in Austin?",
      "Which trade permits (electrical, plumbing) must be pulled separately on AB+C for a master bath?",
      "Are hardwired smoke and carbon monoxide detectors required to be updated during a remodel?"
    ],
    adu: [
      "What plan set is required to convert a detached 2-car garage into an ADU under the HOME Initiative?",
      "What is the maximum impervious cover allowed on a standard single-family lot with an ADU?",
      "Does Austin Water require a separate water meter or dedicated TAP verification for an ADU?"
    ],
    electrical_upgrade: [
      "What permits are required to upgrade a residential service panel from 100A to 200A in Austin?",
      "When does Austin Energy require a work order before replacing the meter base?",
      "Do I need an electrical plan check for adding a 100A subpanel in a detached garage?"
    ]
  },
  seattle: {
    deck_patio: [
      "What is the height threshold where a deck requires an SDCI building permit (Tip 312)?",
      "Can a residential deck project qualify for Subject-to-Field-Inspection (STFI) in Seattle?",
      "What site plan scale and setback clearances are required from side property lines?"
    ],
    remodel: [
      "Does Seattle allow kitchen remodels under Subject-to-Field-Inspection (STFI) if no headers move?",
      "Why must plumbing permits be submitted to King County Public Health instead of SDCI?",
      "What mechanical ventilation CFM rate is required for a windowless bathroom in Seattle?"
    ],
    adu: [
      "What are the document submittal requirements for a Detached ADU (DADU) under SMC 23.44.041?",
      "Is off-street parking or owner-occupancy still mandatory for Seattle ADUs?",
      "What is the Pre-Application Site Visit (PASV) and when must it be scheduled?"
    ],
    electrical_upgrade: [
      "Does Seattle Department of Construction and Inspections require an electrical permit for a 200A service upgrade?",
      "What coordination is needed with Seattle City Light (SCL) for meter disconnect/reconnect?",
      "When does a residential electrical service upgrade qualify for an over-the-counter electrical permit?"
    ]
  },
  los_angeles: {
    electrical_upgrade: [
      "What are the LADBS permit and document requirements for upgrading an electrical service panel to 200A?",
      "When does a residential service upgrade qualify for LADBS Express ePermit vs full plan check?",
      "What documentation is required by LADWP for meter spotting and service clearance?"
    ],
    deck_patio: [
      "What are the LADBS permit requirements for building an attached residential deck in Los Angeles?",
      "What footing depth and setback clearances are required for hillside residential decks?",
      "Are guardrails required on residential walking platforms elevated over 30 inches in LA?"
    ],
    remodel: [
      "What documentation is required by LADBS for a major residential kitchen or bathroom remodel?",
      "Can non-structural interior remodels qualify for LADBS Express ePermit?",
      "What title 24 energy and water conservation requirements apply to kitchen and bath remodels in LA?"
    ],
    adu: [
      "What plan check requirements apply to garage conversion ADUs under LADBS guidelines?",
      "Does the City of Los Angeles offer standard plan ADU approvals?",
      "What utility separation and fire separation documents are needed for detached ADUs in Los Angeles?"
    ]
  }
};
