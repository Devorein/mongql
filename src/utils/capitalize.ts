export default function capitalize(subjectString: string) {
  return subjectString.substr(0, 1).toUpperCase() + subjectString.substr(1);
}