import { create } from 'zustand'
import type { FinanceEntry } from '@/lib/types'

export type FinanceFormState = {
  date: string
  dueDate: string
  description: string
  type: FinanceEntry['type']
  category: string
  amount: string
  paid: boolean
}

export type FormMode = 'novo' | 'editar'

type FinanceErrors = Partial<Record<keyof FinanceFormState, string>>

type FinanceStore = {
  // Mode
  mode: FormMode
  setMode: (mode: FormMode) => void

  // New form
  newForm: FinanceFormState
  setNewForm: (form: FinanceFormState | ((current: FinanceFormState) => FinanceFormState)) => void
  newFormErrors: FinanceErrors
  setNewFormErrors: (errors: FinanceErrors) => void

  // Edit form
  editingEntry: FinanceEntry | null
  setEditingEntry: (entry: FinanceEntry | null) => void
  editForm: FinanceFormState
  setEditForm: (form: FinanceFormState | ((current: FinanceFormState) => FinanceFormState)) => void
  editFormErrors: FinanceErrors
  setEditFormErrors: (errors: FinanceErrors) => void

  // Feedback
  feedback: string | null
  feedbackType: 'success' | 'error' | null
  setFeedback: (message: string | null, type?: 'success' | 'error') => void
  clearFeedback: () => void

  // Utilities
  resetNewForm: (initial: FinanceFormState) => void
  resetEditForm: (initial: FinanceFormState) => void
}

const emptyForm = (date: string): FinanceFormState => ({
  date,
  dueDate: '',
  description: '',
  type: 'Entrada',
  category: '',
  amount: '',
  paid: true,
})

export const useFinanceStore = create<FinanceStore>((set) => {
  const currentDate = new Date().toISOString().slice(0, 10)

  return {
    mode: 'novo',
    setMode: (mode) => set({ mode }),

    newForm: emptyForm(currentDate),
    setNewForm: (form) =>
      set((state) => ({
        newForm: typeof form === 'function' ? form(state.newForm) : form,
      })),
    newFormErrors: {},
    setNewFormErrors: (errors) => set({ newFormErrors: errors }),

    editingEntry: null,
    setEditingEntry: (entry) => set({ editingEntry: entry }),
    editForm: emptyForm(currentDate),
    setEditForm: (form) =>
      set((state) => ({
        editForm: typeof form === 'function' ? form(state.editForm) : form,
      })),
    editFormErrors: {},
    setEditFormErrors: (errors) => set({ editFormErrors: errors }),

    feedback: null,
    feedbackType: null,
    setFeedback: (message, type = 'error') =>
      set({ feedback: message, feedbackType: type }),
    clearFeedback: () => set({ feedback: null, feedbackType: null }),

    resetNewForm: (initial) =>
      set({ newForm: initial, newFormErrors: {}, feedback: null, feedbackType: null }),
    resetEditForm: (initial) =>
      set({ editForm: initial, editFormErrors: {}, feedback: null, feedbackType: null }),
  }
})
