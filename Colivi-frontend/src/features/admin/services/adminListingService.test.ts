import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../../lib/api';
import { adminListingService } from './adminListingService';

vi.mock('../../../lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('adminListingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searchAllListings calls /admin/listings with filters and pagination', async () => {
    const mockPage = {
      content: [{ id: 'listing-1', title: 'Piso Centro', status: 'AVAILABLE' }],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPage });

    const result = await adminListingService.searchAllListings(
      { city: 'Madrid', status: 'AVAILABLE' },
      0,
      10
    );

    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/listings?city=Madrid&status=AVAILABLE&page=0&size=10')
    );
    expect(result).toEqual(mockPage);
  });

  it('banListing calls PATCH /listings/ban/:id', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

    await adminListingService.banListing('listing-1');

    expect(api.patch).toHaveBeenCalledWith('/listings/ban/listing-1');
  });

  it('unbanListing calls PATCH /listings/unban/:id', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

    await adminListingService.unbanListing('listing-1');

    expect(api.patch).toHaveBeenCalledWith('/listings/unban/listing-1');
  });

  it('hardDeleteListing calls DELETE /listings/hardDelete/:id', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

    await adminListingService.hardDeleteListing('listing-1');

    expect(api.delete).toHaveBeenCalledWith('/listings/hardDelete/listing-1');
  });

  it('recoverListing calls PATCH /listings/recover/:id', async () => {
    const mockRecovered = { id: 'listing-1', status: 'AVAILABLE' };
    vi.mocked(api.patch).mockResolvedValueOnce({ data: mockRecovered });

    const result = await adminListingService.recoverListing('listing-1');

    expect(api.patch).toHaveBeenCalledWith('/listings/recover/listing-1');
    expect(result).toEqual(mockRecovered);
  });
});
