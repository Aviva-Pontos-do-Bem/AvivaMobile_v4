// Cor e ícone de cada categoria de causa, usados no lugar da imagem quando a
// vaga não tem foto (um quadrado cinza "sem imagem" deixava o feed sem graça).
// Cores vêm do logo: verde, amarelo, coral, azul-marinho.

const ESTILOS = {
  'Meio ambiente': { cor: '#2E9E73', fundo: '#E3F6EE', icone: 'globe' },
  'Educação': { cor: '#C98F00', fundo: '#FFF3D1', icone: 'book-open' },
  'Saúde': { cor: '#D9533C', fundo: '#FDE8E4', icone: 'heart' },
  'Assistência social': { cor: '#1D3557', fundo: '#E3EAF3', icone: 'users' },
  'Tecnologia': { cor: '#3F5BA9', fundo: '#E6EBF8', icone: 'cpu' },
};

const PADRAO = { cor: '#1D3557', fundo: '#E8EFF6', icone: 'heart' };

export function estiloCategoria(categoria) {
  return ESTILOS[categoria] || PADRAO;
}
