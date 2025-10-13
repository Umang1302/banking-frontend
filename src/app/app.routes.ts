import { Routes } from '@angular/router';
import { rootGuard } from './auth-guard/authorization';
import { roleGuard } from './auth-guard/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./module/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [rootGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./module/dashboard/dashboard-home').then(m => m.DashboardHomeComponent),
        canActivate: [rootGuard, roleGuard]
      },
      {
        path: 'admin',
        loadComponent: () => import('./module/admin/admin-dashboard').then(m => m.AdminDashboardComponent),
        canActivate: [rootGuard, roleGuard]
      },
      {
        path: 'profile',
        loadComponent: () => import('./module/user-profile/user-profile').then(m => m.UserProfileComponent),
        canActivate: [rootGuard, roleGuard]
      },
      {
        path: 'transactions',
        loadComponent: () => import('./module/transaction/transaction').then(m => m.TransactionComponent),
        canActivate: [rootGuard, roleGuard],
        children: [
          {
            path: 'history',
            loadComponent: () => import('./module/transaction/transaction-history/transaction-history').then(m => m.TransactionHistoryComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'create',
            loadComponent: () => import('./module/transaction/create-transaction/create-transaction').then(m => m.CreateTransactionComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'bulk-upload',
            loadComponent: () => import('./module/transaction/bulk-upload/bulk-upload').then(m => m.BulkUploadComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'statements',
            loadComponent: () => import('./module/transaction/statement/statement').then(m => m.StatementComponent),
            canActivate: [rootGuard, roleGuard]
          }
        ]
      },
      {
        path: 'neft',
        canActivate: [rootGuard],
        children: [
          {
            path: '',
            redirectTo: 'transfer',
            pathMatch: 'full'
          },
          {
            path: 'beneficiaries',
            loadComponent: () => import('./module/neft/beneficiary/beneficiary-list/beneficiary-list.component').then(m => m.BeneficiaryListComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'beneficiaries/add',
            loadComponent: () => import('./module/neft/beneficiary/beneficiary-form/beneficiary-form.component').then(m => m.BeneficiaryFormComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'beneficiaries/edit/:id',
            loadComponent: () => import('./module/neft/beneficiary/beneficiary-form/beneficiary-form.component').then(m => m.BeneficiaryFormComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'transfer',
            loadComponent: () => import('./module/neft/transfer/neft-transfer/neft-transfer.component').then(m => m.NeftTransferComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'history',
            loadComponent: () => import('./module/neft/transfer/neft-history/neft-history.component').then(m => m.NeftHistoryComponent),
            canActivate: [rootGuard, roleGuard]
          }
        ]
      },
      {
        path: 'admin-neft',
        canActivate: [rootGuard],
        children: [
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./module/neft/admin/admin-neft-dashboard/admin-neft-dashboard.component').then(m => m.AdminNeftDashboardComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'batches',
            loadComponent: () => import('./module/neft/admin/batch-list/batch-list.component').then(m => m.BatchListComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'batches/:batchId',
            loadComponent: () => import('./module/neft/admin/batch-details/batch-details.component').then(m => m.BatchDetailsComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'transactions',
            loadComponent: () => import('./module/neft/admin/transaction-list/transaction-list.component').then(m => m.TransactionListComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'transactions/:reference',
            loadComponent: () => import('./module/neft/admin/transaction-details/transaction-details.component').then(m => m.TransactionDetailsComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'beneficiaries',
            loadComponent: () => import('./module/neft/admin/beneficiary-management/beneficiary-management.component').then(m => m.BeneficiaryManagementComponent),
            canActivate: [rootGuard, roleGuard]
          }
        ]
      }
    ]
  },
  // {
  //   path: 'user-management',
  //   loadComponent: () => import('./module/user-management/user-management').then(m => m.UserManagementComponent),
  //   canActivate: [rootGuard, roleGuard]
  // },
  { path: 'login', loadComponent: () => import('./module/auth/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./module/auth/register/register').then(m => m.Register) },
  { path: '**', redirectTo: '/dashboard' }
];
