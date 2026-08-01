interface Props {
  show: boolean;
}

export default function LoadingOverlay({ show }: Props) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-white/85 flex flex-col items-center justify-center z-[100]">
      <div className="spinner" />
      <p className="mt-4 text-gray-700 font-medium">Consultando datos del Congreso...</p>
    </div>
  );
}
