import { SearchRecord } from '../types';

export const LA_ELECTRICAL_DEMO_RECORD: SearchRecord = {
  id: 'rec-demo-la-electrical',
  timestamp: Date.now() - 1000 * 60 * 5,
  jurisdiction: 'City of Los Angeles, CA',
  jurisdictionKey: 'los_angeles',
  category: 'Electrical Service Upgrade',
  categoryKey: 'electrical_upgrade',
  question: 'What are the permit requirements and documentation for a residential electrical service upgrade?',
  mode: 'verified-reference',
  answer: {
    summary: 'Electrical service upgrades may require an electrical permit and supporting documentation depending on the work scope. In the City of Los Angeles, upgrading a residential electrical service (such as from 100A to 200A) requires an electrical permit from the Department of Building and Safety (LADBS) and service planning clearance from the Los Angeles Department of Water and Power (LADWP).',
    requiredDocuments: [
      {
        documentName: 'LADBS Electrical Permit Application (ePermit or In-Person)',
        description: 'Standard residential single-phase services up to 200A or 400A qualify for online Express Permitting through the LADBS ePermit system without plan check.',
        isMandatory: true
      },
      {
        documentName: 'LADWP Service Planning & Meter Spotting Clearance',
        description: 'Coordination with Los Angeles Department of Water and Power (LADWP) for service disconnect, meter socket location approval, and service entrance point.',
        isMandatory: true
      },
      {
        documentName: 'Electrical Load Calculation Sheet',
        description: 'Calculation of total connected residential electrical loads in accordance with CEC Article 220 to determine required service ampacity.',
        isMandatory: true
      },
      {
        documentName: 'Single-Line Diagram (One-Line Diagram)',
        description: 'Required if service exceeds 400A, incorporates solar/ESS storage interconnection, or requires structural panel relocation.',
        isMandatory: false
      }
    ],
    keyThresholds: [
      'Residential panel upgrades up to 200A (single-phase 120/240V) qualify for instant online Express ePermit without plan check.',
      'Commercial services, multi-family services >400A, or installations requiring structural alterations trigger LADBS Electrical Plan Check.',
      'Meter disconnect/reconnect and utility energization must be coordinated directly with LADWP.',
      'Grounding electrode system must be brought up to current code (two ground rods min 6ft apart or concrete-encased Ufer ground).'
    ],
    sources: [
      {
        title: 'Electrical Permit Requirements',
        codeReference: 'City of Los Angeles Electrical Code (LAMC Chapter IX, Article 3 / California Electrical Code)',
        urlOrDocRef: 'https://www.ladbs.org/services/core-services/plan-check-permit/plan-check-permit-special-assistance/electrical',
        department: 'Department of Building and Safety'
      },
      {
        title: 'LADWP Electric Service Requirements (ESR)',
        codeReference: 'LADWP Customer Service Rules & Regulations',
        urlOrDocRef: 'https://www.ladwp.com',
        department: 'Los Angeles Department of Water and Power'
      }
    ],
    cautionaryNotice: 'Informational Prototype: PermitLens AI provides preliminary permit checklist guidance based on published municipal documents. It does not constitute legal, structural engineering, or final code-compliance approval. Always verify with municipal building officials prior to submittal.'
  },
  feedback: {
    rating: 'helpful',
    comment: 'Accurate breakdown of LADBS ePermit vs LADWP meter spotting.',
    submittedAt: Date.now() - 1000 * 60 * 2
  }
};

export const INITIAL_DEMO_RECORD: SearchRecord = {
  id: 'rec-demo-austin-deck',
  timestamp: Date.now() - 1000 * 60 * 15,
  jurisdiction: 'City of Austin, TX',
  jurisdictionKey: 'austin',
  category: 'Residential Deck / Patio Addition',
  categoryKey: 'deck_patio',
  question: 'What are the railing and plan requirements for a 3ft deck in Austin?',
  mode: 'ai-generated',
  answer: {
    summary: 'According to the City of Austin Building Criteria Manual and 2021 International Residential Code (IRC R507), residential decks elevated more than 30 inches above adjacent grade require a standard Residential Building Permit and full safety guardrails. Decks under 30 inches that are freestanding and do not exceed setback or impervious cover limits are permit-exempt.',
    requiredDocuments: [
      {
        documentName: 'Certified Plot Plan / Boundary Survey',
        description: 'Drawn to standard engineering scale (e.g. 1" = 20\') showing all property lines, easements, existing building footprints, proposed deck perimeter, and setback distances.',
        isMandatory: true
      },
      {
        documentName: 'Structural Framing & Ledger Plan',
        description: 'Plan sheet detailing beam sizes and spans, joist dimensions and on-center spacing, post sizes, and ledger board lag-screw fastening pattern to the primary framing.',
        isMandatory: true
      },
      {
        documentName: 'Pier & Footing Foundation Detail',
        description: 'Cross-section showing pier diameter and minimum 12-inch depth below undisturbed soil, post base connectors, and anchor bolts.',
        isMandatory: true
      },
      {
        documentName: 'Guardrail & Handrail Elevation Drawing',
        description: 'Required for decks >30" above grade. Must demonstrate 36" minimum height and max 4" baluster opening (must not allow a 4-inch sphere to pass).',
        isMandatory: true
      },
      {
        documentName: 'Tree Review / Critical Root Zone Form',
        description: 'Required if post excavation occurs within 1/2 of the Critical Root Zone of any protected tree (caliper 19 inches or greater).',
        isMandatory: false
      }
    ],
    keyThresholds: [
      'Minimum guard height: 36 inches above walking surface for decks > 30 inches above grade.',
      'Baluster spacing: Maximum 4 inches (must not allow a 4-inch sphere to pass through).',
      'Handrails are required for stairs with 4 or more continuous risers (graspable 1.25" to 2" profile).',
      'Attachment to brick veneer, masonry overhangs, or house cantilevers is strictly prohibited.'
    ],
    sources: [
      {
        title: 'Austin_Residential_Deck_Guide_2023.pdf',
        codeReference: 'Land Development Code Section 25-12-243 & IRC R507',
        urlOrDocRef: 'Austin Development Services Residential Plan Review',
        department: 'City of Austin Development Services'
      },
      {
        title: 'Austin Tree Protection Ordinance & Criteria',
        codeReference: 'Environmental Criteria Manual Section 3',
        urlOrDocRef: 'City Arborist Program Guidelines',
        department: 'Austin Development Services'
      }
    ],
    cautionaryNotice: 'Informational Prototype: PermitLens AI provides preliminary permit checklist guidance based on published municipal documents. It does not constitute legal, structural engineering, or final code-compliance approval. Always verify with municipal building officials prior to submittal.'
  },
  feedback: {
    rating: 'helpful',
    comment: 'Clear pre-submittal checklist for framing and footing details.',
    submittedAt: Date.now() - 1000 * 60 * 10
  }
};

export const DEFAULT_GUEST_HISTORY: SearchRecord[] = [
  LA_ELECTRICAL_DEMO_RECORD,
  INITIAL_DEMO_RECORD
];
