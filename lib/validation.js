// Validações "de verdade" — em especial o CNPJ, que usa o algoritmo oficial
// de dígitos verificadores (módulo 11), não só checa o tamanho da string.
// Isso importa para a segurança do cadastro de ONG/Empresa: um CNPJ com
// formato válido mas dígitos verificadores errados é quase certamente
// digitado errado (ou falso).

export function apenasNumeros(texto) {
  return (texto || '').replace(/\D/g, '');
}

export function validarCNPJ(cnpjTexto) {
  const cnpj = apenasNumeros(cnpjTexto);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false; // todos os dígitos iguais, ex: 00000000000000

  const calcularDigito = (base, pesos) => {
    const soma = base
      .split('')
      .reduce((acc, digito, i) => acc + Number(digito) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digito1 = calcularDigito(cnpj.slice(0, 12), pesos1);
  const digito2 = calcularDigito(cnpj.slice(0, 12) + digito1, pesos2);

  return cnpj.slice(12) === `${digito1}${digito2}`;
}

export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
}

export function validarTelefoneBR(telefone) {
  const numeros = apenasNumeros(telefone);
  return numeros.length === 10 || numeros.length === 11; // fixo ou celular, com DDD
}

export function validarSenhaForte(senha) {
  // Regra simples e explícita para o usuário entender o motivo de falhar:
  // mínimo 6 caracteres (mínimo aceito pelo Supabase Auth por padrão) e
  // ao menos 1 letra e 1 número.
  if (!senha || senha.length < 6) return false;
  return /[a-zA-Z]/.test(senha) && /[0-9]/.test(senha);
}
