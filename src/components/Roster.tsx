import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, Users, Clock, MapPin, Search, Edit, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Roster, Profile, Client, Project, RosterProfile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EnhancedRosterCalendarView } from "./roster/EnhancedRosterCalendarView";

export const RosterComponent = () => {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoster, setEditingRoster] = useState<Roster | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    profile_id: "",
    client_id: "",
    project_id: "",
    date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    total_hours: 0,
    notes: "",
    status: "pending" as const,
    expected_profiles: 1,
    per_hour_rate: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rostersRes, profilesRes, clientsRes, projectsRes] = await Promise.all([
        supabase.from('rosters').select(`
          *,
          profiles (id, full_name, email, role, avatar_url, is_active, phone, employment_type, hourly_rate, salary, tax_file_number, start_date, created_at, updated_at),
          clients (id, name, email, phone, company, status, created_at, updated_at),
          projects (id, name, description, client_id, status, start_date, end_date, budget, created_at, updated_at)
        `),
        supabase.from('profiles').select('*'),
        supabase.from('clients').select('*').eq('status', 'active'),
        supabase.from('projects').select('*').eq('status', 'active')
      ]);

      if (rostersRes.error) throw rostersRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setRosters(rostersRes.data as Roster[]);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  const openDialog = () => {
    setIsDialogOpen(true);
    setEditingRoster(null);
    resetForm();
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRoster(null);
    resetForm();
  };

  const editRoster = (roster: Roster) => {
    setEditingRoster(roster);
    setFormData({
      name: roster.name || "",
      profile_id: roster.profile_id,
      client_id: roster.client_id,
      project_id: roster.project_id,
      date: roster.date,
      end_date: roster.end_date || "",
      start_time: roster.start_time,
      end_time: roster.end_time,
      total_hours: roster.total_hours,
      notes: roster.notes || "",
      status: roster.status,
      expected_profiles: roster.expected_profiles || 1,
      per_hour_rate: roster.per_hour_rate || 0
    });
    setIsDialogOpen(true);
  };

  const deleteRoster = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this roster?")) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('rosters').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Roster deleted successfully" });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting roster:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      profile_id: "",
      client_id: "",
      project_id: "",
      date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      total_hours: 0,
      notes: "",
      status: "pending" as const,
      expected_profiles: 1,
      per_hour_rate: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rosterData = {
        name: formData.name,
        profile_id: formData.profile_id,
        client_id: formData.client_id,
        project_id: formData.project_id,
        date: formData.date,
        end_date: formData.end_date || null,
        start_time: formData.start_time,
        end_time: formData.end_time,
        total_hours: formData.total_hours,
        notes: formData.notes,
        status: formData.status,
        expected_profiles: formData.expected_profiles,
        per_hour_rate: formData.per_hour_rate
      };

      if (editingRoster) {
        const { error } = await supabase
          .from('rosters')
          .update(rosterData)
          .eq('id', editingRoster.id);
        if (error) throw error;
        toast({ title: "Success", description: "Roster updated successfully" });
      } else {
        const { error } = await supabase
          .from('rosters')
          .insert([rosterData]);
        if (error) throw error;
        toast({ title: "Success", description: "Roster created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving roster:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRosters = rosters.filter(roster => {
    const searchTermLower = searchTerm.toLowerCase();
    const profileName = roster.profiles?.full_name?.toLowerCase() || '';
    const clientName = roster.clients?.name?.toLowerCase() || '';
    const projectName = roster.projects?.name?.toLowerCase() || '';

    const matchesSearchTerm =
      profileName.includes(searchTermLower) ||
      clientName.includes(searchTermLower) ||
      projectName.includes(searchTermLower) ||
      roster.name?.toLowerCase().includes(searchTermLower);

    const matchesStatusFilter = statusFilter === "all" || roster.status === statusFilter;

    return matchesSearchTerm && matchesStatusFilter;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Roster Management</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by employee, client, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setViewMode(viewMode === "table" ? "calendar" : "table")}>
              {viewMode === "table" ? "View Calendar" : "View Table"}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Roster
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editingRoster ? "Edit Roster" : "Create New Roster"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Roster Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="profile_id">Employee *</Label>
                      <Select value={formData.profile_id} onValueChange={(value) => handleSelectChange("profile_id", value)}>
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
                      <Select value={formData.client_id} onValueChange={(value) => handleSelectChange("client_id", value)}>
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
                      <Select value={formData.project_id} onValueChange={(value) => handleSelectChange("project_id", value)}>
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
                      <Label htmlFor="date">Start Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="total_hours">Total Hours *</Label>
                      <Input
                        id="total_hours"
                        type="number"
                        value={formData.total_hours}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="expected_profiles">Expected Profiles</Label>
                      <Input
                        id="expected_profiles"
                        type="number"
                        value={formData.expected_profiles}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="per_hour_rate">Per Hour Rate</Label>
                      <Input
                        id="per_hour_rate"
                        type="number"
                        value={formData.per_hour_rate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status *</Label>
                      <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Additional notes for the roster"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Saving..." : "Save Roster"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRosters.map((roster) => (
                  <tr key={roster.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{roster.name}</td>
                    <td className="py-3 px-4 text-gray-900">{roster.profiles?.full_name}</td>
                    <td className="py-3 px-4 text-gray-600">{roster.clients?.company}</td>
                    <td className="py-3 px-4 text-gray-600">{roster.projects?.name}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(roster.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{roster.total_hours}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`text-xs font-medium ${roster.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : roster.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {roster.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => editRoster(roster)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteRoster(roster.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRosters.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No roster records found</p>
                      <p className="text-sm">Create a roster to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EnhancedRosterCalendarView rosters={rosters} />
        )}
      </CardContent>
    </Card>
  );
};
