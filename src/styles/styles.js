import { StyleSheet } from 'react-native';

export const cores = {
  fundo: '#F3F4F6',
  texto: '#1F2933',
  textoClaro: '#667085',
  laranja: '#F97316',
  borda: '#D0D5DD',
  vermelho: '#D92D20',
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    color: cores.texto,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitulo: {
    color: cores.texto,
    fontSize: 18,
    fontWeight: '600',
  },
  botao: {
    alignItems: 'center',
    backgroundColor: cores.laranja,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});