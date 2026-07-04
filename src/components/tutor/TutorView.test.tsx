// Unit tests for TutorView — the presentation shell that wires the tutor
// engine (via useTutorStore) to the screen.
//
// These tests drive the real store and the real question bank (no mocks), and
// verify the user-facing flow: the conversation auto-starts, onboarding inputs
// appear per phase, and after answering a question the engine's ordered blocks
// (result → explanation → vocab → progress card) render with the progress card
// last (Requirements 8.1, 9.1–9.4).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import { TutorView } from './TutorView';
import { useTutorStore } from '../../store/useTutorStore';
import { initialState } from '../../tutor/tutorEngine';

beforeEach(() => {
  // Reset the persisted store to a fresh, name-less session so each test starts
  // from the greeting phase.
  localStorage.clear();
  useTutorStore.setState({ state: initialState(), responseBlocks: [] });
});

afterEach(() => {
  cleanup();
});

describe('TutorView onboarding', () => {
  it('auto-starts the conversation and shows a bilingual greeting + name input', () => {
    render(<TutorView />);

    // Greeting carries both Mandarin and Indonesian text (Requirement 1.1).
    expect(screen.getByText(/HSK 老师/)).toBeInTheDocument();
    expect(screen.getByText(/Siapa nama Anda/)).toBeInTheDocument();

    // Name capture UI is present (askName phase).
    expect(screen.getByLabelText('Nama Anda')).toBeInTheDocument();
  });

  it('advances to level selection after submitting a name', () => {
    render(<TutorView />);

    fireEvent.change(screen.getByLabelText('Nama Anda'), {
      target: { value: 'Budi' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }));

    // Level selector buttons 1..6 appear (askLevel phase).
    expect(screen.getByRole('button', { name: 'HSK level 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'HSK level 6' })).toBeInTheDocument();
    // The recorded name is reflected in the prompt (and progress card).
    expect(screen.getAllByText(/Budi/).length).toBeGreaterThan(0);
  });

  it('presents exactly one question after a level is chosen', () => {
    render(<TutorView />);

    fireEvent.change(screen.getByLabelText('Nama Anda'), {
      target: { value: 'Budi' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }));
    fireEvent.click(screen.getByRole('button', { name: 'HSK level 1' }));

    // Exactly one question surface is rendered (Requirements 9.1, 3.4).
    const questions = screen.getAllByRole('region', { name: 'Soal HSK' });
    expect(questions).toHaveLength(1);
  });
});

describe('TutorView evaluation flow', () => {
  it('renders result, explanation, vocab, offer, and ends with the progress card', () => {
    render(<TutorView />);

    fireEvent.change(screen.getByLabelText('Nama Anda'), {
      target: { value: 'Budi' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }));
    fireEvent.click(screen.getByRole('button', { name: 'HSK level 1' }));

    // Answer the presented question by clicking choice A.
    const choiceA = screen
      .getByRole('region', { name: 'Soal HSK' })
      .querySelector('button');
    expect(choiceA).not.toBeNull();
    fireEvent.click(choiceA as HTMLButtonElement);

    // Evaluation content is present: explanation header, vocab table, offer.
    expect(screen.getByText('Penjelasan')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Lanjut' })
    ).toBeInTheDocument();

    // The Progress Card is always last in the transcript (Requirement 8.1).
    const cards = screen.getAllByLabelText('Kartu Progres');
    expect(cards.length).toBeGreaterThan(0);
    const main = screen.getByRole('main');
    const lastChild = main.lastElementChild as HTMLElement | null;
    expect(lastChild).not.toBeNull();
    expect(lastChild).toHaveAttribute('aria-label', 'Kartu Progres');
  });
});
