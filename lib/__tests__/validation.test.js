import { apenasNumeros, validarCNPJ, validarEmail, validarTelefoneBR, validarSenhaForte } from '../validation';

describe('validarCNPJ', () => {
  it('aceita um CNPJ com dígitos verificadores corretos', () => {
    expect(validarCNPJ('11.122.233/0001-83')).toBe(true);
    expect(validarCNPJ('11122233000183')).toBe(true);
  });

  it('rejeita um CNPJ com dígito verificador errado', () => {
    expect(validarCNPJ('11122233000184')).toBe(false);
  });

  it('rejeita CNPJ com todos os dígitos iguais (formato válido, mas falso)', () => {
    expect(validarCNPJ('00000000000000')).toBe(false);
    expect(validarCNPJ('11111111111111')).toBe(false);
  });

  it('rejeita CNPJ com tamanho errado', () => {
    expect(validarCNPJ('123')).toBe(false);
    expect(validarCNPJ('')).toBe(false);
    expect(validarCNPJ(null)).toBe(false);
  });
});

describe('validarEmail', () => {
  it('aceita e-mails no formato básico correto', () => {
    expect(validarEmail('pessoa@dominio.com')).toBe(true);
    expect(validarEmail('  pessoa@dominio.com  ')).toBe(true);
  });

  it('rejeita e-mails sem @ ou sem domínio', () => {
    expect(validarEmail('pessoa.dominio.com')).toBe(false);
    expect(validarEmail('pessoa@')).toBe(false);
    expect(validarEmail('')).toBe(false);
    expect(validarEmail(undefined)).toBe(false);
  });
});

describe('validarTelefoneBR', () => {
  it('aceita fixo (10 dígitos) e celular (11 dígitos) com DDD', () => {
    expect(validarTelefoneBR('(11) 3333-4444')).toBe(true);
    expect(validarTelefoneBR('(11) 93333-4444')).toBe(true);
  });

  it('rejeita número sem DDD ou incompleto', () => {
    expect(validarTelefoneBR('33334444')).toBe(false);
    expect(validarTelefoneBR('123')).toBe(false);
  });
});

describe('validarSenhaForte', () => {
  it('aceita senha com letra, número e 6+ caracteres', () => {
    expect(validarSenhaForte('senha123')).toBe(true);
  });

  it('rejeita senha curta demais, só letras ou só números', () => {
    expect(validarSenhaForte('a1')).toBe(false);
    expect(validarSenhaForte('somentelet')).toBe(false);
    expect(validarSenhaForte('123456')).toBe(false);
    expect(validarSenhaForte('')).toBe(false);
  });
});

describe('apenasNumeros', () => {
  it('remove tudo que não é dígito', () => {
    expect(apenasNumeros('(11) 90000-0000')).toBe('11900000000');
    expect(apenasNumeros(null)).toBe('');
  });
});
