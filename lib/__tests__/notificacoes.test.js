import { tempoRelativo, iconePorTipo, textoContador } from '../notificacoes';

describe('tempoRelativo', () => {
  const agora = new Date('2026-10-13T12:00:00Z');

  it('formata janelas de tempo', () => {
    expect(tempoRelativo('2026-10-13T11:59:30Z', agora)).toBe('agora');
    expect(tempoRelativo('2026-10-13T11:45:00Z', agora)).toBe('há 15 min');
    expect(tempoRelativo('2026-10-13T09:00:00Z', agora)).toBe('há 3 h');
    expect(tempoRelativo('2026-10-12T12:00:00Z', agora)).toBe('há 1 dia');
    expect(tempoRelativo('2026-10-10T12:00:00Z', agora)).toBe('há 3 dias');
  });

  it('não quebra com data ausente ou inválida', () => {
    expect(tempoRelativo(null, agora)).toBe('');
    expect(tempoRelativo('lixo', agora)).toBe('');
  });

  it('data no futuro (relógio desajustado) vira "agora"', () => {
    expect(tempoRelativo('2026-10-13T12:05:00Z', agora)).toBe('agora');
  });
});

describe('iconePorTipo', () => {
  it('conhece os tipos e tem fallback', () => {
    expect(iconePorTipo('candidatura_aceita').nome).toBe('check-circle');
    expect(iconePorTipo('verificacao_aprovada').nome).toBe('shield');
    expect(iconePorTipo('reclamacao_respondida').nome).toBe('message-circle');
    expect(iconePorTipo('doacao_nova').nome).toBe('heart');
    expect(iconePorTipo('doacao_nao_recebida').nome).toBe('alert-circle');
    expect(iconePorTipo('qualquer-coisa').nome).toBe('bell');
  });
});

describe('textoContador', () => {
  it('esconde zero e limita em 9+', () => {
    expect(textoContador(0)).toBe('');
    expect(textoContador(3)).toBe('3');
    expect(textoContador(25)).toBe('9+');
  });
});
