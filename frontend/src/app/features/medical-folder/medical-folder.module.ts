import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalFolderRoutingModule } from './medical-folder-routing.module';
import { FormsModule } from '@angular/forms';
import { MedicalRecordListComponent } from './pages/medical-record-list/medical-record-list.component';
import { MedicalRecordFormComponent } from './pages/medical-record-form/medical-record-form.component';
import { MedicalRecordDetailsComponent } from './pages/medical-record-details/medical-record-details.component';

@NgModule({
  declarations: [
    MedicalRecordListComponent,
    MedicalRecordFormComponent,
    MedicalRecordDetailsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MedicalFolderRoutingModule,
  ]
})
export class MedicalFolderModule { }
