export default function (sort: string) {
  const transformed_sort: { [key: string]: -1 | 1 } = {};
  if (sort && sort !== '') {
    sort.split(',').forEach((field) => {
      const isDescending = field.startsWith('-');
      if (isDescending) transformed_sort[field.replace('-', '')] = -1;
      else transformed_sort[field] = 1;
    });
  } else {
    transformed_sort.created_at = -1;
    transformed_sort.name = -1;
  }
  return transformed_sort;
}
