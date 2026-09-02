import { Routes, Route } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { HomePage } from "../pages/HomePage";
import { MapSearchPage } from "../pages/MapSearchPage";
import { ListingDetailPage } from "../pages/ListingDetailPage";
import { ProfilePage } from "../pages/ProfilePage";
import { PublicProfilePage } from "../pages/PublicProfilePage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { CreateAccommodationPage } from "../pages/CreateAccommodationPage";
import { CreateListingPage } from "../pages/CreateListingPage";
import { MyAccommodationsPage } from "../pages/MyAccommodationsPage";
import { MyListingsPage } from "../pages/MyListingsPage";
import { EditAccommodationPage } from "../pages/EditAccommodationPage";
import { EditListingPage } from "../pages/EditListingPage";
import { MyRequestsPage } from "../pages/MyRequestsPage";
import { ReceivedRequestsPage } from "../pages/ReceivedRequestsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { AdminPage } from "../pages/AdminPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Admin Moderation Portal */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />

      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<MapSearchPage />} />
      <Route path="/listings/:id" element={<ListingDetailPage />} />
      <Route path="/users/:id" element={<PublicProfilePage />} />
      <Route path="/profile/:id" element={<PublicProfilePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      {/* Protected: requires authentication */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-accommodation"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <CreateAccommodationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-listing"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <CreateListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-accommodations"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <MyAccommodationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-listings"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <MyListingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-requests"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <MyRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/received-requests"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <ReceivedRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-accommodation/:id"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <EditAccommodationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-listing/:id"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <EditListingPage />
          </ProtectedRoute>
        }
      />
      {/* Fallback route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
