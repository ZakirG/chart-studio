import { validateSqlQuery } from './sql-validation'

describe('SQL Validation', () => {
  test('allows single SELECT statement', () => {
    const sql = 'SELECT * FROM customers'
    const errors = validateSqlQuery(sql)
    expect(errors).toHaveLength(0)
  })

  test('allows multiple SELECT statements', () => {
    const sql = `
      SELECT * FROM customers;
      SELECT * FROM orders;
      SELECT COUNT(*) FROM deals;
    `
    const errors = validateSqlQuery(sql)
    expect(errors).toHaveLength(0)
  })

  test('allows CTE queries', () => {
    const sql = 'WITH cte AS (SELECT * FROM customers) SELECT * FROM cte'
    const errors = validateSqlQuery(sql)
    expect(errors).toHaveLength(0)
  })

  test('allows comments in queries', () => {
    const sql = `
      -- Get all customers
      SELECT * FROM customers;
      -- Get customer count
      SELECT COUNT(*) FROM customers;
    `
    const errors = validateSqlQuery(sql)
    expect(errors).toHaveLength(0)
  })

  test('rejects dangerous DDL statements', () => {
    const sql = 'DROP TABLE customers'
    const errors = validateSqlQuery(sql)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toContain('Only SELECT queries and CTEs')
  })

  test('rejects dangerous DML statements', () => {
    const sql = 'DELETE FROM customers WHERE id = 1'
    const errors = validateSqlQuery(sql)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toContain('Only SELECT queries and CTEs')
  })

  test('rejects mixed safe and dangerous statements', () => {
    const sql = `
      SELECT * FROM customers;
      DROP TABLE orders;
    `
    const errors = validateSqlQuery(sql)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toContain('Statement 2')
  })

  test('handles empty statements gracefully', () => {
    const sql = `
      SELECT * FROM customers;
      ;
      SELECT * FROM orders;
    `
    const errors = validateSqlQuery(sql)
    expect(errors).toHaveLength(0)
  })

  test('validates each statement independently', () => {
    const sql = `
      SELECT * FROM customers;
      INSERT INTO customers VALUES (1, 'test');
      SELECT * FROM orders;
    `
    const errors = validateSqlQuery(sql)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(error => error.message.includes('Statement 2'))).toBe(true)
  })
})
