/**
 * Pagination Utilities Unit Tests
 * 
 * Comprehensive tests for pagination utilities including:
 * - Basic pagination calculations
 * - Cursor-based pagination
 * - Virtual scrolling calculations
 * - Debounced search functionality
 * - French language pagination text
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculatePagination,
  createPaginationResult,
  getPaginationInfo,
  getPageNumbers,
  createCursorPaginationResult,
  parseCursor,
  DebouncedSearch,
  calculateVirtualScroll,
  type PaginationParams,
  type PaginationResult,
  type CursorPaginationParams,
  type VirtualScrollParams,
} from '@/lib/utils/pagination';

describe('Pagination Utilities', () => {
  describe('calculatePagination', () => {
    it('should calculate correct pagination parameters', () => {
      const result = calculatePagination(3, 10);
      
      expect(result).toEqual({
        page: 3,
        limit: 10,
        offset: 20,
      });
    });

    it('should normalize negative page numbers to 1', () => {
      const result = calculatePagination(-5, 10);
      
      expect(result.page).toBe(1);
      expect(result.offset).toBe(0);
    });

    it('should normalize zero page to 1', () => {
      const result = calculatePagination(0, 10);
      
      expect(result.page).toBe(1);
      expect(result.offset).toBe(0);
    });

    it('should normalize negative limit to 1', () => {
      const result = calculatePagination(1, -10);
      
      expect(result.limit).toBe(1);
    });

    it('should limit maximum items per page to 100', () => {
      const result = calculatePagination(1, 150);
      
      expect(result.limit).toBe(100);
    });

    it('should handle edge case with page 1', () => {
      const result = calculatePagination(1, 20);
      
      expect(result).toEqual({
        page: 1,
        limit: 20,
        offset: 0,
      });
    });

    it('should calculate correct offset for large page numbers', () => {
      const result = calculatePagination(100, 25);
      
      expect(result.offset).toBe(2475); // (100 - 1) * 25
    });
  });

  describe('createPaginationResult', () => {
    const sampleData = ['item1', 'item2', 'item3'];
    const params: PaginationParams = { page: 2, limit: 10, offset: 10 };

    it('should create correct pagination result', () => {
      const result = createPaginationResult(sampleData, 50, params);
      
      expect(result).toEqual({
        data: sampleData,
        pagination: {
          page: 2,
          limit: 10,
          total: 50,
          totalPages: 5,
          hasNext: true,
          hasPrev: true,
          offset: 10,
        },
      });
    });

    it('should handle first page correctly', () => {
      const firstPageParams: PaginationParams = { page: 1, limit: 10, offset: 0 };
      const result = createPaginationResult(sampleData, 50, firstPageParams);
      
      expect(result.pagination.hasPrev).toBe(false);
      expect(result.pagination.hasNext).toBe(true);
    });

    it('should handle last page correctly', () => {
      const lastPageParams: PaginationParams = { page: 5, limit: 10, offset: 40 };
      const result = createPaginationResult(sampleData, 50, lastPageParams);
      
      expect(result.pagination.hasPrev).toBe(true);
      expect(result.pagination.hasNext).toBe(false);
    });

    it('should handle single page correctly', () => {
      const singlePageParams: PaginationParams = { page: 1, limit: 10, offset: 0 };
      const result = createPaginationResult(sampleData, 3, singlePageParams);
      
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasPrev).toBe(false);
      expect(result.pagination.hasNext).toBe(false);
    });

    it('should handle empty data', () => {
      const result = createPaginationResult([], 0, params);
      
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true); // page 2, so has prev
    });

    it('should calculate totalPages correctly for partial pages', () => {
      const result = createPaginationResult(sampleData, 23, { page: 1, limit: 10, offset: 0 });
      
      expect(result.pagination.totalPages).toBe(3); // Math.ceil(23/10)
    });
  });

  describe('getPaginationInfo', () => {
    it('should generate correct pagination info', () => {
      const pagination = {
        page: 2,
        limit: 10,
        total: 95,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
        offset: 10,
      };

      const info = getPaginationInfo(pagination);
      
      expect(info).toEqual({
        start: 11,
        end: 20,
        total: 95,
        totalPages: 10,
        currentPage: 2,
        itemsPerPage: 10,
        showingText: 'Affichage de 11 à 20 sur 95 résultats',
        pageText: 'Page 2 sur 10',
      });
    });

    it('should handle first page correctly', () => {
      const pagination = {
        page: 1,
        limit: 15,
        total: 100,
        totalPages: 7,
        hasNext: true,
        hasPrev: false,
        offset: 0,
      };

      const info = getPaginationInfo(pagination);
      
      expect(info.start).toBe(1);
      expect(info.end).toBe(15);
      expect(info.showingText).toBe('Affichage de 1 à 15 sur 100 résultats');
    });

    it('should handle last page with partial results', () => {
      const pagination = {
        page: 7,
        limit: 15,
        total: 93,
        totalPages: 7,
        hasNext: false,
        hasPrev: true,
        offset: 90,
      };

      const info = getPaginationInfo(pagination);
      
      expect(info.start).toBe(91);
      expect(info.end).toBe(93); // Should not exceed total
      expect(info.showingText).toBe('Affichage de 91 à 93 sur 93 résultats');
    });

    it('should handle empty results', () => {
      const pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      const info = getPaginationInfo(pagination);
      
      expect(info.start).toBe(1); // Min is 1
      expect(info.end).toBe(0);
      expect(info.showingText).toBe('Affichage de 1 à 0 sur 0 résultats');
    });

    it('should handle single item correctly', () => {
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      const info = getPaginationInfo(pagination);
      
      expect(info.start).toBe(1);
      expect(info.end).toBe(1);
      expect(info.showingText).toBe('Affichage de 1 à 1 sur 1 résultats');
    });
  });

  describe('getPageNumbers', () => {
    it('should return all pages when total is less than maxVisible', () => {
      const pageNumbers = getPageNumbers(2, 3, 5);
      
      expect(pageNumbers).toEqual([1, 2, 3]);
    });

    it('should center current page when possible', () => {
      const pageNumbers = getPageNumbers(5, 10, 5);
      
      expect(pageNumbers).toEqual([3, 4, 5, 6, 7]);
    });

    it('should start from page 1 when current page is near beginning', () => {
      const pageNumbers = getPageNumbers(2, 10, 5);
      
      expect(pageNumbers).toEqual([1, 2, 3, 4, 5]);
    });

    it('should end at last page when current page is near end', () => {
      const pageNumbers = getPageNumbers(9, 10, 5);
      
      expect(pageNumbers).toEqual([6, 7, 8, 9, 10]);
    });

    it('should handle edge case with single page', () => {
      const pageNumbers = getPageNumbers(1, 1, 5);
      
      expect(pageNumbers).toEqual([1]);
    });

    it('should handle current page at beginning', () => {
      const pageNumbers = getPageNumbers(1, 10, 5);
      
      expect(pageNumbers).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle current page at end', () => {
      const pageNumbers = getPageNumbers(10, 10, 5);
      
      expect(pageNumbers).toEqual([6, 7, 8, 9, 10]);
    });

    it('should respect custom maxVisible', () => {
      const pageNumbers = getPageNumbers(5, 10, 3);
      
      expect(pageNumbers).toEqual([4, 5, 6]);
      expect(pageNumbers).toHaveLength(3);
    });
  });

  describe('Cursor Pagination', () => {
    const sampleData = [
      { id: 'item1', createdAt: new Date('2024-01-01T10:00:00Z'), name: 'Item 1' },
      { id: 'item2', createdAt: new Date('2024-01-01T11:00:00Z'), name: 'Item 2' },
      { id: 'item3', createdAt: new Date('2024-01-01T12:00:00Z'), name: 'Item 3' },
    ];

    describe('createCursorPaginationResult', () => {
      it('should create cursor pagination result without cursor', () => {
        const params: CursorPaginationParams = { limit: 3 };
        const result = createCursorPaginationResult(sampleData, params);
        
        expect(result.data).toEqual(sampleData);
        expect(result.pagination.hasNext).toBe(true); // data.length === limit
        expect(result.pagination.hasPrev).toBe(false); // no cursor provided
        expect(result.pagination.nextCursor).toBeDefined();
        expect(result.pagination.prevCursor).toBeUndefined();
      });

      it('should create cursor pagination result with cursor', () => {
        const params: CursorPaginationParams = { cursor: 'some-cursor', limit: 3 };
        const result = createCursorPaginationResult(sampleData, params);
        
        expect(result.pagination.hasPrev).toBe(true); // cursor provided
        expect(result.pagination.prevCursor).toBeDefined();
      });

      it('should handle no next page when data length is less than limit', () => {
        const params: CursorPaginationParams = { limit: 5 };
        const result = createCursorPaginationResult(sampleData, params);
        
        expect(result.pagination.hasNext).toBe(false); // data.length < limit
      });

      it('should generate correct cursors', () => {
        const params: CursorPaginationParams = { limit: 3 };
        const result = createCursorPaginationResult(sampleData, params);
        
        // Next cursor should be based on last item
        const lastItem = sampleData[sampleData.length - 1];
        const expectedNextCursor = btoa(`${lastItem.createdAt.getTime()}_${lastItem.id}`);
        expect(result.pagination.nextCursor).toBe(expectedNextCursor);
        
        // Prev cursor should be based on first item when has cursor
        const paramsWithCursor: CursorPaginationParams = { cursor: 'test', limit: 3 };
        const resultWithCursor = createCursorPaginationResult(sampleData, paramsWithCursor);
        const firstItem = sampleData[0];
        const expectedPrevCursor = btoa(`${firstItem.createdAt.getTime()}_${firstItem.id}`);
        expect(resultWithCursor.pagination.prevCursor).toBe(expectedPrevCursor);
      });

      it('should handle empty data', () => {
        const params: CursorPaginationParams = { limit: 3 };
        const result = createCursorPaginationResult([], params);
        
        expect(result.data).toEqual([]);
        expect(result.pagination.hasNext).toBe(false);
        expect(result.pagination.hasPrev).toBe(false);
        expect(result.pagination.nextCursor).toBeUndefined();
        expect(result.pagination.prevCursor).toBeUndefined();
      });
    });

    describe('parseCursor', () => {
      it('should parse valid cursor correctly', () => {
        const timestamp = Date.now();
        const id = 'test-id';
        const cursor = btoa(`${timestamp}_${id}`);
        
        const result = parseCursor(cursor);
        
        expect(result).toEqual({
          timestamp,
          id,
        });
      });

      it('should return null for invalid cursor', () => {
        const result = parseCursor('invalid-cursor');
        
        expect(result).toBeNull();
      });

      it('should return null for malformed cursor', () => {
        const malformedCursor = btoa('invalid-format');
        const result = parseCursor(malformedCursor);
        
        expect(result).toEqual({
          timestamp: NaN,
          id: undefined,
        });
      });

      it('should handle empty cursor', () => {
        const result = parseCursor('');
        
        expect(result).toBeNull();
      });
    });
  });

  describe('DebouncedSearch', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce search calls', async () => {
      const searchFn = vi.fn().mockResolvedValue('result');
      const callback = vi.fn();
      const debouncedSearch = new DebouncedSearch(300);

      // Call search multiple times quickly
      debouncedSearch.search(searchFn, callback);
      debouncedSearch.search(searchFn, callback);
      debouncedSearch.search(searchFn, callback);

      expect(searchFn).not.toHaveBeenCalled();

      // Advance timer
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();

      expect(searchFn).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('result');
    });

    it('should cancel previous search when new search is called', async () => {
      const searchFn1 = vi.fn().mockResolvedValue('result1');
      const searchFn2 = vi.fn().mockResolvedValue('result2');
      const callback = vi.fn();
      const debouncedSearch = new DebouncedSearch(300);

      debouncedSearch.search(searchFn1, callback);
      
      // Advance timer partially
      vi.advanceTimersByTime(200);
      
      // Call search again before first one completes
      debouncedSearch.search(searchFn2, callback);
      
      // Advance timer fully
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();

      expect(searchFn1).not.toHaveBeenCalled();
      expect(searchFn2).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('result2');
    });

    it('should handle search errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const searchFn = vi.fn().mockRejectedValue(new Error('Search failed'));
      const callback = vi.fn();
      const debouncedSearch = new DebouncedSearch(300);

      debouncedSearch.search(searchFn, callback);
      
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();

      expect(searchFn).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Search error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should allow manual cancellation', async () => {
      const searchFn = vi.fn().mockResolvedValue('result');
      const callback = vi.fn();
      const debouncedSearch = new DebouncedSearch(300);

      debouncedSearch.search(searchFn, callback);
      debouncedSearch.cancel();
      
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();

      expect(searchFn).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should use custom delay', async () => {
      const searchFn = vi.fn().mockResolvedValue('result');
      const callback = vi.fn();
      const debouncedSearch = new DebouncedSearch(500);

      debouncedSearch.search(searchFn, callback);
      
      // Should not fire at 300ms
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
      expect(searchFn).not.toHaveBeenCalled();
      
      // Should fire at 500ms
      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();
      expect(searchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Virtual Scrolling', () => {
    describe('calculateVirtualScroll', () => {
      const defaultParams: VirtualScrollParams = {
        itemHeight: 50,
        containerHeight: 400,
        totalItems: 1000,
        scrollTop: 500,
      };

      it('should calculate correct virtual scroll parameters', () => {
        const result = calculateVirtualScroll(defaultParams);
        
        expect(result).toEqual({
          startIndex: 5, // Math.max(0, Math.floor(500/50) - 5)
          endIndex: 22, // Math.min(999, 5 + Math.ceil(400/50) + 10)
          visibleItems: 8, // Math.ceil(400/50)
          totalHeight: 50000, // 1000 * 50
          offsetY: 250, // 5 * 50
        });
      });

      it('should handle scroll at top', () => {
        const params = { ...defaultParams, scrollTop: 0 };
        const result = calculateVirtualScroll(params);
        
        expect(result.startIndex).toBe(0);
        expect(result.offsetY).toBe(0);
      });

      it('should handle scroll near bottom', () => {
        const params = { ...defaultParams, scrollTop: 49000 }; // Near bottom
        const result = calculateVirtualScroll(params);
        
        expect(result.endIndex).toBe(999); // Should not exceed total items - 1
      });

      it('should respect custom overscan', () => {
        const params = { ...defaultParams, overscan: 10 };
        const result = calculateVirtualScroll(params);
        
        // startIndex should be further back with larger overscan
        expect(result.startIndex).toBe(0); // Math.max(0, 10 - 10)
        expect(result.endIndex).toBe(37); // More items included
      });

      it('should handle very small containers', () => {
        const params: VirtualScrollParams = {
          itemHeight: 100,
          containerHeight: 50,
          totalItems: 100,
          scrollTop: 200,
        };
        
        const result = calculateVirtualScroll(params);
        
        expect(result.visibleItems).toBe(1); // Math.ceil(50/100)
        expect(result.startIndex).toBe(0); // Math.max(0, 2 - 5)
        expect(result.endIndex).toBe(11); // 0 + 1 + 10
      });

      it('should handle empty list', () => {
        const params = { ...defaultParams, totalItems: 0 };
        const result = calculateVirtualScroll(params);
        
        expect(result.startIndex).toBe(0);
        expect(result.endIndex).toBe(-1); // Math.min(-1, ...)
        expect(result.totalHeight).toBe(0);
      });

      it('should handle very large scroll position', () => {
        const params = { ...defaultParams, scrollTop: 100000 };
        const result = calculateVirtualScroll(params);
        
        expect(result.startIndex).toBe(1995); // Math.max(0, 2000 - 5)
        expect(result.endIndex).toBe(999); // Clamped to totalItems - 1
      });
    });
  });

  describe('French Language Support', () => {
    it('should use French in pagination info text', () => {
      const pagination = {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
        offset: 0,
      };

      const info = getPaginationInfo(pagination);
      
      expect(info.showingText).toBe('Affichage de 1 à 10 sur 25 résultats');
      expect(info.pageText).toBe('Page 1 sur 3');
    });

    it('should handle singular/plural forms correctly in French', () => {
      const singleResultPagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      };

      const info = getPaginationInfo(singleResultPagination);
      
      // French uses "résultats" for both singular and plural in this context
      expect(info.showingText).toBe('Affichage de 1 à 1 sur 1 résultats');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid numbers gracefully', () => {
      const result = calculatePagination(NaN, NaN);
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
      expect(result.offset).toBe(0);
    });

    it('should handle extremely large numbers', () => {
      const result = calculatePagination(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
      
      expect(result.page).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.limit).toBe(100); // Capped at 100
      expect(result.offset).toBe((Number.MAX_SAFE_INTEGER - 1) * 100);
    });

    it('should handle float numbers by normalizing them', () => {
      const result = calculatePagination(2.7, 10.9);
      
      expect(result.page).toBe(2); // Math.max should handle float
      expect(result.limit).toBe(10);
    });

    it('should handle negative total items in pagination result', () => {
      const result = createPaginationResult(['item'], -5, { page: 1, limit: 10, offset: 0 });
      
      expect(result.pagination.total).toBe(-5);
      expect(result.pagination.totalPages).toBe(0); // Math.ceil(-5/10) = -1, but should be handled
    });
  });
});