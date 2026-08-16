// Cálculo de distância entre coordenadas — usado pela busca de "ONGs perto
// de você". Fórmula de Haversine: distância em linha reta sobre a esfera da
// Terra, boa o suficiente para ordenar "o que está mais perto" sem precisar
// de uma API de rotas.

const RAIO_TERRA_KM = 6371;

function paraRadianos(graus) {
  return (graus * Math.PI) / 180;
}

export function distanciaKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null || Number.isNaN(v))) return null;

  const dLat = paraRadianos(lat2 - lat1);
  const dLng = paraRadianos(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadianos(lat1)) * Math.cos(paraRadianos(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RAIO_TERRA_KM * c;
}

// "800 m", "3,2 km" — formato curto para caber num card.
export function formatarDistancia(km) {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}
