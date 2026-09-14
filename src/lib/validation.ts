import { JurisdictionKey, PermitCategoryKey } from '../types';

export const QUESTION_MIN_LENGTH = 5;
export const QUESTION_MAX_LENGTH = 400;
export const FEEDBACK_COMMENT_MAX_LENGTH = 300;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 80;
export const COMPANY_MAX_LENGTH = 80;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePermitSearch(input: {
  jurisdiction?: JurisdictionKey | '';
  category?: PermitCategoryKey | '';
  question: string;
}): string | null {
  if (!input.jurisdiction) {
    return 'Please select a city before searching.';
  }
  if (!input.category) {
    return 'Please select a permit category before searching.';
  }

  const question = input.question.trim();
  if (!question) {
    return 'Please enter a permit question before searching.';
  }
  if (question.length < QUESTION_MIN_LENGTH) {
    return `Please enter at least ${QUESTION_MIN_LENGTH} characters so the search can match permit sources.`;
  }
  if (question.length > QUESTION_MAX_LENGTH) {
    return `Please shorten the question to ${QUESTION_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

export function validateFeedbackComment(comment: string): string | null {
  if (comment.length > FEEDBACK_COMMENT_MAX_LENGTH) {
    return `Please keep comments to ${FEEDBACK_COMMENT_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

export function validateSignInProfile(name: string, email: string, company?: string): string | null {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedCompany = company?.trim() || '';

  if (!trimmedName || !trimmedEmail) {
    return 'Please enter your full name and email address.';
  }
  if (trimmedName.length < NAME_MIN_LENGTH) {
    return 'Please enter a name with at least 2 characters.';
  }
  if (trimmedName.length > NAME_MAX_LENGTH) {
    return `Please shorten the name to ${NAME_MAX_LENGTH} characters or fewer.`;
  }
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return 'Please enter a valid email address (for example, name@gmail.com).';
  }
  if (trimmedCompany.length > COMPANY_MAX_LENGTH) {
    return `Please shorten the company name to ${COMPANY_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}
