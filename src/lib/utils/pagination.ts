// Pagination utilities for optimized data fetching

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    offset: number;
  };
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

// Calculate pagination parameters
export const calculatePagination = (page: number, limit: number): PaginationParams => {
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
  const offset = (normalizedPage - 1) * normalizedLimit;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    offset
  };
};

// Create pagination result
export const createPaginationResult = <T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginationResult<T> => {
  const totalPages = Math.ceil(total / params.limit);
  const hasNext = params.page < totalPages;
  const hasPrev = params.page > 1;

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      offset: params.offset || 0
    }
  };
};

// Generate pagination info for UI
export const getPaginationInfo = (pagination: PaginationResult<any>['pagination']) => {
  const { page, limit, total, totalPages } = pagination;
  const start = Math.min((page - 1) * limit + 1, total);
  const end = Math.min(page * limit, total);

  return {
    start,
    end,
    total,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
    showingText: `Affichage de ${start} à ${end} sur ${total} résultats`,
    pageText: `Page ${page} sur ${totalPages}`
  };
};

// Generate page numbers for pagination UI
export const getPageNumbers = (currentPage: number, totalPages: number, maxVisible = 5): number[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + maxVisible - 1);

  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

// Cursor-based pagination for real-time data
export const createCursorPaginationResult = <T extends { id: string; createdAt: Date }>(
  data: T[],
  params: CursorPaginationParams
): CursorPaginationResult<T> => {
  const hasNext = data.length === params.limit;
  const hasPrev = !!params.cursor;

  let nextCursor: string | undefined;
  let prevCursor: string | undefined;

  if (data.length > 0) {
    if (hasNext) {
      const lastItem = data[data.length - 1];
      nextCursor = btoa(`${lastItem.createdAt.getTime()}_${lastItem.id}`);
    }

    if (hasPrev) {
      const firstItem = data[0];
      prevCursor = btoa(`${firstItem.createdAt.getTime()}_${firstItem.id}`);
    }
  }

  return {
    data,
    pagination: {
      limit: params.limit,
      hasNext,
      hasPrev,
      nextCursor,
      prevCursor
    }
  };
};

// Parse cursor for database queries
export const parseCursor = (cursor: string): { timestamp: number; id: string } | null => {
  try {
    const decoded = atob(cursor);
    const [timestamp, id] = decoded.split('_');
    return {
      timestamp: parseInt(timestamp, 10),
      id
    };
  } catch (error) {
    return null;
  }
};

// Debounced search for performance
export class DebouncedSearch {
  private timeoutId: NodeJS.Timeout | null = null;
  private delay: number;

  constructor(delay = 300) {
    this.delay = delay;
  }

  search<T>(searchFn: () => Promise<T>, callback: (result: T) => void): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(async () => {
      try {
        const result = await searchFn();
        callback(result);
      } catch (_error) {
        console.error('Search error:', _error);
      }
    }, this.delay);
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// Virtual scrolling helper for large lists
export interface VirtualScrollParams {
  itemHeight: number;
  containerHeight: number;
  totalItems: number;
  scrollTop: number;
  overscan?: number;
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  totalHeight: number;
  offsetY: number;
}

export const calculateVirtualScroll = (params: VirtualScrollParams): VirtualScrollResult => {
  const { itemHeight, containerHeight, totalItems, scrollTop, overscan = 5 } = params;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2);

  const totalHeight = totalItems * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY
  };
};
