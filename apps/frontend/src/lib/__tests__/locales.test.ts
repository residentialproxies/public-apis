import { describe, it, expect } from 'vitest'
import {
  toOpenGraphLocale,
  toBcp47Locale,
  getFallbackLocale,
  generateHreflangUrls,
  toLocalizedPath,
  toLocalizedUrl,
} from '../locales'

describe('locales utilities', () => {
  describe('toOpenGraphLocale', () => {
    it('should convert en to en_US', () => {
      expect(toOpenGraphLocale('en')).toBe('en_US')
    })

    it('should convert zh to zh_CN', () => {
      expect(toOpenGraphLocale('zh')).toBe('zh_CN')
    })

    it('should convert ja to ja_JP', () => {
      expect(toOpenGraphLocale('ja')).toBe('ja_JP')
    })

    it('should convert es to es_ES', () => {
      expect(toOpenGraphLocale('es')).toBe('es_ES')
    })

    it('should convert pt-BR to pt_BR', () => {
      expect(toOpenGraphLocale('pt-BR')).toBe('pt_BR')
    })

    it('should convert de to de_DE', () => {
      expect(toOpenGraphLocale('de')).toBe('de_DE')
    })
  })

  describe('toBcp47Locale', () => {
    it('should convert en to en-US', () => {
      expect(toBcp47Locale('en')).toBe('en-US')
    })

    it('should convert zh to zh-CN', () => {
      expect(toBcp47Locale('zh')).toBe('zh-CN')
    })

    it('should convert ja to ja-JP', () => {
      expect(toBcp47Locale('ja')).toBe('ja-JP')
    })

    it('should keep pt-BR as pt-BR', () => {
      expect(toBcp47Locale('pt-BR')).toBe('pt-BR')
    })
  })

  describe('getFallbackLocale', () => {
    it('should return en_US as fallback', () => {
      expect(getFallbackLocale()).toBe('en_US')
    })
  })

  describe('generateHreflangUrls', () => {
    it('should generate URLs for all supported locales', () => {
      const urls = generateHreflangUrls('/catalog', 'https://example.com')

      expect(urls['en']).toBe('https://example.com/catalog')
      expect(urls['zh']).toBe('https://example.com/zh/catalog')
      expect(urls['ja']).toBe('https://example.com/ja/catalog')
      expect(urls['es']).toBe('https://example.com/es/catalog')
      expect(urls['pt-BR']).toBe('https://example.com/pt-BR/catalog')
      expect(urls['de']).toBe('https://example.com/de/catalog')
    })

    it('should include x-default pointing to English', () => {
      const urls = generateHreflangUrls('/catalog', 'https://example.com')

      expect(urls['x-default']).toBe('https://example.com/catalog')
    })

    it('should handle root path', () => {
      const urls = generateHreflangUrls('', 'https://example.com')

      expect(urls['en']).toBe('https://example.com/')
      expect(urls['zh']).toBe('https://example.com/zh')
    })

    it('should handle complex paths', () => {
      const urls = generateHreflangUrls('/api/123/example-api', 'https://example.com')

      expect(urls['en']).toBe('https://example.com/api/123/example-api')
      expect(urls['zh']).toBe('https://example.com/zh/api/123/example-api')
    })
  })

  describe('toLocalizedPath', () => {
    it('should omit prefix for default locale', () => {
      expect(toLocalizedPath('/catalog', 'en')).toBe('/catalog')
      expect(toLocalizedPath('/', 'en')).toBe('/')
    })

    it('should add prefix for non-default locale', () => {
      expect(toLocalizedPath('/catalog', 'zh')).toBe('/zh/catalog')
      expect(toLocalizedPath('/', 'zh')).toBe('/zh')
    })

    it('should normalize missing leading slash and trailing slash', () => {
      expect(toLocalizedPath('catalog/', 'en')).toBe('/catalog')
      expect(toLocalizedPath('catalog/', 'de')).toBe('/de/catalog')
    })
  })

  describe('toLocalizedUrl', () => {
    it('should build locale-aware absolute URLs', () => {
      expect(toLocalizedUrl('https://example.com', '/about', 'en')).toBe(
        'https://example.com/about',
      )
      expect(toLocalizedUrl('https://example.com', '/about', 'ja')).toBe(
        'https://example.com/ja/about',
      )
    })

    it('should handle trailing slash in siteUrl', () => {
      expect(toLocalizedUrl('https://example.com/', '/search', 'en')).toBe(
        'https://example.com/search',
      )
    })
  })
})
