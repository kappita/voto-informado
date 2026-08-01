export default function Footer() {
  return (
    <footer className="text-center py-6 text-xs text-gray-500 border-t border-gray-200 mt-8">
      <p>
        Datos obtenidos de las APIs públicas del{' '}
        <a href="https://tramitacion.senado.cl" target="_blank" rel="noopener" className="text-[#0039a6] hover:underline">Senado</a> y la{' '}
        <a href="https://opendata.camara.cl" target="_blank" rel="noopener" className="text-[#0039a6] hover:underline">Cámara de Diputados</a> de Chile.
        {' '}&middot;{' '}
        Código abierto en{' '}
        <a href="https://github.com" target="_blank" rel="noopener" className="text-[#0039a6] hover:underline">GitHub</a>.
      </p>
    </footer>
  );
}
