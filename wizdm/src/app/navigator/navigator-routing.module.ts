import { ContentRouterModule, RoutesWithContent } from '@wizdm/content';
import { BackLinkObserver, LogoutLinkObserver, CloseLinkObserver, WelcomeBack } from './utils';
import { matchUserNameOnly } from 'app/pages/profile/matcher';
import { matchFullPath } from 'app/pages/static/static-matcher';
import { NavigatorComponent } from './navigator.component';
import { Oauth2Handler } from 'app/utils/oauth2-handler';
import { LazyDialogLoader } from '@wizdm/lazy-dialog';
import { RedirectService } from '@wizdm/redirect';
import { UserPreferences } from 'app/utils/user';

import { NgModule } from '@angular/core';

const routes: RoutesWithContent = [

  // Auth handler (for firebase password confirmation/reset and stuff)
  { path: 'auth/action', pathMatch: 'full', canActivate: [ Oauth2Handler ] },

  // External links redirection helper
  { path: 'redirect', canActivate: [ RedirectService ] },

  // Custom action links at root level
  { path: 'back', canActivate: [ BackLinkObserver ] },
  { path: 'logout', canActivate: [ LogoutLinkObserver ] },
  { path: 'close', canActivate: [ CloseLinkObserver ] },
  
  // Enables language autodetection on empty routes
  { path: '', redirectTo: 'auto', pathMatch: 'full' },
  
  // Loads te main window (navigator) together with the localized content 
  {
    path: ':lang',    
    component: NavigatorComponent,    
    canActivate: [ UserPreferences ],
    content: 'navigator',
    
    children: [

      // Children action links redirecting to their root's counterparts
      { path: 'back', redirectTo: '/back' },
      { path: 'logout', redirectTo: '/logout' },
      { path: 'close', redirectTo: '/close' },

      // Not found page
      { path: 'not-found', loadChildren: () => import('../pages/not-found/not-found.module').then(m => m.NotFoundModule) },
      { path: '404', redirectTo: 'not-found', pathMatch: 'full' },

      // Home -> Landing page or Welcome Back
      { path: '', pathMatch: 'full', loadChildren: () => import('../pages/landing/landing.module').then(m => m.LandingModule), canActivate: [ WelcomeBack ] },
      { path: 'home', redirectTo: '', pathMatch: 'full' },
      
      // Content browsing
      { path: 'explore', loadChildren: () => import('../pages/explore/explore.module').then(m => m.ExploreModule) },
      { path: 'welcome-back', redirectTo: 'explore', pathMatch: 'full' }, 

      // Instant messaging
      { path: 'chat', loadChildren: () => import('../pages/chat/chat.module').then(m => m.ChatModule) },

      // User's profile (matching @username)
      { matcher: matchUserNameOnly, loadChildren: () => import('../pages/profile/profile.module').then(m => m.ProfileModule) },

      // Donate
      { path: 'donate', loadChildren: () => import('../pages/donate/donate.module').then(m => m.DonateModule) },

      // Settings
      { path: 'settings', loadChildren: () => import('../pages/settings/settings.module').then(m => m.SettingsModule) },

      // Admin tools
      { path: 'admin', loadChildren: () => import('../pages/admin/admin.module').then(m => m.AdminModule) },
      
       // Login dialog
      { path: 'login', loadChildren: () => import('../dialogs/login/login.module').then(m => m.LoginModule), canActivate: [ LazyDialogLoader ] },

      // Feedback dialog
      { path: 'contact', loadChildren: () => import('../dialogs/feedback/feedback.module').then(m => m.FeedbackModule), canActivate: [ LazyDialogLoader ] },

      // Payments dialog
      //{ path: 'pay', loadChildren: () => import('../dialogs/pay/pay.module').then(m => m.PayModule), canActivate: [ LazyDialogLoader ] },
      
      // Docs (using static docs subfolder)
      { path: 'docs', redirectTo: 'docs/start', pathMatch: 'full' },
      
      // Static content pages (about, terms, docs/...), redirecting to NotFound when no content is available
      { matcher: matchFullPath, loadChildren: () => import('../pages/static/static.module').then(m => m.StaticModule) },

      // Anything else will route to not found
      { path: '**', redirectTo: 'not-found' }
    ]
  }
];

@NgModule({
  imports: [ ContentRouterModule.forChild(routes) ],
  exports: [ ContentRouterModule ],
  providers: [ WelcomeBack, UserPreferences, LazyDialogLoader ]
})
export class NavRoutingModule {}
