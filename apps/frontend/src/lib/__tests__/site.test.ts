import { describe, it, expect } from 'vitest'
import { getSiteUrl, getSiteName, getSiteDomain, SITE_NAME, SITE_DOMAIN, SITE_DESCRIPTION } from '../site'

describe('site utilities', () => {
  describe('constants', () => {
    it('should have SITE_NAME defined', () => {
      expect(SITE_NAME).toBe('Public API')
    })

    it('should have SITE_DOMAIN defined', () => {
      expect(SITE_DOMAIN).toBe('public-api.org')
    })

    it('should have SITE_DESCRIPTION defined', () => {
      expect(SITE_DESCRIPTION).toBeTruthy()
      expect(SITE_DESCRIPTION.length).toBeGreaterThan(50)
    })
  })

  describe('getSiteUrl', () => {
    it('should return site URL', () => {
      const url = getSiteUrl()
      expect(url).toBeTruthy()
      expect(url.startsWith('http')).toBe(true)
    })

    it('should not have trailing slash', () => {
      const url = getSiteUrl()
      expect(url.endsWith('/')).toBe(false)
    })

    it('should use SITE_DOMAIN when env not set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SITE_URL
      delete process.env.NEXT_PUBLIC_SITE_URL

      const url = getSiteUrl()
      expect(url).toContain(SITE_DOMAIN)

      process.env.NEXT_PUBLIC_SITE_URL = originalEnv
    })
  })

  describe('getSiteName', () => {
    it('should return site name', () => {
      const name = getSiteName()
      expect(name).toBe(SITE_NAME)
    })
  })

  describe('getSiteDomain', () => {
    it('should return site domain', () => {
      const domain = getSiteDomain()
      expect(domain).toBe(SITE_DOMAIN)
    })
  })
})
