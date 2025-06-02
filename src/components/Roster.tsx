import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, Plus, Edit, Trash2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Roster, Client, Project, Profile, RosterStatus } from "@/types/database";
import { MultipleProfileSelector } from "@/components/common/MultipleProfileSelector";

export const RosterManagement = () => {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoster, setEditingRoster] = useState<Roster | null>(null);
  const [formData, setFormData] = useState({
    profile_id: "",
    client_id: "",
    project_id: "",
    date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    total_hours: "0",
    notes: "",
    status: "pending" as RosterStatus,
    name: "",
    expected_profiles: "1",
    per_hour_rate: "0"
  });
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [rostersRes, clientsRes, projectsRes, profilesRes] = await Promise.all([
        supabase.from('rosters').select('*').order('date', { ascending: false }),
        supabase.from('clients').select('*').order('name'),
        supabase.from('projects').select('*').order('name'),
        supabase.from('profiles').select('*').eq('is_active', true).order('full_name')
      ]);

      if (rostersRes.error) throw rostersRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      setRosters(rostersRes.data as Roster[]);
      setClients(clientsRes.data as Client[]);
      setProjects(projectsRes.data as Project[]);
      setProfiles(profilesRes.data as Profile[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch roster data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      profile_id: "",
      client_id: "",
      project_id: "",
      date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      total_hours: "0",
      notes: "",
      status: "pending",
      name: "",
      expected_profiles: "1",
      per_hour_rate: "0"
    });
    setSelectedProfiles([]);
    setEditingRoster(null);
  };

  const openEditDialog = (roster: Roster) => {
    setFormData({
      profile_id: roster.profile_id,
      client_id: roster.client_id,
      project_id: roster.project_id,
      date: roster.date,
      end_date: roster.end_date || roster.date,
      start_time: roster.start_time,
      end_time: roster.end_time,
      total_hours: roster.total_hours.toString(),
      notes: roster.notes || "",
      status: roster.status,
      name: roster.name || "",
      expected_profiles: roster.expected_profiles?.toString() || "1",
      per_hour_rate: roster.per_hour_rate?.toString() || "0"
    });
    setSelectedProfiles(roster.roster_profiles?.map(rp => rp.profile_id) || []);
    setEditingRoster(roster);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this roster?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('rosters').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Roster deleted successfully" });
      fetchInitialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rosterData = {
        profile_id: formData.profile_id,
        client_id: formData.client_id,
        project_id: formData.project_id,
        date: formData.date,
        end_date: formData.end_date || formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        total_hours: parseFloat(formData.total_hours),
        notes: formData.notes,
        status: formData.status as RosterStatus,
        name: formData.name,
        expected_profiles: parseInt(formData.expected_profiles),
        per_hour_rate: parseFloat(formData.per_hour_rate) || 0
      };

      if (editingRoster) {
        const { error } = await supabase
          .from('rosters')
          .update(rosterData)
          .eq('id', editingRoster.id);
        if (error) throw error;

        // Update roster_profiles assignments
        if (selectedProfiles.length > 0) {
          // Delete existing roster_profiles for this roster
          await supabase.from('roster_profiles').delete().eq('roster_id', editingRoster.id);
          // Insert new roster_profiles
          const rosterProfilesToInsert = selectedProfiles.map(profileId => ({
            roster_id: editingRoster.id,
            profile_id: profileId
          }));
          const { error: rpError } = await supabase.from('roster_profiles').insert(rosterProfilesToInsert);
          if (rpError) throw rpError;
        }

        toast({ title: "Success", description: "Roster updated successfully" });
      } else {
        // For bulk creation
        const rostersToCreate = [];
        let currentDate = new Date(formData.date);
        const endDate = new Date(formData.end_date || formData.date);

        while (currentDate <= endDate) {
          rostersToCreate.push({
            ...rosterData,
            date: currentDate.toISOString().split('T')[0],
            status: formData.status as RosterStatus
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const { error } = await supabase
          .from('rosters')
          .insert(rostersToCreate);
        if (error) throw error;

        // Assign profiles to each created roster
        if (selectedProfiles.length > 0) {
          // Fetch newly created rosters to get their IDs
          const { data: createdRosters, error: fetchError } = await supabase
            .from('rosters')
            .select('id, date')
            .gte('date', formData.date)
            .lte('date', formData.end_date || formData.date);
          if (fetchError) throw fetchError;

          const rosterProfilesToInsert = [];
          for (const roster of createdRosters || []) {
            for (const profileId of selectedProfiles) {
              rosterProfilesToInsert.push({
                roster_id: roster.id,
                profile_id: profileId
              });
            }
          }
          const { error: rpError } = await supabase.from('roster_profiles').insert(rosterProfilesToInsert);
          if (rpError) throw rpError;
        }

        toast({ title: "Success", description: "Rosters created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchInitialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save roster",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Roster Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {editingRoster ? "Edit Roster" : "Create Roster"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingRoster ? "Edit Roster" : "Create Roster"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_id">Client *</Label>
                  <Select
                    id="client_id"
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="project_id">Project *</Label>
                  <Select
                    id="project_id"
                    value={formData.project_id}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects
                        .filter(project => project.client_id === formData.client_id)
                        .map(project => (
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
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
                    step="0.1"
                    min="0"
                    value={formData.total_hours}
                    onChange={(e) => setFormData({ ...formData, total_hours: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="per_hour_rate">Per Hour Rate</Label>
                  <Input
                    id="per_hour_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.per_hour_rate}
                    onChange={(e) => setFormData({ ...formData, per_hour_rate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="expected_profiles">Expected Profiles</Label>
                  <Input
                    id="expected_profiles"
                    type="number"
                    min="1"
                    value={formData.expected_profiles}
                    onChange={(e) => setFormData({ ...formData, expected_profiles: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    id="status"
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as RosterStatus })}
                    required
                  >
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

                <div className="md:col-span-2">
                  <Label htmlFor="name">Roster Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Optional roster name"
                  />
                </div>
              </div>

              <div>
                <Label>Assign Profiles</Label>
                <MultipleProfileSelector
                  profiles={profiles}
                  selectedProfiles={selectedProfiles}
                  onChange={setSelectedProfiles}
                />
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
                {loading ? "Saving..." : editingRoster ? "Update Roster" : "Create Roster"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rosters.map(roster => (
          <Card key={roster.id} className="relative">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{roster.name || `Roster on ${roster.date}`}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(roster)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(roster.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{roster.date}</span>
                  {roster.end_date && roster.end_date !== roster.date && (
                    <>
                      <span>to</span>
                      <span>{roster.end_date}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{roster.start_time} - {roster.end_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>Expected Profiles: {roster.expected_profiles || 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>Client: {clients.find(c => c.id === roster.client_id)?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>Project: {projects.find(p => p.id === roster.project_id)?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold">Status: </span>
                  <Badge variant={
                    roster.status === 'confirmed' ? 'success' :
                    roster.status === 'cancelled' ? 'destructive' : 'default'
                  }>
                    {roster.status.toUpperCase()}
                  </Badge>
                </div>
                {roster.notes && (
                  <div>
                    <span className="font-semibold">Notes: </span>
                    <p className="text-sm text-gray-600">{roster.notes}</p>
                  </div>
                )}
                {roster.roster_profiles && roster.roster_profiles.length > 0 && (
                  <div>
                    <span className="font-semibold">Assigned Profiles:</span>
                    <ul className="list-disc list-inside text-sm">
                      {roster.roster_profiles.map(rp => {
                        const profile = profiles.find(p => p.id === rp.profile_id);
                        return <li key={rp.id}>{profile?.full_name || 'Unknown'}</li>;
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {rosters.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No rosters found</p>
            <p className="text-sm">Create a roster to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};
