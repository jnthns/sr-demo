import ExperimentControls from "./components/ExperimentControls";
import ExperimentStaticForm from "./components/ExperimentStaticForm";
import ExperimentPageTracking from "./components/ExperimentPageTracking";
import PageHeading from './components/PageHeading';

export default function Home() {
  return (
    <>
      <ExperimentPageTracking />
      <div className="min-h-screen py-10">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          <PageHeading className="mb-6">Experiments</PageHeading>
          <div className="bg-zen-100 glass-card rounded-2xl border border-zen-200 p-6">
            <p className="amp-unmask font-mono text-sm text-zen-600 bg-zen-200 rounded-xl px-4 py-3 inline-block">
              This is unmasked.
            </p>
          </div>
          <ExperimentControls />
          <ExperimentStaticForm />
        </div>
      </div>
    </>
  )
}
