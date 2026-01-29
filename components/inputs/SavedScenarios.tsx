'use client';

import { useState } from 'react';
import { useStore, SavedScenario } from '@/lib/store';
import { formatCurrency } from '@/lib/utils/formatters';

export function SavedScenarios() {
  const savedScenarios = useStore((state) => state.savedScenarios);
  const saveCurrentScenario = useStore((state) => state.saveCurrentScenario);
  const loadScenario = useStore((state) => state.loadScenario);
  const deleteScenario = useStore((state) => state.deleteScenario);
  const renameScenario = useStore((state) => state.renameScenario);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleSave = () => {
    if (newScenarioName.trim()) {
      saveCurrentScenario(newScenarioName.trim());
      setNewScenarioName('');
      setShowSaveDialog(false);
      setIsExpanded(true);
    }
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      renameScenario(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Saved Scenarios</h2>
          {savedScenarios.length > 0 && (
            <span className="text-sm text-gray-500">({savedScenarios.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Current
          </button>
          {savedScenarios.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-500 hover:text-gray-700"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">Save current scenario for later comparison:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g., Downtown Condo Option"
              className="flex-1 rounded-md border-gray-300 text-sm"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={!newScenarioName.trim()}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setNewScenarioName('');
              }}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved Scenarios List */}
      {savedScenarios.length === 0 ? (
        <p className="text-sm text-gray-500">
          No saved scenarios yet. Save your current configuration to compare different properties or options later.
        </p>
      ) : isExpanded ? (
        <div className="space-y-3">
          {savedScenarios
            .sort((a, b) => b.savedAt - a.savedAt)
            .map((scenario) => (
              <div
                key={scenario.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  {editingId === scenario.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(scenario.id);
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingName('');
                          }
                        }}
                        className="flex-1 rounded-md border-gray-300 text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(scenario.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingName('');
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-gray-900 truncate">{scenario.name}</p>
                      <p className="text-xs text-gray-500">
                        {scenario.buyScenario.name} • {formatCurrency(scenario.buyScenario.purchasePrice)} • {formatDate(scenario.savedAt)}
                      </p>
                    </>
                  )}
                </div>
                {editingId !== scenario.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => loadScenario(scenario.id)}
                      className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                      title="Load this scenario"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(scenario.id);
                        setEditingName(scenario.name);
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Rename"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${scenario.name}"?`)) {
                          deleteScenario(scenario.id);
                        }
                      }}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Show {savedScenarios.length} saved scenario{savedScenarios.length !== 1 ? 's' : ''}...
        </button>
      )}
    </div>
  );
}
