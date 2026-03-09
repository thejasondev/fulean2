import { atom, computed } from "nanostores";

// ============================================
// Onboarding Store
// Tracks first-visit status and tour progress
// ============================================

const STORAGE_KEY = "fulean2_onboarding";

interface OnboardingState {
  hasCompletedTour: boolean;
  tourStep: number;
  isTourActive: boolean;
}

const defaultState: OnboardingState = {
  hasCompletedTour: false,
  tourStep: 0,
  isTourActive: false,
};

// Load from localStorage
function loadState(): OnboardingState {
  if (typeof window === "undefined") return { ...defaultState };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultState, ...parsed, isTourActive: false, tourStep: 0 };
    }
  } catch {
    // Ignore
  }
  return { ...defaultState };
}

// Save to localStorage
function saveState(state: Partial<OnboardingState>) {
  if (typeof localStorage === "undefined") return;
  try {
    const current = loadState();
    const updated = { ...current, ...state };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        hasCompletedTour: updated.hasCompletedTour,
      }),
    );
  } catch {
    // Ignore
  }
}

// Atoms
export const $hasCompletedTour = atom<boolean>(loadState().hasCompletedTour);
export const $tourStep = atom<number>(0);
export const $isTourActive = atom<boolean>(false);

// Tour step definitions
export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "rates",
    target: "[data-tour='rates']",
    title: "📊 Tasas de Cambio",
    description:
      "Aquí monitoreas tus tasas de compra y venta. Toca cada tarjeta para configurar tus propias tasas contra el mercado.",
    position: "bottom",
  },
  {
    id: "quick-trade",
    target: "[data-tour='quick-trade']",
    title: "⚡ Sistema Touch POS",
    description:
      "Activa el Modo Rápido para registrar transacciones con solo 2 toques ágiles. Precalcula tus CUP sin usar el teclado.",
    position: "bottom",
  },
  {
    id: "operar",
    target: "[data-tour='operar']",
    title: "💱 Movimientos Limpios",
    description:
      "Registra ventas, compras e intercambios. Cada registro actualiza automáticamente tu capital e inventario general.",
    position: "top",
  },
  {
    id: "contar",
    target: "[data-tour='contar']",
    title: "💵 Contador de Efectivo",
    description:
      "Agiliza fardos de billetes agrupándolos rápido con el toque 'Fajo'. Toca 'Compartir' para enviar el desglose detallado.",
    position: "top",
  },
  {
    id: "reportes",
    target: "[data-tour='reportes']",
    title: "📈 Control y Cierre",
    description:
      "Supervisa tus ganancias, audita tu almacén general monetario y extrae tu Ticket de Cierre con el nuevo visualizador.",
    position: "top",
  },
];

// Computed
export const $currentTourStep = computed([$tourStep], (step) => {
  return TOUR_STEPS[step] || null;
});

export const $isLastStep = computed([$tourStep], (step) => {
  return step >= TOUR_STEPS.length - 1;
});

// Actions
export function startTour() {
  $tourStep.set(0);
  $isTourActive.set(true);
}

export function nextTourStep() {
  const current = $tourStep.get();
  if (current < TOUR_STEPS.length - 1) {
    $tourStep.set(current + 1);
  } else {
    completeTour();
  }
}

export function prevTourStep() {
  const current = $tourStep.get();
  if (current > 0) {
    $tourStep.set(current - 1);
  }
}

export function skipTour() {
  $isTourActive.set(false);
  $tourStep.set(0);
  $hasCompletedTour.set(true);
  saveState({ hasCompletedTour: true });
}

export function completeTour() {
  $isTourActive.set(false);
  $tourStep.set(0);
  $hasCompletedTour.set(true);
  saveState({ hasCompletedTour: true });
}

export function resetTour() {
  $hasCompletedTour.set(false);
  saveState({ hasCompletedTour: false });
}

// Check if should show tour on first visit
export function checkFirstVisit(): boolean {
  const state = loadState();
  return !state.hasCompletedTour;
}
