import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Building2, 
  FolderOpen, 
  Clock, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Dashboard = () => {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalClients: 0,
    activeProjects: 0,
    totalHoursThisWeek: 0,
    pendingHours: 0,
    approvedHours: 0,
    totalPayroll: 0,
    avgHoursPerEmployee: 0,
    completionRate: 0
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [
        { count: employeeCount },
        { count: clientCount },
        { count: projectCount },
        { data: weeklyHours },
        { data: payrollData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('working_hours').select('total_hours, status').gte('date', getWeekStart()),
        supabase.from('payroll').select('net_pay').eq('status', 'approved')
      ]);

      const totalHours = weeklyHours?.reduce((sum, h) => sum + h.total_hours, 0) || 0;
      const pendingHours = weeklyHours?.filter(h => h.status === 'pending').reduce((sum, h) => sum + h.total_hours, 0) || 0;
      const approvedHours = weeklyHours?.filter(h => h.status === 'approved').reduce((sum, h) => sum + h.total_hours, 0) || 0;
      const totalPayroll = payrollData?.reduce((sum, p) => sum + p.net_pay, 0) || 0;

      setStats({
        totalEmployees: employeeCount || 0,
        totalClients: clientCount || 0,
        activeProjects: projectCount || 0,
        totalHoursThisWeek: totalHours,
        pendingHours,
        approvedHours,
        totalPayroll,
        avgHoursPerEmployee: employeeCount ? totalHours / employeeCount : 0,
        completionRate: totalHours > 0 ? (approvedHours / totalHours) * 100 : 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data: recentHours } = await supabase
        .from('working_hours')
        .select(`
          *,
          profiles!working_hours_profile_id_fkey(full_name),
          projects!working_hours_project_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const activities = recentHours?.map(h => ({
        type: 'hours',
        description: `${h.profiles?.full_name} logged ${h.total_hours}h for ${h.projects?.name}`,
        time: new Date(h.created_at).toLocaleDateString(),
        status: h.status
      })) || [];

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const getWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  };

  const dashboardStats = [
    { 
      title: "Total Employees", 
      value: stats.totalEmployees.toString(), 
      icon: Users, 
      color: "text-blue-600",
      permission: "employees_view"
    },
    { 
      title: "Active Clients", 
      value: stats.totalClients.toString(), 
      icon: Building2, 
      color: "text-green-600",
      permission: "clients_view"
    },
    { 
      title: "Active Projects", 
      value: stats.activeProjects.toString(), 
      icon: FolderOpen, 
      color: "text-purple-600",
      permission: "projects_view"
    },
    { 
      title: "Hours This Week", 
      value: `${stats.totalHoursThisWeek.toFixed(1)}h`, 
      icon: Clock, 
      color: "text-orange-600",
      permission: "working_hours_view"
    },
    { 
      title: "Pending Hours", 
      value: `${stats.pendingHours.toFixed(1)}h`, 
      icon: AlertCircle, 
      color: "text-yellow-600",
      permission: "working_hours_view"
    },
    { 
      title: "Approved Hours", 
      value: `${stats.approvedHours.toFixed(1)}h`, 
      icon: CheckCircle, 
      color: "text-emerald-600",
      permission: "working_hours_view"
    },
    { 
      title: "Total Payroll", 
      value: `$${stats.totalPayroll.toLocaleString()}`, 
      icon: DollarSign, 
      color: "text-indigo-600",
      permission: "payroll_view"
    },
    { 
      title: "Avg Hours/Employee", 
      value: `${stats.avgHoursPerEmployee.toFixed(1)}h`, 
      icon: TrendingUp, 
      color: "text-rose-600",
      permission: "working_hours_view"
    },
    { 
      title: "Completion Rate", 
      value: `${stats.completionRate.toFixed(1)}%`, 
      icon: Activity, 
      color: "text-cyan-600",
      permission: "working_hours_view"
    },
  ];

  // Filter stats based on permissions
  const visibleStats = dashboardStats.filter(stat => 
    !stat.permission || hasPermission(stat.permission)
  );

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600">Overview of your business metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600 truncate">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color} flex-shrink-0`} />
              </CardHeader>
              <CardContent>
                <div className={`text-lg md:text-2xl font-bold ${stat.color} truncate`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasPermission("working_hours_view") && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.status === 'approved' ? 'bg-green-500' :
                      activity.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm text-gray-900 break-words">
                        {activity.description}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.time}</span>
                        <span className={`text-xs px-2 py-1 rounded w-fit ${
                          activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-xs md:text-sm text-gray-500 text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-xs md:text-sm font-medium">Weekly Progress</span>
                  <span className="text-sm md:text-base font-bold text-blue-600">
                    {stats.completionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-xs md:text-sm font-medium">Approved Hours</span>
                  <span className="text-sm md:text-base font-bold text-green-600">
                    {stats.approvedHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-xs md:text-sm font-medium">Pending Review</span>
                  <span className="text-sm md:text-base font-bold text-yellow-600">
                    {stats.pendingHours.toFixed(1)}h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
