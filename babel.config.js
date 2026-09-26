// Só existe pra o Jest conseguir transformar a sintaxe de import/export dos
// arquivos de lib/ nos testes (lib/__tests__) — o app em si roda via Expo/
// Metro, que já tem seu próprio babel config embutido e não lê este arquivo.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
