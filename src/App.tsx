import React, { useEffect, useState } from 'react';
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
import { ErrorBanner } from './components/common/ErrorBanner';
import { SearchLoadingBanner } from './components/common/SearchLoadingBanner';
import { Building2 } from 'lucide-react';
import {
  subscribeToAuth,
  logOut,
  saveSearchRecordToFirestore,
  fetchUserSearchesFromFirestore,
  deleteSearchRecordFromFirestore,
  saveFeedbackToFirestore,
  testConnection
} from './lib/firebase';
import { DEFAULT_GUEST_HISTORY } from './data/demoRecords';
import { loadGuestSession, saveGuestSession } from './lib/storage';
import { validatePermitSearch } from './lib/validation';
import { toUserFriendlyError } from './lib/errors';

const initialGuestSession = loadGuestSession();

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<SearchRecord[]>(initialGuestSession.history);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<JurisdictionKey>(
    initialGuestSession.selectedJurisdiction
  );
  const [selectedCategory, setSelectedCategory] = useState<PermitCategoryKey>(
    initialGuestSession.selectedCategory
  );
  const [currentRecord, setCurrentRecord] = useState<SearchRecord | null>(
    initialGuestSession.history.find((record) => record.id === initialGuestSession.currentRecordId) ||
      initialGuestSession.history[0] ||
      null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (currentUser) return;
    saveGuestSession({
      history,
      currentRecordId: currentRecord?.id || null,
      selectedJurisdiction,
      selectedCategory
    });
  }, [currentUser, history, currentRecord, selectedJurisdiction, selectedCategory]);

  useEffect(() => {
    testConnection();

    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsHistoryLoading(true);
        try {
          const userSearches = await fetchUserSearchesFromFirestore(user.id);
          setHistory(userSearches);
          setCurrentRecord(userSearches[0] || null);
        } catch (err) {
          console.error('Error loading user searches from Firestore:', err);
          setCloudError(toUserFriendlyError(err, 'history'));
        } finally {
          setIsHistoryLoading(false);
        }
      } else {
        const guest = loadGuestSession();
        setHistory(guest.history.length ? guest.history : DEFAULT_GUEST_HISTORY);
        const restored =
          guest.history.find((record) => record.id === guest.currentRecordId) ||
          guest.history[0] ||
          DEFAULT_GUEST_HISTORY[0];
        setCurrentRecord(restored);
        setSelectedJurisdiction(guest.selectedJurisdiction);
        setSelectedCategory(guest.selectedCategory);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (user: UserProfile) => {
    setCurrentUser(user);
    setIsHistoryLoading(true);
    try {
      const userSearches = await fetchUserSearchesFromFirestore(user.id);
      setHistory(userSearches);
      setCurrentRecord(userSearches[0] || null);
    } catch (err) {
      console.error('Error fetching user searches after sign-in:', err);
      setCloudError(toUserFriendlyError(err, 'history'));
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.warn('Sign-out error:', err);
    }
    setCurrentUser(null);
    const guest = loadGuestSession();
    setHistory(guest.history.length ? guest.history : DEFAULT_GUEST_HISTORY);
    setCurrentRecord(
      guest.history.find((record) => record.id === guest.currentRecordId) ||
        guest.history[0] ||
        DEFAULT_GUEST_HISTORY[0]
    );
  };

  const handleSearch = async (question: string) => {
    setSearchError(null);
    setCloudError(null);

    const validationError = validatePermitSearch({
      jurisdiction: selectedJurisdiction,
      category: selectedCategory,
      question
    });
    if (validationError) {
      setSearchError(validationError);
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSearchError('You appear to be offline. Please check your internet connection and try again.');
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

      if (currentUser) {
        try {
          await saveSearchRecordToFirestore(currentUser.id, newRecord);
        } catch (saveErr) {
          console.error('Failed to save search to Firestore:', saveErr);
          setCloudError(toUserFriendlyError(saveErr, 'history'));
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError(toUserFriendlyError(err, 'search'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (recordId: string, rating: 'helpful' | 'not_helpful', comment?: string) => {
    const timestamp = Date.now();
    const userId = currentUser ? currentUser.id : 'anonymous';

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

    try {
      await saveFeedbackToFirestore(userId, recordId, rating, timestamp);
    } catch (fireErr) {
      console.error('Cloud save failed during feedback:', fireErr);
      setCloudError(toUserFriendlyError(fireErr, 'feedback'));
    }

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
      console.warn('Server feedback sync note:', e);
    }
  };

  const handleSelectHistoryRecord = (record: SearchRecord) => {
    setCurrentRecord(record);
    setSelectedJurisdiction(record.jurisdictionKey);
    setSelectedCategory(record.categoryKey);
  };

  const handleDeleteHistoryRecord = async (recordId: string) => {
    const remaining = history.filter((r) => r.id !== recordId);
    setHistory(remaining);
    if (currentRecord?.id === recordId) {
      setCurrentRecord(remaining[0] || null);
    }
    if (currentUser) {
      try {
        await deleteSearchRecordFromFirestore(currentUser.id, recordId);
      } catch (err) {
        console.error('Failed to delete record from Firestore:', err);
        setCloudError(toUserFriendlyError(err, 'delete'));
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
          console.error('Error clearing record from Firestore:', err);
          setCloudError(toUserFriendlyError(err, 'delete'));
        }
      }
    }
  };

  const handleNewSearch = () => {
    setCurrentRecord(null);
    setSearchError(null);
  };

  const sidebarProps = {
    records: history,
    activeRecordId: currentRecord?.id || null,
    onSelectRecord: handleSelectHistoryRecord,
    onClearHistory: handleClearAllHistory,
    onDeleteRecord: handleDeleteHistoryRecord,
    currentUser,
    onNewSearch: handleNewSearch,
    isLoading: isHistoryLoading
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden font-sans text-slate-800 bg-slate-50">
      <HistorySidebar {...sidebarProps} onOpenAuth={() => setIsAuthModalOpen(true)} />

      {isMobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <HistorySidebar
            {...sidebarProps}
            onOpenAuth={() => {
              setIsMobileSidebarOpen(false);
              setIsAuthModalOpen(true);
            }}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            isMobileDrawer={true}
          />
        </>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          selectedJurisdiction={selectedJurisdiction}
          onSelectJurisdiction={setSelectedJurisdiction}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          isMobileSidebarOpen={isMobileSidebarOpen}
          isSearching={isLoading}
        />

        <div className="flex-1 p-4 sm:p-8 flex flex-col gap-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900">
            <div className="flex items-start sm:items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                <strong>PermitLens AI:</strong> Residential permit research assistant for <strong>City of Los Angeles, CA</strong> (LADBS), <strong>City of Austin, TX</strong> (DSD), and <strong>City of Seattle, WA</strong> (SDCI).
              </span>
            </div>
            <span className="hidden sm:inline text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded shrink-0">
              Verified Codes
            </span>
          </div>

          <SearchConsole
            jurisdiction={selectedJurisdiction}
            category={selectedCategory}
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          {searchError && (
            <ErrorBanner
              id="search-error-banner"
              message={searchError}
              onDismiss={() => setSearchError(null)}
            />
          )}

          {cloudError && (
            <ErrorBanner
              id="firestore-error-banner"
              message={cloudError}
              onDismiss={() => setCloudError(null)}
              tone="warning"
            />
          )}

          {isLoading && <SearchLoadingBanner />}

          <div className="flex-1 min-h-0">
            {currentRecord ? (
              <AnswerCard key={currentRecord.id} record={currentRecord} onFeedback={handleFeedback} />
            ) : (
              !isLoading && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 text-center text-slate-500 shadow-xs">
                  <p className="text-sm font-semibold text-slate-700">Ready to search permit requirements</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Type a question above or pick one of the suggested prompts to retrieve document checklists, municipal code thresholds, and official source links.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </main>

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
