import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, Search, Edit, Trash2, Eye, CheckCircle, XCircle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkingHour, Profile, Client, Project, WorkingHoursStatus } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EditWorkingHoursDialog } from "./EditWorkingHoursDialog";
import { WorkingHoursActions } from "./working-hours/WorkingHoursActions";

export const WorkingHoursComponent = () => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHours, setEditingHours] = useState<WorkingHour | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    date: "",
    start_time: "",
    end_time: "",
    total_hours: 0,
    actual_hours: 0,
    overtime_hours: 0,
    hourly_rate: 0,
    payable_amount: 0,
    sign_in_time: "",
    sign_out_time: "",
    notes: "",
    status: "pending" as WorkingHoursStatus
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hoursRes, profilesRes, clientsRes, projectsRes] = await Promise.all([
        supabase.from('working_hours').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('projects').select('*')
      ]);

      if (hoursRes.error) throw hoursRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setWorkingHours(hoursRes.data as WorkingHour[]);
      setProfiles(profilesRes.data as Profile[]);
      setClients(clientsRes.data as Client[]);
      setProjects(projectsRes.data as Project[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('working_hours')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Success", description: "Working hours approved successfully" });
      fetchData();
    } catch (error: any) {
      console.error('Error approving working hours:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const hoursToEdit = workingHours.find(hours => hours.id === id);
    if (hoursToEdit) {
      setEditingHours(hoursToEdit);
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('working_hours')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Success", description: "Working hours deleted successfully" });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting working hours:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: string) => {
    alert(`View details for working hours ID: ${id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const workingHoursData = {
        profile_id: formData.profile_id,
        client_id: formData.client_id,
        project_id: formData.project_id,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        total_hours: formData.total_hours,
        actual_hours: formData.actual_hours,
        overtime_hours: formData.overtime_hours,
        hourly_rate: formData.hourly_rate,
        payable_amount: formData.payable_amount,
        sign_in_time: formData.sign_in_time || null,
        sign_out_time: formData.sign_out_time || null,
        notes: formData.notes,
        status: formData.status
      };

      const { error } = await supabase
        .from('working_hours')
        .insert([workingHoursData]);
      
      if (error) throw error;

      toast({ title: "Success", description: "Working hours created successfully" });
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error creating working hours:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (hoursData: WorkingHour) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('working_hours')
        .update(hoursData)
        .eq('id', hoursData.id);

      if (error) throw error;

      toast({ title: "Success", description: "Working hours updated successfully" });
      setIsEditDialogOpen(false);
      setEditingHours(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating working hours:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update working hours",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkingHours = workingHours.filter(hours =>
    profiles.find(profile => profile.id === hours.profile_id)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(hours => statusFilter === "all" || hours.status === statusFilter);

  const resetForm = () => {
    setFormData({
      profile_id: "",
      client_id: "",
      project_id: "",
      date: "",
      start_time: "",
      end_time: "",
      total_hours: 0,
      actual_hours: 0,
      overtime_hours: 0,
      hourly_rate: 0,
      payable_amount: 0,
      sign_in_time: "",
      sign_out_time: "",
      notes: "",
      status: "pending" as WorkingHoursStatus
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Working Hours Management</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Working Hours
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Working Hours</DialogTitle>
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
                              {client.company}
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
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="total_hours">Total Hours *</Label>
                      <Input
                        id="total_hours"
                        type="number"
                        step="0.5"
                        value={formData.total_hours.toString()}
                        onChange={(e) => setFormData({ ...formData, total_hours: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourly_rate">Hourly Rate *</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        step="0.01"
                        value={formData.hourly_rate.toString()}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sign_in_time">Sign In Time</Label>
                      <Input
                        id="sign_in_time"
                        type="time"
                        value={formData.sign_in_time}
                        onChange={(e) => setFormData({ ...formData, sign_in_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sign_out_time">Sign Out Time</Label>
                      <Input
                        id="sign_out_time"
                        type="time"
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
                      placeholder="Additional notes or comments"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Creating..." : "Create Working Hours"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Client</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Project</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkingHours.map((hours) => (
                <tr key={hours.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">
                    {profiles.find(profile => profile.id === hours.profile_id)?.full_name || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {clients.find(client => client.id === hours.client_id)?.company || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {projects.find(project => project.id === hours.project_id)?.name || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(hours.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {hours.total_hours.toFixed(1)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={`capitalize ${
                      hours.status === 'pending'
                        ? 'text-yellow-600 border-yellow-600'
                        : hours.status === 'approved'
                          ? 'text-green-600 border-green-600'
                          : hours.status === 'rejected'
                            ? 'text-red-600 border-red-600'
                            : 'text-gray-600 border-gray-600'
                    }`}>
                      {hours.status}
                    </Badge>
                  </td>
                  <td className="text-right py-3 px-4">
                    <WorkingHoursActions
                      workingHour={hours}
                      onApprove={handleApprove}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onView={handleView}
                    />
                  </td>
                </tr>
              ))}
              {filteredWorkingHours.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No working hours records found</p>
                    <p className="text-sm">Add working hours to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      <EditWorkingHoursDialog
        isOpen={isEditDialogOpen}
        onClose={() => { setIsEditDialogOpen(false); setEditingHours(null); }}
        onSubmit={handleEditSubmit}
        workingHours={editingHours}
        profiles={profiles}
        clients={clients}
        projects={projects}
        loading={loading}
      />
    </Card>
  );
};
