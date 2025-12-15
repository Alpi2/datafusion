"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import marketplaceAPI from "@/lib/api/marketplace";
import { DatasetCard } from "@/components/marketplace/DatasetCard";

export default function ComparePageClient() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") || "";
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : [];
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (ids.length === 0) return setDatasets([]);
      setLoading(true);
      try {
        const result: any[] = [];
        for (const id of ids) {
          try {
            const res = await marketplaceAPI.getDatasetById(id);
            const dataset = (res && res.dataset) || res;
            if (dataset) result.push(dataset);
          } catch (e) {
            // ignore missing dataset
          }
        }
        if (mounted) setDatasets(result);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [idsParam]);

  if (loading) return <div className="p-8">Loading...</div>;

  if (ids.length === 0)
    return <div className="p-8">No datasets selected for comparison.</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Compare Datasets</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {datasets.map((d) => (
          <div key={d.id} className="bg-slate-800/40 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">{d.title}</h2>
            <p className="text-slate-300 text-sm mb-3">{d.description}</p>
            <div className="text-sm text-slate-400 mb-2">
              Category: {d.category}
            </div>
            <div className="text-sm text-slate-400 mb-2">Price: ${d.price}</div>
            <div className="text-sm text-slate-400 mb-2">
              Quality: {d.quality}%
            </div>
            <div className="text-sm text-slate-400">
              Downloads: {d.downloads}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
