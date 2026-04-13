import { GraduationCap, ClipboardList } from 'lucide-react';

export function Landing({
  onSelectDuality,
  onSelectDualityExtended
}: {
  onSelectDuality: () => void;
  onSelectDualityExtended: () => void;
}) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Main Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mb-6">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">
            EvalHub
          </h1>
          <p className="text-gray-500 text-lg">College Evaluation Platform</p>
        </div>

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Assignments Mode */}
          <button
            id="select-assignments-btn"
            onClick={onSelectDuality}
            className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-600 transition-all hover:bg-zinc-800/50 text-left"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:border-zinc-500 transition-colors">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Assignments
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  Professor-assigned coding problems. Solve tasks, build your profile, and track progress across the semester.
                </p>
              </div>

              <div className="pt-4 space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                  <span>Professor-Created Problems</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                  <span>Personal Progress Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                  <span>Solve Anytime</span>
                </div>
              </div>

              <div className="pt-4 w-full">
                <div className="bg-white text-black px-6 py-3 rounded-lg font-medium group-hover:bg-gray-200 transition-colors">
                  Enter Assignments
                </div>
              </div>
            </div>
          </button>

          {/* Quiz Mode */}
          <button
            id="select-quiz-btn"
            onClick={onSelectDualityExtended}
            className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-600 transition-all hover:bg-zinc-800/50 text-left"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:border-zinc-500 transition-colors">
                <ClipboardList className="w-10 h-10 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Quizzes
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  Timed evaluations set by professors. Solve problems within a deadline, with instant auto-grading and class rankings.
                </p>
              </div>

              <div className="pt-4 space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                  <span>Timed Evaluations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                  <span>Instant Auto-Grading</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                  <span>Class Rankings</span>
                </div>
              </div>

              <div className="pt-4 w-full">
                <div className="bg-white text-black px-6 py-3 rounded-lg font-medium group-hover:bg-gray-200 transition-colors">
                  Enter Quizzes
                </div>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-700 mt-8">
          Sign in with your institutional @bmu.edu.in Google account
        </p>
      </div>
    </div>
  );
}
