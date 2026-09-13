import React, { useState, useEffect } from 'react';
import {
  JurisdictionKey,
  PermitCategoryKey,
  UserProfile,
  SearchRecord
} from './types';
import { Header } from './components/Header';
import { SearchConsole } from './components/SearchConsole';
import { AnswerCard } from './components/AnswerCard';
import { HistorySidebar } from './components/HistorySidebar';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { AlertCircle, Building2, X } from 'lucide-react';
import {
  subscribeToAuth,
  logOut,
  saveSearchRecordToFirestore,
  fetchUserSearchesFromFirestore,
  deleteSearchRecordFromFirestore,
  saveFeedbackToFirestore,
  testConnection
} from './lib/firebase';

// Initial preloaded search for initial exploration
const LA_ELECTRICAL_DEMO_RECORD: SearchRecord = {
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

const INITIAL_DEMO_RECORD: SearchRecord = {
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<SearchRecord[]>([LA_ELECTRICAL_DEMO_RECORD, INITIAL_DEMO_RECORD]);

  const [selectedJurisdiction, setSelectedJurisdiction] = useState<JurisdictionKey>('los_angeles');
  const [selectedCategory, setSelectedCategory] = useState<PermitCategoryKey>('electrical_upgrade');
  const [currentRecord, setCurrentRecord] = useState<SearchRecord | null>(LA_ELECTRICAL_DEMO_RECORD);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initialize Firebase Auth listener and Firestore connection check
  useEffect(() => {
    testConnection();

    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userSearches = await fetchUserSearchesFromFirestore(user.id);
          setHistory(userSearches);
          if (userSearches.length > 0) {
            setCurrentRecord(userSearches[0]);
          } else {
            setCurrentRecord(null);
          }
        } catch (err: any) {
          console.error("Error loading user searches from Firestore:", err);
          setFirestoreError(`Firestore failure: Could not load user history (${err.message || "read error"}).`);
        }
      } else {
        // When logged out, reset to empty or default demonstration
        setHistory([LA_ELECTRICAL_DEMO_RECORD, INITIAL_DEMO_RECORD]);
        setCurrentRecord(LA_ELECTRICAL_DEMO_RECORD);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (user: UserProfile) => {
    setCurrentUser(user);
    try {
      const userSearches = await fetchUserSearchesFromFirestore(user.id);
      setHistory(userSearches);
      if (userSearches.length > 0) {
        setCurrentRecord(userSearches[0]);
      } else {
        setCurrentRecord(null);
      }
    } catch (err: any) {
      console.error("Error fetching user searches after sign-in:", err);
      setFirestoreError(`Firestore failure: Could not load search history (${err.message || "database error"}).`);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.warn("Sign-out error:", err);
    }
    setCurrentUser(null);
    setHistory([LA_ELECTRICAL_DEMO_RECORD, INITIAL_DEMO_RECORD]);
    setCurrentRecord(LA_ELECTRICAL_DEMO_RECORD);
  };

  const handleSearch = async (question: string) => {
    setSearchError(null);
    setFirestoreError(null);

    // 1. Error handling: no jurisdiction selected
    if (!selectedJurisdiction) {
      setSearchError("No jurisdiction selected. Please select a municipal jurisdiction before searching.");
      return;
    }

    // 2. Error handling: no permit category selected
    if (!selectedCategory) {
      setSearchError("No permit category selected. Please select a permit category before searching.");
      return;
    }

    // 3. Error handling: empty question
    if (!question || !question.trim()) {
      setSearchError("Empty question. Please enter a permit question before searching.");
      return;
    }

    // 4. Error handling: question shorter than 5 characters
    if (question.trim().length < 5) {
      setSearchError("Question is too short (must be at least 5 characters).");
      return;
    }

    // Network failure check before sending request
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSearchError("Network failure: You appear to be offline. Please verify your internet connection and try again.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/permit-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jurisdiction: selectedJurisdiction,
          category: selectedCategory,
          question: question.trim()
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Specific error mapping
        if (res.status === 404 || data.error?.toLowerCase().includes("no matching source")) {
          throw new Error(data.error || "No matching source found for the selected jurisdiction and permit category.");
        }
        if (res.status === 502 || data.isGeminiError || data.error?.toLowerCase().includes("gemini")) {
          throw new Error(data.error || "Gemini API failure: AI model service error.");
        }
        throw new Error(data.error || `Server returned error status ${res.status}`);
      }

      const newRecord: SearchRecord = {
        id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        timestamp: Date.now(),
        jurisdiction: data.jurisdiction,
        jurisdictionKey: selectedJurisdiction,
        category: data.category,
        categoryKey: selectedCategory,
        question: data.question,
        answer: data.answer,
        mode: data.mode || 'ai-generated'
      };

      setCurrentRecord(newRecord);
      setHistory((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);

      // Directly persist to Firestore for authenticated user
      if (currentUser) {
        try {
          await saveSearchRecordToFirestore(currentUser.id, newRecord);
        } catch (saveErr: any) {
          console.error("Failed to save search to Firestore:", saveErr);
          setFirestoreError(`Firestore failure: Could not save search history (${saveErr.message || "write error"}).`);
        }
      }
    } catch (err: any) {
      console.error("Search error:", err);
      if (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setSearchError("Network failure: Unable to connect to the server. Please check your internet connection.");
      } else if (err.message?.toLowerCase().includes("gemini")) {
        setSearchError(`Gemini API failure: ${err.message}`);
      } else if (err.message?.toLowerCase().includes("no matching source")) {
        setSearchError("No matching source found: No official municipal reference document matches your selected criteria.");
      } else {
        setSearchError(err.message || "Unable to retrieve permit checklist from server. Please retry in a moment.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (recordId: string, rating: 'helpful' | 'not_helpful', comment?: string) => {
    const timestamp = Date.now();
    const userId = currentUser ? currentUser.id : 'anonymous';

    // Update local state immediately for responsive UI
    setHistory((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            feedback: {
              rating,
              comment,
              submittedAt: timestamp
            }
          };
        }
        return r;
      })
    );

    if (currentRecord && currentRecord.id === recordId) {
      setCurrentRecord((prev) =>
        prev
          ? {
              ...prev,
              feedback: {
                rating,
                comment,
                submittedAt: timestamp
              }
            }
          : null
      );
    }

    // Save feedback to Firestore with user ID, search ID, rating, timestamp
    try {
      await saveFeedbackToFirestore(userId, recordId, rating, timestamp);
    } catch (fireErr: any) {
      console.error("Firestore failure during feedback save:", fireErr);
      setFirestoreError(`Firestore failure: Could not save feedback (${fireErr.message || "Database write error"}).`);
      throw fireErr;
    }

    // Also notify server endpoint
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchId: recordId,
          userId,
          rating,
          feedbackComment: comment,
          timestamp
        })
      });
    } catch (e) {
      console.warn("Server feedback sync note:", e);
    }
  };

  const handleSelectHistoryRecord = (record: SearchRecord) => {
    setCurrentRecord(record);
    setSelectedJurisdiction(record.jurisdictionKey);
    setSelectedCategory(record.categoryKey);
  };

  const handleDeleteHistoryRecord = async (recordId: string) => {
    setHistory((prev) => prev.filter((r) => r.id !== recordId));
    if (currentRecord?.id === recordId) {
      const remaining = history.filter((r) => r.id !== recordId);
      setCurrentRecord(remaining[0] || null);
    }
    if (currentUser) {
      try {
        await deleteSearchRecordFromFirestore(currentUser.id, recordId);
      } catch (err) {
        console.error("Failed to delete record from Firestore:", err);
      }
    }
  };

  const handleClearAllHistory = async () => {
    const toDelete = [...history];
    setHistory([]);
    setCurrentRecord(null);
    if (currentUser) {
      for (const rec of toDelete) {
        try {
          await deleteSearchRecordFromFirestore(currentUser.id, rec.id);
        } catch (err) {
          console.error("Error clearing record from Firestore:", err);
        }
      }
    }
  };

  const handleNewSearch = () => {
    setCurrentRecord(null);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-slate-800 bg-slate-50">
      
      {/* 1. Geometric Balance Dark Left Sidebar (Persistent on desktop) */}
      <HistorySidebar
        records={history}
        activeRecordId={currentRecord?.id || null}
        onSelectRecord={handleSelectHistoryRecord}
        onClearHistory={handleClearAllHistory}
        onDeleteRecord={handleDeleteHistoryRecord}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onNewSearch={handleNewSearch}
      />

      {/* Mobile Drawer Overlay & Sidebar for small screens */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <HistorySidebar
            records={history}
            activeRecordId={currentRecord?.id || null}
            onSelectRecord={handleSelectHistoryRecord}
            onClearHistory={handleClearAllHistory}
            onDeleteRecord={handleDeleteHistoryRecord}
            currentUser={currentUser}
            onOpenAuth={() => {
              setIsMobileSidebarOpen(false);
              setIsAuthModalOpen(true);
            }}
            onNewSearch={handleNewSearch}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            isMobileDrawer={true}
          />
        </>
      )}

      {/* 2. Main Work Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Geometric Header Bar: Jurisdiction & Category dropdowns + System Ready */}
        <Header
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          selectedJurisdiction={selectedJurisdiction}
          onSelectJurisdiction={setSelectedJurisdiction}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />

        {/* Scrollable Content Container */}
        <div className="flex-1 p-4 sm:p-8 flex flex-col gap-6 overflow-y-auto">
          
          {/* Scope Banner (Course Workshop Notice) */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                <strong>PermitLens AI:</strong> Residential permit research assistant for <strong>City of Los Angeles, CA</strong> (LADBS), <strong>City of Austin, TX</strong> (DSD), and <strong>City of Seattle, WA</strong> (SDCI).
              </span>
            </div>
            <span className="hidden sm:inline text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded">
              Verified Codes
            </span>
          </div>

          {/* Search Console (Geometric input with search icon & suggested chips) */}
          <SearchConsole
            jurisdiction={selectedJurisdiction}
            category={selectedCategory}
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          {/* Search Error banner */}
          {searchError && (
            <div
              id="search-error-banner"
              className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 flex items-center justify-between gap-2 animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span className="font-medium">{searchError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSearchError(null)}
                className="text-red-500 hover:text-red-700 p-1 rounded-md transition cursor-pointer"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Firestore Error banner */}
          {firestoreError && (
            <div
              id="firestore-error-banner"
              className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex items-center justify-between gap-2 animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-medium">{firestoreError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFirestoreError(null)}
                className="text-amber-500 hover:text-amber-700 p-1 rounded-md transition cursor-pointer"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Active Permit Answer Card */}
          <div className="flex-1 min-h-0">
            {currentRecord ? (
              <AnswerCard
                record={currentRecord}
                onFeedback={handleFeedback}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-xs">
                <p className="text-sm font-semibold text-slate-700">Ready to search permit requirements</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Type a question above or pick one of the suggested prompts to retrieve document checklists, municipal code thresholds, and official source links.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Google Authentication Dialog */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

    </div>
  );
}
