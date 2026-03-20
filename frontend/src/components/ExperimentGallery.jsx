import ExperimentCard from './ExperimentCard';

export default function ExperimentGallery({ experiments, onRun }) {
  if (!experiments.length) {
    return <p className="text-gray-500 text-sm">No experiments available.</p>;
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-bold text-white">One-Click Chaos</h2>
        <span className="text-xs text-gray-500 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
          {experiments.length} experiments
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {experiments.map((exp) => (
          <ExperimentCard key={exp.id} experiment={exp} onRun={onRun} />
        ))}
      </div>
    </section>
  );
}
