'use client'

import { useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { autocompletion } from '@codemirror/autocomplete'
import { EditorView } from '@codemirror/view'
import { createSqlCompletionSource, SchemaMetadata } from './sql-autocomplete'

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  schema?: SchemaMetadata
  placeholder?: string
  readOnly?: boolean
}

const STORAGE_KEY = 'sql-editor-content'

export function SqlEditor({ 
  value, 
  onChange, 
  schema, 
  placeholder = "-- Write your SQL query here\nSELECT * FROM customers LIMIT 10;",
  readOnly = false 
}: SqlEditorProps) {
  // Load content from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedContent = localStorage.getItem(STORAGE_KEY)
        if (savedContent && savedContent !== value) {
          onChange(savedContent)
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

  // Create extensions for CodeMirror
  const extensions = [
    sql(),
    EditorView.theme({
      '&': {
        fontSize: '14px',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
      },
      '.cm-content': {
        minHeight: '200px',
        padding: '12px'
      },
      '.cm-focused': {
        outline: 'none'
      },
      '.cm-editor': {
        border: '1px solid #e5e7eb',
        borderRadius: '6px'
      },
      '.cm-editor.cm-focused': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 1px #3b82f6'
      },
      '.cm-completionIcon': {
        paddingRight: '0.5em'
      },
      '.cm-completionIcon-keyword:after': {
        content: '"K"',
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#7c3aed'
      },
      '.cm-completionIcon-variable:after': {
        content: '"T"',
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#059669'
      },
      '.cm-completionIcon-property:after': {
        content: '"C"',
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#dc2626'
      }
    })
  ]

  // Add autocomplete if schema is available
  if (schema) {
    extensions.push(
      autocompletion({
        override: [createSqlCompletionSource(schema)],
        activateOnTyping: true,
        maxRenderedOptions: 20,
        optionClass: () => 'cm-completion-option',
        compareCompletions: (a, b) => {
          // Prioritize exact matches, then column names, then keywords
          const aIsKeyword = a.type === 'keyword'
          const bIsKeyword = b.type === 'keyword'
          if (aIsKeyword && !bIsKeyword) return 1
          if (!aIsKeyword && bIsKeyword) return -1
          return a.label.localeCompare(b.label)
        }
      })
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor */}
      <div className="flex-1 min-h-0">
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={extensions}
          placeholder={placeholder}
          editable={!readOnly}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: false,
            searchKeymap: true
          }}
        />
      </div>
    </div>
  )
}
