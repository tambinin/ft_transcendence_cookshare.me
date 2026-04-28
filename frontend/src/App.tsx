import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import ScrollToTop from './components/ScrollToTop'
import { RecipeProvider } from './contexts/recipe.context'
import { FeedProvider } from './contexts/feed.context'
import { ShoppingListProvider } from './contexts/shoppingList.context'
import { FollowProvider } from './contexts/follow.context'
import { FavoriteProvider } from './contexts/favorite.context'
import './App.css'

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Home = lazy(() => import('./pages/Home'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const EmailVerify = lazy(() => import('./pages/EmailVerify'))
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'))
const Settings = lazy(() => import('./pages/Settings'))
const Profile = lazy(() => import('./pages/Profile'))
// Recipe page removed — modal is used instead
const NotFound = lazy(() => import('./pages/404'))
const Messenger = lazy(() => import('./pages/Messenger'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const ChatBot = lazy(() => import('./components/ChatBot/ChatBot'))

// Lazy-loaded feeds
const PostFeed = lazy(() => import('./components/Feeds/PostFeed'))
const ForYouFeed = lazy(() => import('./components/Feeds/ForYouFeed'))
const InvitationFeed = lazy(() => import('./components/Feeds/InvitationFeed'))
const FriendsFeed = lazy(() => import('./components/Feeds/FriendsFeed'))
const OwnRecipeFeed = lazy(() => import('./components/Feeds/OwnRecipeFeed'))
const MealPlanFeed = lazy(() => import('./components/Feeds/MealPlanFeed'))
const ShoppingListFeed = lazy(() => import('./components/Feeds/ShoppingListFeed'))
const CollectionFeed = lazy(() => import('./components/Feeds/CollectionFeed'))

function App() {
  const location = useLocation();
  const showChatBot = location.pathname.startsWith('/home');

  return (
    <FeedProvider>
    <FollowProvider>
    <FavoriteProvider>
    <RecipeProvider>
    <ShoppingListProvider>
      <ScrollToTop />
      <Suspense fallback={
        <div className="min-h-screen bg-[#0d1117] animate-pulse">
          <div className="h-16 bg-white/5 border-b border-white/5" />
          <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-64 bg-white/5 rounded-xl" />
            <div className="h-64 bg-white/5 rounded-xl" />
          </div>
        </div>
      }>
      <Routes key={location.key}>
          {/* Routes publiques — accessibles sans authentification */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<PublicRoute redirectIfAuth><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute redirectIfAuth><Register /></PublicRoute>} />
          <Route path="/email-verify" element={<EmailVerify />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Routes protégées — nécessitent un token JWT valide */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          {/* Recipe page removed — use RecipeModal instead */}
          <Route path="/messenger/:userId?" element={<ProtectedRoute><Messenger /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>}>
            <Route index element={<Navigate to="feed" replace />} />
            <Route path="feed" element={<PostFeed />} />
            <Route path="for-you" element={<ForYouFeed />} />
            <Route path="friends" element={<FriendsFeed />} />
            <Route path="invitations" element={<InvitationFeed />} />
            <Route path="my-recipes" element={<OwnRecipeFeed />} />
            <Route path="meal-plan" element={<MealPlanFeed />} />
            <Route path="shopping-list" element={<ShoppingListFeed />} />
            <Route path="collections" element={<CollectionFeed />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        {showChatBot && <ChatBot />}
      </Suspense>
    </ShoppingListProvider>
    </RecipeProvider>
    </FavoriteProvider>
    </FollowProvider>
    </FeedProvider>
  )
}

export default App
