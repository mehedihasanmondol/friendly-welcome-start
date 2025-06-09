import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { PersonalDashboard } from "@/components/PersonalDashboard";
import { ProfileManagement } from "@/components/ProfileManagement";
import { ClientManagement } from "@/components/ClientManagement";
import { ProjectManagement } from "@/components/ProjectManagement";
import { WorkingHoursComponent } from "@/components/WorkingHours";
import { RosterComponent } from "@/components/Roster";
import { PayrollComponent } from "@/components/Payroll";
import { Notifications } from "@/components/Notifications";
import { Reports } from "@/components/Reports";
import { BankBalance } from "@/components/BankBalance";
import { SalaryManagement } from "@/components/SalaryManagement";
import { RolePermissionsManager } from "@/components/RolePermissionsManager";
import { UserMenu } from "@/components/UserMenu";
import { RoleDashboardRouter } from "@/components/RoleDashboardRouter";
import { RosterReport } from "@/components/RosterReport";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { hasPermission } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "personal-dashboard":
        return <PersonalDashboard />;
      case "profiles":
        return <ProfileManagement />;
      case "clients":
        return <ClientManagement />;
      case "projects":
        return <ProjectManagement />;
      case "working-hours":
        return <WorkingHoursComponent />;
      case "roster":
        return <RosterComponent />;
      case "roster-report":
        return <RosterReport />;
      case "payroll":
        return <PayrollComponent />;
      case "salary":
        return <SalaryManagement />;
      case "notifications":
        return <Notifications />;
      case "reports":
        return <Reports />;
      case "bank-balance":
        return <BankBalance />;
      case "permissions":
        return <RolePermissionsManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          hasPermission={hasPermission}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-center p-2 md:p-4">
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Sidebar 
                  activeTab={activeTab} 
                  onTabChange={(tab) => {
                    setActiveTab(tab);
                    setMobileNavOpen(false);
                  }} 
                  hasPermission={hasPermission}
                  onCollapsedChange={() => {}}
                  isMobile={true}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* User Menu */}
          <UserMenu />
        </div>

        {/* Page Content */}
        <div className="p-2 md:p-6">
          <RoleDashboardRouter activeTab={activeTab} setActiveTab={setActiveTab} />
          {renderContent()}
        </div>
      </div>

      {/* Floating Navigation for Mobile */}
      <FloatingNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasPermission={hasPermission}
      />
    </div>
  );
};

export default Index;
