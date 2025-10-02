import { useState } from 'react';
import { Filter, Plus, X, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic: 'AND' | 'OR';
}

interface FilterSectionProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  csvData: any[];
  cardClass: string;
  inputClass: string;
  buttonClass: string;
  labelClass: string;
}

const OPERATORS = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' },
  { value: '<', label: 'less than' },
  { value: '>=', label: 'greater or equal' },
  { value: '<=', label: 'less or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'startswith', label: 'starts with' },
  { value: 'endswith', label: 'ends with' },
];

export default function FilterSection({
  filter,
  onFilterChange,
  csvData,
  cardClass,
  inputClass,
  buttonClass,
  labelClass
}: FilterSectionProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Extract available fields from CSV data
  const availableFields = csvData.length > 0 
    ? Object.keys(csvData[0]).filter(key => key !== 'email')
    : [];

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: availableFields[0] || 'name',
      operator: '=',
      value: '',
      logic: 'AND'
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const buildFilterExpression = () => {
    if (conditions.length === 0) return '';
    
    let expression = '';
    conditions.forEach((condition, index) => {
      if (index > 0) {
        expression += ` ${condition.logic} `;
      }
      
      let conditionExpr = '';
      if (condition.operator === 'contains') {
        conditionExpr = `${condition.field} contains "${condition.value}"`;
      } else if (condition.operator === 'startswith') {
        conditionExpr = `${condition.field} startswith "${condition.value}"`;
      } else if (condition.operator === 'endswith') {
        conditionExpr = `${condition.field} endswith "${condition.value}"`;
      } else {
        // Handle numeric vs string values
        const isNumeric = !isNaN(Number(condition.value));
        const value = isNumeric ? condition.value : `"${condition.value}"`;
        conditionExpr = `${condition.field} ${condition.operator} ${value}`;
      }
      
      expression += conditionExpr;
    });
    
    return expression;
  };

  const applyFilter = () => {
    const expression = buildFilterExpression();
    onFilterChange(expression);
    setShowBuilder(false);
  };

  const clearFilter = () => {
    setConditions([]);
    onFilterChange('');
  };

  const getFilterPreview = () => {
    if (!filter) return 'No filter applied';
    try {
      return `Filter: ${filter}`;
    } catch {
      return 'Invalid filter expression';
    }
  };

  return (
    <div className={cardClass + " p-4"}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-200">
          <Filter className="w-4 h-4 text-orange-400" />
          Advanced Filter
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setManualMode(!manualMode)}
            className={`${buttonClass} p-1.5 ${
              manualMode 
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={manualMode ? "Switch to builder" : "Switch to manual"}
          >
            <Code className="w-3 h-3" />
          </button>
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className={`${buttonClass} bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 p-1.5`}
            title={showBuilder ? "Hide builder" : "Show builder"}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Filter Status */}
      <div className="mb-3">
        <div className={`text-xs p-2 rounded bg-[#0D1117] border border-gray-800 ${
          filter ? 'text-orange-400' : 'text-gray-500'
        }`}>
          {getFilterPreview()}
        </div>
        {filter && (
          <div className="flex justify-end mt-2">
            <button
              onClick={clearFilter}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Manual Mode */}
      {manualMode ? (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Filter Expression</label>
            <textarea
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder='age &gt; 25 AND tier = "pro"'
              rows={3}
              className={inputClass}
            />
          </div>
          <div className="text-xs text-gray-500">
            Examples: age &gt; 25, tier = "pro", name contains "John"
          </div>
        </div>
      ) : (
        <>
          {/* Visual Filter Builder */}
          <AnimatePresence>
            {showBuilder && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="space-y-3 bg-[#0D1117] border border-gray-800 rounded p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Build Filter Conditions</span>
                    <button
                      onClick={addCondition}
                      className={`${buttonClass} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs px-2 py-1`}
                    >
                      Add Condition
                    </button>
                  </div>

                  {conditions.length === 0 ? (
                    <div className="text-center text-gray-500 text-xs py-4">
                      Click "Add Condition" to start building your filter
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conditions.map((condition, index) => (
                        <motion.div
                          key={condition.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-2 bg-[#161B22] rounded border border-gray-700"
                        >
                          {index > 0 && (
                            <select
                              value={condition.logic}
                              onChange={(e) => updateCondition(condition.id, { logic: e.target.value as 'AND' | 'OR' })}
                              className="text-xs bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-300"
                            >
                              <option value="AND">AND</option>
                              <option value="OR">OR</option>
                            </select>
                          )}
                          
                          <select
                            value={condition.field}
                            onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                            className="text-xs bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-300 flex-1"
                          >
                            {availableFields.map(field => (
                              <option key={field} value={field}>{field}</option>
                            ))}
                          </select>
                          
                          <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(condition.id, { operator: e.target.value })}
                            className="text-xs bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-300"
                          >
                            {OPERATORS.map(op => (
                              <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                          </select>
                          
                          <input
                            type="text"
                            value={condition.value}
                            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                            placeholder="value"
                            className="text-xs bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-300 flex-1"
                          />
                          
                          <button
                            onClick={() => removeCondition(condition.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                      
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={applyFilter}
                          className={`${buttonClass} bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-xs px-3 py-1 flex-1`}
                        >
                          Apply Filter
                        </button>
                        <button
                          onClick={() => setConditions([])}
                          className={`${buttonClass} bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs px-3 py-1`}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Filters */}
          {availableFields.includes('tier') && (
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Quick Filters</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onFilterChange('tier = "pro"')}
                  className={`${buttonClass} bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 text-xs py-1`}
                >
                  Pro Only
                </button>
                <button
                  onClick={() => onFilterChange('tier = "premium"')}
                  className={`${buttonClass} bg-gold-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 text-xs py-1`}
                >
                  Premium Only
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Field Reference */}
      {availableFields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="text-xs text-gray-400 mb-2">Available Fields:</div>
          <div className="flex flex-wrap gap-1">
            {availableFields.slice(0, 6).map(field => (
              <span
                key={field}
                className="px-2 py-1 text-xs bg-[#0D1117] border border-gray-700 rounded text-gray-400"
              >
                {field}
              </span>
            ))}
            {availableFields.length > 6 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{availableFields.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}