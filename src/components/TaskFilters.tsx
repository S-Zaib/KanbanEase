import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

// If react-icons is still causing issues, replace the imports with:
// const FaSearch = () => <span>🔍</span>;
// const FaFilter = () => <span>⚙️</span>;
// const FaTimes = () => <span>✖️</span>;

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: '🔴 Urgent' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
];

export type FilterCriteria = {
  searchText: string;
  priority: string[];
  assignedTo: string[];
  hasDueDate: boolean | null;
  isOverdue: boolean | null;
  hasSubtasks: boolean | null;
};

type TaskFiltersProps = {
  boardMembers: any[];
  onFilterChange: (filters: FilterCriteria) => void;
};

export default function TaskFilters({ boardMembers, onFilterChange }: TaskFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [hasDueDate, setHasDueDate] = useState<boolean | null>(null);
  const [isOverdue, setIsOverdue] = useState<boolean | null>(null);
  const [hasSubtasks, setHasSubtasks] = useState<boolean | null>(null);
  
  // Apply filters when any criteria changes
  useEffect(() => {
    const filters: FilterCriteria = {
      searchText,
      priority: selectedPriorities,
      assignedTo: selectedAssignees,
      hasDueDate,
      isOverdue,
      hasSubtasks,
    };
    
    onFilterChange(filters);
  }, [searchText, selectedPriorities, selectedAssignees, hasDueDate, isOverdue, hasSubtasks]);
  
  const clearFilters = () => {
    setSearchText('');
    setSelectedPriorities([]);
    setSelectedAssignees([]);
    setHasDueDate(null);
    setIsOverdue(null);
    setHasSubtasks(null);
  };
  
  const togglePriority = (priority: string) => {
    if (selectedPriorities.includes(priority)) {
      setSelectedPriorities(selectedPriorities.filter(p => p !== priority));
    } else {
      setSelectedPriorities([...selectedPriorities, priority]);
    }
  };
  
  const toggleAssignee = (userId: string) => {
    if (selectedAssignees.includes(userId)) {
      setSelectedAssignees(selectedAssignees.filter(id => id !== userId));
    } else {
      setSelectedAssignees([...selectedAssignees, userId]);
    }
  };
  
  const hasActiveFilters = () => {
    return searchText !== '' || 
      selectedPriorities.length > 0 || 
      selectedAssignees.length > 0 || 
      hasDueDate !== null || 
      isOverdue !== null ||
      hasSubtasks !== null;
  };
  
  return (
    <div className="mb-4 bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden shadow-md">
      {/* Search bar - always visible */}
      <div className="p-3 flex items-center">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <FaSearch />
          </div>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search tasks..."
            className="w-full py-2 pl-10 pr-4 bg-[#0d1117] text-gray-200 rounded-md border border-[#30363d] focus:border-blue-500 outline-none shadow-inner"
          />
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`ml-3 p-2 rounded-md ${isExpanded || hasActiveFilters() ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#21262d]'}`}
          title="Toggle filters"
        >
          <FaFilter />
          {hasActiveFilters() && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>
          )}
        </button>
        
        {hasActiveFilters() && (
          <button 
            onClick={clearFilters}
            className="ml-2 p-2 text-gray-400 hover:text-gray-200 rounded-md hover:bg-[#21262d]"
            title="Clear all filters"
          >
            <FaTimes />
          </button>
        )}
      </div>
      
      {/* Expanded filter options */}
      {isExpanded && (
        <div className="p-3 border-t border-[#30363d] bg-[#1c2129]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority filter */}
            <div>
              <h4 className="text-gray-400 text-xs uppercase mb-2">Priority</h4>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => togglePriority(option.value)}
                    className={`px-2 py-1 text-xs rounded-md ${
                      selectedPriorities.includes(option.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Assignee filter */}
            <div>
              <h4 className="text-gray-400 text-xs uppercase mb-2">Assigned To</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleAssignee('')}
                  className={`px-2 py-1 text-xs rounded-md ${
                    selectedAssignees.includes('')
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
                  }`}
                >
                  Unassigned
                </button>
                {boardMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => toggleAssignee(member.id)}
                    className={`px-2 py-1 text-xs rounded-md truncate max-w-[150px] ${
                      selectedAssignees.includes(member.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
                    }`}
                    title={member.email}
                  >
                    👤 {member.email.split('@')[0]}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Due date filters */}
            <div>
              <h4 className="text-gray-400 text-xs uppercase mb-2">Due Date</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setHasDueDate(hasDueDate === true ? null : true)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    hasDueDate === true
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
                  }`}
                >
                  Has Due Date
                </button>
                <button
                  onClick={() => setHasDueDate(hasDueDate === false ? null : false)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    hasDueDate === false
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
                  }`}
                >
                  No Due Date
                </button>
                <button
                  onClick={() => setIsOverdue(isOverdue === true ? null : true)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    isOverdue === true
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
                  }`}
                >
                  Overdue
                </button>
              </div>
            </div>
            
            {/* Subtasks filter */}
            <div>
              <h4 className="text-gray-400 text-xs uppercase mb-2">Subtasks</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setHasSubtasks(hasSubtasks === true ? null : true)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    hasSubtasks === true
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
                  }`}
                >
                  Has Subtasks
                </button>
                <button
                  onClick={() => setHasSubtasks(hasSubtasks === false ? null : false)}
                  className={`px-2 py-1 text-xs rounded-md ${
                    hasSubtasks === false
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]'
                  }`}
                >
                  No Subtasks
                </button>
              </div>
            </div>
          </div>
          
          {/* Active filters summary */}
          {hasActiveFilters() && (
            <div className="mt-4 pt-3 border-t border-[#30363d] text-xs text-gray-400">
              <span className="mr-2">Active filters:</span>
              {searchText && <span className="bg-[#21262d] px-2 py-1 rounded mr-2">Search: "{searchText}"</span>}
              {selectedPriorities.map(p => (
                <span key={p} className="bg-[#21262d] px-2 py-1 rounded mr-2">
                  Priority: {PRIORITY_OPTIONS.find(o => o.value === p)?.label}
                </span>
              ))}
              {selectedAssignees.map(id => (
                <span key={id} className="bg-[#21262d] px-2 py-1 rounded mr-2">
                  Assignee: {id === '' ? 'Unassigned' : boardMembers.find(m => m.id === id)?.email.split('@')[0]}
                </span>
              ))}
              {hasDueDate === true && <span className="bg-[#21262d] px-2 py-1 rounded mr-2">Has due date</span>}
              {hasDueDate === false && <span className="bg-[#21262d] px-2 py-1 rounded mr-2">No due date</span>}
              {isOverdue === true && <span className="bg-[#21262d] px-2 py-1 rounded mr-2">Overdue</span>}
              {hasSubtasks === true && <span className="bg-[#21262d] px-2 py-1 rounded mr-2">Has subtasks</span>}
              {hasSubtasks === false && <span className="bg-[#21262d] px-2 py-1 rounded mr-2">No subtasks</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
