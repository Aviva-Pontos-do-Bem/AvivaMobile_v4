import * as Linking from 'expo-linking';

// Gera um link de verdade (não só texto) para compartilhar uma publicação
// ou um perfil fora do app — usa o esquema do próprio app (aviva://) em
// nativo e a URL real da página quando rodando na web, então o link
// sempre abre o conteúdo certo em vez de só mencionar ele por escrito.
export function linkDaPublicacao(postId) {
  return Linking.createURL(`post/${postId}`);
}

export function linkDoPerfil(userId) {
  return Linking.createURL(`perfil-publico/${userId}`);
}
