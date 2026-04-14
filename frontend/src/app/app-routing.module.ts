import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'medical-record',
    loadChildren: () =>
      import('./features/medical-record/medical-record.module').then(
        (m) => m.MedicalRecordModule,
      ),
  },
  {
    path: 'assessment',
    loadChildren: () =>
      import('./features/medical-record/assessment.module').then(
        (m) => m.AssessmentModule,
      ),
  },
  {
    path: 'doctor-reports',
    loadChildren: () =>
      import('./features/medical-record/doctor-reports.module').then(
        (m) => m.DoctorReportsModule,
      ),
  },


  {
    path: '',
    loadChildren: () =>
      import('./features/front-office/front-office.module').then(
        (m) => m.FrontOfficeModule,
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/back-office/back-office.module').then(
        (m) => m.BackOfficeModule,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
