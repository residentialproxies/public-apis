import { describe, it, expect, vi } from 'vitest'
import { slugify } from '../slugify'

describe('slugify', () => {
  it('should convert text to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('API Navigator')).toBe('api-navigator')
  })

  it('should replace spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world')
    expect(slugify('multiple   spaces')).toBe('multiple-spaces')
  })

  it('should remove special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
    expect(slugify('Test & Example')).toBe('test-example')
  })

  it('should handle numbers', () => {
    expect(slugify('API v2')).toBe('api-v2')
    expect(slugify('123 Test')).toBe('123-test')
  })

  it('should trim whitespace', () => {
    expect(slugify('  hello world  ')).toBe('hello-world')
  })

  it('should handle empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('should not start or end with hyphen', () => {
    const result = slugify('-hello-')
    expect(result.startsWith('-')).toBe(false)
    expect(result.endsWith('-')).toBe(false)
  })
})
