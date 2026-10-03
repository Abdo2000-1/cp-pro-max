import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { lazy, Suspense, useEffect } from 'react';

import { LoadingState } from '@/components/ui/LoadingState';
import { StateInspectorFloat } from '@/components/ui/StateInspectorFloat';

// Target 8 Modernized Pages
const Flow = lazy(() => import('@/pages/Flow'));
const AddCase = lazy(() => import('@/pages/AddCase'));
const OrderDetailsPage = lazy(() => import('@/pages/OrderDetailsPage'));
const QuarterTargetsReport = lazy(() => import('@/pages/QuarterTargetsReport'));
const Task47ModelWorkReport = lazy(() => import('@/pages/Task47ModelWorkReport'));
const Task31StaffTargets = lazy(() => import('@/pages/Task31StaffTargets'));
const EditCasePage = lazy(() => import('@/pages/EditCasePage'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));

// Auxiliary ERP & CRM Pages
const Login = lazy(() => import('@/pages/Login'));
const ViewOrder = lazy(() => import('@/pages/ViewOrder'));
const OrderWorkflow = lazy(() => import('@/pages/OrderWorkflow'));
const OrderFiles = lazy(() => import('@/pages/OrderFiles'));
const SubOrderDetail = lazy(() => import('@/pages/SubOrderDetail'));
const Cases = lazy(() => import('@/pages/Cases'));
const CaseDetails = lazy(() => import('@/pages/CaseDetails'));
const Patients = lazy(() => import('@/pages/Patients'));
const PatientDetails = lazy(() => import('@/pages/PatientDetails'));
const Doctors = lazy(() => import('@/pages/Doctors'));
const DoctorDetails = lazy(() => import('@/pages/DoctorDetails'));
const Clinics = lazy(() => import('@/pages/Clinics'));
const ClinicDetails = lazy(() => import('@/pages/ClinicDetails'));
const Billing = lazy(() => import('@/pages/Billing'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const ChangeRequests = lazy(() => import('@/pages/ChangeRequests'));
const ScanCenter = lazy(() => import('@/pages/ScanCenter'));
const WorkflowBoard = lazy(() => import('@/pages/WorkflowBoard'));
const Documents = lazy(() => import('@/pages/Documents'));
const Grid = lazy(() => import('@/pages/Grid'));
const Forms = lazy(() => import('@/pages/Forms'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingState text="Loading 3DDX CP Module..." />}>{children}</Suspense>;
}

// Redirects legacy ?task=... query parameters to modern React routes
function LegacyTaskQueryHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const task = searchParams.get('task');
    if (task && location.pathname === '/') {
      const taskLower = task.toLowerCase();
      if (taskLower === 'flow') {
        navigate('/flow', { replace: true });
      } else if (taskLower === 'addcase') {
        navigate('/add-case', { replace: true });
      } else if (taskLower === 'cpreportviewer') {
        navigate('/quarter-targets', { replace: true });
      } else if (task === '47') {
        navigate('/task-47', { replace: true });
      } else if (task === '31') {
        navigate('/task-31', { replace: true });
      } else if (taskLower === 'editcase') {
        navigate(`/edit-case?${searchParams.toString()}`, { replace: true });
      }
    }
  }, [searchParams, location.pathname, navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <LegacyTaskQueryHandler />
          <Routes>
            <Route path="/login" element={<SuspenseWrapper><Login /></SuspenseWrapper>} />
            <Route path="/" element={<Layout />}>
              {/* Default landing: 3DDX CP PRO MAX Login */}
              <Route index element={<Navigate to="/login" replace />} />
              
              {/* 8 Target Modernized Pages */}
              <Route path="flow" element={<SuspenseWrapper><Flow /></SuspenseWrapper>} />
              <Route path="orders" element={<SuspenseWrapper><Flow /></SuspenseWrapper>} />
              <Route path="add-case" element={<SuspenseWrapper><AddCase /></SuspenseWrapper>} />
              <Route path="order-details" element={<SuspenseWrapper><OrderDetailsPage /></SuspenseWrapper>} />
              <Route path="quarter-targets" element={<SuspenseWrapper><QuarterTargetsReport /></SuspenseWrapper>} />
              <Route path="task-47" element={<SuspenseWrapper><Task47ModelWorkReport /></SuspenseWrapper>} />
              <Route path="task-31" element={<SuspenseWrapper><Task31StaffTargets /></SuspenseWrapper>} />
              <Route path="edit-case" element={<SuspenseWrapper><EditCasePage /></SuspenseWrapper>} />
              <Route path="dashboard" element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
              <Route path="profile" element={<SuspenseWrapper><Profile /></SuspenseWrapper>} />
              <Route path="newcp/index.php" element={<Navigate to="/dashboard" replace />} />

              {/* Auxiliary ERP & CRM Routes */}
              <Route path="orders/:orderId" element={<SuspenseWrapper><ViewOrder /></SuspenseWrapper>} />
              <Route path="orders/:orderId/workflow" element={<SuspenseWrapper><OrderWorkflow /></SuspenseWrapper>} />
              <Route path="orders/:orderId/files" element={<SuspenseWrapper><OrderFiles /></SuspenseWrapper>} />
              <Route path="orders/:orderId/sub-orders/:subOrderId" element={<SuspenseWrapper><SubOrderDetail /></SuspenseWrapper>} />
              <Route path="cases" element={<SuspenseWrapper><Cases /></SuspenseWrapper>} />
              <Route path="cases/:caseId" element={<SuspenseWrapper><CaseDetails /></SuspenseWrapper>} />
              <Route path="patients" element={<SuspenseWrapper><Patients /></SuspenseWrapper>} />
              <Route path="patients/:patientId" element={<SuspenseWrapper><PatientDetails /></SuspenseWrapper>} />
              <Route path="doctors" element={<SuspenseWrapper><Doctors /></SuspenseWrapper>} />
              <Route path="doctors/:doctorId" element={<SuspenseWrapper><DoctorDetails /></SuspenseWrapper>} />
              <Route path="clinics" element={<SuspenseWrapper><Clinics /></SuspenseWrapper>} />
              <Route path="clinics/:clinicId" element={<SuspenseWrapper><ClinicDetails /></SuspenseWrapper>} />
              <Route path="billing" element={<SuspenseWrapper><Billing /></SuspenseWrapper>} />
              <Route path="grid" element={<SuspenseWrapper><Grid /></SuspenseWrapper>} />
              <Route path="forms" element={<SuspenseWrapper><Forms /></SuspenseWrapper>} />
              <Route path="reports" element={<SuspenseWrapper><Reports /></SuspenseWrapper>} />
              <Route path="settings" element={<SuspenseWrapper><Settings /></SuspenseWrapper>} />
              <Route path="notifications" element={<SuspenseWrapper><Notifications /></SuspenseWrapper>} />
              <Route path="change-requests" element={<SuspenseWrapper><ChangeRequests /></SuspenseWrapper>} />
              <Route path="scan-center" element={<SuspenseWrapper><ScanCenter /></SuspenseWrapper>} />
              <Route path="workflow-board" element={<SuspenseWrapper><WorkflowBoard /></SuspenseWrapper>} />
              <Route path="documents" element={<SuspenseWrapper><Documents /></SuspenseWrapper>} />
            </Route>
            <Route path="*" element={<Navigate to="/flow" replace />} />
          </Routes>
          <StateInspectorFloat />
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
