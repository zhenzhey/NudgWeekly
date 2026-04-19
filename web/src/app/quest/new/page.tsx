import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewQuestForm } from "@/components/NewQuestForm";

export default function NewQuestPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back nav */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          New{" "}
          <span className="gradient-text">Quest</span>
        </h1>
        <p className="text-gray-400">
          Describe your goal in plain English and our AI will create a verifiable plan.
        </p>
      </div>

      <NewQuestForm />
    </div>
  );
}
