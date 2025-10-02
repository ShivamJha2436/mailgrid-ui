import { useState } from 'react';
import { 
  Play, Square, List, X, Clock, CheckCircle2, 
  AlertCircle, RefreshCw, Trash2, Calendar,
  Activity, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JobManagementSectionProps {
  jobs: any[];
  schedulerRunning: boolean;
  showJobs: boolean;
  onToggleJobs: () => void;
  onStartScheduler: () => void;
  onStopScheduler: () => void;
  onRefreshJobs: () => void;
  onCancelJob: (jobId: string) => void;
  onAddLog: (type: 'info' | 'error' | 'success', msg: string) => void;
  cardClass: string;
  buttonClass: string;
}

export default function JobManagementSection({
  jobs,
  schedulerRunning,
  showJobs,
  onToggleJobs,
  onStartScheduler,
  onStopScheduler,
  onRefreshJobs,
  onCancelJob,
  cardClass,
  buttonClass
}: JobManagementSectionProps) {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'running': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'cancelled': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3" />;
      case 'running': return <RefreshCw className="w-3 h-3 animate-spin" />;
      case 'failed': return <AlertCircle className="w-3 h-3" />;
      case 'cancelled': return <X className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const activeJobs = jobs.filter(j => ['pending', 'running'].includes(j.status)).length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;

  return (
    <div className={cardClass + " p-4"}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-200">
          <Activity className="w-4 h-4 text-purple-400" />
          Job Manager
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshJobs}
            className={buttonClass + " bg-gray-700 hover:bg-gray-600 p-1.5"}
            title="Refresh jobs"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={onToggleJobs}
            className={buttonClass + " bg-gray-700 hover:bg-gray-600 p-1.5"}
            title={showJobs ? "Hide jobs" : "Show jobs"}
          >
            <List className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Scheduler Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Scheduler Status</span>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
            schedulerRunning 
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
              : 'text-gray-400 bg-gray-500/10 border-gray-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              schedulerRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
            }`} />
            {schedulerRunning ? 'Running' : 'Stopped'}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={schedulerRunning ? onStopScheduler : onStartScheduler}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1 justify-center ${
              schedulerRunning 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            {schedulerRunning ? (
              <>
                <Square className="w-3 h-3" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                Start
              </>
            )}
          </button>
          <button
            onClick={onToggleJobs}
            className={buttonClass + " bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 flex items-center gap-1 justify-center"}
          >
            <TrendingUp className="w-3 h-3" />
            Metrics
          </button>
        </div>
      </div>

      {/* Job Statistics */}
      {jobs.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Job Statistics</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-[#0D1117] rounded p-2 text-center border border-gray-800">
              <div className="text-yellow-400 font-semibold">{activeJobs}</div>
              <div className="text-gray-500">Active</div>
            </div>
            <div className="bg-[#0D1117] rounded p-2 text-center border border-gray-800">
              <div className="text-emerald-400 font-semibold">{completedJobs}</div>
              <div className="text-gray-500">Done</div>
            </div>
            <div className="bg-[#0D1117] rounded p-2 text-center border border-gray-800">
              <div className="text-red-400 font-semibold">{failedJobs}</div>
              <div className="text-gray-500">Failed</div>
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <AnimatePresence>
        {showJobs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="text-xs text-gray-400 mb-2">
              Recent Jobs ({jobs.length})
            </div>
            
            {jobs.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-4">
                No scheduled jobs
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {jobs.slice(0, 10).map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-[#0D1117] rounded p-2 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer ${
                      selectedJob === job.id ? 'border-blue-500/50' : ''
                    }`}
                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs border ${getJobStatusColor(job.status)}`}>
                          {getStatusIcon(job.status)}
                          <span className="ml-1">{job.status}</span>
                        </span>
                        <span className="text-xs text-gray-400 truncate max-w-20">
                          {job.id.substring(0, 8)}...
                        </span>
                      </div>
                      
                      {['pending', 'running'].includes(job.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelJob(job.id);
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Cancel job"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(job.runAt)}
                      </div>
                      {job.nextRunAt && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          Next: {formatDate(job.nextRunAt)}
                        </div>
                      )}
                    </div>

                    {selectedJob === job.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-2 pt-2 border-t border-gray-800 text-xs text-gray-400"
                      >
                        <div>Attempts: {job.attempts}/{job.maxAttempts}</div>
                        {job.cronExpr && <div>Cron: {job.cronExpr}</div>}
                        {job.interval && <div>Interval: {job.interval}</div>}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}