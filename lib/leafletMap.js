// Gera o HTML de um mapa Leaflet + OpenStreetMap para rodar dentro de um
// WebView. Diferente do Google Maps, o OpenStreetMap não pede chave de API
// nem cartão de crédito cadastrado — os tiles do mapa são carregados
// direto de tile.openstreetmap.org, de graça, para qualquer app.
//
// Comunicação de volta pro React Native: quando a pessoa toca em "Ver
// perfil" no popup de uma ONG, o HTML chama
// window.ReactNativeWebView.postMessage(id) — isso dispara o onMessage do
// <WebView> lá no componente que usa esse HTML.
export function gerarHtmlMapa({ minhaLat, minhaLng, ongs }) {
  // JSON.stringify escapa aspas automaticamente, mas "</script>" dentro de
  // uma string ainda fecharia a tag na marra — troca defensiva pra evitar
  // isso caso algum nome de ONG contenha esse texto.
  const dadosOngsJson = JSON.stringify(
    (ongs || []).map((o) => ({ id: o.id, lat: o.lat, lng: o.lng, nome: o.full_name, distancia: o.distanciaFormatada }))
  ).replace(/<\//g, '<\\/');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #mapa { height: 100%; margin: 0; padding: 0; background: #EAF2ED; }
    .popup-ong { font-family: -apple-system, sans-serif; }
    .popup-ong strong { display: block; margin-bottom: 2px; font-size: 13px; }
    .popup-ong span { display: block; color: #6B7280; font-size: 11px; margin-bottom: 6px; }
    .popup-ong button {
      background: #2E8B57; color: white; border: none; border-radius: 8px;
      padding: 6px 10px; font-size: 12px; font-family: inherit;
    }
  </style>
</head>
<body>
  <div id="mapa"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var ongs = ${dadosOngsJson};
    var map = L.map('mapa', { zoomControl: true }).setView([${minhaLat}, ${minhaLng}], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    var iconeVoce = L.divIcon({
      className: '',
      html: '<div style="background:#2E8B57;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>',
      iconSize: [18, 18],
    });
    L.marker([${minhaLat}, ${minhaLng}], { icon: iconeVoce }).addTo(map).bindPopup('Você está aqui');

    var iconeOng = L.divIcon({
      className: '',
      html: '<div style="background:#1877F2;width:14px;height:14px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
      iconSize: [14, 14],
    });

    ongs.forEach(function (ong) {
      var conteudo = document.createElement('div');
      conteudo.className = 'popup-ong';
      conteudo.innerHTML =
        '<strong>' + ong.nome + '</strong>' +
        '<span>' + (ong.distancia || '') + '</span>' +
        '<button id="btn-' + ong.id + '">Ver perfil</button>';

      var marcador = L.marker([ong.lat, ong.lng], { icon: iconeOng }).addTo(map).bindPopup(conteudo);
      marcador.on('popupopen', function () {
        var btn = document.getElementById('btn-' + ong.id);
        if (btn) btn.onclick = function () {
          window.ReactNativeWebView.postMessage(ong.id);
        };
      });
    });
  </script>
</body>
</html>`;
}
