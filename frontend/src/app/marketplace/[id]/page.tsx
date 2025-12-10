export default function DatasetDetailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold text-white">Dataset Detail</h1>
      </div>
    </div>
  );
}
export async function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ id: (i + 1).toString() }));
}
