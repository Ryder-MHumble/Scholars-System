import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  InstitutionPicker,
  type InstitutionPickResult,
} from "@/components/common/InstitutionPicker";

export function InstitutionPickerPage() {
  const navigate = useNavigate();
  const [selectedResult, setSelectedResult] =
    useState<InstitutionPickResult | null>(null);

  const handleSelect = (result: InstitutionPickResult) => {
    setSelectedResult(result);
    console.log("Selected:", result);
    // You can navigate or perform other actions here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">选择机构</h1>
            {selectedResult && (
              <p className="text-sm text-gray-600 mt-1">
                已选择: {selectedResult.institution_name}
                {selectedResult.department_name &&
                  ` - ${selectedResult.department_name}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Institution Picker */}
      <div className="h-[calc(100vh-80px)]">
        <InstitutionPicker onSelect={handleSelect} />
      </div>
    </div>
  );
}
