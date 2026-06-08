export function getVal(id: string): string {
  return (document.getElementById(id) as HTMLInputElement)?.value.trim() ?? '';
}

export function setField(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) el.value = value;
}

export function showErrors(errors: string[], boxId: string): void {
  const el = document.getElementById(boxId)!;
  el.innerHTML = `<ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>`;
  el.style.display = '';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function clearErrors(boxId: string): void {
  const el = document.getElementById(boxId)!;
  el.style.display = 'none';
  el.innerHTML = '';
}
