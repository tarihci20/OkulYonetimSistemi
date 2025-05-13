import React from 'react';
import DashboardLayout from "@/components/layout/dashboard-layout";
import ScheduleManagement from '@/components/admin/schedule-management';

const ScheduleManagementPage: React.FC = () => {
  return (
    <DashboardLayout>
      <ScheduleManagement />
    </DashboardLayout>
  );
};

export default ScheduleManagementPage;