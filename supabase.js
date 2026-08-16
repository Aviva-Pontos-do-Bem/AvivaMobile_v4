import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://wqsibmrmblxqsajlysgb.supabase.co';
const supabaseAnonKey = 'sb_publishable_eKc8usQvBuPCckIfC2wwSA_eYs4ZJW2';

// O access/refresh token do Supabase (JWT) precisa persistir entre sessões
// do app, mas guardá-lo em AsyncStorage puro deixa o token legível em texto
// plano no armazenamento do dispositivo. O expo-secure-store usa o
// Keychain (iOS) / Keystore (Android), só que tem um limite de ~2KB por
// item — pequeno demais para a sessão inteira. Por isso: o valor da sessão
// é cifrado com AES-CTR usando uma chave aleatória, essa chave (pequena) é
// quem fica no SecureStore, e só o blob cifrado (grande) vai pro
// AsyncStorage. Resultado: sem a chave do Keychain/Keystore, o conteúdo do
// AsyncStorage é inútil. Essa é a estratégia recomendada pela própria
// Supabase para Expo/React Native. No Web não existe Keychain/Keystore
// nativo, então mantemos AsyncStorage puro (equivalente ao localStorage).
class ArmazenamentoSeguroDaSessao {
  async _cifrar(chave, valor) {
    const chaveAes = crypto.getRandomValues(new Uint8Array(32));
    const cifrador = new aesjs.ModeOfOperation.ctr(chaveAes, new aesjs.Counter(1));
    const bytesCifrados = cifrador.encrypt(aesjs.utils.utf8.toBytes(valor));
    await SecureStore.setItemAsync(chave, aesjs.utils.hex.fromBytes(chaveAes));
    return aesjs.utils.hex.fromBytes(bytesCifrados);
  }

  async _decifrar(chave, valorCifrado) {
    const chaveHex = await SecureStore.getItemAsync(chave);
    if (!chaveHex) return null;
    const cifrador = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(chaveHex), new aesjs.Counter(1));
    const bytesDecifrados = cifrador.decrypt(aesjs.utils.hex.toBytes(valorCifrado));
    return aesjs.utils.utf8.fromBytes(bytesDecifrados);
  }

  async getItem(chave) {
    const valorCifrado = await AsyncStorage.getItem(chave);
    if (!valorCifrado) return null;
    return this._decifrar(chave, valorCifrado);
  }

  async setItem(chave, valor) {
    const valorCifrado = await this._cifrar(chave, valor);
    await AsyncStorage.setItem(chave, valorCifrado);
  }

  async removeItem(chave) {
    await AsyncStorage.removeItem(chave);
    await SecureStore.deleteItemAsync(chave);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? AsyncStorage : new ArmazenamentoSeguroDaSessao(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
