import parseSort from './parseSort';
import parsePageLimit from './parsePageLimit';
import { IPaginationInput } from '../../types';

/**
 * Parses the input pagination and extracts sort, limit, page and filter info
 * @param pagination Pagination to parse
 * @returns extracted sort, limit, page and filter 
 */
export default function (pagination: IPaginationInput) {
  const { page, limit, sort, filter } = pagination;
  const parsed_sort = parseSort(sort);
  const [parsed_page, parsed_limit] = parsePageLimit(page, limit);
  const parsed_filter = JSON.parse(!filter || filter === '' ? '{}' : filter);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  return {
    startIndex,
    endIndex,
    sort: parsed_sort,
    limit: parsed_limit,
    page: parsed_page,
    filter: parsed_filter
  };
}
