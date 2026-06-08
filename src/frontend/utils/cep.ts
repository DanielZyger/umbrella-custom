import { setField } from './form';

export function setupCEPLookup(prefix: string): void {
  const cepInput = document.getElementById(`${prefix}-cep`) as HTMLInputElement | null;
  if (!cepInput) return;

  cepInput.addEventListener('blur', async () => {
    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) return;
      setField(`${prefix}-logradouro`, data.logradouro ?? '');
      setField(`${prefix}-bairro`, data.bairro ?? '');
      setField(`${prefix}-cidade`, data.localidade ?? '');
      setField(`${prefix}-uf`, data.uf ?? '');
      document.getElementById(`${prefix}-numero`)?.focus();
    } catch {
      /* ignore network errors */
    }
  });
}
