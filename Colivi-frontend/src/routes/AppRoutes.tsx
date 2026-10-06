import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";

const LoginPage = lazy(() => import("../pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("../pages/RegisterPage").then(m => ({ default: m.RegisterPage })));
const HomePage = lazy(() => import("../pages/HomePage").then(m => ({ default: m.HomePage })));
const MapSearchPage = lazy(() => import("../pages/MapSearchPage").then(m => ({ default: m.MapSearchPage })));
const ListingDetailPage = lazy(() => import("../pages/ListingDetailPage").then(m => ({ default: m.ListingDetailPage })));
const ProfilePage = lazy(() => import("../pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const PublicProfilePage = lazy(() => import("../pages/PublicProfilePage").then(m => ({ default: m.PublicProfilePage })));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const RequestReactivationPage = lazy(() => import("../pages/RequestReactivationPage").then(m => ({ default: m.RequestReactivationPage })));
const ReactivateAccountPage = lazy(() => import("../pages/ReactivateAccountPage").then(m => ({ default: m.ReactivateAccountPage })));
const CreateAccommodationPage = lazy(() => import("../pages/CreateAccommodationPage").then(m => ({ default: m.CreateAccommodationPage })));
const CreateListingPage = lazy(() => import("../pages/CreateListingPage").then(m => ({ default: m.CreateListingPage })));
const MyAccommodationsPage = lazy(() => import("../pages/MyAccommodationsPage").then(m => ({ default: m.MyAccommodationsPage })));
const MyListingsPage = lazy(() => import("../pages/MyListingsPage").then(m => ({ default: m.MyListingsPage })));
const EditAccommodationPage = lazy(() => import("../pages/EditAccommodationPage").then(m => ({ default: m.EditAccommodationPage })));
const EditListingPage = lazy(() => import("../pages/EditListingPage").then(m => ({ default: m.EditListingPage })));
const MyRequestsPage = lazy(() => import("../pages/MyRequestsPage").then(m => ({ default: m.MyRequestsPage })));
const ReceivedRequestsPage = lazy(() => import("../pages/ReceivedRequestsPage").then(m => ({ default: m.ReceivedRequestsPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
const AdminPage = lazy(() => import("../pages/AdminPage").then(m => ({ default: m.AdminPage })));
const HomesPage = lazy(() => import("../pages/HomesPage").then(m => ({ default: m.HomesPage })));
const ArchivedHomesPage = lazy(() => import("../pages/ArchivedHomesPage").then(m => ({ default: m.ArchivedHomesPage })));
const HomeDetailPage = lazy(() => import("../pages/HomeDetailPage").then(m => ({ default: m.HomeDetailPage })));
const MessagesPage = lazy(() => import("../pages/MessagesPage").then(m => ({ default: m.MessagesPage })));
const TermsPage = lazy(() => import("../pages/TermsPage").then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("../pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const CookiesPage = lazy(() => import("../pages/CookiesPage").then(m => ({ default: m.CookiesPage })));
const ContactPage = lazy(() => import("../pages/ContactPage").then(m => ({ default: m.ContactPage })));

const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-[#9f3c16]/20 border-t-[#9f3c16] rounded-full animate-spin" />
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
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
      <Route path="/reactivate-request" element={<RequestReactivationPage />} />
      <Route path="/reactivate" element={<ReactivateAccountPage />} />
      {/* Compliance and Informational Routes */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/contact" element={<ContactPage />} />
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
        path="/messages"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <MessagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/:conversationId"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <MessagesPage />
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
      <Route
        path="/homes"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <HomesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/homes/archived"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <ArchivedHomesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/homes/:id"
        element={
          <ProtectedRoute forbiddenRoles={['ADMIN']}>
            <HomeDetailPage />
          </ProtectedRoute>
        }
      />
      {/* Fallback route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
};
