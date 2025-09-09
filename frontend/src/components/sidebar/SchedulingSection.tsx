import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar, PlayCircle, List, X, Loader2, ChevronRight } from "lucide-react";

interface SchedulingSectionProps {
  scheduleAt: string;
  setScheduleAt: (time: string) => void;
  interval: string;
  setInterval: (interval: string) => void;
  cron: string;
  setCron: (cron: string) => void;
  jobRetries: number;
  setJobRetries: (retries: number) => void;
  jobBackoff: string;
  setJobBackoff: (backoff: string) => void;
  schedulerDB: string;
  setSchedulerDB: (db: string) => void;
  onSchedule: () => Promise<void>;
  onAddLog: (type: 'info' | 'error' | 'success', msg: string) => void;
  loading: boolean;
  canSchedule: boolean;
  inputClass: string;
  buttonClass: string;
  cardClass: string;
  labelClass: string;
}

interface Job {
  id: string;
  status: string;
  runAt: string;
  nextRunAt: string;
  attempts: number;
  maxAttempts: number;
}

export default function SchedulingSection({
  scheduleAt,
  setScheduleAt,
  interval,
  setInterval,
  cron,
  setCron,
  jobRetries,
  setJobRetries,
  jobBackoff,
  setJobBackoff,
  schedulerDB,
  setSchedulerDB,
  onSchedule,
  onAddLog,
  loading,
  canSchedule,
  inputClass,
  buttonClass,
  cardClass,
  labelClass
}: SchedulingSectionProps) {
  const [scheduleType, setScheduleType] = useState<"now" | "once" | "recurring" | "cron">("now");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showJobs, setShowJobs] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Format current time for datetime-local input
  const getCurrentTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Default to 5 minutes from now
    return now.toISOString().slice(0, 16);
  };

  // Update schedule fields based on type
  useEffect(() => {
    switch (scheduleType) {
      case "now":
        setScheduleAt("");
        setInterval("");
        setCron("");
        break;
      case "once":
        if (!scheduleAt) setScheduleAt(getCurrentTime());
        setInterval("");
        setCron("");
        break;
      case "recurring":
        setScheduleAt("");
        if (!interval) setInterval("1h");
        setCron("");
        break;
      case "cron":
        setScheduleAt("");
        setInterval("");
        if (!cron) setCron("0 9 * * *");
        break;
    }
  }, [scheduleType, scheduleAt, interval, cron, setScheduleAt, setInterval, setCron]);

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      // TODO: Replace with actual Wails call when available
      setJobs([]); // Placeholder - no jobs for now
      onAddLog('info', 'Job management will be available after backend update');
    } catch (error) {
      onAddLog('error', 'Failed to load jobs');
    } finally {
      setLoadingJobs(false);
    }
  };

  const cancelJob = async (_jobId: string) => {
    onAddLog('info', 'Job cancellation will be available after backend update');
  };

  const handleSchedule = async () => {
    if (scheduleType === "now") {
      // Immediate send - use existing send logic
      return;
    }
    
    // Convert datetime-local to RFC3339
    let formattedScheduleAt = scheduleAt;
    if (scheduleType === "once" && scheduleAt) {
      formattedScheduleAt = new Date(scheduleAt).toISOString();
    }
    
    const originalScheduleAt = scheduleAt;
    setScheduleAt(formattedScheduleAt);
    
    try {
      await onSchedule();
      const scheduleDesc = 
        scheduleType === "once" ? `at ${new Date(scheduleAt).toLocaleString()}` :
        scheduleType === "recurring" ? `every ${interval}` :
        scheduleType === "cron" ? `with cron "${cron}"` : "";
      onAddLog('success', `📅 Campaign scheduled ${scheduleDesc}`);
    } finally {
      setScheduleAt(originalScheduleAt);
    }
  };

  const isScheduled = scheduleType !== "now";

  return (
    <div className={cardClass + " p-4"}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Scheduling
      </h3>
      
      {/* Schedule Type Toggle */}
      <div className="grid grid-cols-2 gap-1 mb-3 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <button
          onClick={() => setScheduleType("now")}
          className={`py-1.5 text-xs font-medium rounded transition-all ${
            scheduleType === "now" 
              ? "bg-white dark:bg-zinc-700 shadow-sm" 
              : "hover:bg-white/50 dark:hover:bg-zinc-700/50"
          }`}
        >
          <PlayCircle className="w-3 h-3 inline mr-1" />
          Send Now
        </button>
        <button
          onClick={() => setScheduleType(scheduleType === "now" ? "once" : "now")}
          className={`py-1.5 text-xs font-medium rounded transition-all ${
            isScheduled 
              ? "bg-white dark:bg-zinc-700 shadow-sm" 
              : "hover:bg-white/50 dark:hover:bg-zinc-700/50"
          }`}
        >
          <Calendar className="w-3 h-3 inline mr-1" />
          Schedule
        </button>
      </div>

      <AnimatePresence>
        {isScheduled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {/* Schedule Type Specific Controls */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <button
                onClick={() => setScheduleType("once")}
                className={`py-1 text-xs font-medium rounded transition-all ${
                  scheduleType === "once" 
                    ? "bg-white dark:bg-zinc-700 shadow-sm" 
                    : "hover:bg-white/50 dark:hover:bg-zinc-700/50"
                }`}
              >
                Once
              </button>
              <button
                onClick={() => setScheduleType("recurring")}
                className={`py-1 text-xs font-medium rounded transition-all ${
                  scheduleType === "recurring" 
                    ? "bg-white dark:bg-zinc-700 shadow-sm" 
                    : "hover:bg-white/50 dark:hover:bg-zinc-700/50"
                }`}
              >
                Repeat
              </button>
              <button
                onClick={() => setScheduleType("cron")}
                className={`py-1 text-xs font-medium rounded transition-all ${
                  scheduleType === "cron" 
                    ? "bg-white dark:bg-zinc-700 shadow-sm" 
                    : "hover:bg-white/50 dark:hover:bg-zinc-700/50"
                }`}
              >
                Cron
              </button>
            </div>

            {scheduleType === "once" && (
              <div>
                <label className={labelClass}>Run At</label>
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={e => setScheduleAt(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {scheduleType === "recurring" && (
              <div>
                <label className={labelClass}>Interval</label>
                <select
                  value={interval}
                  onChange={e => setInterval(e.target.value)}
                  className={inputClass}
                >
                  <option value="1m">Every Minute</option>
                  <option value="5m">Every 5 Minutes</option>
                  <option value="15m">Every 15 Minutes</option>
                  <option value="30m">Every 30 Minutes</option>
                  <option value="1h">Every Hour</option>
                  <option value="2h">Every 2 Hours</option>
                  <option value="6h">Every 6 Hours</option>
                  <option value="12h">Every 12 Hours</option>
                  <option value="24h">Daily</option>
                  <option value="168h">Weekly</option>
                </select>
              </div>
            )}

            {scheduleType === "cron" && (
              <div>
                <label className={labelClass}>Cron Expression</label>
                <input
                  type="text"
                  value={cron}
                  onChange={e => setCron(e.target.value)}
                  placeholder="0 9 * * * (daily at 9 AM)"
                  className={inputClass}
                />
                <div className="text-xs text-zinc-500 mt-1">
                  Format: minute hour day month weekday
                </div>
              </div>
            )}

            {/* Advanced Options */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400"
            >
              <span>Advanced Options</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">Job Retries</label>
                      <input 
                        type="number" 
                        value={jobRetries} 
                        onChange={e => setJobRetries(parseInt(e.target.value) || 3)} 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">Backoff</label>
                      <input 
                        type="text" 
                        value={jobBackoff} 
                        onChange={e => setJobBackoff(e.target.value)} 
                        placeholder="2s"
                        className={inputClass} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-600 dark:text-zinc-400">Database Path</label>
                    <input 
                      type="text" 
                      value={schedulerDB} 
                      onChange={e => setSchedulerDB(e.target.value)} 
                      placeholder="mailgrid.db"
                      className={inputClass} 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Button */}
      <div className="mt-4">
        <button
          onClick={handleSchedule}
          disabled={loading || (!canSchedule && isScheduled)}
          className={`w-full ${buttonClass} ${
            isScheduled 
              ? 'bg-orange-600 hover:bg-orange-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
          ) : isScheduled ? (
            <Calendar className="w-4 h-4 inline mr-2" />
          ) : (
            <PlayCircle className="w-4 h-4 inline mr-2" />
          )}
          {isScheduled ? 'Schedule Campaign' : 'Send Now'}
        </button>
      </div>

      {/* Jobs Management */}
      {isScheduled && (
        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => {
              setShowJobs(!showJobs);
              if (!showJobs) loadJobs();
            }}
            className="w-full flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400"
          >
            <span className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Scheduled Jobs
            </span>
            <ChevronRight className={`w-4 h-4 transition-transform ${showJobs ? 'rotate-90' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showJobs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 overflow-hidden"
              >
                {loadingJobs ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-xs text-zinc-500 text-center py-2">
                    No scheduled jobs
                  </div>
                ) : (
                  <div className="space-y-2">
                    {jobs.map(job => (
                      <div 
                        key={job.id} 
                        className="flex items-center justify-between p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs"
                      >
                        <div>
                          <div className="font-medium">{job.id.slice(0, 8)}</div>
                          <div className="text-zinc-500">{job.status}</div>
                        </div>
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
