import { useState, useEffect } from 'react';
import { 
  BarChart3, Activity, Mail, Clock, CheckCircle2, 
  AlertCircle, TrendingUp, TrendingDown, Zap,
  Users, Send, Eye, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricsData {
  totalEmails: number;
  sentEmails: number;
  failedEmails: number;
  pendingEmails: number;
  successRate: number;
  avgResponseTime: number;
  throughput: number;
  activeJobs: number;
  recentActivity: Array<{
    time: string;
    type: 'sent' | 'failed' | 'queued';
    recipient?: string;
    subject?: string;
  }>;
  hourlyStats: Array<{
    hour: string;
    sent: number;
    failed: number;
  }>;
  smtp: {
    connected: boolean;
    host: string;
    port: number;
    secure: boolean;
  };
}

interface MetricsDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function MetricsDashboard({ isVisible, onClose }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalEmails: 0,
    sentEmails: 0,
    failedEmails: 0,
    pendingEmails: 0,
    successRate: 0,
    avgResponseTime: 0,
    throughput: 0,
    activeJobs: 0,
    recentActivity: [],
    hourlyStats: [],
    smtp: {
      connected: false,
      host: '',
      port: 0,
      secure: false
    }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Simulate metrics updates (replace with real API calls)
  const refreshMetrics = async () => {
    setRefreshing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data - replace with actual metrics API
    const newMetrics: MetricsData = {
      totalEmails: Math.floor(Math.random() * 1000) + 500,
      sentEmails: Math.floor(Math.random() * 800) + 400,
      failedEmails: Math.floor(Math.random() * 50) + 10,
      pendingEmails: Math.floor(Math.random() * 20) + 5,
      successRate: Math.random() * 20 + 80, // 80-100%
      avgResponseTime: Math.random() * 500 + 100, // 100-600ms
      throughput: Math.random() * 10 + 5, // 5-15 emails/sec
      activeJobs: Math.floor(Math.random() * 5) + 1,
      recentActivity: Array.from({ length: 10 }, (_, i) => ({
        time: new Date(Date.now() - i * 60000).toLocaleTimeString(),
        type: Math.random() > 0.1 ? 'sent' : 'failed' as 'sent' | 'failed',
        recipient: `user${i}@example.com`,
        subject: `Email Campaign ${i + 1}`
      })),
      hourlyStats: Array.from({ length: 12 }, (_, i) => ({
        hour: `${23 - i}:00`,
        sent: Math.floor(Math.random() * 50) + 10,
        failed: Math.floor(Math.random() * 5)
      })),
      smtp: {
        connected: Math.random() > 0.2,
        host: 'smtp.gmail.com',
        port: 587,
        secure: true
      }
    };
    
    setMetrics(newMetrics);
    setLastRefresh(new Date());
    setRefreshing(false);
  };

  useEffect(() => {
    if (isVisible) {
      refreshMetrics();
      const interval = setInterval(refreshMetrics, 30000); // Auto-refresh every 30s
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    change, 
    color = 'text-blue-400',
    bgColor = 'bg-blue-500/10',
    borderColor = 'border-blue-500/20'
  }: {
    icon: any;
    title: string;
    value: string | number;
    change?: { value: number; isPositive: boolean };
    color?: string;
    bgColor?: string;
    borderColor?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColor} ${borderColor} border rounded-lg p-4`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {change && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${
              change.isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {change.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change.value)}%
            </div>
          )}
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#0D1117] rounded-xl border border-gray-800 w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#161B22] border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Mailgrid Metrics</h2>
              <p className="text-xs text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshMetrics}
              disabled={refreshing}
              className="p-2 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Mail}
              title="Total Emails"
              value={metrics.totalEmails.toLocaleString()}
              change={{ value: 12.5, isPositive: true }}
            />
            <StatCard
              icon={CheckCircle2}
              title="Sent Successfully"
              value={metrics.sentEmails.toLocaleString()}
              color="text-emerald-400"
              bgColor="bg-emerald-500/10"
              borderColor="border-emerald-500/20"
              change={{ value: 8.3, isPositive: true }}
            />
            <StatCard
              icon={AlertCircle}
              title="Failed"
              value={metrics.failedEmails.toLocaleString()}
              color="text-red-400"
              bgColor="bg-red-500/10"
              borderColor="border-red-500/20"
              change={{ value: 2.1, isPositive: false }}
            />
            <StatCard
              icon={Clock}
              title="Pending"
              value={metrics.pendingEmails.toLocaleString()}
              color="text-yellow-400"
              bgColor="bg-yellow-500/10"
              borderColor="border-yellow-500/20"
            />
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={TrendingUp}
              title="Success Rate"
              value={`${metrics.successRate.toFixed(1)}%`}
              color="text-emerald-400"
              bgColor="bg-emerald-500/10"
              borderColor="border-emerald-500/20"
            />
            <StatCard
              icon={Zap}
              title="Avg Response Time"
              value={`${metrics.avgResponseTime.toFixed(0)}ms`}
              color="text-blue-400"
              bgColor="bg-blue-500/10"
              borderColor="border-blue-500/20"
            />
            <StatCard
              icon={Send}
              title="Throughput"
              value={`${metrics.throughput.toFixed(1)}/sec`}
              color="text-purple-400"
              bgColor="bg-purple-500/10"
              borderColor="border-purple-500/20"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* SMTP Status */}
            <div className="bg-[#161B22] rounded-lg border border-gray-800 p-4">
              <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                SMTP Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Connection</span>
                  <span className={`px-2 py-1 rounded text-xs border ${
                    metrics.smtp.connected 
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                      : 'text-red-400 bg-red-500/10 border-red-500/20'
                  }`}>
                    {metrics.smtp.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Host</span>
                  <span className="text-xs text-gray-200">{metrics.smtp.host || 'Not configured'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Port</span>
                  <span className="text-xs text-gray-200">{metrics.smtp.port || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Security</span>
                  <span className="text-xs text-gray-200">{metrics.smtp.secure ? 'TLS/SSL' : 'None'}</span>
                </div>
              </div>
            </div>

            {/* Active Jobs */}
            <div className="bg-[#161B22] rounded-lg border border-gray-800 p-4">
              <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Active Jobs</span>
                  <span className="text-xs text-yellow-400">{metrics.activeJobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Memory Usage</span>
                  <span className="text-xs text-gray-200">45.2 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Uptime</span>
                  <span className="text-xs text-gray-200">2h 34m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Version</span>
                  <span className="text-xs text-gray-200">v2.1.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Chart Simulation */}
          <div className="bg-[#161B22] rounded-lg border border-gray-800 p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Email Activity (Last 12 Hours)</h3>
            <div className="flex items-end gap-2 h-32">
              {metrics.hourlyStats.map((stat, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="flex flex-col items-center gap-1 mb-2">
                    <div 
                      className="w-full bg-emerald-500/20 rounded-sm min-h-[2px]"
                      style={{ height: `${(stat.sent / 50) * 80}px` }}
                    />
                    <div 
                      className="w-full bg-red-500/20 rounded-sm min-h-[1px]"
                      style={{ height: `${(stat.failed / 5) * 20}px` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 transform rotate-45 origin-bottom-left">
                    {stat.hour}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500/20 rounded" />
                <span className="text-xs text-gray-400">Sent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500/20 rounded" />
                <span className="text-xs text-gray-400">Failed</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#161B22] rounded-lg border border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Recent Activity</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {metrics.recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2 bg-[#0D1117] rounded border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'sent' ? 'bg-emerald-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{activity.time}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        activity.type === 'sent' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {activity.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 truncate">
                      {activity.recipient} • {activity.subject}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}