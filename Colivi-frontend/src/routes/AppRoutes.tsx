import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { HomePage } from "../pages/HomePage";
import { MapSearchPage } from "../pages/MapSearchPage";
import { ListingDetailPage } from "../pages/ListingDetailPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { CreateAccommodationPage } from "../pages/CreateAccommodationPage";
import { CreateListingPage } from "../pages/CreateListingPage";
import { MyAccommodationsPage } from "../pages/MyAccommodationsPage";
import { MyListingsPage } from "../pages/MyListingsPage";
import { EditAccommodationPage } from "../pages/EditAccommodationPage";
import { EditListingPage } from "../pages/EditListingPage";
import { ProtectedRoute } from "./ProtectedRoute";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<MapSearchPage />} />
      <Route path="/listings/:id" element={<ListingDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      {/* Protected: requires authentication */}
      <Route
        path="/create-accommodation"
        element={
          <ProtectedRoute>
            <CreateAccommodationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-listing"
        element={
          <ProtectedRoute>
            <CreateListingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-accommodations"
        element={
          <ProtectedRoute>
            <MyAccommodationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-listings"
        element={
          <ProtectedRoute>
            <MyListingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-accommodation/:id"
        element={
          <ProtectedRoute>
            <EditAccommodationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-listing/:id"
        element={
          <ProtectedRoute>
            <EditListingPage />
          </ProtectedRoute>
        }
      />
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
