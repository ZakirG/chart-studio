/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { useState, useEffect } from 'react'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

const STORAGE_KEY = 'sql-editor-content'

// Simplified version of the SqlEditor localStorage logic
function useSqlEditorPersistence(initialValue: string) {
  const [value, setValue] = useState(initialValue)

  // Load content from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedContent = localStorage.getItem(STORAGE_KEY)
        if (savedContent && savedContent !== value) {
          setValue(savedContent)
        }
      } catch (error) {
        // localStorage might not be available or might be full
        console.warn('Failed to load from localStorage:', error)
      }
    }
  }, []) // Only run on mount

  // Save to localStorage when value changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage && value) {
      try {
        localStorage.setItem(STORAGE_KEY, value)
      } catch (error) {
        // localStorage might not be available or might be full
        console.warn('Failed to save to localStorage:', error)
      }
    }
  }, [value])

  return [value, setValue] as const
}

describe('SQL Editor localStorage Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  test('loads content from localStorage on initialization', () => {
    const savedQuery = 'SELECT * FROM saved_query;'
    localStorageMock.setItem(STORAGE_KEY, savedQuery)

    const { result } = renderHook(() => 
      useSqlEditorPersistence('-- Initial query')
    )

    expect(result.current[0]).toBe(savedQuery)
    expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY)
  })

  test('saves content to localStorage when value changes', () => {
    const { result } = renderHook(() => 
      useSqlEditorPersistence('-- Initial query')
    )

    const newQuery = 'SELECT * FROM customers WHERE active = 1;'

    act(() => {
      result.current[1](newQuery)
    })

    expect(result.current[0]).toBe(newQuery)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, newQuery)
  })

  test('does not save empty content to localStorage', () => {
    const { result } = renderHook(() => 
      useSqlEditorPersistence('-- Initial query')
    )

    act(() => {
      result.current[1]('')
    })

    expect(result.current[0]).toBe('')
    // setItem should not be called for empty content
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith(STORAGE_KEY, '')
  })

  test('handles localStorage not being available gracefully', () => {
    // Temporarily remove localStorage
    const originalLocalStorage = window.localStorage
    // @ts-ignore
    delete window.localStorage

    const { result } = renderHook(() => 
      useSqlEditorPersistence('-- Initial query')
    )

    act(() => {
      result.current[1]('SELECT * FROM test;')
    })

    // Should not throw an error
    expect(result.current[0]).toBe('SELECT * FROM test;')

    // Restore localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
    })
  })

  test('persists content across multiple hook instances', () => {
    const query1 = 'SELECT * FROM customers;'
    
    // First instance saves content
    const { result: result1 } = renderHook(() => 
      useSqlEditorPersistence('-- Initial')
    )

    act(() => {
      result1.current[1](query1)
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, query1)

    // Second instance loads the saved content
    const { result: result2 } = renderHook(() => 
      useSqlEditorPersistence('-- Different initial')
    )

    expect(result2.current[0]).toBe(query1)
  })
})
