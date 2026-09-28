import { File } from 'expo-file-system';
import { supabase } from '../supabase';

// ANTES: fetch(uriLocal).arrayBuffer() — o fetch do React Native às vezes
// devolve uma resposta "vazia" pra URIs de arquivo local (file://), e o
// upload ia pro Supabase mesmo assim com só alguns bytes de lixo em vez da
// imagem (era por isso que a imagem publicada ficava em branco/"não foi
// possível carregar": o arquivo salvo no Storage tinha uns 14 bytes).
//
// Tentativa seguinte: ler com expo-file-system (readAsStringAsync) em
// base64 e decodificar pra bytes. Funcionava, mas o SDK 57 aposentou esse
// método (readAsStringAsync) em favor da API nova baseada em classes.
//
// AGORA: a classe File da API nova tem um método que já devolve os bytes
// do arquivo direto (sem passar por base64 nem por fetch nenhum), o que é
// mais simples e mais rápido que as duas tentativas anteriores.
function uriParaArrayBuffer(uriLocal) {
  const arquivo = new File(uriLocal);
  return arquivo.bytes(); // Uint8Array — o cliente do Supabase aceita isso direto
}

// O content-type que vem no header do fetch para um arquivo local (file://)
// costuma ser genérico ou ausente, então o tipo MIME é decidido pela
// extensão do arquivo, não pela resposta do fetch.
function mimeDaExtensao(extensao) {
  const mapa = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', gif: 'image/gif',
    mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', '3gp': 'video/3gpp',
    pdf: 'application/pdf',
  };
  return mapa[(extensao || '').toLowerCase()] || 'image/jpeg';
}

function extensaoDoUri(uriLocal) {
  return uriLocal.split('.').pop()?.split('?')[0] || 'jpg';
}

// Envia a foto para o bucket "avatars" dentro de uma pasta com o próprio
// user id (avatars/<userId>/avatar-<timestamp>.jpg) — o nome da pasta é o
// que a policy de Storage usa para garantir que cada pessoa só consegue
// escrever dentro da própria pasta (veja supabase-schema-v3-storage.sql).
// Retorna a URL pública já pronta para salvar em profiles.foto_url.
export async function enviarAvatar(uriLocal, userId) {
  const arrayBuffer = await uriParaArrayBuffer(uriLocal);
  const extensao = extensaoDoUri(uriLocal);
  const caminho = `${userId}/avatar-${Date.now()}.${extensao}`;

  const { error: erroUpload } = await supabase.storage
    .from('avatars')
    .upload(caminho, arrayBuffer, {
      contentType: mimeDaExtensao(extensao),
      upsert: true,
    });

  if (erroUpload) throw erroUpload;

  const { data } = supabase.storage.from('avatars').getPublicUrl(caminho);
  return data.publicUrl;
}

// Mesma lógica do avatar, mas salva como "capa-<timestamp>" na mesma
// pasta do usuário — não precisa de bucket novo, a policy de Storage já
// libera qualquer arquivo dentro da pasta avatars/<userId>/.
export async function enviarCapa(uriLocal, userId) {
  const arrayBuffer = await uriParaArrayBuffer(uriLocal);
  const extensao = extensaoDoUri(uriLocal);
  const caminho = `${userId}/capa-${Date.now()}.${extensao}`;

  const { error } = await supabase.storage.from('avatars').upload(caminho, arrayBuffer, {
    contentType: mimeDaExtensao(extensao),
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(caminho);
  return data.publicUrl;
}

// Imagem anexada a uma publicação — vai num bucket separado ("posts")
// para não misturar com fotos de perfil.
export async function enviarImagemPost(uriLocal, userId) {
  const arrayBuffer = await uriParaArrayBuffer(uriLocal);
  const extensao = extensaoDoUri(uriLocal);
  const caminho = `${userId}/post-${Date.now()}.${extensao}`;

  const { error } = await supabase.storage.from('posts').upload(caminho, arrayBuffer, {
    contentType: mimeDaExtensao(extensao),
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('posts').getPublicUrl(caminho);
  return data.publicUrl;
}

// Vídeo anexado a uma publicação — mesmo bucket "posts" da imagem.
export async function enviarVideoPost(uriLocal, userId) {
  const arrayBuffer = await uriParaArrayBuffer(uriLocal);
  const extensao = extensaoDoUri(uriLocal);
  const caminho = `${userId}/post-video-${Date.now()}.${extensao}`;

  const { error } = await supabase.storage.from('posts').upload(caminho, arrayBuffer, {
    contentType: mimeDaExtensao(extensao),
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('posts').getPublicUrl(caminho);
  return data.publicUrl;
}

// Imagem de capa de uma vaga/ação — mesmo bucket "posts" (já público e
// testado), path próprio pra não misturar com fotos de publicações.
export async function enviarImagemVaga(uriLocal, ongId) {
  const arrayBuffer = await uriParaArrayBuffer(uriLocal);
  const extensao = extensaoDoUri(uriLocal);
  const caminho = `${ongId}/vaga-capa-${Date.now()}.${extensao}`;

  const { error } = await supabase.storage.from('posts').upload(caminho, arrayBuffer, {
    contentType: mimeDaExtensao(extensao),
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('posts').getPublicUrl(caminho);
  return data.publicUrl;
}

// Documento fiscal (estatuto social, comprovante bancário) — bucket privado
// "documentos-fiscais", pasta por usuário, igual ao padrão dos outros
// buckets. `prefixo` diferencia estatuto de comprovante dentro da mesma
// pasta ("estatuto" ou "comprovante").
export async function enviarDocumentoFiscal(uriLocal, userId, prefixo) {
  const arrayBuffer = await uriParaArrayBuffer(uriLocal);
  const extensao = extensaoDoUri(uriLocal);
  const caminho = `${userId}/${prefixo}-${Date.now()}.${extensao}`;

  const { error } = await supabase.storage.from('documentos-fiscais').upload(caminho, arrayBuffer, {
    contentType: mimeDaExtensao(extensao),
    upsert: true,
  });
  if (error) throw error;

  return caminho;
}

// Versão genérica das duas funções acima, usada pelo novo formulário de
// publicação com várias fotos/vídeos: manda um arquivo por vez para o bucket
// "posts" e devolve a URL pública já pronta para virar uma linha em
// post_midia. `indice` só entra no nome do arquivo pra evitar colisão quando
// vários uploads da mesma publicação saem no mesmo milissegundo.
export async function enviarMidiaPost(uriLocal, userId, tipo, indice = 0) {
  const arrayBuffer = await uriParaArrayBuffer(uriLocal);
  const extensao = extensaoDoUri(uriLocal);
  const prefixo = tipo === 'video' ? 'post-video' : 'post';
  const caminho = `${userId}/${prefixo}-${Date.now()}-${indice}.${extensao}`;

  const { error } = await supabase.storage.from('posts').upload(caminho, arrayBuffer, {
    contentType: mimeDaExtensao(extensao),
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('posts').getPublicUrl(caminho);
  return data.publicUrl;
}
