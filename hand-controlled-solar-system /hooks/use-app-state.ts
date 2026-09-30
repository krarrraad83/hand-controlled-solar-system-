'use client'

import { useSyncExternalStore } from 'react'
import { getAppState, getServerAppState, subscribeAppState, type AppState } from '@/lib/store'

export function useAppState<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(
    subscribeAppState,
    () => selector(getAppState()),
    () => selector(getServerAppState()),
  )
}
