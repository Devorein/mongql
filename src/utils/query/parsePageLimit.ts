export default function (page: number | string, limit: number | string): [number, number] {
  page = parseInt(page as string) || 1;
  limit = parseInt(limit as string) || 10;
  const startIndex = (page - 1) * limit;
  return [startIndex, limit];
};
