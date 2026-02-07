import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the config module
vi.mock('../config', () => ({
  getCmsBaseUrl: () => 'http://localhost:3001',
  CACHE_CONFIG: {
    categories: { revalidate: 300 },
    apisList: { revalidate: 60 },
    apiDetail: { revalidate: 60 },
    facets: { revalidate: 60 },
    health: { revalidate: 60 },
  },
}))

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('backend API client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('fetchCategories', () => {
    it('should fetch categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [{ id: 1, name: 'Animals', slug: 'animals', apiCount: 10 }],
        }),
      })

      const { fetchCategories } = await import('../backend')
      const result = await fetchCategories()

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('name', 'Animals')
    })

    it('should handle empty categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ docs: [] }),
      })

      const { fetchCategories } = await import('../backend')
      const result = await fetchCategories()

      expect(result).toEqual([])
    })
  })

  describe('fetchApisList', () => {
    it('should fetch APIs with query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [{ id: 1, name: 'Test API' }],
          page: 1,
          limit: 20,
          totalDocs: 100,
          totalPages: 5,
          hasNextPage: true,
          hasPrevPage: false,
          nextPage: 2,
          prevPage: null,
        }),
      })

      const { fetchApisList } = await import('../backend')
      const result = await fetchApisList({ category: 'animals', page: '1' })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toHaveProperty('docs')
      expect(result).toHaveProperty('totalDocs')
    })
  })

  describe('fetchApiDetail', () => {
    it('should fetch single API by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          name: 'Test API',
          description: 'A test API',
          link: 'https://api.test.com',
        }),
      })

      const { fetchApiDetail } = await import('../backend')
      const result = await fetchApiDetail('123')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toHaveProperty('id', 123)
      expect(result).toHaveProperty('name', 'Test API')
    })
  })

  describe('checkBackendHealth', () => {
    it('should return healthy status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy' }),
      })

      const { checkBackendHealth } = await import('../backend')
      const result = await checkBackendHealth()

      expect(result.healthy).toBe(true)
      expect(result.latency).toBeDefined()
    })

    it('should handle unhealthy backend', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const { checkBackendHealth } = await import('../backend')
      const result = await checkBackendHealth()

      expect(result.healthy).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { checkBackendHealth } = await import('../backend')
      const result = await checkBackendHealth()

      expect(result.healthy).toBe(false)
      expect(result.error).toContain('Network error')
    })
  })
})
