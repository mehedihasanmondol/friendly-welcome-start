import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Calendar, FileText, Download, Plus, Printer, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Profile, Payroll, WorkingHour, Client, Project, SalarySheet } from "@/types/database";
import { SalarySheetPrintView } from "./SalarySheetPrintView";

interface SalarySheetManagerProps {
  profiles: Profile[];
  payrolls: Payroll[];
  workingHours: WorkingHour[];
  clients: Client[];
  projects: Project[];
  onRefresh: () => void;
}

export const SalarySheetManager = ({ profiles, payrolls, workingHours, clients, projects, onRefresh }: SalarySheetManagerProps) => {
  const [salarySheets, setSalarySheets] = useState<SalarySheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateShortcut, setDateShortcut] = useState("current-month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSheet, setSelectedSheet] = useState<SalarySheet | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSalarySheets();
  }, []);

  useEffect(() => {
    if (dateShortcut) {
      handleDateShortcut(dateShortcut);
    }
  }, [dateShortcut]);

  const fetchSalarySheets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salary_sheets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSalarySheets(data as SalarySheet[]);
    } catch (error) {
      console.error('Error fetching salary sheets:', error);
      toast({
        title: "Error",
        description: "Failed to load salary sheets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateShortcut = (shortcut: string) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    let start: Date, end: Date;
    
    switch (shortcut) {
      case "current-month":
        start = new Date(currentYear, currentMonth, 1);
        end = new Date(currentYear, currentMonth + 1, 0);
        break;
        
      case "last-month":
        start = new Date(currentYear, currentMonth - 1, 1);
        end = new Date(currentYear, currentMonth, 0);
        break;
        
      case "this-year":
        start = new Date(currentYear, 0, 1);
        end = new Date(currentYear, 11, 31);
        break;
        
      default:
        // Handle month shortcuts (january, february, etc.)
        const monthNames = [
          "january", "february", "march", "april", "may", "june",
          "july", "august", "september", "october", "november", "december"
        ];
        const monthIndex = monthNames.indexOf(shortcut.toLowerCase());
        if (monthIndex !== -1) {
          start = new Date(currentYear, monthIndex, 1);
          end = new Date(currentYear, monthIndex + 1, 0);
        } else {
          return;
        }
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleCreateSalarySheet = async (formData: any) => {
    try {
      setLoading(true);
      
      // Create salary sheet logic
      const { data, error } = await supabase
        .from('salary_sheets')
        .insert([{
          profile_id: formData.profile_id,
          employee_name: profiles.find(p => p.id === formData.profile_id)?.full_name || '',
          pay_period_start: formData.pay_period_start,
          pay_period_end: formData.pay_period_end,
          gross_salary: formData.gross_salary,
          deductions: formData.deductions,
          net_salary: formData.net_salary,
          status: 'draft'
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Salary sheet created successfully"
      });
      
      setIsCreateDialogOpen(false);
      fetchSalarySheets();
      onRefresh();
    } catch (error: any) {
      console.error('Error creating salary sheet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create salary sheet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewSalarySheet = (sheet: SalarySheet) => {
    setSelectedSheet(sheet);
    setIsPrintDialogOpen(true);
  };

  const handleDownloadSalarySheet = (sheet: SalarySheet) => {
    // Download logic
    toast({
      title: "Download Started",
      description: `Downloading salary sheet for ${sheet.employee_name}`
    });
  };

  const generateShortcutOptions = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const options = [
      { value: "current-month", label: "Current Month" },
      { value: "last-month", label: "Last Month" },
    ];
    
    // Add months from current month down to January
    for (let i = currentMonth; i >= 0; i--) {
      options.push({
        value: monthNames[i].toLowerCase(),
        label: monthNames[i]
      });
    }
    
    options.push({ value: "this-year", label: "This Year" });
    
    return options;
  };

  const filteredSheets = salarySheets.filter(sheet => {
    const matchesSearch = sheet.employee_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sheet.status === statusFilter;
    const matchesProfile = profileFilter === "all" || sheet.profile_id === profileFilter;
    
    let matchesDate = true;
    if (startDate && endDate) {
      const sheetDate = new Date(sheet.pay_period_start);
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      
      matchesDate = sheetDate >= filterStart && sheetDate <= filterEnd;
    }
    
    return matchesSearch && matchesStatus && matchesProfile && matchesDate;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Salary Sheet Management
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Salary Sheet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Generate New Salary Sheet</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = {
                    profile_id: formData.get('profile_id') as string,
                    pay_period_start: formData.get('pay_period_start') as string,
                    pay_period_end: formData.get('pay_period_end') as string,
                    gross_salary: parseFloat(formData.get('gross_salary') as string),
                    deductions: parseFloat(formData.get('deductions') as string),
                    net_salary: parseFloat(formData.get('net_salary') as string),
                  };
                  handleCreateSalarySheet(data);
                }} className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Employee</label>
                    <Select name="profile_id" required>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Period Start</label>
                      <Input name="pay_period_start" type="date" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Period End</label>
                      <Input name="pay_period_end" type="date" required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Gross Salary</label>
                      <Input name="gross_salary" type="number" step="0.01" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Deductions</label>
                      <Input name="deductions" type="number" step="0.01" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Net Salary</label>
                      <Input name="net_salary" type="number" step="0.01" required />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Generating..." : "Generate Salary Sheet"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Desktop filters - side by side */}
          <div className="hidden lg:block space-y-4 mt-4">
            {/* Date filters row */}
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600 mb-1 block">Period</label>
                <Select value={dateShortcut} onValueChange={handleDateShortcut}>
                  <SelectTrigger>
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateShortcutOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600 mb-1 block">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600 mb-1 block">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="col-span-3">
                <label className="text-sm font-medium text-gray-600 mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            {/* Other filters row */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <label className="text-sm font-medium text-gray-600 mb-1 block">Employee</label>
                <Select value={profileFilter} onValueChange={setProfileFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3">
                <label className="text-sm font-medium text-gray-600 mb-1 block">Client</label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3">
                <label className="text-sm font-medium text-gray-600 mb-1 block">Project</label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3">
                <label className="text-sm font-medium text-gray-600 mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="finalized">Finalized</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Mobile filters - original compact layout */}
          <div className="lg:hidden space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Select value={dateShortcut} onValueChange={handleDateShortcut}>
                <SelectTrigger>
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  {generateShortcutOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="finalized">Finalized</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10"
                  placeholder="Start Date"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                  placeholder="End Date"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-500 text-sm">Loading salary sheets...</div>
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Pay Period</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Gross Salary</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Deductions</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Net Salary</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSheets.map((sheet) => (
                      <tr key={sheet.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{sheet.employee_name}</div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(sheet.pay_period_start).toLocaleDateString()} - {new Date(sheet.pay_period_end).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">${sheet.gross_salary.toFixed(2)}</td>
                        <td className="py-3 px-4 text-red-600">${sheet.deductions.toFixed(2)}</td>
                        <td className="py-3 px-4 font-medium text-green-600">${sheet.net_salary.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            sheet.status === 'sent' ? 'default' :
                            sheet.status === 'finalized' ? 'secondary' : 'outline'
                          }>
                            {sheet.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2 items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSalarySheet(sheet)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadSalarySheet(sheet)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredSheets.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          No salary sheets found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="lg:hidden space-y-3">
                {filteredSheets.map((sheet) => (
                  <Card key={sheet.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header with employee info and status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">
                              {sheet.employee_name}
                            </h4>
                            <p className="text-xs text-gray-600 truncate">
                              {new Date(sheet.pay_period_start).toLocaleDateString()} - {new Date(sheet.pay_period_end).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <Badge variant={
                              sheet.status === 'sent' ? 'default' :
                              sheet.status === 'finalized' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {sheet.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Financial details grid */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <div className="text-xs text-purple-600 font-medium">Gross</div>
                            <div className="text-sm font-semibold text-purple-700">${sheet.gross_salary.toFixed(2)}</div>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded">
                            <div className="text-xs text-red-600 font-medium">Deductions</div>
                            <div className="text-sm font-semibold text-red-700">${sheet.deductions.toFixed(2)}</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="text-xs text-green-600 font-medium">Net</div>
                            <div className="text-sm font-semibold text-green-700">${sheet.net_salary.toFixed(2)}</div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSalarySheet(sheet)}
                            className="flex-1 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadSalarySheet(sheet)}
                            className="flex-1 text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredSheets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-base font-medium mb-2">No salary sheets found</div>
                    <p className="text-sm">Try adjusting your filters or date range</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Salary Sheet</span>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedSheet && (
            <SalarySheetPrintView sheet={selectedSheet} profile={profiles.find(p => p.id === selectedSheet.profile_id)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
