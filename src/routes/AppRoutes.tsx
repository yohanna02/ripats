import { Navigate, Route, Routes } from "react-router-dom";
import WorkspaceFrame from "../components/layout/AppFrame";
import AdminFrame from "../components/layout/AdminFrame";
import Guard from "../components/layout/Guard";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import AdminAccessReviews from "../pages/admin/AccessReviews";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminDocumentation from "../pages/admin/Documentation";
import AdminNewResearch from "../pages/admin/NewResearch";
import AdminReports from "../pages/admin/Reports";
import AdminResearchRegistry from "../pages/admin/ResearchRegistry";
import AdminResearchDetail from "../pages/admin/ResearchDetail";
import AdminSecurity from "../pages/admin/Security";
import AdminUsers from "../pages/admin/Users";
import UserAccessRequests from "../pages/app/AccessRequests";
import UserAccessReviews from "../pages/app/AccessReviews";
import UserDashboard from "../pages/app/Dashboard";
import UserDocumentation from "../pages/app/Documentation";
import UserNewResearch from "../pages/app/NewResearch";
import UserResearchDetail from "../pages/app/ResearchDetail";
import UserResearchRegistry from "../pages/app/ResearchRegistry";
import Home from "../pages/Home/Home";
import InnovationProfile from "../pages/PublicArchive/InnovationProfile";
import PublicArchive from "../pages/PublicArchive/PublicArchive";
import { SetupAccount, SetupAdminPage } from "../features/auth/setupScreens";
import SettingsPage from "../features/account/SettingsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/research" element={<PublicArchive />} />
      <Route path="/research/:researchId" element={<InnovationProfile />} />
      <Route path="/documentation" element={<UserDocumentation />} />
      <Route path="/sign-in" element={<Login />} />
      <Route path="/sign-up" element={<Register />} />
      <Route element={<Guard needsProfile={false} />}>
        <Route path="/setup-account" element={<SetupAccount />} />
        <Route path="/setup-administrator" element={<SetupAdminPage />} />
      </Route>
      <Route element={<Guard />}>
        <Route path="/app" element={<WorkspaceFrame />}>
          <Route path="research/:id" element={<UserResearchDetail />} />
          <Route element={<Guard roles={["researcher", "partner", "supervisor"]} />}>
            <Route index element={<UserDashboard />} />
            <Route path="research" element={<UserResearchRegistry />} />
            <Route element={<Guard roles={["researcher", "partner", "supervisor"]} />}>
              <Route path="research/new" element={<UserNewResearch />} />
            </Route>
            <Route path="access" element={<UserAccessRequests />} />
            <Route path="reviews" element={<UserAccessReviews />} />
            <Route path="profile" element={<SettingsPage />} />
            <Route path="documentation" element={<UserDocumentation />} />
          </Route>
        </Route>
        <Route path="/admin" element={<AdminFrame />}>
          <Route element={<Guard roles={["administrator", "ip_officer", "security_officer"]} />}>
            <Route index element={<AdminDashboard />} />
            <Route path="security" element={<AdminSecurity />} />
            <Route path="documentation" element={<AdminDocumentation />} />
            <Route path="profile" element={<SettingsPage />} />
          </Route>
          <Route element={<Guard roles={["administrator", "ip_officer"]} />}>
            <Route path="research" element={<AdminResearchRegistry />} />
            <Route path="research/new" element={<AdminNewResearch />} />
            <Route path="research/:id" element={<AdminResearchDetail />} />
            <Route path="access" element={<AdminAccessReviews />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
          <Route element={<Guard roles={["administrator"]} />}>
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
