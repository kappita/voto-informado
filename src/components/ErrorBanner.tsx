interface Props {
  message: string;
}

export default function ErrorBanner({ message }: Props) {
  if (!message) return null;
  return <div className="bg-red-100 text-red-800 py-3 px-4 rounded-lg mt-4 text-sm font-medium">{message}</div>;
}
