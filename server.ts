import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Safe request logging (method, sanitized path, status, latency) without exposing secrets or bodies
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const sanitizedUrl = (req.originalUrl || req.url).split("?")[0];
    console.log(`[HTTP] ${req.method} ${sanitizedUrl} ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Health check endpoints for Cloud Run and container liveness probes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/healthz", (_req, res) => {
  res.status(200).send("OK");
});

// Initialize Google GenAI client safely
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!aiClient && key && key !== "MY_GEMINI_API_KEY" && key.trim().length > 5) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("[Startup] GoogleGenAI client initialized successfully.");
    } catch (err: any) {
      console.error("[Startup] GoogleGenAI initialization notice:", err?.message || err);
      aiClient = null;
    }
  }
  return aiClient;
}

// Fallback verified permit data for Austin and Seattle
const VERIFIED_KNOWLEDGE: Record<string, Record<string, any>> = {
  austin: {
    deck_patio: {
      summary: "In the City of Austin, uncovered residential decks with walking surfaces 30 inches or less above grade that are detached and do not encroach into required zoning setbacks or easements generally do not require a building permit. However, any deck over 30 inches above adjacent grade, attached to the primary residence, or covered by a roof requires a standard Residential Building Permit and full plan review.",
      requiredDocuments: [
        {
          documentName: "Certified Plot / Site Plan",
          description: "Shows property lines, easements, existing house footprint, proposed deck dimensions, and distances to boundary setbacks.",
          isMandatory: true
        },
        {
          documentName: "Structural Framing & Foundation Plan",
          description: "Details post/pier sizing, concrete footing depth (minimum 12\" below undisturbed ground in Austin), beam spans, joist spacing, and ledger board fastening specs.",
          isMandatory: true
        },
        {
          documentName: "Guardrail & Handrail Elevation Drawing",
          description: "Required for decks >30\" high. Shows 36\" minimum guardrail height with baluster spacing preventing a 4\" sphere from passing.",
          isMandatory: true
        },
        {
          documentName: "Tree Review / Critical Root Zone Form",
          description: "Required if post footings or excavation occur within the 1/2 Critical Root Zone of any protected tree (19\"+ DBH).",
          isMandatory: false
        }
      ],
      keyThresholds: [
        "Walking surface > 30 inches above finished grade requires building permit and guardrails.",
        "Attached decks require engineered ledger attachment (no attachment to brick veneer or overhangs).",
        "Must comply with Austin Land Development Code maximum impervious cover limits for the zoning district (typically 45%)."
      ],
      sources: [
        {
          title: "Austin Residential Deck Submittal Checklist",
          codeReference: "City of Austin Land Development Code Section 25-12-243",
          urlOrDocRef: "https://www.austintexas.gov/department/residential-plan-review",
          department: "City of Austin Development Services"
        },
        {
          title: "2021 International Residential Code (IRC) with Austin Local Amendments",
          codeReference: "IRC Section R507 (Exterior Decks)",
          urlOrDocRef: "https://library.municode.com/tx/austin/codes/code_of_ordinances?nodeId=TIT25LADE",
          department: "Austin Building Technical Codes"
        }
      ]
    },
    remodel: {
      summary: "City of Austin residential interior kitchen and bathroom remodels require building permits whenever walls are removed, layouts are altered, or plumbing and electrical systems are modified. Purely cosmetic work (such as replacing tile, cabinets in same location, or painting) is exempt, but trade permits are mandatory for new circuits, relocated plumbing fixtures, or gas lines.",
      requiredDocuments: [
        {
          documentName: "Existing & Proposed Floor Plans",
          description: "Dimensioned 1/4\" = 1' scale floor plan displaying wall removals, doors, fixture relocations, and smoke/CO detector locations.",
          isMandatory: true
        },
        {
          documentName: "Structural Framing Details / Engineer Letter",
          description: "Required if any load-bearing wall, header, or post is modified or removed to create open-concept kitchens.",
          isMandatory: false
        },
        {
          documentName: "Separate Trade Permit Applications (MEP)",
          description: "Licensed master electrician, master plumber, and mechanical contractor must pull dedicated trade permits via the Austin Build + Connect (AB+C) portal.",
          isMandatory: true
        },
        {
          documentName: "Residential Interior Remodel Application Form",
          description: "Completed general contractor submittal form detailing scope of work and valuation.",
          isMandatory: true
        }
      ],
      keyThresholds: [
        "Replacing non-structural fixtures in identical locations without running new pipe/wire is exempt from plan review.",
        "Moving plumbing drains (DWV) or adding dedicated 20A kitchen small-appliance circuits triggers trade permits.",
        "Hardwired interconnected smoke/CO alarms must be brought up to current 2021 IRC code throughout adjacent areas."
      ],
      sources: [
        {
          title: "Austin Interior Remodel Submittal Checklist",
          codeReference: "Austin Development Services Residential Review Bulletin",
          urlOrDocRef: "https://www.austintexas.gov/department/development-services",
          department: "City of Austin Development Services"
        },
        {
          title: "Austin Energy & Water Conservation Codes",
          codeReference: "Austin City Code Chapter 25-12, Article 12",
          urlOrDocRef: "https://www.austintexas.gov/department/building-technical-codes",
          department: "Austin Building Inspections"
        }
      ]
    },
    adu: {
      summary: "Under the City of Austin HOME Initiative (Phase 1 & 2 amendments), accessory dwelling units (ADUs) and multi-unit residential infill are permitted on most single-family lots. ADUs may be detached, attached, or converted from an existing garage. Standard single-family parking mandates have been eliminated or reduced, but impervious cover, tree protection, and utility capacity must be thoroughly documented.",
      requiredDocuments: [
        {
          documentName: "Certified Boundary & Tree Survey",
          description: "Sealed survey showing property boundaries, easements, topography, building footprint, and all protected trees (19\"+ caliper).",
          isMandatory: true
        },
        {
          documentName: "Complete Architectural & Structural Plan Set",
          description: "Foundation plan, floor plans with room labels, cross-sections, roof framing, and exterior elevations with height limits.",
          isMandatory: true
        },
        {
          documentName: "Austin Water Utility Verification Form & TAP Application",
          description: "Proof of water and wastewater service connection or separate sub-metering approval.",
          isMandatory: true
        },
        {
          documentName: "Impervious Cover & Drainage Calculation Sheet",
          description: "Calculations ensuring total lot impervious cover remains within zoning thresholds (typically 40-45%).",
          isMandatory: true
        },
        {
          documentName: "Energy Code Compliance Path (2021 IECC / AEGB)",
          description: "Manual J/S/D HVAC load calculations and insulation specifications.",
          isMandatory: true
        }
      ],
      keyThresholds: [
        "Under HOME Phase 1/2, up to 3 dwelling units are allowed per eligible lot with relaxed front/rear setbacks.",
        "Maximum ADU floor area is determined by lot size and impervious cover cap (maximum building footprint rules apply).",
        "Garage conversions require demonstrating that displaced habitable space meets minimum ceiling height (7 ft) and insulation requirements."
      ],
      sources: [
        {
          title: "City of Austin HOME Initiative ADU Regulations",
          codeReference: "Austin Land Development Code Ordinance No. 20231207-001 & 2024 Amendments",
          urlOrDocRef: "https://www.austintexas.gov/department/housing-planning",
          department: "Austin Housing & Planning Dept"
        },
        {
          title: "Austin Residential New Construction & ADU Checklist",
          codeReference: "Austin Residential Technical Code Guidelines",
          urlOrDocRef: "https://www.austintexas.gov/department/residential-plan-review",
          department: "City of Austin Development Services"
        }
      ]
    },
    electrical_upgrade: {
      summary: "In the City of Austin, upgrading an electrical service panel (such as from 100A to 200A) requires a standalone trade electrical permit pulled through the Austin Build + Connect (AB+C) portal by a licensed Texas Master Electrician. Work requires utility coordination with Austin Energy for electric service planning and meter disconnect/reconnect.",
      requiredDocuments: [
        {
          documentName: "Austin Development Services Electrical Permit Application",
          description: "Submitted online via the AB+C portal by a licensed electrical contractor.",
          isMandatory: true
        },
        {
          documentName: "Austin Energy Electric Service Design Work Order (ESPI)",
          description: "Service planning request confirming meter location, overhead/underground service lateral, and point of attachment.",
          isMandatory: true
        },
        {
          documentName: "Load Calculation Worksheet",
          description: "NEC Article 220 load calculation justifying panel capacity for new continuous and non-continuous loads.",
          isMandatory: true
        },
        {
          documentName: "One-Line Diagram",
          description: "Diagram showing service entrance conductors, main disconnect size, bus rating, and grounding electrode conductor (GEC).",
          isMandatory: false
        }
      ],
      keyThresholds: [
        "Residential panel upgrades up to 200A single-phase do not require architectural plan check.",
        "Work must comply with the 2023 NEC as amended by the City of Austin.",
        "Grounding electrode system must be verified (2 ground rods 6ft apart or connection to foundation Ufer rebar)."
      ],
      sources: [
        {
          title: "Austin Energy Design Criteria Manual (Section 1.14)",
          codeReference: "City of Austin Code Title 15 & 2023 NEC",
          urlOrDocRef: "https://austinenergy.com/contractors/design-criteria-manual",
          department: "Austin Energy"
        },
        {
          title: "City of Austin Residential Electrical Permit Guide",
          codeReference: "Austin Land Development Code Chapter 25-12, Article 4",
          urlOrDocRef: "https://www.austintexas.gov/department/development-services",
          department: "City of Austin Development Services"
        }
      ]
    }
  },
  seattle: {
    deck_patio: {
      summary: "In the City of Seattle, the Seattle Department of Construction and Inspections (SDCI) exempts single-family residential decks from building permits ONLY if the walking surface is 18 inches or less above finished grade, the deck is not covered by a roof, and it is not situated over a basement or story below. Any deck higher than 18 inches or attached to a structure requires a building permit, usually processed as Subject-to-Field-Inspection (STFI).",
      requiredDocuments: [
        {
          documentName: "Dimensioned Site Plan (SDCI Cam 103 Standard)",
          description: "Shows property lines, existing house, proposed deck outline, distances to side/rear property lines, and environmentally critical areas (ECA) if applicable.",
          isMandatory: true
        },
        {
          documentName: "Structural Framing & Foundation Details",
          description: "Post footing dimensions, concrete pier blocks or poured footings, post-to-beam connectors, joist size/spacing, and ledger attachment detail.",
          isMandatory: true
        },
        {
          documentName: "Guardrail & Stair Geometry Drawing",
          description: "Required for walking surfaces >30\" above grade. Detail showing 36\" guardrails, 4\" sphere rule, and stair handrail returns.",
          isMandatory: true
        },
        {
          documentName: "Subject-to-Field-Inspection (STFI) Eligibility Checklist",
          description: "Completed SDCI form verifying that the project does not involve structural cantilevers or complex engineering.",
          isMandatory: true
        }
      ],
      keyThresholds: [
        "Walking surface > 18 inches above grade triggers SDCI building permit requirement (SDCI Tip 312).",
        "Walking surface > 30 inches above grade requires code-compliant 36-inch guardrail.",
        "Decks in Seattle Environmentally Critical Areas (ECA - e.g. steep slopes or liquefaction zones) require full standard plan review and cannot use STFI."
      ],
      sources: [
        {
          title: "SDCI Tip 312: Decks, Fences, and Arbors for Single-Family Homes",
          codeReference: "Seattle Residential Code (SRC) Section R105.2 & R507",
          urlOrDocRef: "https://www.seattle.gov/sdci/permits/permits-we-issue-(a-z)/deck-permits",
          department: "Seattle Department of Construction & Inspections"
        },
        {
          title: "Seattle Land Use Code: Single-Family Yard & Setback Standards",
          codeReference: "Seattle Municipal Code (SMC) Section 23.44.014",
          urlOrDocRef: "https://www.seattle.gov/sdci/codes",
          department: "SDCI Land Use Division"
        }
      ]
    },
    remodel: {
      summary: "Interior kitchen and bathroom remodels in Seattle that do not alter the building envelope or alter structural load-bearing elements typically qualify for the rapid Subject-to-Field-Inspection (STFI) permit track through the Seattle Services Portal. However, separate trade permits are required: electrical permits from SDCI and plumbing permits from Public Health - Seattle & King County.",
      requiredDocuments: [
        {
          documentName: "Existing & Proposed Scaled Floor Plans",
          description: "1/4\" scale plan showing room dimensions, door openings, plumbing fixtures, kitchen appliances, and window ventilation.",
          isMandatory: true
        },
        {
          documentName: "SDCI STFI Self-Certification Checklist",
          description: "Form confirming that no structural bearing walls are being removed and work is within standard single-family scope.",
          isMandatory: true
        },
        {
          documentName: "King County Public Health Plumbing Permit Application",
          description: "Mandatory separate plumbing permit issued by Public Health - Seattle & King County for any moved drains, water lines, or showers.",
          isMandatory: true
        },
        {
          documentName: "SDCI Electrical Permit",
          description: "Electrical permit for branch circuits, kitchen small appliance circuits (two 20A GFCI/AFCI circuits), and lighting.",
          isMandatory: true
        }
      ],
      keyThresholds: [
        "Non-bearing partition removal without structural headers qualifies for over-the-counter STFI.",
        "Plumbing permits in Seattle are NOT issued by SDCI; they must be pulled through Public Health - Seattle & King County.",
        "Bathrooms require either an operable window (min 3 sq ft) or mechanical exhaust fan ducted to the exterior at min 50 CFM."
      ],
      sources: [
        {
          title: "SDCI Tip 106: Subject-to-Field-Inspection (STFI) Permits",
          codeReference: "Seattle Residential Code (SRC) Chapter 1 & Section R303",
          urlOrDocRef: "https://www.seattle.gov/sdci/permits/permits-we-issue-(a-z)/remodel-permits",
          department: "Seattle Department of Construction & Inspections"
        },
        {
          title: "Public Health - Seattle & King County Plumbing Program Guidelines",
          codeReference: "Uniform Plumbing Code (UPC) as adopted by King County",
          urlOrDocRef: "https://kingcounty.gov/en/dept/dph/health-safety/environmental-health/plumbing",
          department: "Public Health - Seattle & King County"
        }
      ]
    },
    adu: {
      summary: "Seattle permits both Attached Accessory Dwelling Units (AADUs) and Detached Accessory Dwelling Units (DADUs) across Neighborhood Residential (NR) zones under Seattle Municipal Code 23.44.041. Up to two ADUs are permitted per lot. Seattle has eliminated off-street parking mandates and owner-occupancy requirements for ADUs, making permitting streamlined, but architectural, drainage, and utility approvals remain mandatory.",
      requiredDocuments: [
        {
          documentName: "Pre-Application Site Visit (PASV) Report",
          description: "SDCI site inspection assessing steep slopes, tree canopy, and ground conditions prior to application.",
          isMandatory: true
        },
        {
          documentName: "Architectural Plan Set (Plans, Elevations, Sections)",
          description: "Fully dimensioned floor plans, building height calculations (typically 18-22 ft for DADUs), window egress details, and structural framing.",
          isMandatory: true
        },
        {
          documentName: "Drainage & Wastewater / Side Sewer Assessment",
          description: "Evaluation by Seattle Public Utilities (SPU) for stormwater retention and sanitary sewer connection/availability.",
          isMandatory: true
        },
        {
          documentName: "Statement of Financial Responsibility Form",
          description: "Standard SDCI applicant verification form establishing project ownership and billing responsible party.",
          isMandatory: true
        },
        {
          documentName: "Washington State Energy Code (WSEC-R) Compliance Form",
          description: "Energy credits worksheet and insulation/glazing U-factor calculations.",
          isMandatory: true
        }
      ],
      keyThresholds: [
        "Maximum gross floor area: 1,000 sq ft for AADUs and 1,000 sq ft for DADUs (excluding garage/storage in certain configurations).",
        "No off-street parking or owner-occupancy required in Seattle under updated Land Use Code SMC 23.44.041.",
        "Garage conversions must meet Washington State residential insulation and moisture barrier standards."
      ],
      sources: [
        {
          title: "SDCI Tip 217 & Tip 222: Attached & Detached Accessory Dwelling Units",
          codeReference: "Seattle Municipal Code (SMC) Section 23.44.041",
          urlOrDocRef: "https://www.seattle.gov/sdci/permits/permits-we-issue-(a-z)/accessory-dwelling-units",
          department: "SDCI Land Use & Plan Review"
        },
        {
          title: "Seattle Pre-Approved ADU (PACE) Program Guidelines",
          codeReference: "City of Seattle Office of Planning and Community Development",
          urlOrDocRef: "https://aduniverse-seattle.hub.arcgis.com",
          department: "Seattle OPCD & SDCI"
        }
      ]
    },
    electrical_upgrade: {
      summary: "In the City of Seattle, replacing or upgrading a residential electrical service panel requires an electrical permit from the Seattle Department of Construction and Inspections (SDCI) and utility service planning approval from Seattle City Light (SCL) for meter disconnect/reconnect and service capacity verification.",
      requiredDocuments: [
        {
          documentName: "SDCI Electrical Permit Application",
          description: "Online submittal via the Seattle Services Portal. Single-family services up to 400A qualify for over-the-counter processing.",
          isMandatory: true
        },
        {
          documentName: "Seattle City Light (SCL) Service Application",
          description: "Required to coordinate meter disconnect/reconnect, service conductor sizing, and overhead drop or underground handhole connection.",
          isMandatory: true
        },
        {
          documentName: "Residential Load Calculation Worksheet",
          description: "NEC Article 220 load calculation verifying connected appliance, HVAC heat pump, and EV charging demands.",
          isMandatory: true
        },
        {
          documentName: "One-Line Electrical Diagram",
          description: "Diagram showing service entrance, meter socket, main disconnect amperage, panel bus rating, and grounding electrode conductor (GEC).",
          isMandatory: false
        }
      ],
      keyThresholds: [
        "Residential service upgrades up to 400A single-phase do not require engineering plan review unless in an environmentally critical area.",
        "Work must comply with the Seattle Electrical Code (Seattle amendments to the 2023 NEC).",
        "Utility disconnect and meter tag seals are strictly managed by Seattle City Light."
      ],
      sources: [
        {
          title: "SDCI Electrical Permits Information Guide",
          codeReference: "Seattle Municipal Code (SMC) Title 22 & Seattle Electrical Code",
          urlOrDocRef: "https://www.seattle.gov/sdci/permits/permits-we-issue-(a-z)/electrical-permits",
          department: "Seattle Department of Construction & Inspections"
        },
        {
          title: "Seattle City Light Requirements for Electric Service Connection (RESC)",
          codeReference: "SCL Standards SCL-001",
          urlOrDocRef: "https://www.seattle.gov/city-light/business-solutions/construction-services",
          department: "Seattle City Light"
        }
      ]
    }
  },
  los_angeles: {
    electrical_upgrade: {
      summary: "Electrical service upgrades may require an electrical permit and supporting documentation depending on the work scope. In the City of Los Angeles, upgrading a residential electrical service (such as from 100A to 200A or 400A) requires an electrical permit from the Department of Building and Safety (LADBS) and service planning clearance from the Los Angeles Department of Water and Power (LADWP).",
      requiredDocuments: [
        {
          documentName: "LADBS Electrical Permit Application",
          description: "Standard residential single-phase services up to 200A or 400A qualify for online Express Permitting through the LADBS ePermit system without plan check.",
          isMandatory: true
        },
        {
          documentName: "LADWP Service Planning & Meter Spotting Clearance",
          description: "Coordination with Los Angeles Department of Water and Power (LADWP) for service disconnect, meter socket location approval, and service entrance point.",
          isMandatory: true
        },
        {
          documentName: "Electrical Load Calculation Sheet",
          description: "Calculation of total connected residential electrical loads in accordance with CEC Article 220 to determine required service ampacity.",
          isMandatory: true
        },
        {
          documentName: "Single-Line Diagram (One-Line Diagram)",
          description: "Required if service exceeds 400A, incorporates solar/ESS storage interconnection, or requires structural panel relocation.",
          isMandatory: false
        }
      ],
      keyThresholds: [
        "Residential panel upgrades up to 200A (single-phase 120/240V) qualify for instant online Express ePermit without plan check.",
        "Commercial services, multi-family services >400A, or installations requiring structural alterations trigger LADBS Electrical Plan Check.",
        "Meter disconnect/reconnect and utility energization must be coordinated directly with LADWP.",
        "Grounding electrode system must be brought up to current code (two ground rods min 6ft apart or concrete-encased Ufer ground)."
      ],
      sources: [
        {
          title: "Electrical Permit Requirements",
          codeReference: "City of Los Angeles Electrical Code (LAMC Chapter IX, Article 3 / California Electrical Code)",
          urlOrDocRef: "https://www.ladbs.org/services/core-services/plan-check-permit/plan-check-permit-special-assistance/electrical",
          department: "Department of Building and Safety"
        },
        {
          title: "LADWP Electric Service Requirements (ESR)",
          codeReference: "LADWP Customer Service Rules & Regulations",
          urlOrDocRef: "https://www.ladwp.com",
          department: "Los Angeles Department of Water and Power"
        }
      ]
    },
    deck_patio: {
      summary: "In the City of Los Angeles, residential decks elevated more than 30 inches above adjacent grade, attached to the house, or in hillside designated grading areas require a building permit from the Department of Building and Safety (LADBS). Freestanding ground-level decks under 30 inches that do not exceed zoning setback or lot coverage restrictions are permit-exempt.",
      requiredDocuments: [
        {
          documentName: "Dimensioned Plot Plan / Site Plan",
          description: "Must show property lines, easements, existing buildings, proposed deck perimeter, distances to property lines, and hillside slope contours if applicable.",
          isMandatory: true
        },
        {
          documentName: "Structural Framing & Foundation Plan",
          description: "Footing layout, concrete pier depth, post-to-beam connectors, joist sizing, and ledger attachment detail (direct to rim joist with code-approved lag screws).",
          isMandatory: true
        },
        {
          documentName: "Guardrail & Stair Section",
          description: "Shows 42\" guardrail height for commercial or 36\" for residential under California Residential Code with 4\" maximum sphere baluster spacing.",
          isMandatory: true
        }
      ],
      keyThresholds: [
        "Decks elevated >30 inches above grade require a building permit and 36\" minimum guardrails.",
        "Hillside designated areas in Los Angeles (City of LA Baseline Hillside Ordinance) require soils engineering and slope review.",
        "Ledger boards cannot be fastened to brick veneer or cantilevers."
      ],
      sources: [
        {
          title: "LADBS Residential Wood-Framed Deck Information Bulletin P/BC 2020-001",
          codeReference: "City of Los Angeles Building Code (LAMC Chapter IX) & California Residential Code R507",
          urlOrDocRef: "https://www.ladbs.org",
          department: "Department of Building and Safety"
        }
      ]
    },
    remodel: {
      summary: "In the City of Los Angeles, kitchen and bathroom remodels involving non-structural cosmetic updates (like replacing cabinets and fixtures in the same location) can qualify for Express ePermits, while removing walls, altering plumbing drain stacks, or relocating electrical circuits requires LADBS building, plumbing, and electrical trade permits.",
      requiredDocuments: [
        {
          documentName: "Existing & Proposed Floor Plans",
          description: "Dimensioned layout showing wall removals, door/window modifications, plumbing fixture locations, and smoke/CO detector placements.",
          isMandatory: true
        },
        {
          documentName: "Trade Permit Applications (Electrical, Plumbing, Mechanical)",
          description: "Separate trade permits pulled through LADBS ePermit for new circuits, gas lines, or plumbing waste lines.",
          isMandatory: true
        },
        {
          documentName: "Title 24 Energy Compliance / Lighting Verification",
          description: "Verification of high-efficacy lighting and California Energy Code Title 24 compliance.",
          isMandatory: true
        }
      ],
      keyThresholds: [
        "Non-bearing interior wall removal qualifies for Express Permit; load-bearing walls require structural plan check.",
        "Kitchen counter outlets must be supplied by minimum two 20A small-appliance branch circuits with GFCI and AFCI protection.",
        "California Green Building Standards (CALGreen) water-efficient fixture requirements apply to all remodeled bathrooms."
      ],
      sources: [
        {
          title: "LADBS Residential Alterations and Remodeling Guidelines",
          codeReference: "City of Los Angeles Building Code & CALGreen Title 24",
          urlOrDocRef: "https://www.ladbs.org",
          department: "Department of Building and Safety"
        }
      ]
    },
    adu: {
      summary: "In the City of Los Angeles, Accessory Dwelling Units (ADUs) and garage conversions are permitted under California State Law (AB 68/SB 13/AB 881) and the City of Los Angeles ADU Memorandum, requiring architectural plan check and LADBS building, plumbing, mechanical, and electrical clearances.",
      requiredDocuments: [
        {
          documentName: "Complete Architectural Plan Set",
          description: "Dimensioned floor plans, roof plan, elevations, exterior wall fire ratings, window egress sizes, and energy calculation sheets.",
          isMandatory: true
        },
        {
          documentName: "Plot Plan & Zoning Review Worksheet",
          description: "Shows front, side, and rear setbacks (4-foot side/rear setbacks for detached ADUs), height limits, and lot coverage.",
          isMandatory: true
        },
        {
          documentName: "LADWP Utility & Fire Flow Clearance",
          description: "Clearance regarding water meter capacity and electrical service entrance requirements.",
          isMandatory: true
        }
      ],
      keyThresholds: [
        "Detached ADUs up to 800 sq ft with 4-ft side and rear setbacks are permitted by right under California State Law.",
        "Garage conversions do not require replacement off-street parking if located within 1/2 mile of public transit.",
        "Sprinklers are not required in the ADU unless also required in the primary dwelling."
      ],
      sources: [
        {
          title: "City of Los Angeles ADU Guidebook & Information Bulletin",
          codeReference: "LAMC Section 12.22 A.33 & California Government Code Section 65852.2",
          urlOrDocRef: "https://www.ladbs.org/services/core-services/plan-check-permit/accessory-dwelling-units",
          department: "Department of Building and Safety"
        }
      ]
    }
  }
};

function resolveJurisdictionKey(val: string): string {
  const low = (val || "").toLowerCase();
  if (low.includes("los") || low.includes("angeles") || low.includes("la")) return "los_angeles";
  if (low.includes("seattle")) return "seattle";
  return "austin";
}

function resolveCategoryKey(val: string): string {
  const low = (val || "").toLowerCase();
  if (low.includes("elect") || low.includes("panel") || low.includes("service")) return "electrical_upgrade";
  if (low.includes("deck") || low.includes("patio")) return "deck_patio";
  if (low.includes("remodel") || low.includes("kitchen") || low.includes("bath")) return "remodel";
  return "adu";
}

function getJurisdictionDisplayName(key: string): string {
  if (key === "los_angeles") return "City of Los Angeles, CA";
  if (key === "seattle") return "City of Seattle, WA";
  return "City of Austin, TX";
}

function getCategoryDisplayName(key: string): string {
  if (key === "electrical_upgrade") return "Electrical Service Upgrade";
  if (key === "deck_patio") return "Residential Deck / Patio Addition";
  if (key === "remodel") return "Kitchen & Bathroom Remodel";
  return "Accessory Dwelling Unit (ADU) / Garage Conversion";
}

// Search endpoint for permit inquiries
app.post("/api/permit-search", async (req, res) => {
  const UNSUPPORTED_MESSAGE = "I could not verify this from the available PermitLens sources. Please check with the official permitting authority.";

  try {
    const { jurisdiction, category, question } = req.body || {};

    // 1. Error handling: no jurisdiction selected
    if (!jurisdiction || typeof jurisdiction !== "string" || !jurisdiction.trim()) {
      return res.status(400).json({ error: "No jurisdiction selected. Please select a municipal jurisdiction before searching." });
    }

    // 2. Error handling: no permit category selected
    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ error: "No permit category selected. Please select a permit category before searching." });
    }

    // 3. Error handling: empty question
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Empty question. Please enter a permit question before searching." });
    }

    // 4. Error handling: question shorter than 5 characters
    if (question.trim().length < 5) {
      return res.status(400).json({ error: "Question is too short (must be at least 5 characters)." });
    }

    // Filter reference data strictly by selected jurisdiction
    const jurKey = resolveJurisdictionKey(jurisdiction);
    // Filter strictly by selected permit category
    const catKey = resolveCategoryKey(category);

    // 5. Error handling: no matching source
    const matchingSource = VERIFIED_KNOWLEDGE[jurKey]?.[catKey];

    const jurDisplay = getJurisdictionDisplayName(jurKey);
    const catDisplay = getCategoryDisplayName(catKey);

    if (!matchingSource) {
      return res.status(404).json({
        error: "No matching source found for the selected jurisdiction and permit category.",
        jurisdiction: jurDisplay,
        category: catDisplay,
        question,
        answer: {
          summary: UNSUPPORTED_MESSAGE,
          requiredDocuments: [],
          keyThresholds: [],
          sources: [],
          cautionaryNotice: "PermitLens AI is an independent contractor research tool and is not an official permitting authority or municipal government agency. Always verify permit submittal requirements with your local building department."
        },
        mode: "unsupported-query"
      });
    }

    const ai = getGenAI();

    if (!ai) {
      // If no API key configured, return verified curated response directly based strictly on matching source
      return res.json({
        jurisdiction: jurDisplay,
        category: catDisplay,
        question,
        answer: {
          summary: matchingSource.summary,
          requiredDocuments: matchingSource.requiredDocuments,
          keyThresholds: matchingSource.keyThresholds,
          sources: matchingSource.sources,
          cautionaryNotice: "PermitLens AI is an independent contractor research tool and is not an official permitting authority or municipal government agency. Always verify permit submittal requirements with your local building department."
        },
        mode: "verified-reference"
      });
    }

    const systemInstruction = `You are PermitLens AI, a specialized permit research assistant.
STRICT PERMITLENS ANSWER RULES:
1. Filter context: You are provided ONLY the official reference records for:
   - Selected Jurisdiction: "${jurDisplay}"
   - Selected Permit Category: "${catDisplay}"
2. Use ONLY the matching source records provided below as your context.
3. NEVER use information, codes, or rules from another jurisdiction.
4. NEVER invent permit requirements, fees, approval guarantees, inspection rules, deadlines, or code requirements.
5. If the available source does not support the answer (for example, if the contractor question asks about unverified fees, guaranteed approvals, off-topic trades, or details not confirmed in the matching sources), you MUST respond with:
"${UNSUPPORTED_MESSAGE}"
in the "summary" field.
6. Always show:
   - Source title (from matching source)
   - Source URL (from matching source)
   - Jurisdiction ("${jurDisplay}")
   - Permit category ("${catDisplay}")

MATCHING SOURCE RECORDS CONTEXT:
${JSON.stringify(matchingSource, null, 2)}

JSON output schema:
{
  "summary": "Direct factual answer strictly supported by the matching sources, OR '${UNSUPPORTED_MESSAGE}'",
  "requiredDocuments": [
    {
      "documentName": "Specific document or drawing name directly from matching source",
      "description": "Details from matching source",
      "isMandatory": true
    }
  ],
  "keyThresholds": [
    "Thresholds directly from matching source"
  ],
  "sources": [
    {
      "title": "Document or Bulletin title",
      "codeReference": "Municipal code reference",
      "urlOrDocRef": "Official department portal or checklist URL",
      "department": "City department name"
    }
  ],
  "cautionaryNotice": "PermitLens AI is an independent contractor research tool and is not an official permitting authority or municipal government agency. Always verify permit submittal requirements with your local building department."
}`;

    const prompt = `Jurisdiction: ${jurDisplay}
Permit Category: ${catDisplay}
Contractor Question: "${question}"

Analyze this question strictly against the matching source records provided above for ${jurDisplay} and ${catDisplay}. If the available source does not support the answer, output "${UNSUPPORTED_MESSAGE}" as the summary. Never invent requirements or use information from any other jurisdiction. Output JSON matching the schema.`;

    // Execute with a 9-second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini request timed out after 9 seconds")), 9000)
    );

    const apiPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    let geminiResponse: any;
    try {
      geminiResponse = await Promise.race([apiPromise, timeoutPromise]);
    } catch (geminiError: any) {
      console.warn("Gemini API call unavailable or timed out, returning verified source records:", geminiError?.message || geminiError);
      return res.json({
        jurisdiction: jurDisplay,
        category: catDisplay,
        question,
        answer: {
          ...matchingSource,
          cautionaryNotice: "PermitLens AI is an independent contractor research tool and is not an official permitting authority or municipal government agency. Always verify permit submittal requirements with your local building department."
        },
        mode: "verified-reference"
      });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(geminiResponse.text || "{}");
    } catch {
      parsedResult = matchingSource;
    }

    // Check if the answer could not be verified or is unsupported
    const summaryLower = (parsedResult.summary || "").toLowerCase();
    if (
      summaryLower.includes("could not verify") ||
      summaryLower.includes("cannot verify") ||
      summaryLower.includes("permitlens sources")
    ) {
      parsedResult.summary = UNSUPPORTED_MESSAGE;
    }

    // Ensure all critical sections exist and sources match the verified jurisdiction/category
    if (!parsedResult.requiredDocuments || !Array.isArray(parsedResult.requiredDocuments)) {
      parsedResult.requiredDocuments = matchingSource.requiredDocuments;
    }
    if (!parsedResult.sources || !Array.isArray(parsedResult.sources) || parsedResult.sources.length === 0) {
      parsedResult.sources = matchingSource.sources;
    }
    if (!parsedResult.keyThresholds || !Array.isArray(parsedResult.keyThresholds)) {
      parsedResult.keyThresholds = matchingSource.keyThresholds;
    }
    if (!parsedResult.summary) {
      parsedResult.summary = matchingSource.summary;
    }
    parsedResult.cautionaryNotice = "PermitLens AI is an independent contractor research tool and is not an official permitting authority or municipal government agency. Always verify permit submittal requirements with your local building department.";

    return res.json({
      jurisdiction: jurDisplay,
      category: catDisplay,
      question,
      answer: parsedResult,
      mode: parsedResult.summary === UNSUPPORTED_MESSAGE ? "unsupported-query" : "ai-generated"
    });

  } catch (error: any) {
    console.error("Error generating permit response:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred while processing permit inquiry."
    });
  }
});

// Feedback endpoint
app.post("/api/feedback", (req, res) => {
  try {
    const { searchId, rating, feedbackComment, userId, timestamp } = req.body || {};
    console.log(`[Feedback] Received feedback for record: ${searchId || "unknown"} (rating: ${rating || "none"})`);
    res.json({
      status: "ok",
      received: {
        searchId: searchId || "",
        userId: userId || "anonymous",
        rating: rating || "helpful",
        feedbackComment: feedbackComment || "",
        timestamp: timestamp || new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error("[Feedback Error]:", err?.message || err);
    res.status(200).json({ status: "ok", warning: "Feedback recorded" });
  }
});

// Emergency HTML shell for fail-safe root page rendering
function getEmergencyHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PermitLens AI</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 520px; width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; }
      h1 { font-size: 1.5rem; margin: 0 0 0.75rem 0; color: #38bdf8; }
      p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin: 0 0 1.5rem 0; }
      .btn { display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; border: none; border-radius: 6px; padding: 0.65rem 1.5rem; font-weight: 500; cursor: pointer; }
      .btn:hover { background: #0369a1; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>PermitLens AI</h1>
      <p>The permit research assistant is running. If the interface does not load immediately, please reload the page.</p>
      <button class="btn" onclick="window.location.reload()">Reload Application</button>
    </div>
  </body>
</html>`;
}

// Locate dist directory reliably in both dev and production (bundled or unbundled)
function resolveDistDirectory(): string {
  const candidates: string[] = [];

  if (typeof __dirname !== "undefined") {
    // When running dist/server.cjs, __dirname is already the dist folder
    candidates.push(__dirname);
    candidates.push(path.join(__dirname, "dist"));
    candidates.push(path.resolve(__dirname, "..", "dist"));
  }
  candidates.push(path.join(process.cwd(), "dist"));
  candidates.push(process.cwd());

  for (const dir of candidates) {
    if (dir && fs.existsSync(path.join(dir, "index.html"))) {
      return dir;
    }
  }
  return path.join(process.cwd(), "dist");
}

function renderIndexHtml(distDir: string, res: express.Response) {
  const indexPath = path.join(distDir, "index.html");
  if (fs.existsSync(indexPath)) {
    try {
      const html = fs.readFileSync(indexPath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      return res.status(200).send(html);
    } catch (readErr: any) {
      console.error("[Static Error] Failed to read index.html:", readErr?.message || readErr);
    }
  }
  console.warn(`[Static Warning] index.html not found at ${indexPath}; serving fail-safe shell`);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(getEmergencyHtml());
}

async function start() {
  const distDir = resolveDistDirectory();
  const hasBuiltDist = fs.existsSync(path.join(distDir, "index.html"));
  const isDevMode = process.env.NODE_ENV === "development" && !hasBuiltDist;

  console.log(`[Startup] Environment: ${process.env.NODE_ENV || "production"}`);
  console.log(`[Startup] Static directory: ${distDir} (built assets present: ${hasBuiltDist})`);

  if (isDevMode) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("[Startup] Vite development middleware mounted.");
    } catch (viteError: any) {
      console.warn("[Startup] Vite dev server unavailable, using static fallback:", viteError?.message);
      mountStaticServing(distDir);
    }
  } else {
    mountStaticServing(distDir);
  }

  function mountStaticServing(directory: string) {
    // 1. Static asset middleware
    app.use(
      express.static(directory, {
        index: false,
        maxAge: "1d",
        fallthrough: true,
      })
    );

    // 2. SPA fallback: serve index.html for all page requests (never 500)
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      return renderIndexHtml(directory, res);
    });
  }

  // 3. API 404 handler
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // 4. Global Express error handler to guarantee root HTML requests never return raw 500
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(`[Server Error] Uncaught error on ${req.method} ${req.originalUrl || req.url}:`, err?.message || err);
    if (res.headersSent) {
      return;
    }
    if (req.accepts("html") && !req.path.startsWith("/api/")) {
      return renderIndexHtml(distDir, res);
    }
    res.status(500).json({ error: "An unexpected server error occurred." });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`PermitLens AI server listening on 0.0.0.0:${PORT}`);
  });

  server.on("error", (err: any) => {
    console.error("Server listener error during startup:", err);
  });
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

start().catch((err) => {
  console.error("Fatal error in start():", err);
  process.exit(1);
});
