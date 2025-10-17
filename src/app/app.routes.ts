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
        path: 'rtgs',
        canActivate: [rootGuard],
        children: [
          {
            path: '',
            redirectTo: 'transfer',
            pathMatch: 'full'
          },
          {
            path: 'transfer',
            loadComponent: () => import('./module/rtgs/transfer/rtgs-transfer/rtgs-transfer.component').then(m => m.RtgsTransferComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'history',
            loadComponent: () => import('./module/rtgs/transfer/rtgs-history/rtgs-history.component').then(m => m.RtgsHistoryComponent),
            canActivate: [rootGuard, roleGuard]
          }
        ]
      },
      {
        path: 'qr-payment',
        canActivate: [rootGuard],
        children: [
          {
            path: '',
            redirectTo: 'generate',
            pathMatch: 'full'
          },
          {
            path: 'generate',
            loadComponent: () => import('./module/qr-payment/qr-generate/qr-generate.component').then(m => m.QRGenerateComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'scan',
            loadComponent: () => import('./module/qr-payment/qr-scanner/qr-scanner.component').then(m => m.QRScannerComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'history',
            loadComponent: () => import('./module/qr-payment/qr-history/qr-history.component').then(m => m.QRHistoryComponent),
            canActivate: [rootGuard, roleGuard]
          }
        ]
      },
      {
        path: 'upi-payment',
        canActivate: [rootGuard],
        children: [
          {
            path: '',
            redirectTo: 'pay',
            pathMatch: 'full'
          },
          {
            path: 'manage',
            loadComponent: () => import('./module/upi-payment/upi-management/upi-management.component').then(m => m.UPIManagementComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'pay',
            loadComponent: () => import('./module/upi-payment/upi-payment/upi-payment.component').then(m => m.UPIPaymentComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'history',
            loadComponent: () => import('./module/upi-payment/upi-history/upi-history.component').then(m => m.UPIHistoryComponent),
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
      },
      {
        path: 'admin-rtgs',
        canActivate: [rootGuard],
        children: [
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./module/rtgs/admin/admin-rtgs-dashboard/admin-rtgs-dashboard.component').then(m => m.AdminRtgsDashboardComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'transactions',
            loadComponent: () => import('./module/rtgs/admin/admin-rtgs-transaction-list/admin-rtgs-transaction-list.component').then(m => m.AdminRtgsTransactionListComponent),
            canActivate: [rootGuard, roleGuard]
          },
          {
            path: 'transactions/:reference',
            loadComponent: () => import('./module/rtgs/admin/admin-rtgs-transaction-details/admin-rtgs-transaction-details.component').then(m => m.AdminRtgsTransactionDetailsComponent),
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
