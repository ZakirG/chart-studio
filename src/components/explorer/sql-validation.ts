export interface ValidationError {
  message: string
  line?: number
  column?: number
  severity: 'error' | 'warning'
}

export function validateSqlQuery(sql: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!sql.trim()) {
    return errors
  }
  
  // Remove comments and empty lines to get the actual SQL content
  const sqlWithoutComments = sql
    .split('\n')
    .map(line => {
      // Remove line comments (-- comment)
      const commentIndex = line.indexOf('--')
      if (commentIndex >= 0) {
        return line.substring(0, commentIndex).trim()
      }
      return line.trim()
    })
    .filter(line => line.length > 0) // Remove empty lines
    .join(' ')
    .trim()
  
  // If there's no actual SQL content after removing comments, don't validate
  if (!sqlWithoutComments) {
    return errors
  }

  // Check each statement individually - allow multiple SELECT/WITH statements
  const statements = sql.split(';').filter(s => s.trim())
  
  statements.forEach((statement, index) => {
    const cleanStatement = statement
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('--')
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex).trim()
        }
        return line.trim()
      })
      .filter(line => line.length > 0)
      .join(' ')
      .trim()
    
    if (!cleanStatement) return // Skip empty statements
    
    const trimmedStatement = cleanStatement.toUpperCase()
    const allowedStarts = ['SELECT', 'WITH']
    const startsWithAllowed = allowedStarts.some(start => trimmedStatement.startsWith(start))

    if (!startsWithAllowed) {
      errors.push({
        message: `Statement ${index + 1}: Only SELECT queries and CTEs (WITH) are allowed. DDL/DML operations are forbidden.`,
        severity: 'error'
      })
    }
  })
  
  // Check for potentially dangerous keywords in the actual SQL content
  const dangerousKeywords = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'CREATE', 'ALTER', 'TRUNCATE',
    'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL'
  ]
  
  dangerousKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(sqlWithoutComments)) {
      errors.push({
        message: `${keyword} statements are not allowed in the SQL editor.`,
        severity: 'error'
      })
    }
  })

  return errors
}
