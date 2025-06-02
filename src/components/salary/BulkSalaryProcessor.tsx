import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Plus, Play, Pause, RefreshCw, Users, DollarSign, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BulkPayroll, Profile, BulkPayrollStatus, BulkPayrollItemStatus } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { EnhancedProfileSelector } from "./EnhancedProfileSelector";

interface BulkSalaryProcessorProps {
  bulkPayrolls: BulkPayroll[];
  profiles: Profile[];
  onRefresh: () => void;
}

export const BulkSalaryProcessor = ({ bulkPayrolls, profiles, onRefresh }: BulkSalaryProcessorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pay_period_start: "",
    pay_period_end: ""
  });
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingPayrollId, setProcessingPayrollId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (bulkPayrolls.length > 0) {
      setProcessingPayrollId(bulkPayrolls[0].id);
    }
  }, [bulkPayrolls]);

  const handleProfileSelect = (profileIds: string[]) => {
    setSelectedProfiles(profileIds);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, [name]: formattedDate }));
    }
  };

  const startBulkPayroll = async (bulkPayrollId: string) => {
    setProcessingPayrollId(bulkPayrollId);
    setIsProcessing(true);

    try {
      const { data: bulkPayroll, error: bulkPayrollError } = await supabase
        .from('bulk_payroll')
        .select('*')
        .eq('id', bulkPayrollId)
        .single();

      if (bulkPayrollError) throw bulkPayrollError;

      const { data: bulkPayrollItems, error: bulkPayrollItemsError } = await supabase
        .from('bulk_payroll_items')
        .select('*')
        .eq('bulk_payroll_id', bulkPayrollId);

      if (bulkPayrollItemsError) throw bulkPayrollItemsError;

      if (!bulkPayrollItems || bulkPayrollItems.length === 0) {
        toast({
          title: "Error",
          description: "No payroll items found for this bulk payroll.",
          variant: "destructive"
        });
        return;
      }

      // Update bulk payroll status to processing
      const { error: updateError } = await supabase
        .from('bulk_payroll')
        .update({ status: 'processing' as BulkPayrollStatus })
        .eq('id', bulkPayrollId);

      if (updateError) throw updateError;

      // Process each payroll item
      for (const item of bulkPayrollItems) {
        await processPayrollItem(item.id, bulkPayroll);
      }

      // Update bulk payroll status to completed
      const { error: completeError } = await supabase
        .from('bulk_payroll')
        .update({ status: 'completed' as BulkPayrollStatus })
        .eq('id', bulkPayrollId);

      if (completeError) throw completeError;

      toast({
        title: "Success",
        description: "Bulk payroll processing completed successfully."
      });
    } catch (error: any) {
      console.error('Error processing bulk payroll:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process bulk payroll",
        variant: "destructive"
      });
      // Optionally, update bulk payroll status to failed
      await supabase
        .from('bulk_payroll')
        .update({ status: 'failed' as BulkPayrollStatus })
        .eq('id', bulkPayrollId);
    } finally {
      setIsProcessing(false);
      onRefresh();
    }
  };

  const pauseBulkPayroll = () => {
    setIsProcessing(false);
    toast({
      title: "Paused",
      description: "Bulk payroll processing paused."
    });
  };

  const processPayrollItem = async (itemId: string, bulkPayroll: any) => {
    try {
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (bulkPayroll as any).profile_id)
        .single();

      if (profileError) throw profileError;

      // Simulate payroll calculation
      const hourlyRate = profile?.hourly_rate || 25;
      const totalHours = 40;
      const grossPay = hourlyRate * totalHours;
      const deductions = grossPay * 0.1;
      const netPay = grossPay - deductions;

      // Create payroll record
      const { data: payroll, error: payrollError } = await supabase
        .from('payroll')
        .insert([{
          profile_id: (bulkPayroll as any).profile_id,
          pay_period_start: bulkPayroll.pay_period_start,
          pay_period_end: bulkPayroll.pay_period_end,
          total_hours: totalHours,
          hourly_rate: hourlyRate,
          gross_pay: grossPay,
          deductions: deductions,
          net_pay: netPay,
          status: 'pending'
        }])
        .select()
        .single();

      if (payrollError) throw payrollError;

      // Update bulk payroll item status to processed
      const { error: itemUpdateError } = await supabase
        .from('bulk_payroll_items')
        .update({ status: 'processed' as BulkPayrollItemStatus, payroll_id: payroll.id })
        .eq('id', itemId);

      if (itemUpdateError) throw itemUpdateError;

      // Update bulk payroll processed records count
      const { error: bulkUpdateError } = await supabase.rpc('increment_processed_records', { bulk_payroll_id: bulkPayroll.id });
      if (bulkUpdateError) throw bulkUpdateError;

      toast({
        title: "Payroll Processed",
        description: `Payroll processed successfully for item ${itemId}.`
      });
    } catch (error: any) {
      console.error('Error processing payroll item:', error);
      toast({
        title: "Error",
        description: `Failed to process payroll item ${itemId}: ${error.message}`,
        variant: "destructive"
      });
      // Optionally, update bulk payroll item status to failed
      await supabase
        .from('bulk_payroll_items')
        .update({ status: 'failed' as BulkPayrollItemStatus, error_message: error.message })
        .eq('id', itemId);
    } finally {
      onRefresh();
    }
  };

  const createBulkPayroll = async () => {
    if (!formData.name || !formData.pay_period_start || !formData.pay_period_end || selectedProfiles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields and select at least one profile",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: newBulkPayroll, error } = await supabase
        .from('bulk_payroll')
        .insert([{
          name: formData.name,
          description: formData.description,
          pay_period_start: formData.pay_period_start,
          pay_period_end: formData.pay_period_end,
          created_by: (profiles[0] as any).id, // Replace with actual user ID
          status: 'draft' as BulkPayrollStatus,
          total_records: selectedProfiles.length,
          processed_records: 0,
          total_amount: 0
        }])
        .select()
        .single();

      if (error) throw error;

      // Create bulk payroll items
      const bulkItems = selectedProfiles.map(profileId => ({
        bulk_payroll_id: newBulkPayroll.id,
        profile_id: profileId,
        status: 'pending' as BulkPayrollItemStatus
      }));

      const { error: itemsError } = await supabase
        .from('bulk_payroll_items')
        .insert(bulkItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Bulk payroll created successfully"
      });
      setIsDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      console.error('Error creating bulk payroll:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create bulk payroll",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bulk Payroll Processing</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Bulk Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Bulk Payroll</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="pay_period_start">Pay Period Start</Label>
                  <Input
                    type="date"
                    id="pay_period_start"
                    name="pay_period_start"
                    value={formData.pay_period_start}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="pay_period_end">Pay Period End</Label>
                  <Input
                    type="date"
                    id="pay_period_end"
                    name="pay_period_end"
                    value={formData.pay_period_end}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="mt-4">
                <Label>Select Profiles</Label>
                <EnhancedProfileSelector profiles={profiles} onSelect={handleProfileSelect} />
              </div>
              <Button onClick={createBulkPayroll} disabled={loading} className="mt-4">
                {loading ? "Creating..." : "Create"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {bulkPayrolls.length === 0 ? (
          <div className="text-center py-6">
            <Zap className="h-10 w-10 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No bulk payrolls found. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bulkPayrolls.map(bulkPayroll => (
              <Card key={bulkPayroll.id} className="border">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{bulkPayroll.name}</CardTitle>
                  <Badge variant="secondary">{bulkPayroll.status}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{bulkPayroll.description}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span>{bulkPayroll.total_records} profiles</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span>${bulkPayroll.total_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>
                      {new Date(bulkPayroll.pay_period_start).toLocaleDateString()} -{' '}
                      {new Date(bulkPayroll.pay_period_end).toLocaleDateString()}
                    </span>
                  </div>
                  {bulkPayroll.status === 'processing' && (
                    <Progress
                      value={(bulkPayroll.processed_records / bulkPayroll.total_records) * 100}
                      className="mt-4"
                    />
                  )}
                  <div className="mt-4 flex justify-end space-x-2">
                    {bulkPayroll.status === 'draft' && (
                      <Button
                        onClick={() => startBulkPayroll(bulkPayroll.id)}
                        disabled={isProcessing && processingPayrollId !== bulkPayroll.id}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Processing
                      </Button>
                    )}
                    {bulkPayroll.status === 'processing' && (
                      <Button
                        onClick={pauseBulkPayroll}
                        disabled={!isProcessing || processingPayrollId !== bulkPayroll.id}
                        variant="secondary"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={onRefresh}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
