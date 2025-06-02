import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, DollarSign, Plus, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkingHour, Client, Project, Profile, WorkingHoursStatus } from "@/types/database";
import { useAuth } from "@/hooks/useAuth";
import { WorkingHoursActions } from "@/components/working-hours/WorkingHoursActions";

export const WorkingHours = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkingHour, setEditingWorkingHour] = useState<WorkingHour | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<WorkingHour[]>([]);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [filters, setFilters] = useState({
    profile_id: '',
    client_id: '',
    project_id: '',
    date: ''
  });

  const [formData, setFormData] = useState({
    profile_id: '',
    client_id: '',
    project_id: '',
    date: '',
    start_time: '',
    end_time: '',
    total_hours: '',
    actual_hours: '',
    overtime_hours: '',
    hourly_rate: '',
    payable_amount: '',
    notes: '',
    sign_in_time: '',
    sign_out_time: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [workingHoursRes, clientsRes, projectsRes, profilesRes] = await Promise.all([
        supabase
          .from('working_hours')
          .select(`
            *,
            profiles!working_hours_profile_id_fkey (id, full_name, role, hourly_rate),
            clients!working_hours_client_id_fkey (id, name, company),
            projects!working_hours_project_id_fkey (id, name)
          `)
          .order('date', { ascending: false }),

        supabase.from('clients').select('*').order('name'),
        supabase.from('projects').select('*').order('name'),
        supabase.from('profiles').select('*').order('full_name')
      ]);

      if (workingHoursRes.error) throw workingHoursRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      setWorkingHours(workingHoursRes.data as WorkingHour[]);
      setClients(clientsRes.data as Client[]);
      setProjects(projectsRes.data as Project[]);
      setProfiles(profilesRes.data as Profile[]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch working hours data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkingHours = workingHours.filter(wh => {
    if (filters.profile_id && wh.profile_id !== filters.profile_id) return false;
    if (filters.client_id && wh.client_id !== filters.client_id) return false;
    if (filters.project_id && wh.project_id !== filters.project_id) return false;
    if (filters.date && wh.date !== filters.date) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const workingHourData = {
        profile_id: formData.profile_id,
        client_id: formData.client_id,
        project_id: formData.project_id,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        total_hours: parseFloat(formData.total_hours),
        actual_hours: parseFloat(formData.actual_hours),
        overtime_hours: parseFloat(formData.overtime_hours),
        hourly_rate: parseFloat(formData.hourly_rate),
        payable_amount: parseFloat(formData.payable_amount),
        notes: formData.notes,
        sign_in_time: formData.sign_in_time,
        sign_out_time: formData.sign_out_time,
        status: 'pending' as WorkingHoursStatus
      };

      if (editingWorkingHour) {
        const { error } = await supabase
          .from('working_hours')
          .update(workingHourData)
          .eq('id', editingWorkingHour.id);
        if (error) throw error;
        toast({ title: "Success", description: "Working hour updated successfully" });
      } else {
        const { error } = await supabase
          .from('working_hours')
          .insert([workingHourData]);
        if (error) throw error;
        toast({ title: "Success", description: "Working hour created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving working hour:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save working hour",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (selectedRows.length === 0) return;

    setLoading(true);
    try {
      const workingHoursToCreate = selectedRows.map(row => ({
        total_hours: row.total_hours,
        actual_hours: row.actual_hours,
        overtime_hours: row.overtime_hours,
        payable_amount: row.payable_amount,
        sign_in_time: row.sign_in_time,
        sign_out_time: row.sign_out_time,
        profile_id: row.profile_id,
        client_id: row.client_id,
        project_id: row.project_id,
        date: row.date,
        start_time: row.start_time,
        end_time: row.end_time,
        hourly_rate: row.hourly_rate,
        notes: row.notes,
        status: 'pending' as WorkingHoursStatus
      }));

      const { error } = await supabase
        .from('working_hours')
        .insert(workingHoursToCreate);

      if (error) throw error;

      toast({ title: "Success", description: "Bulk working hours created successfully" });
      setSelectedRows([]);
      fetchData();
    } catch (error: any) {
      console.error('Error creating bulk working hours:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create bulk working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      profile_id: '',
      client_id: '',
      project_id: '',
      date: '',
      start_time: '',
      end_time: '',
      total_hours: '',
      actual_hours: '',
      overtime_hours: '',
      hourly_rate: '',
      payable_amount: '',
      notes: '',
      sign_in_time: '',
      sign_out_time: ''
    });
    setEditingWorkingHour(null);
  };

  const editWorkingHour = (workingHour: WorkingHour) => {
    setFormData({
      profile_id: workingHour.profile_id,
      client_id: workingHour.client_id,
      project_id: workingHour.project_id,
      date: workingHour.date,
      start_time: workingHour.start_time,
      end_time: workingHour.end_time,
      total_hours: workingHour.total_hours.toString(),
      actual_hours: workingHour.actual_hours?.toString() || '',
      overtime_hours: workingHour.overtime_hours?.toString() || '',
      hourly_rate: workingHour.hourly_rate?.toString() || '',
      payable_amount: workingHour.payable_amount?.toString() || '',
      notes: workingHour.notes || '',
      sign_in_time: workingHour.sign_in_time || '',
      sign_out_time: workingHour.sign_out_time || ''
    });
    setEditingWorkingHour(workingHour);
    setIsDialogOpen(true);
  };

  const deleteWorkingHour = async (id: string) => {
    try {
      const { error } = await supabase
        .from('working_hours')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Working hour deleted successfully" });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting working hour:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete working hour",
        variant: "destructive"
      });
    }
  };

  const toggleRowSelection = (workingHour: WorkingHour) => {
    setSelectedRows(prevRows => {
      const isSelected = prevRows.find(row => row.id === workingHour.id);
      if (isSelected) {
        return prevRows.filter(row => row.id !== workingHour.id);
      } else {
        return [...prevRows, workingHour];
      }
    });
  };

  const isRowSelected = (workingHour: WorkingHour) => {
    return selectedRows.find(row => row.id === workingHour.id);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading working hours...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Manage Working Hours</CardTitle>
          <div className="flex items-center space-x-2">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Working Hour
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingWorkingHour ? "Edit Working Hour" : "Create Working Hour"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="profile_id">Employee *</Label>
                      <Select value={formData.profile_id} onValueChange={(value) => setFormData({ ...formData, profile_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="client_id">Client *</Label>
                      <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="project_id">Project *</Label>
                      <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        type="date"
                        id="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        type="time"
                        id="start_time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="end_time">End Time *</Label>
                      <Input
                        type="time"
                        id="end_time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="total_hours">Total Hours *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        id="total_hours"
                        value={formData.total_hours}
                        onChange={(e) => setFormData({ ...formData, total_hours: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="actual_hours">Actual Hours</Label>
                      <Input
                        type="number"
                        step="0.1"
                        id="actual_hours"
                        value={formData.actual_hours}
                        onChange={(e) => setFormData({ ...formData, actual_hours: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="overtime_hours">Overtime Hours</Label>
                      <Input
                        type="number"
                        step="0.1"
                        id="overtime_hours"
                        value={formData.overtime_hours}
                        onChange={(e) => setFormData({ ...formData, overtime_hours: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="hourly_rate">Hourly Rate</Label>
                      <Input
                        type="number"
                        step="0.01"
                        id="hourly_rate"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="payable_amount">Payable Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        id="payable_amount"
                        value={formData.payable_amount}
                        onChange={(e) => setFormData({ ...formData, payable_amount: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sign_in_time">Sign In Time</Label>
                      <Input
                        type="time"
                        id="sign_in_time"
                        value={formData.sign_in_time}
                        onChange={(e) => setFormData({ ...formData, sign_in_time: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sign_out_time">Sign Out Time</Label>
                      <Input
                        type="time"
                        id="sign_out_time"
                        value={formData.sign_out_time}
                        onChange={(e) => setFormData({ ...formData, sign_out_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes"
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Saving..." : editingWorkingHour ? "Update Working Hour" : "Create Working Hour"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button onClick={handleBulkSubmit} disabled={selectedRows.length === 0 || loading}>
              Submit Selected ({selectedRows.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="profile_filter">Employee</Label>
            <Select value={filters.profile_id} onValueChange={(value) => setFilters({ ...filters, profile_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Employees</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="client_filter">Client</Label>
            <Select value={filters.client_id} onValueChange={(value) => setFilters({ ...filters, client_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="project_filter">Project</Label>
            <Select value={filters.project_id} onValueChange={(value) => setFilters({ ...filters, project_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date_filter">Date</Label>
            <Input
              type="date"
              id="date_filter"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
        </div>

        {/* Working Hours Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded text-blue-500 focus:ring-blue-500"
                    onChange={() => {
                      if (selectedRows.length === filteredWorkingHours.length) {
                        setSelectedRows([]);
                      } else {
                        setSelectedRows([...filteredWorkingHours]);
                      }
                    }}
                    checked={selectedRows.length === filteredWorkingHours.length && filteredWorkingHours.length > 0}
                    disabled={filteredWorkingHours.length === 0}
                  />
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkingHours.map((workingHour) => (
                <tr key={workingHour.id}>
                  <td className="px-6 py-4 whitespace-no-wrap">
                    <input
                      type="checkbox"
                      className="rounded text-blue-500 focus:ring-blue-500"
                      checked={isRowSelected(workingHour)}
                      onChange={() => toggleRowSelection(workingHour)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap">
                    <div className="text-sm leading-5 text-gray-900">{workingHour.profiles?.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap">
                    <div className="text-sm leading-5 text-gray-900">{workingHour.clients?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap">
                    <div className="text-sm leading-5 text-gray-900">{workingHour.projects?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap">
                    <div className="text-sm leading-5 text-gray-900">{workingHour.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap">
                    <div className="text-sm leading-5 text-gray-900">{workingHour.total_hours}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-right text-sm leading-5 font-medium">
                    <WorkingHoursActions workingHour={workingHour} onEdit={editWorkingHour} onDelete={deleteWorkingHour} onRefresh={fetchData} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
